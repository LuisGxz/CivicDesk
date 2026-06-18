using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Catalog;

/// <summary>Public catalog: all active services, optionally filtered by category or free-text search.</summary>
public record GetServicesQuery(string? Category = null, string? Search = null) : IRequest<IReadOnlyList<ServiceSummaryDto>>;

public class GetServicesHandler(IAppDbContext db) : IRequestHandler<GetServicesQuery, IReadOnlyList<ServiceSummaryDto>>
{
    public async Task<IReadOnlyList<ServiceSummaryDto>> Handle(GetServicesQuery request, CancellationToken ct)
    {
        var query = db.ServiceTypes.AsNoTracking().Where(s => s.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(s => s.Category.ToString() == request.Category);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(s =>
                EF.Functions.Like(s.NameEn, $"%{term}%") || EF.Functions.Like(s.NameEs, $"%{term}%") ||
                EF.Functions.Like(s.DescriptionEn, $"%{term}%") || EF.Functions.Like(s.DescriptionEs, $"%{term}%"));
        }

        return await query
            .OrderBy(s => s.SortOrder)
            .Select(s => ServiceSummaryDto.From(s))
            .ToListAsync(ct);
    }
}

public record GetServiceDetailQuery(string Slug) : IRequest<ServiceDetailDto>;

public class GetServiceDetailHandler(IAppDbContext db) : IRequestHandler<GetServiceDetailQuery, ServiceDetailDto>
{
    public async Task<ServiceDetailDto> Handle(GetServiceDetailQuery request, CancellationToken ct)
    {
        var service = await db.ServiceTypes.AsNoTracking()
            .Include(s => s.FormFields)
            .Include(s => s.RequiredDocuments)
            .FirstOrDefaultAsync(s => s.Slug == request.Slug && s.IsActive, ct)
            ?? throw new NotFoundException("Service", request.Slug);

        return new ServiceDetailDto(
            ServiceSummaryDto.From(service),
            service.FormFields.OrderBy(f => f.SortOrder).Select(FormFieldDto.From).ToList(),
            service.RequiredDocuments.OrderBy(d => d.SortOrder).Select(RequiredDocumentDto.From).ToList());
    }
}

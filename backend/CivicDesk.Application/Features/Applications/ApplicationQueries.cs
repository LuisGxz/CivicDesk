using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Applications;

/// <summary>The signed-in citizen's own applications, newest first.</summary>
public record GetMyApplicationsQuery(Guid CitizenId) : IRequest<IReadOnlyList<ApplicationSummaryDto>>;

public class GetMyApplicationsHandler(IAppDbContext db) : IRequestHandler<GetMyApplicationsQuery, IReadOnlyList<ApplicationSummaryDto>>
{
    public async Task<IReadOnlyList<ApplicationSummaryDto>> Handle(GetMyApplicationsQuery request, CancellationToken ct)
    {
        var apps = await db.Applications.AsNoTracking()
            .Include(a => a.ServiceType)
            .Where(a => a.CitizenId == request.CitizenId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync(ct);

        return apps.Select(ApplicationMapper.ToSummary).ToList();
    }
}

/// <summary>Full detail for a citizen's own application (internal officer notes are excluded).</summary>
public record GetApplicationDetailQuery(Guid CitizenId, Guid ApplicationId) : IRequest<ApplicationDetailDto>;

public class GetApplicationDetailHandler(IAppDbContext db) : IRequestHandler<GetApplicationDetailQuery, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(GetApplicationDetailQuery request, CancellationToken ct)
    {
        var app = await LoadDetail.Query(db)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (app.CitizenId != request.CitizenId)
            throw new ForbiddenException("You can only view your own application.");

        return ApplicationMapper.ToDetail(app, includeInternalComments: false);
    }
}

public record DocumentDownloadDto(string FileName, string ContentType, byte[] Content);

/// <summary>Download a document. Citizens may fetch their own; staff may fetch any.</summary>
public record GetDocumentQuery(Guid RequesterId, bool RequesterIsStaff, Guid ApplicationId, Guid DocumentId)
    : IRequest<DocumentDownloadDto>;

public class GetDocumentHandler(IAppDbContext db) : IRequestHandler<GetDocumentQuery, DocumentDownloadDto>
{
    public async Task<DocumentDownloadDto> Handle(GetDocumentQuery request, CancellationToken ct)
    {
        var app = await db.Applications.AsNoTracking()
            .Include(a => a.Documents)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (!request.RequesterIsStaff && app.CitizenId != request.RequesterId)
            throw new ForbiddenException("You can only download documents from your own application.");

        var doc = app.Documents.FirstOrDefault(d => d.Id == request.DocumentId)
            ?? throw new NotFoundException("Document", request.DocumentId);

        return new DocumentDownloadDto(doc.FileName, doc.ContentType, doc.Content);
    }
}

/// <summary>Shared include graph for the full application detail projection.</summary>
internal static class LoadDetail
{
    public static IQueryable<Domain.Entities.ServiceApplication> Query(IAppDbContext db) =>
        db.Applications.AsNoTracking()
            .Include(a => a.ServiceType).ThenInclude(s => s!.FormFields)
            .Include(a => a.ServiceType).ThenInclude(s => s!.RequiredDocuments)
            .Include(a => a.Citizen)
            .Include(a => a.AssignedOfficer)
            .Include(a => a.Documents)
            .Include(a => a.Events)
            .Include(a => a.Comments).ThenInclude(c => c.Author);
}

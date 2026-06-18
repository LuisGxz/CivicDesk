using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Application.Common.Models;
using CivicDesk.Application.Features.Applications;
using CivicDesk.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Officer;

/// <summary>The officer inbox: server-side filtered + paginated queue of applications.</summary>
public record GetInboxQuery(
    Guid OfficerId, string? Status, bool MineOnly, string? ServiceSlug, string? Search, int Page = 1, int PageSize = 10)
    : IRequest<PagedResult<InboxItemDto>>;

public class GetInboxHandler(IAppDbContext db) : IRequestHandler<GetInboxQuery, PagedResult<InboxItemDto>>
{
    public async Task<PagedResult<InboxItemDto>> Handle(GetInboxQuery request, CancellationToken ct)
    {
        // Drafts are the citizen's private workspace — never shown to staff.
        var query = db.Applications.AsNoTracking()
            .Include(a => a.ServiceType)
            .Include(a => a.Citizen)
            .Include(a => a.AssignedOfficer)
            .Where(a => a.Status != ApplicationStatus.Draft);

        if (Enum.TryParse<ApplicationStatus>(request.Status, out var status) && status != ApplicationStatus.Draft)
            query = query.Where(a => a.Status == status);

        if (request.MineOnly)
            query = query.Where(a => a.AssignedOfficerId == request.OfficerId);

        if (!string.IsNullOrWhiteSpace(request.ServiceSlug))
            query = query.Where(a => a.ServiceType!.Slug == request.ServiceSlug);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(a =>
                EF.Functions.Like(a.ReferenceNumber, $"%{term}%") ||
                EF.Functions.Like(a.Citizen!.FullName, $"%{term}%"));
        }

        var total = await query.CountAsync(ct);
        var page = Math.Max(1, request.Page);
        var size = Math.Clamp(request.PageSize, 1, 50);

        // Oldest-submitted first within the queue so nothing starves.
        var items = await query
            .OrderBy(a => a.Status == ApplicationStatus.Submitted ? 0 : 1)
            .ThenBy(a => a.SubmittedAtUtc ?? a.CreatedAtUtc)
            .Skip((page - 1) * size).Take(size)
            .Select(a => new InboxItemDto(
                a.Id, a.ReferenceNumber, a.ServiceType!.NameEn, a.ServiceType.NameEs, a.ServiceType.Icon,
                a.Citizen!.FullName, a.Status.ToString(), a.AssignedOfficerId, a.AssignedOfficer!.FullName,
                a.SubmittedAtUtc, a.UpdatedAtUtc))
            .ToListAsync(ct);

        return new PagedResult<InboxItemDto>(items, page, size, total);
    }
}

/// <summary>Full application detail for staff — includes internal notes.</summary>
public record GetOfficerApplicationQuery(Guid ApplicationId) : IRequest<ApplicationDetailDto>;

public class GetOfficerApplicationHandler(IAppDbContext db) : IRequestHandler<GetOfficerApplicationQuery, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(GetOfficerApplicationQuery request, CancellationToken ct)
    {
        var app = await LoadDetail.Query(db)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        return ApplicationMapper.ToDetail(app, includeInternalComments: true);
    }
}

/// <summary>Queue counts for the dashboard badges.</summary>
public record GetInboxStatsQuery(Guid OfficerId) : IRequest<InboxStatsDto>;

public class GetInboxStatsHandler(IAppDbContext db) : IRequestHandler<GetInboxStatsQuery, InboxStatsDto>
{
    public async Task<InboxStatsDto> Handle(GetInboxStatsQuery request, CancellationToken ct)
    {
        var byStatus = await db.Applications.AsNoTracking()
            .Where(a => a.Status != ApplicationStatus.Draft)
            .GroupBy(a => a.Status)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(ct);

        int Count(ApplicationStatus s) => byStatus.FirstOrDefault(x => x.Key == s)?.Count ?? 0;
        var mine = await db.Applications.AsNoTracking()
            .CountAsync(a => a.AssignedOfficerId == request.OfficerId && (a.Status == ApplicationStatus.UnderReview || a.Status == ApplicationStatus.NeedsInfo), ct);

        return new InboxStatsDto(
            Count(ApplicationStatus.Submitted), Count(ApplicationStatus.UnderReview), Count(ApplicationStatus.NeedsInfo),
            Count(ApplicationStatus.Approved), Count(ApplicationStatus.Rejected), mine);
    }
}

/// <summary>List of officers/supervisors for the assignment dropdown (supervisor only).</summary>
public record GetStaffQuery : IRequest<IReadOnlyList<StaffDto>>;

public class GetStaffHandler(IAppDbContext db) : IRequestHandler<GetStaffQuery, IReadOnlyList<StaffDto>>
{
    public async Task<IReadOnlyList<StaffDto>> Handle(GetStaffQuery request, CancellationToken ct) =>
        await db.Users.AsNoTracking()
            .Where(u => u.Role == UserRole.Officer || u.Role == UserRole.Supervisor)
            .OrderBy(u => u.FullName)
            .Select(u => new StaffDto(u.Id, u.FullName, u.Role.ToString(), u.Department))
            .ToListAsync(ct);
}

/// <summary>Recent audit trail (supervisor only).</summary>
public record GetAuditQuery(int Take = 50) : IRequest<IReadOnlyList<AuditEntryDto>>;

public class GetAuditHandler(IAppDbContext db) : IRequestHandler<GetAuditQuery, IReadOnlyList<AuditEntryDto>>
{
    public async Task<IReadOnlyList<AuditEntryDto>> Handle(GetAuditQuery request, CancellationToken ct) =>
        await db.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.OccurredAtUtc)
            .Take(Math.Clamp(request.Take, 1, 200))
            .Select(a => new AuditEntryDto(
                a.Id, a.ActorEmail, a.ActorRole.ToString(), a.Action, a.EntityType, a.EntityId,
                a.Metadata, a.IpAddress, a.OccurredAtUtc))
            .ToListAsync(ct);
}

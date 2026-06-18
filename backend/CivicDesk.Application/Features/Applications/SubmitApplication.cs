using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Applications;

/// <summary>Final step: submit a draft. Enforces that every required document slot is filled.</summary>
public record SubmitApplicationCommand(Guid CitizenId, Guid ApplicationId) : IRequest<ApplicationSummaryDto>;

public class SubmitApplicationHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<SubmitApplicationCommand, ApplicationSummaryDto>
{
    public async Task<ApplicationSummaryDto> Handle(SubmitApplicationCommand request, CancellationToken ct)
    {
        var app = await db.Applications
            .Include(a => a.ServiceType).ThenInclude(s => s!.RequiredDocuments)
            .Include(a => a.Documents)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (app.CitizenId != request.CitizenId)
            throw new ForbiddenException("You can only submit your own application.");

        var missing = app.ServiceType!.RequiredDocuments
            .Where(rd => rd.Required && app.Documents.All(d => d.SlotKey != rd.Key))
            .Select(rd => rd.LabelEn)
            .ToList();
        if (missing.Count > 0)
            throw new ConflictException($"Missing required documents: {string.Join(", ", missing)}.");

        app.Submit(clock.UtcNow);
        audit.Record("application.submitted", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber });
        await db.SaveChangesAsync(ct);

        return ApplicationMapper.ToSummary(app);
    }
}

/// <summary>Citizen responds to a NeedsInfo request (after optionally re-uploading documents).</summary>
public record ResubmitApplicationCommand(Guid CitizenId, Guid ApplicationId, string? Note) : IRequest<ApplicationSummaryDto>;

public class ResubmitApplicationHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<ResubmitApplicationCommand, ApplicationSummaryDto>
{
    public async Task<ApplicationSummaryDto> Handle(ResubmitApplicationCommand request, CancellationToken ct)
    {
        var app = await db.Applications
            .Include(a => a.ServiceType)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (app.CitizenId != request.CitizenId)
            throw new ForbiddenException("You can only update your own application.");

        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        app.ResubmitAfterInfo(clock.UtcNow, note, note);
        audit.Record("application.resubmitted", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber });
        await db.SaveChangesAsync(ct);

        return ApplicationMapper.ToSummary(app);
    }
}

using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Application.Features.Applications;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Officer;

// ── Claim ─────────────────────────────────────────────────────────────────────
public record ClaimApplicationCommand(Guid OfficerId, Guid ApplicationId) : IRequest<ApplicationDetailDto>;

public class ClaimApplicationHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<ClaimApplicationCommand, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(ClaimApplicationCommand request, CancellationToken ct)
    {
        var app = await Load(db, request.ApplicationId, ct);
        app.StartReview(request.OfficerId, clock.UtcNow);
        audit.Record("application.claimed", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber });
        await db.SaveChangesAsync(ct);
        return await OfficerCommandHelpers.Reload(db, app.Id, ct);
    }

    private static Task<ServiceApplication> Load(IAppDbContext db, Guid id, CancellationToken ct) =>
        OfficerCommandHelpers.LoadTracked(db, id, ct);
}

// ── Request info ──────────────────────────────────────────────────────────────
public record RequestInfoCommand(Guid OfficerId, Guid ApplicationId, string MessageEn, string MessageEs)
    : IRequest<ApplicationDetailDto>;

public class RequestInfoValidator : AbstractValidator<RequestInfoCommand>
{
    public RequestInfoValidator()
    {
        RuleFor(x => x.MessageEn).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.MessageEs).NotEmpty().MaximumLength(1000);
    }
}

public class RequestInfoHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<RequestInfoCommand, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(RequestInfoCommand request, CancellationToken ct)
    {
        var app = await OfficerCommandHelpers.LoadTracked(db, request.ApplicationId, ct);
        app.RequestInfo(request.OfficerId, request.MessageEn.Trim(), request.MessageEs.Trim(), clock.UtcNow);
        audit.Record("application.info_requested", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber });
        await db.SaveChangesAsync(ct);
        return await OfficerCommandHelpers.Reload(db, app.Id, ct);
    }
}

// ── Approve ───────────────────────────────────────────────────────────────────
public record ApproveApplicationCommand(Guid OfficerId, Guid ApplicationId, string? NoteEn, string? NoteEs)
    : IRequest<ApplicationDetailDto>;

public class ApproveApplicationHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<ApproveApplicationCommand, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(ApproveApplicationCommand request, CancellationToken ct)
    {
        var app = await OfficerCommandHelpers.LoadTracked(db, request.ApplicationId, ct);
        app.Approve(request.OfficerId,
            string.IsNullOrWhiteSpace(request.NoteEn) ? null : request.NoteEn.Trim(),
            string.IsNullOrWhiteSpace(request.NoteEs) ? null : request.NoteEs.Trim(),
            clock.UtcNow);
        audit.Record("application.approved", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber });
        await db.SaveChangesAsync(ct);
        return await OfficerCommandHelpers.Reload(db, app.Id, ct);
    }
}

// ── Reject ────────────────────────────────────────────────────────────────────
public record RejectApplicationCommand(Guid OfficerId, Guid ApplicationId, string ReasonEn, string ReasonEs)
    : IRequest<ApplicationDetailDto>;

public class RejectApplicationValidator : AbstractValidator<RejectApplicationCommand>
{
    public RejectApplicationValidator()
    {
        RuleFor(x => x.ReasonEn).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.ReasonEs).NotEmpty().MaximumLength(1000);
    }
}

public class RejectApplicationHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<RejectApplicationCommand, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(RejectApplicationCommand request, CancellationToken ct)
    {
        var app = await OfficerCommandHelpers.LoadTracked(db, request.ApplicationId, ct);
        app.Reject(request.OfficerId, request.ReasonEn.Trim(), request.ReasonEs.Trim(), clock.UtcNow);
        audit.Record("application.rejected", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber });
        await db.SaveChangesAsync(ct);
        return await OfficerCommandHelpers.Reload(db, app.Id, ct);
    }
}

// ── Assign (supervisor) ───────────────────────────────────────────────────────
public record AssignApplicationCommand(Guid ApplicationId, Guid OfficerId) : IRequest<ApplicationDetailDto>;

public class AssignApplicationHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<AssignApplicationCommand, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(AssignApplicationCommand request, CancellationToken ct)
    {
        var officer = await db.Users.FirstOrDefaultAsync(u => u.Id == request.OfficerId, ct)
            ?? throw new NotFoundException("Officer", request.OfficerId);
        if (!officer.IsStaff)
            throw new ConflictException("Applications can only be assigned to officers or supervisors.");

        var app = await OfficerCommandHelpers.LoadTracked(db, request.ApplicationId, ct);
        app.AssignTo(request.OfficerId, clock.UtcNow);
        audit.Record("application.assigned", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber, officer.Email });
        await db.SaveChangesAsync(ct);
        return await OfficerCommandHelpers.Reload(db, app.Id, ct);
    }
}

// ── Comment ───────────────────────────────────────────────────────────────────
public record AddCommentCommand(Guid AuthorId, Guid ApplicationId, string Body, bool IsInternal)
    : IRequest<ApplicationDetailDto>;

public class AddCommentValidator : AbstractValidator<AddCommentCommand>
{
    public AddCommentValidator() => RuleFor(x => x.Body).NotEmpty().MaximumLength(2000);
}

public class AddCommentHandler(IAppDbContext db, IAuditLogger audit)
    : IRequestHandler<AddCommentCommand, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(AddCommentCommand request, CancellationToken ct)
    {
        var app = await db.Applications.FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        db.ApplicationComments.Add(new ApplicationComment
        {
            ApplicationId = app.Id,
            AuthorId = request.AuthorId,
            Body = request.Body.Trim(),
            IsInternal = request.IsInternal
        });
        audit.Record("application.commented", nameof(ServiceApplication), app.Id, new { request.IsInternal });
        await db.SaveChangesAsync(ct);
        return await OfficerCommandHelpers.Reload(db, app.Id, ct);
    }
}

// ── Verify / reject a document ────────────────────────────────────────────────
public record ReviewDocumentCommand(Guid ApplicationId, Guid DocumentId, bool Approve) : IRequest<ApplicationDetailDto>;

public class ReviewDocumentHandler(IAppDbContext db, IAuditLogger audit)
    : IRequestHandler<ReviewDocumentCommand, ApplicationDetailDto>
{
    public async Task<ApplicationDetailDto> Handle(ReviewDocumentCommand request, CancellationToken ct)
    {
        var doc = await db.ApplicationDocuments
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.ApplicationId == request.ApplicationId, ct)
            ?? throw new NotFoundException("Document", request.DocumentId);

        if (request.Approve) doc.MarkVerified(); else doc.MarkRejected();
        audit.Record("document.reviewed", nameof(ApplicationDocument), doc.Id, new { request.Approve });
        await db.SaveChangesAsync(ct);
        return await OfficerCommandHelpers.Reload(db, request.ApplicationId, ct);
    }
}

internal static class OfficerCommandHelpers
{
    public static async Task<ServiceApplication> LoadTracked(IAppDbContext db, Guid id, CancellationToken ct) =>
        await db.Applications
            .Include(a => a.Events)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundException("Application", id);

    public static async Task<ApplicationDetailDto> Reload(IAppDbContext db, Guid id, CancellationToken ct)
    {
        var app = await LoadDetail.Query(db).FirstAsync(a => a.Id == id, ct);
        return ApplicationMapper.ToDetail(app, includeInternalComments: true);
    }
}

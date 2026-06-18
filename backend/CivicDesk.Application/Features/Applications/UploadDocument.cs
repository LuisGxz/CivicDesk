using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Applications;

/// <summary>
/// Step 2 of the stepper: attach a document to a slot. Validates the citizen owns the application,
/// it's still editable (Draft/NeedsInfo), and the file's type/size. Re-uploading a slot replaces it.
/// </summary>
public record UploadDocumentCommand(
    Guid CitizenId, Guid ApplicationId, string SlotKey, string FileName, string ContentType, byte[] Content)
    : IRequest<DocumentDto>;

public class UploadDocumentHandler(IAppDbContext db, IAuditLogger audit, IClock clock)
    : IRequestHandler<UploadDocumentCommand, DocumentDto>
{
    public async Task<DocumentDto> Handle(UploadDocumentCommand request, CancellationToken ct)
    {
        var app = await db.Applications
            .Include(a => a.Documents)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (app.CitizenId != request.CitizenId)
            throw new ForbiddenException("You can only upload documents to your own application.");

        if (app.Status is not (ApplicationStatus.Draft or ApplicationStatus.NeedsInfo))
            throw new ConflictException("Documents can only be added while the application is a draft or awaiting corrections.");

        if (request.Content.LongLength == 0)
            throw new ConflictException("The uploaded file is empty.");
        if (request.Content.LongLength > ApplicationDocument.MaxSizeBytes)
            throw new ConflictException("The file exceeds the 10 MB limit.");
        if (!ApplicationDocument.AllowedContentTypes.Contains(request.ContentType))
            throw new ConflictException("Only PDF, JPG and PNG files are accepted.");

        // Replace any previous upload for this slot.
        var existing = app.Documents.Where(d => d.SlotKey == request.SlotKey).ToList();
        foreach (var doc in existing)
            db.ApplicationDocuments.Remove(doc);

        var document = new ApplicationDocument
        {
            ApplicationId = app.Id,
            SlotKey = request.SlotKey,
            FileName = request.FileName,
            ContentType = request.ContentType,
            SizeBytes = request.Content.LongLength,
            Content = request.Content,
            UploadedAtUtc = clock.UtcNow
        };
        db.ApplicationDocuments.Add(document);
        audit.Record("document.uploaded", nameof(ServiceApplication), app.Id, new { request.SlotKey, request.FileName });
        await db.SaveChangesAsync(ct);

        return new DocumentDto(document.Id, document.SlotKey, document.FileName, document.ContentType,
            document.SizeBytes, document.Status.ToString(), document.UploadedAtUtc);
    }
}

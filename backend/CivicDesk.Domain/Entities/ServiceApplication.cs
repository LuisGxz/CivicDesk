using CivicDesk.Domain.Enums;
using CivicDesk.Domain.Exceptions;

namespace CivicDesk.Domain.Entities;

/// <summary>
/// A citizen's request for a service. Aggregate root: owns its captured field values, uploaded
/// documents, the public status timeline and officer comments, and enforces the status lifecycle.
/// Every state change appends a timeline event so the citizen always sees an honest history.
/// </summary>
public class ServiceApplication
{
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Public reference shown to the citizen (e.g. "RB-2026-0418").</summary>
    public required string ReferenceNumber { get; init; }

    public required Guid ServiceTypeId { get; init; }
    public required Guid CitizenId { get; init; }

    public ApplicationStatus Status { get; private set; } = ApplicationStatus.Draft;

    /// <summary>Fee snapshot at submission time, so later catalog price changes don't rewrite history.</summary>
    public decimal Fee { get; set; }

    public Guid? AssignedOfficerId { get; private set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? SubmittedAtUtc { get; private set; }
    public DateTime? DecidedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; } = DateTime.UtcNow;

    /// <summary>Optimistic-concurrency guard: two officers can't act on the same case and silently overwrite.</summary>
    public byte[] RowVersion { get; init; } = [];

    public ServiceType? ServiceType { get; init; }
    public User? Citizen { get; init; }
    public User? AssignedOfficer { get; init; }

    public ICollection<ApplicationFieldValue> FieldValues { get; init; } = [];
    public ICollection<ApplicationDocument> Documents { get; init; } = [];
    public ICollection<ApplicationEvent> Events { get; init; } = [];
    public ICollection<ApplicationComment> Comments { get; init; } = [];

    private void Touch(DateTime nowUtc) => UpdatedAtUtc = nowUtc;

    private void AddEvent(string titleEn, string titleEs, string? detailEn, string? detailEs, Guid? actorId, DateTime nowUtc) =>
        Events.Add(new ApplicationEvent
        {
            ApplicationId = Id,
            Status = Status,
            TitleEn = titleEn,
            TitleEs = titleEs,
            DetailEn = detailEn,
            DetailEs = detailEs,
            ActorId = actorId,
            OccurredAtUtc = nowUtc
        });

    /// <summary>Citizen submits a draft. The single entry point into the officer queue.</summary>
    public void Submit(DateTime nowUtc)
    {
        if (Status != ApplicationStatus.Draft)
            throw new DomainException($"Only a draft application can be submitted (was {Status}).");
        if (Documents.Count == 0)
            throw new DomainException("At least one supporting document is required before submitting.");

        Status = ApplicationStatus.Submitted;
        SubmittedAtUtc = nowUtc;
        Touch(nowUtc);
        AddEvent(
            "Application received", "Solicitud recibida",
            $"Your application and the ${Fee:0.00} fee were received successfully.",
            $"Tu solicitud y el pago de ${Fee:0.00} fueron recibidos correctamente.",
            CitizenId, nowUtc);
    }

    /// <summary>An officer takes the case from the queue (Submitted) or resumes it (NeedsInfo).</summary>
    public void StartReview(Guid officerId, DateTime nowUtc)
    {
        if (Status is not (ApplicationStatus.Submitted or ApplicationStatus.NeedsInfo))
            throw new DomainException($"Only submitted or resubmitted applications can enter review (was {Status}).");

        AssignedOfficerId = officerId;
        Status = ApplicationStatus.UnderReview;
        Touch(nowUtc);
        AddEvent(
            "Under review", "En revisión",
            "An officer is reviewing your application.",
            "Un funcionario está revisando tu solicitud.",
            officerId, nowUtc);
    }

    /// <summary>Supervisor assigns/reassigns the case without necessarily reviewing it yet.</summary>
    public void AssignTo(Guid officerId, DateTime nowUtc)
    {
        if (Status is ApplicationStatus.Approved or ApplicationStatus.Rejected or ApplicationStatus.Draft)
            throw new DomainException($"A {Status} application cannot be assigned.");
        AssignedOfficerId = officerId;
        Touch(nowUtc);
    }

    /// <summary>Officer bounces the case back to the citizen for corrections.</summary>
    public void RequestInfo(Guid officerId, string messageEn, string messageEs, DateTime nowUtc)
    {
        if (Status != ApplicationStatus.UnderReview)
            throw new DomainException($"Information can only be requested while under review (was {Status}).");
        if (string.IsNullOrWhiteSpace(messageEn))
            throw new DomainException("A message explaining what's needed is required.");

        Status = ApplicationStatus.NeedsInfo;
        Touch(nowUtc);
        AddEvent("Changes requested", "Cambios solicitados", messageEn, messageEs, officerId, nowUtc);
    }

    /// <summary>Citizen responds to a NeedsInfo request, sending the case back into the queue.</summary>
    public void ResubmitAfterInfo(DateTime nowUtc, string? noteEn = null, string? noteEs = null)
    {
        if (Status != ApplicationStatus.NeedsInfo)
            throw new DomainException($"Only applications awaiting information can be resubmitted (was {Status}).");

        Status = ApplicationStatus.Submitted;
        Touch(nowUtc);
        AddEvent(
            "Resubmitted", "Reenviada",
            noteEn ?? "The citizen provided the requested information.",
            noteEs ?? "El ciudadano proporcionó la información solicitada.",
            CitizenId, nowUtc);
    }

    public void Approve(Guid officerId, string? noteEn, string? noteEs, DateTime nowUtc)
    {
        if (Status != ApplicationStatus.UnderReview)
            throw new DomainException($"Only an application under review can be approved (was {Status}).");

        Status = ApplicationStatus.Approved;
        AssignedOfficerId = officerId;
        DecidedAtUtc = nowUtc;
        Touch(nowUtc);
        AddEvent(
            "Approved", "Aprobada",
            noteEn ?? "Your application has been approved. Your digital document is now available.",
            noteEs ?? "Tu solicitud fue aprobada. Tu documento digital ya está disponible.",
            officerId, nowUtc);
    }

    public void Reject(Guid officerId, string reasonEn, string reasonEs, DateTime nowUtc)
    {
        if (Status != ApplicationStatus.UnderReview)
            throw new DomainException($"Only an application under review can be rejected (was {Status}).");
        if (string.IsNullOrWhiteSpace(reasonEn))
            throw new DomainException("A rejection reason is required.");

        Status = ApplicationStatus.Rejected;
        AssignedOfficerId = officerId;
        DecidedAtUtc = nowUtc;
        Touch(nowUtc);
        AddEvent("Rejected", "Rechazada", reasonEn, reasonEs, officerId, nowUtc);
    }

    public bool IsTerminal => Status is ApplicationStatus.Approved or ApplicationStatus.Rejected;
}

/// <summary>A captured value for one configurable form field on an application.</summary>
public class ApplicationFieldValue
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid ApplicationId { get; init; }
    public required string FieldKey { get; init; }
    public required string Value { get; set; }
}

/// <summary>Metadata + bytes of an uploaded supporting document (stored in-DB for the demo; capped at 10 MB).</summary>
public class ApplicationDocument
{
    public const long MaxSizeBytes = 10 * 1024 * 1024;
    public static readonly string[] AllowedContentTypes =
        ["application/pdf", "image/jpeg", "image/png"];

    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid ApplicationId { get; init; }

    /// <summary>The RequiredDocument slot this fills (or "additional" for extra uploads).</summary>
    public required string SlotKey { get; init; }

    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long SizeBytes { get; init; }
    public required byte[] Content { get; init; }

    public DocumentStatus Status { get; private set; } = DocumentStatus.Pending;
    public DateTime UploadedAtUtc { get; init; } = DateTime.UtcNow;

    public void MarkVerified() => Status = DocumentStatus.Verified;
    public void MarkRejected() => Status = DocumentStatus.Rejected;
}

/// <summary>An immutable entry in the application's public timeline. One per status change.</summary>
public class ApplicationEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid ApplicationId { get; init; }
    public required ApplicationStatus Status { get; init; }
    public required string TitleEn { get; init; }
    public required string TitleEs { get; init; }
    public string? DetailEn { get; init; }
    public string? DetailEs { get; init; }
    public Guid? ActorId { get; init; }
    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}

/// <summary>A free-text note on an application. Internal notes are hidden from the citizen.</summary>
public class ApplicationComment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid ApplicationId { get; init; }
    public required Guid AuthorId { get; init; }
    public required string Body { get; init; }

    /// <summary>True = officer-only note; false = message visible to the citizen.</summary>
    public bool IsInternal { get; init; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public User? Author { get; init; }
}

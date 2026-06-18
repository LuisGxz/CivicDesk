using CivicDesk.Domain.Enums;

namespace CivicDesk.Domain.Entities;

/// <summary>
/// Append-only record of every meaningful action (who, what, when, on which entity).
/// Has no mutators and is never updated or deleted — the persistence layer maps it as
/// insert-only so the trail is tamper-evident. Required for the gov audit story.
/// </summary>
public class AuditLog
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public required Guid ActorId { get; init; }
    public required string ActorEmail { get; init; }
    public required UserRole ActorRole { get; init; }

    /// <summary>Verb of the action, e.g. "application.submitted", "application.approved", "document.uploaded".</summary>
    public required string Action { get; init; }

    public required string EntityType { get; init; }
    public Guid? EntityId { get; init; }

    /// <summary>JSON blob with action-specific context (from/to status, reference number, etc.).</summary>
    public string? Metadata { get; init; }

    public string? IpAddress { get; init; }
    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}

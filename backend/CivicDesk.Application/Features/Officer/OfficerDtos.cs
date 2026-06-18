namespace CivicDesk.Application.Features.Officer;

public record InboxItemDto(
    Guid Id, string ReferenceNumber, string ServiceNameEn, string ServiceNameEs, string ServiceIcon,
    string CitizenName, string Status, Guid? AssignedOfficerId, string? AssignedOfficerName,
    DateTime? SubmittedAtUtc, DateTime UpdatedAtUtc);

public record StaffDto(Guid Id, string FullName, string Role, string? Department);

public record InboxStatsDto(int Submitted, int UnderReview, int NeedsInfo, int Approved, int Rejected, int AssignedToMe);

public record AuditEntryDto(
    Guid Id, string ActorEmail, string ActorRole, string Action, string EntityType, Guid? EntityId,
    string? Metadata, string? IpAddress, DateTime OccurredAtUtc);

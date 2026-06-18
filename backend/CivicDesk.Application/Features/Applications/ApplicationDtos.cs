using CivicDesk.Application.Features.Catalog;

namespace CivicDesk.Application.Features.Applications;

public record ApplicationSummaryDto(
    Guid Id, string ReferenceNumber, string ServiceSlug, string ServiceNameEn, string ServiceNameEs,
    string ServiceIcon, string Status, decimal Fee,
    DateTime CreatedAtUtc, DateTime? SubmittedAtUtc, DateTime UpdatedAtUtc);

public record FieldValueDto(string Key, string LabelEn, string LabelEs, string Type, string Value);

public record DocumentDto(
    Guid Id, string SlotKey, string FileName, string ContentType, long SizeBytes, string Status, DateTime UploadedAtUtc);

public record TimelineEventDto(
    string Status, string TitleEn, string TitleEs, string? DetailEn, string? DetailEs, DateTime OccurredAtUtc);

public record CommentDto(
    Guid Id, string AuthorName, string AuthorRole, string Body, bool IsInternal, DateTime CreatedAtUtc);

public record ApplicationDetailDto(
    Guid Id, string ReferenceNumber, string Status, decimal Fee,
    DateTime CreatedAtUtc, DateTime? SubmittedAtUtc, DateTime? DecidedAtUtc, DateTime UpdatedAtUtc,
    ServiceSummaryDto Service,
    Guid? AssignedOfficerId, string? AssignedOfficerName, string CitizenName,
    IReadOnlyList<FieldValueDto> Fields,
    IReadOnlyList<RequiredDocumentDto> RequiredDocuments,
    IReadOnlyList<DocumentDto> Documents,
    IReadOnlyList<TimelineEventDto> Timeline,
    IReadOnlyList<CommentDto> Comments);

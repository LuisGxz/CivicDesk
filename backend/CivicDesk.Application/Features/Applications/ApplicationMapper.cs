using CivicDesk.Application.Features.Catalog;
using CivicDesk.Domain.Entities;

namespace CivicDesk.Application.Features.Applications;

/// <summary>Builds the citizen/officer-facing DTOs from a fully-loaded application aggregate.</summary>
public static class ApplicationMapper
{
    public static ApplicationSummaryDto ToSummary(ServiceApplication a) => new(
        a.Id, a.ReferenceNumber, a.ServiceType!.Slug, a.ServiceType.NameEn, a.ServiceType.NameEs,
        a.ServiceType.Icon, a.Status.ToString(), a.Fee, a.CreatedAtUtc, a.SubmittedAtUtc, a.UpdatedAtUtc);

    /// <summary>
    /// Full detail. <paramref name="includeInternalComments"/> must be false for citizen views so
    /// officers' internal notes never leak. Requires ServiceType.FormFields + Documents + Events +
    /// Comments.Author + Citizen + AssignedOfficer loaded.
    /// </summary>
    public static ApplicationDetailDto ToDetail(ServiceApplication a, bool includeInternalComments)
    {
        var fieldConfig = a.ServiceType!.FormFields.ToDictionary(f => f.Key);

        var fields = a.FieldValues
            .Select(v =>
            {
                fieldConfig.TryGetValue(v.FieldKey, out var cfg);
                return new FieldValueDto(
                    v.FieldKey,
                    cfg?.LabelEn ?? v.FieldKey,
                    cfg?.LabelEs ?? v.FieldKey,
                    cfg?.Type.ToString() ?? "Text",
                    v.Value);
            })
            .ToList();

        var orderByConfig = a.ServiceType.FormFields
            .OrderBy(f => f.SortOrder)
            .Select((f, i) => (f.Key, i))
            .ToDictionary(x => x.Key, x => x.i);
        fields = fields.OrderBy(f => orderByConfig.TryGetValue(f.Key, out var i) ? i : int.MaxValue).ToList();

        var comments = a.Comments
            .Where(c => includeInternalComments || !c.IsInternal)
            .OrderBy(c => c.CreatedAtUtc)
            .Select(c => new CommentDto(
                c.Id, c.Author?.FullName ?? "Staff", c.Author?.Role.ToString() ?? "Officer",
                c.Body, c.IsInternal, c.CreatedAtUtc))
            .ToList();

        return new ApplicationDetailDto(
            a.Id, a.ReferenceNumber, a.Status.ToString(), a.Fee,
            a.CreatedAtUtc, a.SubmittedAtUtc, a.DecidedAtUtc, a.UpdatedAtUtc,
            ServiceSummaryDto.From(a.ServiceType),
            a.AssignedOfficerId, a.AssignedOfficer?.FullName, a.Citizen?.FullName ?? "Citizen",
            fields,
            a.ServiceType.RequiredDocuments.OrderBy(d => d.SortOrder).Select(RequiredDocumentDto.From).ToList(),
            a.Documents.OrderBy(d => d.UploadedAtUtc)
                .Select(d => new DocumentDto(d.Id, d.SlotKey, d.FileName, d.ContentType, d.SizeBytes, d.Status.ToString(), d.UploadedAtUtc))
                .ToList(),
            a.Events.OrderBy(e => e.OccurredAtUtc)
                .Select(e => new TimelineEventDto(e.Status.ToString(), e.TitleEn, e.TitleEs, e.DetailEn, e.DetailEs, e.OccurredAtUtc))
                .ToList(),
            comments);
    }
}

using CivicDesk.Domain.Entities;

namespace CivicDesk.Application.Features.Catalog;

public record OptionDto(string Value, string LabelEn, string LabelEs);

public record FormFieldDto(
    string Key, string LabelEn, string LabelEs, string? HelpTextEn, string? HelpTextEs,
    string Type, bool Required, int SortOrder, IReadOnlyList<OptionDto> Options,
    int? MaxLength, decimal? Min, decimal? Max)
{
    public static FormFieldDto From(FormField f) => new(
        f.Key, f.LabelEn, f.LabelEs, f.HelpTextEn, f.HelpTextEs, f.Type.ToString(),
        f.Required, f.SortOrder, ParseOptions(f.Options), f.MaxLength, f.Min, f.Max);

    // Options are stored as "value:LabelEn:LabelEs|value:LabelEn:LabelEs".
    private static IReadOnlyList<OptionDto> ParseOptions(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return [];
        return raw.Split('|', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split(':'))
            .Where(p => p.Length == 3)
            .Select(p => new OptionDto(p[0], p[1], p[2]))
            .ToList();
    }
}

public record RequiredDocumentDto(
    string Key, string LabelEn, string LabelEs, string? HintEn, string? HintEs, bool Required, int SortOrder)
{
    public static RequiredDocumentDto From(RequiredDocument d) =>
        new(d.Key, d.LabelEn, d.LabelEs, d.HintEn, d.HintEs, d.Required, d.SortOrder);
}

public record ServiceSummaryDto(
    Guid Id, string Slug, string NameEn, string NameEs, string DescriptionEn, string DescriptionEs,
    string Icon, string Category, decimal Fee, string ProcessingTimeEn, string ProcessingTimeEs)
{
    public static ServiceSummaryDto From(ServiceType s) => new(
        s.Id, s.Slug, s.NameEn, s.NameEs, s.DescriptionEn, s.DescriptionEs, s.Icon,
        s.Category.ToString(), s.Fee, s.ProcessingTimeEn, s.ProcessingTimeEs);
}

public record ServiceDetailDto(
    ServiceSummaryDto Service, IReadOnlyList<FormFieldDto> Fields, IReadOnlyList<RequiredDocumentDto> Documents);

using CivicDesk.Domain.Enums;

namespace CivicDesk.Domain.Entities;

/// <summary>
/// A service the city offers (business license, parking permit…). Owns the config-driven
/// form fields and required document slots that the citizen application form is rendered from.
/// </summary>
public class ServiceType
{
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Stable code used in URLs and the application number prefix (e.g. "BUSINESS-LICENSE").</summary>
    public required string Slug { get; init; }

    public required string NameEn { get; set; }
    public required string NameEs { get; set; }
    public required string DescriptionEn { get; set; }
    public required string DescriptionEs { get; set; }

    /// <summary>Lucide icon name shown on the catalog card.</summary>
    public required string Icon { get; set; }
    public ServiceCategory Category { get; set; }

    public decimal Fee { get; set; }

    /// <summary>Human-readable SLA shown on the card (e.g. "5–7 days" / "5–7 días").</summary>
    public required string ProcessingTimeEn { get; set; }
    public required string ProcessingTimeEs { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public ICollection<FormField> FormFields { get; init; } = [];
    public ICollection<RequiredDocument> RequiredDocuments { get; init; } = [];
}

/// <summary>One configurable input in a service's application form. Rendered generically by the frontend.</summary>
public class FormField
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid ServiceTypeId { get; init; }

    /// <summary>Machine key the captured value is stored under (e.g. "business_name").</summary>
    public required string Key { get; init; }

    public required string LabelEn { get; set; }
    public required string LabelEs { get; set; }
    public string? HelpTextEn { get; set; }
    public string? HelpTextEs { get; set; }

    public FormFieldType Type { get; set; }
    public bool Required { get; set; }
    public int SortOrder { get; set; }

    /// <summary>For Select fields: pipe-separated option list "value:LabelEn:LabelEs|…". Null otherwise.</summary>
    public string? Options { get; set; }

    /// <summary>Optional client+server validation hints.</summary>
    public int? MaxLength { get; set; }
    public decimal? Min { get; set; }
    public decimal? Max { get; set; }

    public ServiceType? ServiceType { get; init; }
}

/// <summary>A document slot the citizen must (or may) upload for a given service.</summary>
public class RequiredDocument
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid ServiceTypeId { get; init; }

    public required string Key { get; init; }
    public required string LabelEn { get; set; }
    public required string LabelEs { get; set; }
    public string? HintEn { get; set; }
    public string? HintEs { get; set; }
    public bool Required { get; set; } = true;
    public int SortOrder { get; set; }

    public ServiceType? ServiceType { get; init; }
}

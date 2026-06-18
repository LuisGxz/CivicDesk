namespace CivicDesk.Domain.Enums;

/// <summary>Who the principal is. Drives RBAC across the portal.</summary>
public enum UserRole
{
    /// <summary>Files and tracks applications.</summary>
    Citizen = 0,
    /// <summary>Reviews assigned applications and moves them through the workflow.</summary>
    Officer = 1,
    /// <summary>Officer powers plus assignment/reassignment and final decisions on any application.</summary>
    Supervisor = 2
}

/// <summary>
/// Lifecycle of a citizen application. Transitions are enforced by <c>Application</c>:
/// Draft → Submitted → UnderReview ⇄ NeedsInfo → Approved | Rejected.
/// </summary>
public enum ApplicationStatus
{
    /// <summary>Citizen is still completing the form; not yet visible to officers.</summary>
    Draft = 0,
    /// <summary>Submitted and waiting in the officer queue (mockup: "received").</summary>
    Submitted = 1,
    /// <summary>An officer has taken the case and is reviewing it.</summary>
    UnderReview = 2,
    /// <summary>Officer requested corrections; the ball is back with the citizen (mockup: "observado").</summary>
    NeedsInfo = 3,
    /// <summary>Final approval. Terminal.</summary>
    Approved = 4,
    /// <summary>Rejected with a reason. Terminal.</summary>
    Rejected = 5
}

/// <summary>Input control rendered by the config-driven application form.</summary>
public enum FormFieldType
{
    Text = 0,
    Textarea = 1,
    Number = 2,
    Date = 3,
    Select = 4,
    Checkbox = 5
}

/// <summary>Verification state of an uploaded document.</summary>
public enum DocumentStatus
{
    Pending = 0,
    Verified = 1,
    Rejected = 2
}

/// <summary>Top-level grouping of services in the catalog.</summary>
public enum ServiceCategory
{
    Business = 0,
    Permits = 1,
    Records = 2,
    Property = 3,
    Community = 4
}

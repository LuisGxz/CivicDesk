namespace CivicDesk.Application.Common.Interfaces;

/// <summary>
/// Appends an entry to the immutable audit trail. Stamps actor + IP from <see cref="ICurrentUser"/>.
/// The row is added to the change tracker but not saved — it is committed together with the
/// action it records, so an audit entry never exists without its action (and vice versa).
/// </summary>
public interface IAuditLogger
{
    void Record(string action, string entityType, Guid? entityId = null, object? metadata = null);
}

using System.Text.Json;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Entities;

namespace CivicDesk.Infrastructure.Common;

/// <summary>
/// Default <see cref="IAuditLogger"/>: stamps actor identity + IP from the current request and
/// queues an <see cref="AuditLog"/> row on the change tracker. It is intentionally Scoped and does
/// not save — the handler's own SaveChanges commits the audit row in the same transaction.
/// </summary>
public class AuditLogger(IAppDbContext db, ICurrentUser currentUser, IClock clock) : IAuditLogger
{
    public void Record(string action, string entityType, Guid? entityId = null, object? metadata = null)
    {
        if (!currentUser.IsAuthenticated)
            return;

        db.AuditLogs.Add(new AuditLog
        {
            ActorId = currentUser.Id,
            ActorEmail = currentUser.Email,
            ActorRole = currentUser.Role,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Metadata = metadata is null ? null : JsonSerializer.Serialize(metadata),
            IpAddress = currentUser.IpAddress,
            OccurredAtUtc = clock.UtcNow
        });
    }
}

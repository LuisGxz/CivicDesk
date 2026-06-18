using CivicDesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<ServiceType> ServiceTypes { get; }
    DbSet<FormField> FormFields { get; }
    DbSet<RequiredDocument> RequiredDocuments { get; }
    DbSet<ServiceApplication> Applications { get; }
    DbSet<ApplicationFieldValue> ApplicationFieldValues { get; }
    DbSet<ApplicationDocument> ApplicationDocuments { get; }
    DbSet<ApplicationEvent> ApplicationEvents { get; }
    DbSet<ApplicationComment> ApplicationComments { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default);
}

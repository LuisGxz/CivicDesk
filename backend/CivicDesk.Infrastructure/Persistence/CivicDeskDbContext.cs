using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Infrastructure.Persistence;

public class CivicDeskDbContext(DbContextOptions<CivicDeskDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ServiceType> ServiceTypes => Set<ServiceType>();
    public DbSet<FormField> FormFields => Set<FormField>();
    public DbSet<RequiredDocument> RequiredDocuments => Set<RequiredDocument>();
    public DbSet<ServiceApplication> Applications => Set<ServiceApplication>();
    public DbSet<ApplicationFieldValue> ApplicationFieldValues => Set<ApplicationFieldValue>();
    public DbSet<ApplicationDocument> ApplicationDocuments => Set<ApplicationDocument>();
    public DbSet<ApplicationEvent> ApplicationEvents => Set<ApplicationEvent>();
    public DbSet<ApplicationComment> ApplicationComments => Set<ApplicationComment>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    /// <summary>
    /// Runs the operation inside an explicit DB transaction, wrapped in the SQL Server
    /// retrying execution strategy (required when EnableRetryOnFailure is on).
    /// </summary>
    public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
    {
        var strategy = Database.CreateExecutionStrategy();
        return strategy.ExecuteAsync(async ct =>
        {
            await using var transaction = await Database.BeginTransactionAsync(ct);
            await operation(ct);
            await transaction.CommitAsync(ct);
        }, cancellationToken);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        GuardAppendOnly();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        GuardAppendOnly();
        return base.SaveChanges();
    }

    /// <summary>The audit trail and the application timeline are append-only: reject any update or delete.</summary>
    private void GuardAppendOnly()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry is { Entity: AuditLog or ApplicationEvent, State: EntityState.Modified or EntityState.Deleted })
                throw new InvalidOperationException(
                    $"{entry.Entity.GetType().Name} records are immutable and cannot be {entry.State}.");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CivicDeskDbContext).Assembly);

        // Optimistic concurrency on Application: a real rowversion on SQL Server (auto-stamped by the
        // engine), but SQLite has no rowversion — so for tests use a plain concurrency token we never
        // try to store-generate. This is the rowversion+SQLite trap from prior projects.
        var rowVersion = modelBuilder.Entity<ServiceApplication>().Property(a => a.RowVersion);
        if (Database.IsSqlServer())
            rowVersion.IsRowVersion();
        else
            rowVersion.IsConcurrencyToken().ValueGeneratedNever();

        // We assign all Guid identifiers client-side. Tell EF never to treat them as
        // store-generated, so entities added through a tracked parent's navigation are
        // correctly marked Added (a non-default Guid would otherwise be read as Modified).
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var key = entityType.FindPrimaryKey()?.Properties.FirstOrDefault();
            if (key is { ClrType.Name: nameof(Guid) })
                key.ValueGenerated = Microsoft.EntityFrameworkCore.Metadata.ValueGenerated.Never;
        }
    }
}

using CivicDesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CivicDesk.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ActorEmail).HasMaxLength(256).IsRequired();
        builder.Property(a => a.ActorRole).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.Action).HasMaxLength(80).IsRequired();
        builder.Property(a => a.EntityType).HasMaxLength(80).IsRequired();
        builder.Property(a => a.Metadata).HasMaxLength(4000);
        builder.Property(a => a.IpAddress).HasMaxLength(64);

        builder.HasIndex(a => a.OccurredAtUtc);
        builder.HasIndex(a => new { a.EntityType, a.EntityId });
    }
}

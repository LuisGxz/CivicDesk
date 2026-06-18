using CivicDesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CivicDesk.Infrastructure.Persistence.Configurations;

public class ApplicationConfiguration : IEntityTypeConfiguration<ServiceApplication>
{
    public void Configure(EntityTypeBuilder<ServiceApplication> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ReferenceNumber).HasMaxLength(20).IsRequired();
        builder.HasIndex(a => a.ReferenceNumber).IsUnique();
        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.Fee).HasPrecision(10, 2);

        // RowVersion is configured per-provider in CivicDeskDbContext.OnModelCreating
        // (rowversion on SQL Server, plain concurrency token on SQLite for tests).

        builder.HasOne(a => a.ServiceType).WithMany().HasForeignKey(a => a.ServiceTypeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(a => a.Citizen).WithMany().HasForeignKey(a => a.CitizenId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(a => a.AssignedOfficer).WithMany().HasForeignKey(a => a.AssignedOfficerId).OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(a => a.FieldValues).WithOne().HasForeignKey(v => v.ApplicationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(a => a.Documents).WithOne().HasForeignKey(d => d.ApplicationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(a => a.Events).WithOne().HasForeignKey(e => e.ApplicationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(a => a.Comments).WithOne().HasForeignKey(c => c.ApplicationId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.CitizenId);
        builder.HasIndex(a => new { a.Status, a.AssignedOfficerId });
    }
}

public class ApplicationFieldValueConfiguration : IEntityTypeConfiguration<ApplicationFieldValue>
{
    public void Configure(EntityTypeBuilder<ApplicationFieldValue> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.FieldKey).HasMaxLength(60).IsRequired();
        builder.Property(v => v.Value).HasMaxLength(4000).IsRequired();
        builder.HasIndex(v => new { v.ApplicationId, v.FieldKey }).IsUnique();
    }
}

public class ApplicationDocumentConfiguration : IEntityTypeConfiguration<ApplicationDocument>
{
    public void Configure(EntityTypeBuilder<ApplicationDocument> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.SlotKey).HasMaxLength(60).IsRequired();
        builder.Property(d => d.FileName).HasMaxLength(260).IsRequired();
        builder.Property(d => d.ContentType).HasMaxLength(120).IsRequired();
        builder.Property(d => d.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(d => d.ApplicationId);
    }
}

public class ApplicationEventConfiguration : IEntityTypeConfiguration<ApplicationEvent>
{
    public void Configure(EntityTypeBuilder<ApplicationEvent> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(e => e.TitleEn).HasMaxLength(120).IsRequired();
        builder.Property(e => e.TitleEs).HasMaxLength(120).IsRequired();
        builder.Property(e => e.DetailEn).HasMaxLength(1000);
        builder.Property(e => e.DetailEs).HasMaxLength(1000);
        builder.HasIndex(e => e.ApplicationId);
    }
}

public class ApplicationCommentConfiguration : IEntityTypeConfiguration<ApplicationComment>
{
    public void Configure(EntityTypeBuilder<ApplicationComment> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Body).HasMaxLength(2000).IsRequired();
        builder.HasOne(c => c.Author).WithMany().HasForeignKey(c => c.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(c => c.ApplicationId);
    }
}

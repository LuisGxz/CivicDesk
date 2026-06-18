using CivicDesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CivicDesk.Infrastructure.Persistence.Configurations;

public class ServiceTypeConfiguration : IEntityTypeConfiguration<ServiceType>
{
    public void Configure(EntityTypeBuilder<ServiceType> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Slug).HasMaxLength(60).IsRequired();
        builder.HasIndex(s => s.Slug).IsUnique();
        builder.Property(s => s.NameEn).HasMaxLength(120).IsRequired();
        builder.Property(s => s.NameEs).HasMaxLength(120).IsRequired();
        builder.Property(s => s.DescriptionEn).HasMaxLength(400).IsRequired();
        builder.Property(s => s.DescriptionEs).HasMaxLength(400).IsRequired();
        builder.Property(s => s.Icon).HasMaxLength(40).IsRequired();
        builder.Property(s => s.Category).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.Fee).HasPrecision(10, 2);
        builder.Property(s => s.ProcessingTimeEn).HasMaxLength(40).IsRequired();
        builder.Property(s => s.ProcessingTimeEs).HasMaxLength(40).IsRequired();

        builder.HasMany(s => s.FormFields).WithOne(f => f.ServiceType).HasForeignKey(f => f.ServiceTypeId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(s => s.RequiredDocuments).WithOne(d => d.ServiceType).HasForeignKey(d => d.ServiceTypeId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class FormFieldConfiguration : IEntityTypeConfiguration<FormField>
{
    public void Configure(EntityTypeBuilder<FormField> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Key).HasMaxLength(60).IsRequired();
        builder.Property(f => f.LabelEn).HasMaxLength(160).IsRequired();
        builder.Property(f => f.LabelEs).HasMaxLength(160).IsRequired();
        builder.Property(f => f.HelpTextEn).HasMaxLength(300);
        builder.Property(f => f.HelpTextEs).HasMaxLength(300);
        builder.Property(f => f.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(f => f.Options).HasMaxLength(1000);
        builder.Property(f => f.Min).HasPrecision(18, 2);
        builder.Property(f => f.Max).HasPrecision(18, 2);
        builder.HasIndex(f => new { f.ServiceTypeId, f.Key }).IsUnique();
    }
}

public class RequiredDocumentConfiguration : IEntityTypeConfiguration<RequiredDocument>
{
    public void Configure(EntityTypeBuilder<RequiredDocument> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Key).HasMaxLength(60).IsRequired();
        builder.Property(d => d.LabelEn).HasMaxLength(160).IsRequired();
        builder.Property(d => d.LabelEs).HasMaxLength(160).IsRequired();
        builder.Property(d => d.HintEn).HasMaxLength(300);
        builder.Property(d => d.HintEs).HasMaxLength(300);
        builder.HasIndex(d => new { d.ServiceTypeId, d.Key }).IsUnique();
    }
}

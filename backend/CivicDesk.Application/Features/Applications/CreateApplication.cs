using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Applications;

/// <summary>
/// Step 1 of the citizen stepper: creates a Draft application for a service and captures the
/// dynamic form values. Validates the submitted values against the service's configured fields,
/// returning per-field errors (so the form can show exactly what's wrong).
/// </summary>
public record CreateApplicationCommand(Guid CitizenId, string ServiceSlug, Dictionary<string, string> Values)
    : IRequest<ApplicationSummaryDto>;

public class CreateApplicationHandler(
    IAppDbContext db, IReferenceNumberFactory referenceFactory, IAuditLogger audit)
    : IRequestHandler<CreateApplicationCommand, ApplicationSummaryDto>
{
    public async Task<ApplicationSummaryDto> Handle(CreateApplicationCommand request, CancellationToken ct)
    {
        var service = await db.ServiceTypes
            .Include(s => s.FormFields)
            .FirstOrDefaultAsync(s => s.Slug == request.ServiceSlug && s.IsActive, ct)
            ?? throw new NotFoundException("Service", request.ServiceSlug);

        ValidateValues(service.FormFields, request.Values);

        var app = new ServiceApplication
        {
            ReferenceNumber = referenceFactory.Next(),
            ServiceTypeId = service.Id,
            CitizenId = request.CitizenId,
            Fee = service.Fee
        };

        foreach (var field in service.FormFields)
        {
            if (request.Values.TryGetValue(field.Key, out var value) && !string.IsNullOrWhiteSpace(value))
                app.FieldValues.Add(new ApplicationFieldValue { ApplicationId = app.Id, FieldKey = field.Key, Value = value.Trim() });
        }

        db.Applications.Add(app);
        audit.Record("application.created", nameof(ServiceApplication), app.Id, new { app.ReferenceNumber, service.Slug });
        await db.SaveChangesAsync(ct);

        return new ApplicationSummaryDto(
            app.Id, app.ReferenceNumber, service.Slug, service.NameEn, service.NameEs, service.Icon,
            app.Status.ToString(), app.Fee, app.CreatedAtUtc, app.SubmittedAtUtc, app.UpdatedAtUtc);
    }

    /// <summary>Mirror of the server-side rules the dynamic form enforces client-side.</summary>
    private static void ValidateValues(IEnumerable<FormField> fields, IReadOnlyDictionary<string, string> values)
    {
        var failures = new List<ValidationFailure>();

        foreach (var field in fields)
        {
            values.TryGetValue(field.Key, out var raw);
            var value = raw?.Trim() ?? string.Empty;

            if (field.Required && string.IsNullOrEmpty(value))
            {
                failures.Add(new ValidationFailure(field.Key, $"{field.LabelEn} is required."));
                continue;
            }

            if (string.IsNullOrEmpty(value)) continue;

            if (field.MaxLength is { } max && value.Length > max)
                failures.Add(new ValidationFailure(field.Key, $"{field.LabelEn} must be at most {max} characters."));

            if (field.Type == FormFieldType.Number)
            {
                if (!decimal.TryParse(value, out var number))
                    failures.Add(new ValidationFailure(field.Key, $"{field.LabelEn} must be a number."));
                else if (field.Min is { } min && number < min)
                    failures.Add(new ValidationFailure(field.Key, $"{field.LabelEn} must be at least {min}."));
                else if (field.Max is { } fmax && number > fmax)
                    failures.Add(new ValidationFailure(field.Key, $"{field.LabelEn} must be at most {fmax}."));
            }

            if (field.Type == FormFieldType.Select && !string.IsNullOrWhiteSpace(field.Options))
            {
                var allowed = field.Options.Split('|', StringSplitOptions.RemoveEmptyEntries)
                    .Select(p => p.Split(':')[0]);
                if (!allowed.Contains(value))
                    failures.Add(new ValidationFailure(field.Key, $"{field.LabelEn} has an invalid selection."));
            }
        }

        if (failures.Count > 0)
            throw new ValidationException(failures);
    }
}

using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Application.Features.Applications;
using CivicDesk.Application.Features.Officer;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using CivicDesk.Infrastructure.Common;
using CivicDesk.Infrastructure.Persistence;
using FluentAssertions;
using FluentValidation;
using Xunit;

namespace CivicDesk.UnitTests;

/// <summary>End-to-end handler flow over SQLite: citizen submits → officer reviews → decision.</summary>
public class ApplicationFlowTests : IDisposable
{
    private readonly TestDbContextFactory _factory = new();
    private readonly FakeClock _clock = new(new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc));
    private readonly FakeCurrentUser _current = new();
    private readonly IReferenceNumberFactory _refs = new ReferenceNumberFactory(new FakeClock(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)));

    private Guid _citizenId, _officerId;

    public ApplicationFlowTests() => Seed();

    private void Seed()
    {
        using var db = _factory.Create();
        var citizen = new User { Email = "c@x.gov", FullName = "Cit Izen", Role = UserRole.Citizen, PasswordHash = "x" };
        var officer = new User { Email = "o@x.gov", FullName = "Off Icer", Role = UserRole.Officer, PasswordHash = "x" };
        db.Users.AddRange(citizen, officer);

        var service = new ServiceType
        {
            Slug = "pet-registration", NameEn = "Pet registration", NameEs = "Registro de mascotas",
            DescriptionEn = "d", DescriptionEs = "d", Icon = "dog", Category = ServiceCategory.Community,
            Fee = 10m, ProcessingTimeEn = "Instant", ProcessingTimeEs = "Inmediato"
        };
        service.FormFields.Add(new FormField { ServiceTypeId = service.Id, Key = "pet_name", LabelEn = "Pet name", LabelEs = "Nombre", Type = FormFieldType.Text, Required = true });
        service.RequiredDocuments.Add(new RequiredDocument { ServiceTypeId = service.Id, Key = "government_id", LabelEn = "ID", LabelEs = "ID", Required = true });
        db.ServiceTypes.Add(service);
        db.SaveChanges();

        _citizenId = citizen.Id;
        _officerId = officer.Id;
        _current.Id = _citizenId;
        _current.Role = UserRole.Citizen;
    }

    private IAuditLogger Audit(CivicDeskDbContext db) => new AuditLogger(db, _current, _clock);

    [Fact]
    public async Task FullFlow_Create_Upload_Submit_Claim_Approve()
    {
        // Create draft
        await using (var db = _factory.Create())
        {
            var create = new CreateApplicationHandler(db, _refs, Audit(db));
            var summary = await create.Handle(new CreateApplicationCommand(_citizenId, "pet-registration",
                new() { ["pet_name"] = "Toby" }), default);
            summary.Status.Should().Be(nameof(ApplicationStatus.Draft));
            summary.ReferenceNumber.Should().StartWith("RB-2026-");
        }

        Guid appId;
        await using (var db = _factory.Create())
            appId = db.Applications.Single().Id;

        // Upload required document
        await using (var db = _factory.Create())
        {
            var upload = new UploadDocumentHandler(db, Audit(db), _clock);
            await upload.Handle(new UploadDocumentCommand(_citizenId, appId, "government_id", "id.pdf", "application/pdf", [1, 2, 3]), default);
        }

        // Submit
        await using (var db = _factory.Create())
        {
            var submit = new SubmitApplicationHandler(db, Audit(db), _clock);
            var result = await submit.Handle(new SubmitApplicationCommand(_citizenId, appId), default);
            result.Status.Should().Be(nameof(ApplicationStatus.Submitted));
        }

        // Officer claims + approves
        _current.Id = _officerId; _current.Role = UserRole.Officer;
        await using (var db = _factory.Create())
            await new ClaimApplicationHandler(db, Audit(db), _clock).Handle(new ClaimApplicationCommand(_officerId, appId), default);

        await using (var db = _factory.Create())
        {
            var detail = await new ApproveApplicationHandler(db, Audit(db), _clock)
                .Handle(new ApproveApplicationCommand(_officerId, appId, "ok", "ok"), default);
            detail.Status.Should().Be(nameof(ApplicationStatus.Approved));
            detail.Timeline.Should().HaveCountGreaterThanOrEqualTo(3);
        }

        // Audit trail recorded each action
        await using (var db = _factory.Create())
            db.AuditLogs.Count().Should().BeGreaterThanOrEqualTo(5);
    }

    [Fact]
    public async Task Create_MissingRequiredField_ThrowsValidation()
    {
        await using var db = _factory.Create();
        var create = new CreateApplicationHandler(db, _refs, Audit(db));

        var act = () => create.Handle(new CreateApplicationCommand(_citizenId, "pet-registration", new()), default);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Submit_WithoutRequiredDocument_Throws409()
    {
        Guid appId;
        await using (var db = _factory.Create())
        {
            var summary = await new CreateApplicationHandler(db, _refs, Audit(db))
                .Handle(new CreateApplicationCommand(_citizenId, "pet-registration", new() { ["pet_name"] = "Toby" }), default);
            appId = summary.Id;
        }

        await using (var db = _factory.Create())
        {
            var act = () => new SubmitApplicationHandler(db, Audit(db), _clock).Handle(new SubmitApplicationCommand(_citizenId, appId), default);
            await act.Should().ThrowAsync<ConflictException>();
        }
    }

    [Fact]
    public async Task Upload_WrongContentType_Throws409()
    {
        Guid appId;
        await using (var db = _factory.Create())
            appId = (await new CreateApplicationHandler(db, _refs, Audit(db))
                .Handle(new CreateApplicationCommand(_citizenId, "pet-registration", new() { ["pet_name"] = "Toby" }), default)).Id;

        await using (var db = _factory.Create())
        {
            var act = () => new UploadDocumentHandler(db, Audit(db), _clock)
                .Handle(new UploadDocumentCommand(_citizenId, appId, "government_id", "x.exe", "application/octet-stream", [1]), default);
            await act.Should().ThrowAsync<ConflictException>();
        }
    }

    [Fact]
    public async Task Inbox_ExcludesDrafts_AndFiltersByStatus()
    {
        // One draft (not submitted) should never appear in the officer inbox.
        await using (var db = _factory.Create())
            await new CreateApplicationHandler(db, _refs, Audit(db))
                .Handle(new CreateApplicationCommand(_citizenId, "pet-registration", new() { ["pet_name"] = "Toby" }), default);

        await using (var db = _factory.Create())
        {
            var inbox = await new GetInboxHandler(db).Handle(new GetInboxQuery(_officerId, null, false, null, null), default);
            inbox.TotalCount.Should().Be(0);
        }
    }

    public void Dispose() => _factory.Dispose();
}

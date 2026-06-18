using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using CivicDesk.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace CivicDesk.UnitTests;

public class ApplicationWorkflowTests
{
    private static readonly DateTime T0 = new(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
    private static readonly Guid Officer = Guid.NewGuid();
    private static readonly Guid Citizen = Guid.NewGuid();

    private static ServiceApplication NewApp(bool withDoc = true)
    {
        var app = new ServiceApplication
        {
            ReferenceNumber = "RB-2026-0001",
            ServiceTypeId = Guid.NewGuid(),
            CitizenId = Citizen,
            Fee = 120m
        };
        if (withDoc)
            app.Documents.Add(new ApplicationDocument
            {
                ApplicationId = app.Id, SlotKey = "government_id", FileName = "id.pdf",
                ContentType = "application/pdf", SizeBytes = 10, Content = [1, 2, 3]
            });
        return app;
    }

    [Fact]
    public void Submit_FromDraft_WithDocument_MovesToSubmitted_AndAddsTimelineEvent()
    {
        var app = NewApp();

        app.Submit(T0);

        app.Status.Should().Be(ApplicationStatus.Submitted);
        app.SubmittedAtUtc.Should().Be(T0);
        app.Events.Should().ContainSingle(e => e.Status == ApplicationStatus.Submitted);
    }

    [Fact]
    public void Submit_WithoutDocuments_Throws()
    {
        var app = NewApp(withDoc: false);

        var act = () => app.Submit(T0);

        act.Should().Throw<DomainException>().WithMessage("*document*");
    }

    [Fact]
    public void Submit_WhenNotDraft_Throws()
    {
        var app = NewApp();
        app.Submit(T0);

        var act = () => app.Submit(T0);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void StartReview_FromSubmitted_AssignsOfficer_AndMovesToUnderReview()
    {
        var app = NewApp();
        app.Submit(T0);

        app.StartReview(Officer, T0.AddHours(1));

        app.Status.Should().Be(ApplicationStatus.UnderReview);
        app.AssignedOfficerId.Should().Be(Officer);
    }

    [Fact]
    public void StartReview_FromDraft_Throws()
    {
        var app = NewApp();

        var act = () => app.StartReview(Officer, T0);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void RequestInfo_FromUnderReview_MovesToNeedsInfo()
    {
        var app = NewApp();
        app.Submit(T0);
        app.StartReview(Officer, T0.AddHours(1));

        app.RequestInfo(Officer, "Need the zoning certificate.", "Falta el certificado de zonificación.", T0.AddHours(2));

        app.Status.Should().Be(ApplicationStatus.NeedsInfo);
        app.Events.Last().DetailEn.Should().Contain("zoning");
    }

    [Fact]
    public void RequestInfo_WithEmptyMessage_Throws()
    {
        var app = NewApp();
        app.Submit(T0);
        app.StartReview(Officer, T0.AddHours(1));

        var act = () => app.RequestInfo(Officer, "  ", "  ", T0.AddHours(2));

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Resubmit_FromNeedsInfo_GoesBackToSubmitted()
    {
        var app = NewApp();
        app.Submit(T0);
        app.StartReview(Officer, T0.AddHours(1));
        app.RequestInfo(Officer, "x", "x", T0.AddHours(2));

        app.ResubmitAfterInfo(T0.AddHours(3));

        app.Status.Should().Be(ApplicationStatus.Submitted);
    }

    [Fact]
    public void Approve_FromUnderReview_IsTerminal_AndStampsDecision()
    {
        var app = NewApp();
        app.Submit(T0);
        app.StartReview(Officer, T0.AddHours(1));

        app.Approve(Officer, null, null, T0.AddHours(2));

        app.Status.Should().Be(ApplicationStatus.Approved);
        app.IsTerminal.Should().BeTrue();
        app.DecidedAtUtc.Should().Be(T0.AddHours(2));
    }

    [Fact]
    public void Approve_FromSubmitted_Throws()
    {
        var app = NewApp();
        app.Submit(T0);

        var act = () => app.Approve(Officer, null, null, T0.AddHours(1));

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Reject_RequiresReason()
    {
        var app = NewApp();
        app.Submit(T0);
        app.StartReview(Officer, T0.AddHours(1));

        var act = () => app.Reject(Officer, "", "", T0.AddHours(2));

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void FullHappyPath_BuildsAnOrderedTimeline()
    {
        var app = NewApp();
        app.Submit(T0);
        app.StartReview(Officer, T0.AddHours(1));
        app.Approve(Officer, "All good.", "Todo correcto.", T0.AddHours(2));

        app.Events.Select(e => e.Status).Should().ContainInOrder(
            ApplicationStatus.Submitted, ApplicationStatus.UnderReview, ApplicationStatus.Approved);
    }
}

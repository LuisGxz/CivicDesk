using CivicDesk.Api.Infrastructure;
using CivicDesk.Application.Features.Applications;
using CivicDesk.Application.Features.Officer;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CivicDesk.Api.Endpoints;

public static class OfficerEndpoints
{
    public record RequestInfoBody(string MessageEn, string MessageEs);
    public record ApproveBody(string? NoteEn, string? NoteEs);
    public record RejectBody(string ReasonEn, string ReasonEs);
    public record CommentBody(string Body, bool IsInternal);
    public record AssignBody(Guid OfficerId);
    public record ReviewDocBody(bool Approve);

    public static IEndpointRouteBuilder MapOfficerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/officer").WithTags("Officer").RequireAuthorization("Staff");

        group.MapGet("/applications", async (string? status, bool? mine, string? service, string? search,
            int? page, int? pageSize, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetInboxQuery(
                http.User.GetUserId(), status, mine ?? false, service, search, page ?? 1, pageSize ?? 10), ct)));

        group.MapGet("/applications/{id:guid}", async (Guid id, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetOfficerApplicationQuery(id), ct)));

        group.MapGet("/applications/{id:guid}/documents/{docId:guid}", async (Guid id, Guid docId, HttpContext http, ISender sender, CancellationToken ct) =>
        {
            var doc = await sender.Send(new GetDocumentQuery(http.User.GetUserId(), RequesterIsStaff: true, id, docId), ct);
            return Results.File(doc.Content, doc.ContentType, doc.FileName);
        });

        group.MapPost("/applications/{id:guid}/claim", async (Guid id, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new ClaimApplicationCommand(http.User.GetUserId(), id), ct)));

        group.MapPost("/applications/{id:guid}/request-info", async (Guid id, [FromBody] RequestInfoBody body, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new RequestInfoCommand(http.User.GetUserId(), id, body.MessageEn, body.MessageEs), ct)));

        group.MapPost("/applications/{id:guid}/approve", async (Guid id, [FromBody] ApproveBody body, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new ApproveApplicationCommand(http.User.GetUserId(), id, body.NoteEn, body.NoteEs), ct)));

        group.MapPost("/applications/{id:guid}/reject", async (Guid id, [FromBody] RejectBody body, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new RejectApplicationCommand(http.User.GetUserId(), id, body.ReasonEn, body.ReasonEs), ct)));

        group.MapPost("/applications/{id:guid}/comments", async (Guid id, [FromBody] CommentBody body, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new AddCommentCommand(http.User.GetUserId(), id, body.Body, body.IsInternal), ct)));

        group.MapPost("/applications/{id:guid}/documents/{docId:guid}/review", async (Guid id, Guid docId, [FromBody] ReviewDocBody body, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new ReviewDocumentCommand(id, docId, body.Approve), ct)));

        group.MapGet("/stats", async (HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetInboxStatsQuery(http.User.GetUserId()), ct)));

        // Supervisor-only: assignment, staff directory, audit trail.
        group.MapPost("/applications/{id:guid}/assign", async (Guid id, [FromBody] AssignBody body, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new AssignApplicationCommand(id, body.OfficerId), ct)))
            .RequireAuthorization("Supervisor");

        group.MapGet("/staff", async (ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetStaffQuery(), ct)))
            .RequireAuthorization("Supervisor");

        group.MapGet("/audit", async (int? take, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetAuditQuery(take ?? 50), ct)))
            .RequireAuthorization("Supervisor");

        return app;
    }
}

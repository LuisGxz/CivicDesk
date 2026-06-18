using CivicDesk.Api.Infrastructure;
using CivicDesk.Application.Features.Applications;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CivicDesk.Api.Endpoints;

public static class ApplicationEndpoints
{
    public record CreateApplicationRequest(string ServiceSlug, Dictionary<string, string> Values);
    public record ResubmitRequest(string? Note);

    public static IEndpointRouteBuilder MapApplicationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/applications").WithTags("Applications").RequireAuthorization();

        group.MapGet("", async (HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetMyApplicationsQuery(http.User.GetUserId()), ct)));

        group.MapGet("/{id:guid}", async (Guid id, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetApplicationDetailQuery(http.User.GetUserId(), id), ct)));

        group.MapPost("", async ([FromBody] CreateApplicationRequest body, HttpContext http, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new CreateApplicationCommand(http.User.GetUserId(), body.ServiceSlug, body.Values), ct);
            return Results.Created($"/api/v1/applications/{result.Id}", result);
        });

        group.MapPost("/{id:guid}/documents", async (Guid id, IFormFile file, [FromForm] string slotKey,
            HttpContext http, ISender sender, CancellationToken ct) =>
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, ct);
            var command = new UploadDocumentCommand(http.User.GetUserId(), id, slotKey, file.FileName, file.ContentType, ms.ToArray());
            return Results.Ok(await sender.Send(command, ct));
        }).DisableAntiforgery();

        group.MapPost("/{id:guid}/submit", async (Guid id, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new SubmitApplicationCommand(http.User.GetUserId(), id), ct)));

        group.MapPost("/{id:guid}/resubmit", async (Guid id, [FromBody] ResubmitRequest body, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new ResubmitApplicationCommand(http.User.GetUserId(), id, body.Note), ct)));

        group.MapGet("/{id:guid}/documents/{docId:guid}", async (Guid id, Guid docId, HttpContext http, ISender sender, CancellationToken ct) =>
        {
            var doc = await sender.Send(new GetDocumentQuery(http.User.GetUserId(), RequesterIsStaff: false, id, docId), ct);
            return Results.File(doc.Content, doc.ContentType, doc.FileName);
        });

        return app;
    }
}

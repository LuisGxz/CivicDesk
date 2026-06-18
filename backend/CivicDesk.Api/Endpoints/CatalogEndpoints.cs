using CivicDesk.Application.Features.Catalog;
using MediatR;

namespace CivicDesk.Api.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/services").WithTags("Catalog");

        group.MapGet("", async (string? category, string? search, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetServicesQuery(category, search), ct)));

        group.MapGet("/{slug}", async (string slug, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetServiceDetailQuery(slug), ct)));

        return app;
    }
}

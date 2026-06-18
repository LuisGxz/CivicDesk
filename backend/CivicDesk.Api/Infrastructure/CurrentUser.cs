using System.Security.Claims;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Enums;

namespace CivicDesk.Api.Infrastructure;

/// <summary>Reads the authenticated principal off the current HTTP request for audit + authorization.</summary>
public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public Guid Id => Principal!.GetUserId();

    public string Email => Principal?.FindFirstValue(ClaimTypes.Email)
        ?? Principal?.FindFirstValue("email") ?? "unknown";

    public UserRole Role => Enum.TryParse<UserRole>(Principal?.FindFirstValue(ClaimTypes.Role), out var role)
        ? role
        : UserRole.Citizen;

    public string? IpAddress => accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
}

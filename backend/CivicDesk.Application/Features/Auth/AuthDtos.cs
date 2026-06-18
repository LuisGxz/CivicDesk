using CivicDesk.Domain.Entities;

namespace CivicDesk.Application.Features.Auth;

public record UserDto(Guid Id, string Email, string FullName, string Role, string? Department)
{
    public static UserDto From(User user) =>
        new(user.Id, user.Email, user.FullName, user.Role.ToString(), user.Department);
}

public record AuthResponse(string AccessToken, string RefreshToken, int ExpiresInSeconds, UserDto User);

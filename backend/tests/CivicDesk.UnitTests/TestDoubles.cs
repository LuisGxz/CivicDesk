using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;

namespace CivicDesk.UnitTests;

public class FakeClock(DateTime now) : IClock
{
    public DateTime UtcNow { get; set; } = now;
}

/// <summary>Deterministic token service: the "raw" token is its own hash for easy assertions.</summary>
public class FakeJwtTokenService : IJwtTokenService
{
    private int _counter;
    public TimeSpan RefreshTokenLifetime => TimeSpan.FromDays(7);
    public (string AccessToken, int ExpiresInSeconds) CreateAccessToken(User user) => ($"access-{user.Id}", 900);
    public (string RawToken, string TokenHash) CreateRefreshToken()
    {
        var raw = $"refresh-{++_counter}";
        return (raw, HashRefreshToken(raw));
    }
    public string HashRefreshToken(string rawToken) => $"hash::{rawToken}";
}

public class FakeCurrentUser : ICurrentUser
{
    public bool IsAuthenticated { get; set; } = true;
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = "officer@civicdesk.gov";
    public UserRole Role { get; set; } = UserRole.Officer;
    public string? IpAddress { get; set; } = "127.0.0.1";
}

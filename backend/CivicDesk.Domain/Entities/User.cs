using CivicDesk.Domain.Enums;

namespace CivicDesk.Domain.Entities;

/// <summary>A portal account. Same entity backs citizens, officers and supervisors; the role gates access.</summary>
public class User
{
    public const int MaxFailedLoginAttempts = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Email { get; init; }
    public required string FullName { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; init; } = UserRole.Citizen;

    /// <summary>Department label for staff (e.g. "Zoning"); null for citizens. Surfaced in the officer UI.</summary>
    public string? Department { get; set; }

    public int FailedLoginCount { get; private set; }
    public DateTime? LockoutEndUtc { get; private set; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; init; } = [];

    public bool IsStaff => Role is UserRole.Officer or UserRole.Supervisor;

    public bool IsLockedOut(DateTime nowUtc) => LockoutEndUtc.HasValue && LockoutEndUtc.Value > nowUtc;

    public void RegisterFailedLogin(DateTime nowUtc)
    {
        FailedLoginCount++;
        if (FailedLoginCount >= MaxFailedLoginAttempts)
        {
            LockoutEndUtc = nowUtc.Add(LockoutDuration);
            FailedLoginCount = 0;
        }
    }

    public void RegisterSuccessfulLogin()
    {
        FailedLoginCount = 0;
        LockoutEndUtc = null;
    }
}

using System.Security.Cryptography;
using CivicDesk.Application.Common.Interfaces;

namespace CivicDesk.Infrastructure.Common;

/// <summary>
/// "RB-{year}-{4 digits}" (RB = Riverton Borough). The 4-digit suffix is random; the unique index on
/// ReferenceNumber plus a retry in the submit handler guarantees no collisions under concurrency.
/// </summary>
public class ReferenceNumberFactory(IClock clock) : IReferenceNumberFactory
{
    public string Next()
    {
        var suffix = RandomNumberGenerator.GetInt32(0, 10000);
        return $"RB-{clock.UtcNow.Year}-{suffix:D4}";
    }
}

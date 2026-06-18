using CivicDesk.Application.Common.Interfaces;

namespace CivicDesk.Infrastructure.Common;

public class Clock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}

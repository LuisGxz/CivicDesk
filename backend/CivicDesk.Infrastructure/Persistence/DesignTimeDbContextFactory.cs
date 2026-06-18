using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CivicDesk.Infrastructure.Persistence;

/// <summary>Used only by `dotnet ef` at design time; never at runtime.</summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<CivicDeskDbContext>
{
    public CivicDeskDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<CivicDeskDbContext>()
            .UseSqlServer("Server=localhost,14333;Database=CivicDesk;TrustServerCertificate=True;")
            .Options;

        return new CivicDeskDbContext(options);
    }
}

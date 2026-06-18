using CivicDesk.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.UnitTests;

/// <summary>Spins up a CivicDeskDbContext on a private in-memory SQLite database for handler tests.</summary>
public sealed class TestDbContextFactory : IDisposable
{
    private readonly SqliteConnection _connection;

    public TestDbContextFactory()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        using var ctx = Create();
        ctx.Database.EnsureCreated();
    }

    public CivicDeskDbContext Create()
    {
        var options = new DbContextOptionsBuilder<CivicDeskDbContext>()
            .UseSqlite(_connection)
            .Options;
        return new CivicDeskDbContext(options);
    }

    public void Dispose() => _connection.Dispose();
}

using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Features.Auth;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using CivicDesk.Infrastructure.Auth;
using FluentAssertions;
using Xunit;

namespace CivicDesk.UnitTests;

public class AuthHandlerTests : IDisposable
{
    private readonly TestDbContextFactory _factory = new();
    private readonly PasswordHasherService _hasher = new();
    private readonly FakeClock _clock = new(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
    private readonly FakeJwtTokenService _jwt = new();

    private AuthTokenIssuer Issuer(Infrastructure.Persistence.CivicDeskDbContext db) => new(db, _jwt, _clock);

    private User SeedUser(Infrastructure.Persistence.CivicDeskDbContext db, string email, string password, UserRole role = UserRole.Citizen)
    {
        var user = new User { Email = email, FullName = "Test User", Role = role, PasswordHash = _hasher.Hash(password) };
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public async Task Register_CreatesCitizen_AndReturnsTokens()
    {
        await using var db = _factory.Create();
        var handler = new RegisterHandler(db, _hasher, Issuer(db));

        var result = await handler.Handle(new RegisterCommand("New.User@CivicDesk.gov", "Passw0rd!", "New User"), default);

        result.User.Role.Should().Be(nameof(UserRole.Citizen));
        result.User.Email.Should().Be("new.user@civicdesk.gov");
        result.AccessToken.Should().NotBeNullOrEmpty();
        db.Users.Should().ContainSingle();
    }

    [Fact]
    public async Task Register_DuplicateEmail_Throws409()
    {
        await using var db = _factory.Create();
        SeedUser(db, "dup@civicdesk.gov", "Passw0rd!");
        var handler = new RegisterHandler(db, _hasher, Issuer(db));

        var act = () => handler.Handle(new RegisterCommand("dup@civicdesk.gov", "Passw0rd!", "Dup"), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Login_WithValidCredentials_Succeeds()
    {
        await using var db = _factory.Create();
        SeedUser(db, "user@civicdesk.gov", "Passw0rd!");
        var handler = new LoginHandler(db, _hasher, Issuer(db), _clock);

        var result = await handler.Handle(new LoginCommand("user@civicdesk.gov", "Passw0rd!"), default);

        result.User.Email.Should().Be("user@civicdesk.gov");
    }

    [Fact]
    public async Task Login_WrongPassword_Throws_AndCountsFailure()
    {
        await using var db = _factory.Create();
        var user = SeedUser(db, "user@civicdesk.gov", "Passw0rd!");
        var handler = new LoginHandler(db, _hasher, Issuer(db), _clock);

        var act = () => handler.Handle(new LoginCommand("user@civicdesk.gov", "wrong"), default);

        await act.Should().ThrowAsync<UnauthorizedException>();
        (await db.Users.FindAsync(user.Id))!.FailedLoginCount.Should().Be(1);
    }

    [Fact]
    public async Task Login_UnknownEmail_GivesSameErrorAsWrongPassword()
    {
        await using var db = _factory.Create();
        var handler = new LoginHandler(db, _hasher, Issuer(db), _clock);

        var act = () => handler.Handle(new LoginCommand("ghost@civicdesk.gov", "whatever"), default);

        (await act.Should().ThrowAsync<UnauthorizedException>()).Which.Message.Should().Be("Invalid email or password.");
    }

    [Fact]
    public async Task Login_FiveFailures_LocksAccount()
    {
        await using var db = _factory.Create();
        SeedUser(db, "user@civicdesk.gov", "Passw0rd!");
        var handler = new LoginHandler(db, _hasher, Issuer(db), _clock);

        for (var i = 0; i < User.MaxFailedLoginAttempts; i++)
            try { await handler.Handle(new LoginCommand("user@civicdesk.gov", "wrong"), default); } catch (UnauthorizedException) { }

        var act = () => handler.Handle(new LoginCommand("user@civicdesk.gov", "Passw0rd!"), default);
        (await act.Should().ThrowAsync<UnauthorizedException>()).Which.Message.Should().Contain("locked");
    }

    [Fact]
    public async Task Refresh_RotatesToken_AndRevokesOld()
    {
        await using var db = _factory.Create();
        var user = SeedUser(db, "user@civicdesk.gov", "Passw0rd!");
        var login = await new LoginHandler(db, _hasher, Issuer(db), _clock).Handle(new LoginCommand("user@civicdesk.gov", "Passw0rd!"), default);

        var refreshed = await new RefreshTokenHandler(db, _jwt, Issuer(db), _clock).Handle(new RefreshTokenCommand(login.RefreshToken), default);

        refreshed.RefreshToken.Should().NotBe(login.RefreshToken);
        // Old token is now revoked → reusing it fails.
        var act = () => new RefreshTokenHandler(db, _jwt, Issuer(db), _clock).Handle(new RefreshTokenCommand(login.RefreshToken), default);
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    public void Dispose() => _factory.Dispose();
}

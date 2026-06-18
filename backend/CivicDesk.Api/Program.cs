using System.Text;
using System.Threading.RateLimiting;
using CivicDesk.Api.Endpoints;
using CivicDesk.Api.Infrastructure;
using CivicDesk.Application;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Enums;
using CivicDesk.Infrastructure;
using CivicDesk.Infrastructure.Auth;
using CivicDesk.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, config) => config
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUser, CurrentUser>();

    var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
        ?? throw new InvalidOperationException("Jwt section is not configured.");

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwt.Issuer,
                ValidateAudience = true,
                ValidAudience = jwt.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30)
            };
        });

    builder.Services.AddAuthorizationBuilder()
        // Staff = any city employee (reviews applications); Supervisor = assignment + override powers.
        .AddPolicy("Staff", policy => policy.RequireRole(nameof(UserRole.Officer), nameof(UserRole.Supervisor)))
        .AddPolicy("Supervisor", policy => policy.RequireRole(nameof(UserRole.Supervisor)));

    // Behind the Azure App Service gateway the real client IP arrives in X-Forwarded-For;
    // without this the rate limiter partitions every request into one shared bucket.
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
    });

    builder.Services.AddCors(options => options.AddPolicy("frontend", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:4200"])
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();
    builder.Services.AddHealthChecks();
    builder.Services.AddOpenApi();

    var app = builder.Build();

    app.UseForwardedHeaders();
    app.UseExceptionHandler();
    app.UseSerilogRequestLogging();
    app.UseCors("frontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    if (app.Environment.IsDevelopment())
        app.MapOpenApi();

    // Apply pending migrations on startup; seed the demo dataset when enabled (dev and demo deployments).
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<CivicDeskDbContext>();
        await dbContext.Database.MigrateAsync();

        if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("SeedDemoData"))
            await scope.ServiceProvider.GetRequiredService<DevDataSeeder>().SeedAsync();
    }

    app.MapHealthChecks("/health");
    app.MapAuthEndpoints();
    app.MapCatalogEndpoints();
    app.MapApplicationEndpoints();
    app.MapOfficerEndpoints();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "CivicDesk API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program;

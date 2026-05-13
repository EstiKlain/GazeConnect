using GazeConnect.AACBoard.Core.Interfaces;
using GazeConnect.AACBoard.Core.Mapping;
using GazeConnect.AACBoard.Data;
using GazeConnect.AACBoard.Data.Repositories;
using GazeConnect.AACBoard.Service;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Carter;
using GazeConnect.AACBoard.Api.Hubs;
using GazeConnect.AACBoard.Api.Endpoints;
using GazeConnect.AACBoard.Api.BackgroundServices;
using GazeConnect.AACBoard.Api.Configuration;


// ── Serilog ────────────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();
try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ────────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .WriteTo.Console());

    // ── Database ───────────────────────────────────────────────────────────────
    builder.Services.AddDbContext<AACBoardContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // ── Repositories ───────────────────────────────────────────────────────────
    builder.Services.AddScoped<IBoardRepository, BoardRepository>();
    builder.Services.AddScoped<IButtonRepository, ButtonRepository>();
    builder.Services.AddScoped<IUsageLogRepository, UsageLogRepository>();

    // ── Services ───────────────────────────────────────────────────────────────
    builder.Services.AddScoped<IBoardService, BoardService>();

    // ── Mapster ────────────────────────────────────────────────────────────────
    BoardMappingConfig.Register();

    // ── SignalR ────────────────────────────────────────────────────────────────
    builder.Services.AddSignalR();


    // ── Carter (Minimal API modules) ──────────────────────────────────────────
    builder.Services.AddCarter();

    //─ CameraHub Subscriber ─────────────────────────────────────────────────────
    builder.Services.Configure<CameraHubSubscriberOptions>(
    builder.Configuration.GetSection(CameraHubSubscriberOptions.SectionName));
    builder.Services.AddHostedService<CameraHubFaceSubscriberHostedService>();

    // ── CORS — מאפשר ל-Angular על 4200 להתחבר ────────────────────────────────
    builder.Services.AddCors(options =>
        options.AddDefaultPolicy(policy =>
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()));   // חובה ל-SignalR


    // ── Swagger ────────────────────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // ── Health Checks ──────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!);

    var app = builder.Build();

    // ── Auto-migrate on startup ────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AACBoardContext>();
        db.Database.Migrate();
        Log.Information("Database migrations applied");
    }

    // ── Middleware pipeline ────────────────────────────────────────────────────
    app.UseSerilogRequestLogging();
    app.UseCors();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // ── Endpoints ──────────────────────────────────────────────────────────────
    app.MapCarter();
    app.MapHub<BoardHub>("/hubs/board");
    app.MapHealthChecks("/health");

    Log.Information("AAC Board Service starting on port 8080");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "AAC Board Service failed to start");
}
finally
{
    Log.CloseAndFlush();
}
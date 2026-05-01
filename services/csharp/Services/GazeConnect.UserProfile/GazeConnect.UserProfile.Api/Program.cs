using GazeConnect.UserProfile.Core.Mapping;
using GazeConnect.UserProfile.Core.Services;
using GazeConnect.UserProfile.Core.Repository;
using GazeConnect.UserProfile.Data;
using GazeConnect.UserProfile.Data.Repositories;
using GazeConnect.UserProfile.Service;
using Mapster;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// --- חיבור לDB ---
builder.Services.AddDbContext<UserProfileContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.UseVector()
    ));

// --- Mapster ---
var mapsterConfig = TypeAdapterConfig.GlobalSettings;
mapsterConfig.Scan(typeof(UserMappingConfig).Assembly);
builder.Services.AddSingleton(mapsterConfig);
builder.Services.AddScoped<IMapper, ServiceMapper>();

// --- Dependency Injection ---
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserProfileContext>();
    db.Database.Migrate();
}

// --- Health Check ---
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "UserProfile" }));

app.Run();
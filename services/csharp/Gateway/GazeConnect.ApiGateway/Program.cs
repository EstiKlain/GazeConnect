using GazeConnect.ApiGateway.Middleware;
using Microsoft.AspNetCore.RateLimiting;
var builder = WebApplication.CreateBuilder(args);


// YARP – קורא routing מה-appsettings.json
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Rate Limiting – מגביל 100 בקשות לכל 10 שניות
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("DefaultPolicy", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromSeconds(10);
        opt.QueueLimit = 10;
    });
});

// Health Checks – endpoint שמראה אם הסרוויס חי
builder.Services.AddHealthChecks();

// CORS – מאפשר לAngular על localhost:4200 לתקשר עם ה-Gateway
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseCors("AllowAngular");
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<JwtMiddleware>();
app.UseRateLimiter();


// /health מחזיר סטטוס של כל הסרוויסים
app.MapHealthChecks("/health");

// YARP מנתב את שאר הבקשות
app.MapReverseProxy();
app.Run();

app.MapGet("/", () => "GazeConnect API Gateway is running!");
app.MapHealthChecks("/health");
app.MapReverseProxy();
app.Run();


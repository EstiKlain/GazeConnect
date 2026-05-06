using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.CameraHub.Core.Models;
using GazeConnect.CameraHub.Service;
using GazeConnect.Shared.DTOs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── CircularBuffer לframes מהמצלמה ───────────────────────────
builder.Services.AddSingleton<ICircularBuffer<TimeStampedFrame>>(
    _ => new CircularBuffer<TimeStampedFrame>(capacity: 15));

// ── CircularBuffer לנקודות מבט ────────────────────────────────
builder.Services.AddSingleton<ICircularBuffer<GazePoint>>(
    _ => new CircularBuffer<GazePoint>(capacity: 15));

// ── TemporalMatcher ───────────────────────────────────────────
builder.Services.AddSingleton<ITemporalMatcher>(sp =>
{
    var gazeBuffer = sp.GetRequiredService<ICircularBuffer<GazePoint>>();
    var logger     = sp.GetRequiredService<ILogger<TemporalMatcher>>();
    return new TemporalMatcher(gazeBuffer, logger, toleranceMs: 50);
});

// ── Camera Source ─────────────────────────────────────────────
// builder.Services.AddSingleton<ICameraSource>(sp =>
// {
//     var logger = sp.GetRequiredService<ILogger<WebcamCameraSource>>();
//     return new WebcamCameraSource(
//         cameraId: "environment",
//         deviceIndex: 0,
//         logger: logger);
// });

// ── Camera Source ─────────────────────────────────────────────
// במקום WebcamCameraSource — BrowserCameraSource שמקבל frames מAngular
builder.Services.AddSingleton<BrowserCameraSource>();
builder.Services.AddSingleton<ICameraSource>(
    sp => sp.GetRequiredService<BrowserCameraSource>());

// ── Face Recognition HTTP Client ──────────────────────────────
builder.Services.AddHttpClient<IFaceRecognitionClient, HttpFaceRecognitionClient>(client =>
{
    var baseUrl = builder.Configuration["FaceRecognition:BaseUrl"]
                  ?? "http://face-recognition:8001";
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromMilliseconds(500);
});

// ── CameraWorker ──────────────────────────────────────────────
builder.Services.AddHostedService<CameraWorker>();

// ── Mouse Simulator — רק בפיתוח! ─────────────────────────────
var mouseEnabled = builder.Configuration.GetValue<bool>("MouseSimulator:Enabled");
if (mouseEnabled)
{
    // Singleton כדי שה-Hub וה-Worker יחלקו אותו instance
    builder.Services.AddSingleton<MouseGazeSimulator>();
    builder.Services.AddHostedService(
        sp => sp.GetRequiredService<MouseGazeSimulator>());
}

// ── Health Check ──────────────────────────────────────────────
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseCors();

app.MapHealthChecks("/health");
app.MapHub<CameraSignalRHub>("/hubs/camera");
app.MapHub<BrowserFrameHub>("/hubs/frame");


// Mouse Hub — רק כשהסימולטור פעיל
if (mouseEnabled)
    app.MapHub<MousePositionHub>("/hubs/mouse");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.Run();
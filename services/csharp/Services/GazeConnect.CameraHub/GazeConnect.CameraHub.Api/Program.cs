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

// ── CircularBuffer לframes מהמצלמה ───────────────────────────
builder.Services.AddSingleton<ICircularBuffer<TimeStampedFrame>>(
    _ => new CircularBuffer<TimeStampedFrame>(capacity: 15));

// ── CircularBuffer לנקודות מבט (GazePoint) ───────────────────
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
builder.Services.AddSingleton<ICameraSource>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<WebcamCameraSource>>();
    return new WebcamCameraSource(
        cameraId: "environment",
        deviceIndex: 0,
        logger: logger);
});

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

// ── Health Check ──────────────────────────────────────────────
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapHealthChecks("/health");
app.MapHub<CameraSignalRHub>("/hubs/camera");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.Run();
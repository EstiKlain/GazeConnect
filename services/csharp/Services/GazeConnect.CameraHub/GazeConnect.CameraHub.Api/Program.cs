using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.CameraHub.Core.Models;
using GazeConnect.CameraHub.Service;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddSignalR();


// ── CircularBuffer ────────────────────────────────────────────
// Singleton: חי כל חיי האפליקציה
// 15 frames = 500ms ב-30fps
builder.Services.AddSingleton<ICircularBuffer<TimeStampedFrame>>(
    _ => new CircularBuffer<TimeStampedFrame>(capacity: 15));


   // ── Camera Source ─────────────────────────────────────────────
// Simulation Mode: webcam רגילה (device 0)
// בייצור: מחליפים ל-DualCameraSource ללא שינוי בשאר הקוד
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

// ── CameraWorker (IHostedService) ─────────────────────────────
builder.Services.AddHostedService<CameraWorker>();

// ── Health Check ──────────────────────────────────────────────
builder.Services.AddHealthChecks();

var app = builder.Build();


app.MapHealthChecks("/health");
app.MapHub<CameraSignalRHub>("/hubs/camera");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.Run();


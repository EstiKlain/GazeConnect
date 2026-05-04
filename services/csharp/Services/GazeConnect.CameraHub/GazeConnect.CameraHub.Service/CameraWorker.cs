using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.CameraHub.Core.Models;
using GazeConnect.Shared.DTOs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// ה-IHostedService הראשי — "הלב הדופק" של CameraHub.
///
/// הסדר בכל iteration של ה-loop:
/// 1. קרא frame מהמצלמה (33ms = 30fps)
/// 2. שמור ב-CircularBuffer (תמיד — גם בלי זיהוי)
/// 3. כל 3 frames — שלח לPython לזיהוי (10fps = חיסכון ב-CPU)
/// 4. תוצאה חזרה → שלח SignalR event לAngular
/// 5. המתן את יתרת ה-33ms
///
/// Fire-and-forget לזיהוי: ה-loop לא חוסם עד שPython מחזיר.
/// </summary>
public sealed class CameraWorker : BackgroundService
{
    private const int FrameIntervalMs = 33;       // 30fps
    private const int RecognitionSamplingRate = 3; // שלח לזיהוי כל frame שלישי = 10fps

    private readonly ICameraSource _camera;
    private readonly ICircularBuffer<TimeStampedFrame> _buffer;
    private readonly IFaceRecognitionClient _recognitionClient;
    private readonly IHubContext<CameraSignalRHub> _hubContext;
    private readonly ILogger<CameraWorker> _logger;
    private int _frameCount;

    public CameraWorker(
        ICameraSource camera,
        ICircularBuffer<TimeStampedFrame> buffer,
        IFaceRecognitionClient recognitionClient,
        IHubContext<CameraSignalRHub> hubContext,
        ILogger<CameraWorker> logger)
    {
        _camera = camera;
        _buffer = buffer;
        _recognitionClient = recognitionClient;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CameraWorker starting for camera: {CameraId}", _camera.CameraId);

        await _camera.OpenAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var loopStart = DateTimeOffset.UtcNow;

            try
            {
                await ProcessFrameAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // שגיאה בframe בודד לא עוצרת את כל המערכת
                _logger.LogError(ex, "Error processing frame from {CameraId}", _camera.CameraId);
            }

            // שמירה על קצב קבוע של 30fps
            var elapsed = DateTimeOffset.UtcNow - loopStart;
            var delay = FrameIntervalMs - (int)elapsed.TotalMilliseconds;
            if (delay > 0)
                await Task.Delay(delay, stoppingToken);
        }

        await _camera.DisposeAsync();
        _logger.LogInformation("CameraWorker stopped");
    }

    private async Task ProcessFrameAsync(CancellationToken ct)
    {
        var frame = await _camera.ReadFrameAsync(ct);
        if (frame is null) return;

        // שמור תמיד — Buffer צריך להיות מלא לTemporalMatching
        _buffer.Add(frame);
        _frameCount++;

        // זיהוי רק כל N frames
        if (_frameCount % RecognitionSamplingRate != 0) return;

        // Fire-and-forget — לא חוסמים את ה-loop הראשי
        _ = Task.Run(async () =>
        {
            var results = await _recognitionClient.RecognizeAsync(frame, ct);

            foreach (var result in results)
            {
                // שלח event לAngular דרך SignalR
                // FaceDetectionResult מגיע מ-Shared — Angular מכיר את המבנה הזה
                await _hubContext.Clients.All.SendAsync(
                    "FaceDetected", result, ct);

                _logger.LogDebug(
                    "Face detected: PersonId={PersonId} ({Confidence:P0}) IsKnown={IsKnown}",
                    result.PersonId,
                    result.Confidence,
                    result.IsKnown);
            }
        }, ct);
    }
}
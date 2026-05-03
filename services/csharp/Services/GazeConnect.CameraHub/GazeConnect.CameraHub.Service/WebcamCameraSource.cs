using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.CameraHub.Core.Models;
using Microsoft.Extensions.Logging;
using OpenCvSharp;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// מימוש ICameraSource עבור webcam רגילה באמצעות OpenCV.
/// 
/// בסימולציה (Development): אותה webcam משמשת כמצלמת הסביבה.
/// בייצור (Production): תוחלף במצלמה ייעודית לכל תפקיד.
/// 
/// OpenCvSharp: wrapper ל-C# מסביב ל-OpenCV הידוע.
/// </summary>
public sealed class WebcamCameraSource : ICameraSource
{
    private VideoCapture? _capture;
    private readonly int _deviceIndex;
    private readonly ILogger<WebcamCameraSource> _logger;

    public string CameraId { get; }
    public bool IsOpen => _capture?.IsOpened() ?? false;

    public WebcamCameraSource(string cameraId, int deviceIndex, ILogger<WebcamCameraSource> logger)
    {
        CameraId = cameraId;
        _deviceIndex = deviceIndex;
        _logger = logger;
    }

    public Task OpenAsync(CancellationToken ct)
    {
        _capture = new VideoCapture(_deviceIndex);
        if (!_capture.IsOpened())
        {
            _logger.LogError("Failed to open camera {CameraId} at device index {Index}", CameraId, _deviceIndex);
            throw new InvalidOperationException($"Cannot open camera {CameraId}");
        }

        // הגדרת רזולוציה — 640x480 מאזן בין איכות לביצועים
        _capture.Set(VideoCaptureProperties.FrameWidth, 640);
        _capture.Set(VideoCaptureProperties.FrameHeight, 480);

        _logger.LogInformation("Camera {CameraId} opened successfully", CameraId);
        return Task.CompletedTask;
    }

    /// <summary>
    /// קורא frame אחד מהמצלמה.
    /// ה-timestamp נרשם מיד עם הקריאה — לפני כל עיבוד — לדיוק מקסימלי ב-TemporalMatching.
    /// </summary>
    public Task<TimeStampedFrame?> ReadFrameAsync(CancellationToken ct)
    {
        if (_capture is null || !_capture.IsOpened())
            return Task.FromResult<TimeStampedFrame?>(null);

        using var mat = new Mat();
        if (!_capture.Read(mat) || mat.Empty())
            return Task.FromResult<TimeStampedFrame?>(null);

        // Timestamp נרשם מיד — לפני encode — הכי מדויק אפשרי
        var timestamp = DateTimeOffset.UtcNow;

        // המרה ל-JPEG bytes לשליחה ל-Python
        Cv2.ImEncode(".jpg", mat, out var imageBytes,
            new ImageEncodingParam(ImwriteFlags.JpegQuality, 85));

        return Task.FromResult<TimeStampedFrame?>(
            new TimeStampedFrame(imageBytes, timestamp, CameraId));
    }

    public ValueTask DisposeAsync()
    {
        _capture?.Dispose();
        return ValueTask.CompletedTask;
    }
}
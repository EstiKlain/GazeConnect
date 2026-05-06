using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.CameraHub.Core.Models;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// מקבל frames מה-Browser (Angular) דרך SignalR
/// במקום לפתוח מצלמה פיזית — פותר את בעיית Docker/Windows
/// </summary>
public sealed class BrowserCameraSource : ICameraSource
{
    private readonly ConcurrentQueue<TimeStampedFrame> _frameQueue = new();
    private readonly ILogger<BrowserCameraSource> _logger;
    private bool _isOpen;

    public string CameraId => "environment";
    public bool IsOpen => _isOpen;

    public BrowserCameraSource(ILogger<BrowserCameraSource> logger)
    {
        _logger = logger;
    }

    public Task OpenAsync(CancellationToken ct)
    {
        _isOpen = true;
        _logger.LogInformation("BrowserCameraSource ready — waiting for frames from Angular");
        return Task.CompletedTask;
    }

    /// <summary>
    /// Angular שולח frame דרך SignalR → נשמר כאן
    /// </summary>
    public void PushFrame(byte[] imageData)
    {
        var frame = new TimeStampedFrame(imageData, DateTimeOffset.UtcNow, CameraId);
        _frameQueue.Enqueue(frame);

        // שמור Queue קטן — מקסימום 5 frames ממתינים
        while (_frameQueue.Count > 5)
            _frameQueue.TryDequeue(out _);
    }

    public Task<TimeStampedFrame?> ReadFrameAsync(CancellationToken ct)
    {
        _frameQueue.TryDequeue(out var frame);
        return Task.FromResult(frame);
    }

    public ValueTask DisposeAsync()
    {
        _isOpen = false;
        return ValueTask.CompletedTask;
    }
}
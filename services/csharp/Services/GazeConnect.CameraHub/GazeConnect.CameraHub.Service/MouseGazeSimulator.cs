using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.Shared.DTOs;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// סימולטור לפיתוח בלבד — מחקה מצלמת עיניים באמצעות העכבר.
///
/// במקום מצלמת עיניים אמיתית שמחשבת GazePoint:
/// → אנחנו שואלים את מיקום העכבר כל 33ms (30fps)
/// → ממירים את המיקום לנקודה נורמלית בין 0.0 ל-1.0
/// → דוחפים ל-CircularBuffer — בדיוק כמו שמצלמה אמיתית הייתה עושה
///
/// למה זה מספיק לבדיקה?
/// TemporalMatcher לא אכפת לו מאיפה הגיע הGazePoint —
/// הוא רק צריך שיהיה GazePoint בBuffer עם timestamp מדויק.
/// </summary>
public sealed class MouseGazeSimulator : BackgroundService
{
    private const int IntervalMs = 33; // 30fps — זהה לCameraWorker

    private readonly ICircularBuffer<GazePoint> _gazeBuffer;
    private readonly ITemporalMatcher _temporalMatcher;
    private readonly ILogger<MouseGazeSimulator> _logger;

    // מיקום העכבר הנוכחי — מתעדכן מ-thread חיצוני
    private float _mouseX;
    private float _mouseY;
    private readonly object _mouseLock = new();

    // גודל המסך — לנרמול מיקום העכבר
    private const float ScreenWidth  = 1920f;
    private const float ScreenHeight = 1080f;

    public MouseGazeSimulator(
        ICircularBuffer<GazePoint> gazeBuffer,
        ITemporalMatcher temporalMatcher,
        ILogger<MouseGazeSimulator> logger)
    {
        _gazeBuffer      = gazeBuffer;
        _temporalMatcher = temporalMatcher;
        _logger          = logger;
    }

    /// <summary>
    /// מתעדכן מה-Angular דרך SignalR endpoint —
    /// Angular שולח מיקום עכבר כל תנועה.
    /// </summary>
    public void UpdateMousePosition(float screenX, float screenY)
    {
        lock (_mouseLock)
        {
            // נרמול: מיקום פיקסלים → 0.0 עד 1.0
            _mouseX = Math.Clamp(screenX / ScreenWidth,  0f, 1f);
            _mouseY = Math.Clamp(screenY / ScreenHeight, 0f, 1f);
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "MouseGazeSimulator started — move your mouse to simulate eye gaze");

        while (!stoppingToken.IsCancellationRequested)
        {
            var loopStart = DateTimeOffset.UtcNow;

            float x, y;
            lock (_mouseLock) { x = _mouseX; y = _mouseY; }

            // צור GazePoint מהעכבר ודחוף לBuffer
            var gazePoint = new GazePoint(
                X:            x,
                Y:            y,
                UtcTimestamp: DateTimeOffset.UtcNow,
                Confidence:   1.0f); // סימולציה = תמיד בטוח 100%

            _gazeBuffer.Add(gazePoint);

            // נסה לחבר פנים שהמתינו לGazePoint
            var flushed = _temporalMatcher.FlushPending();
            if (flushed.Count > 0)
            {
                _logger.LogInformation(
                    "FlushPending matched {Count} face(s) after new GazePoint",
                    flushed.Count);
            }

            // שמור על קצב קבוע של 30fps
            var elapsed = DateTimeOffset.UtcNow - loopStart;
            var delay   = IntervalMs - (int)elapsed.TotalMilliseconds;
            if (delay > 0)
                await Task.Delay(delay, stoppingToken);
        }

        _logger.LogInformation("MouseGazeSimulator stopped");
    }
}
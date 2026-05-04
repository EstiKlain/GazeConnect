using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.Shared.DTOs;
using GazeConnect.Shared.Events;
using Microsoft.Extensions.Logging;

namespace GazeConnect.CameraHub.Service;

public sealed class TemporalMatcher : ITemporalMatcher
{
    private readonly ICircularBuffer<GazePoint> _gazeBuffer;
    private readonly ILogger<TemporalMatcher> _logger;
    private readonly Queue<FaceDetectionResult> _pendingFaces = new();
    private readonly object _lock = new();

    public int ToleranceMs { get; }

    public TemporalMatcher(
        ICircularBuffer<GazePoint> gazeBuffer,
        ILogger<TemporalMatcher> logger,
        int toleranceMs = 50)
    {
        _gazeBuffer = gazeBuffer;
        _logger     = logger;
        ToleranceMs = toleranceMs;
    }

    /// מנסה למצוא GazePoint בטווח ±ToleranceMs מתוצאת הזיהוי.
    /// אם נמצא → מחזיר GazeEvent. אם לא → שומר בQueue לניסיון מאוחר.
    public GazeEvent? TryMatch(FaceDetectionResult face)
    {
        var from       = DateTimeOffset.FromUnixTimeMilliseconds(face.TimestampMs - ToleranceMs);
        var to         = DateTimeOffset.FromUnixTimeMilliseconds(face.TimestampMs + ToleranceMs);
        var candidates = _gazeBuffer.GetInTimeRange(from, to);

        if (candidates.Count == 0)
        {
            // אין gaze בטווח — שמור לניסיון מאוחר
            lock (_lock) _pendingFaces.Enqueue(face);
            _logger.LogDebug(
                "No gaze match for face {PersonId} at {Ts}ms — queued ({Count} pending)",
                face.PersonId, face.TimestampMs, _pendingFaces.Count);
            return null;
        }

        // בחר את הGazePoint הקרוב ביותר בזמן
        var best = candidates
            .OrderBy(g => Math.Abs(g.UtcTimestamp.ToUnixTimeMilliseconds() - face.TimestampMs))
            .First();

        var deltaMs = (int)Math.Abs(best.UtcTimestamp.ToUnixTimeMilliseconds() - face.TimestampMs);

        _logger.LogDebug(
            "Match: {PersonId} Δ={Delta}ms gaze=({X:F2},{Y:F2})",
            face.PersonId, deltaMs, best.X, best.Y);

        return new GazeEvent
        {
            Face       = face,
            GazePoint  = best,
            DeltaMs    = deltaMs,
            OccurredAt = DateTimeOffset.UtcNow
        };
    }

    /// מנסה שוב לחבר פנים שהיו ממתינות, כשמגיע GazePoint חדש.
    /// פנים ישנות מ-500ms → נזרקות.
    /// תוקן: שומר pending בנפרד כדי למנוע לולאה אינסופית בתוך ה-Queue
    public IReadOnlyList<GazeEvent> FlushPending()
    {
        var matched      = new List<GazeEvent>();
        var stillPending = new List<FaceDetectionResult>();

        lock (_lock)
        {
            while (_pendingFaces.TryDequeue(out var face))
            {
                long ageMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - face.TimestampMs;
                if (ageMs > 500)
                {
                    // ישן מדי — זרוק
                    _logger.LogDebug(
                        "Dropping stale face {PersonId} (age {Age}ms)",
                        face.PersonId, ageMs);
                    continue;
                }

                var from       = DateTimeOffset.FromUnixTimeMilliseconds(face.TimestampMs - ToleranceMs);
                var to         = DateTimeOffset.FromUnixTimeMilliseconds(face.TimestampMs + ToleranceMs);
                var candidates = _gazeBuffer.GetInTimeRange(from, to);

                if (candidates.Count == 0)
                {
                    // עדיין לא נמצא gaze — שמור בנפרד, לא חוזר לQueue עכשיו
                    stillPending.Add(face);
                    continue;
                }

                var best = candidates
                    .OrderBy(g => Math.Abs(g.UtcTimestamp.ToUnixTimeMilliseconds() - face.TimestampMs))
                    .First();

                matched.Add(new GazeEvent
                {
                    Face       = face,
                    GazePoint  = best,
                    DeltaMs    = (int)Math.Abs(best.UtcTimestamp.ToUnixTimeMilliseconds() - face.TimestampMs),
                    OccurredAt = DateTimeOffset.UtcNow
                });
            }

            // החזר לQueue רק את מה שעדיין ממתין — אחרי שסיימנו לעבור
            foreach (var f in stillPending)
                _pendingFaces.Enqueue(f);
        }

        return matched;
    }
}
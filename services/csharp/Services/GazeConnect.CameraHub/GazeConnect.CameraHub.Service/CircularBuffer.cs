using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.CameraHub.Core.Models;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// Buffer מעגלי thread-safe ששומר frames מהמצלמה בזיכרון.
///
/// איך עובד:
/// - שומר עד [capacity] פריטים
/// - כשמלא → הפריט הכי ישן נמחק אוטומטית
/// - GetInTimeRange: "תן לי את כל ה-frames שצולמו בין X ל-Y"
///
/// למה 500ms / 15 frames?
/// 30fps × 0.5s = 15 frames — מספיק ל-TemporalMatching של ±50ms
/// עם מרווח בטיחות x5.
/// </summary>
public sealed class CircularBuffer<T> : ICircularBuffer<T>
    where T : TimeStampedFrame
{
    private readonly T[] _buffer;
    private int _head;   // מצביע על המקום הבא לכתיבה
    private int _count;  // כמה פריטים יש כרגע
 private readonly object _lock = new();
    public CircularBuffer(int capacity)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(capacity, 1);
        _buffer = new T[capacity];
    }

    public int Count
    {
        get { lock (_lock) return _count; }
    }

    /// <summary>
    /// מוסיף frame ל-Buffer.
    /// אם מלא — דורס את הישן ביותר (לא זורק exception).
    /// </summary>
    public void Add(T item)
    {
        lock (_lock)
        {
            _buffer[_head] = item;
            _head = (_head + 1) % _buffer.Length;
            if (_count < _buffer.Length) _count++;
        }
    }

    /// <summary>
    /// מחזיר את כל ה-frames שצולמו בין [from] ל-[to].
    /// מחזיר רשימה ריקה אם אין frames בטווח.
    /// </summary>
    public IReadOnlyList<T> GetInTimeRange(DateTimeOffset from, DateTimeOffset to)
    {
        lock (_lock)
        {
            var results = new List<T>(_count);
            for (var i = 0; i < _count; i++)
            {
                var idx = (_head - _count + i + _buffer.Length) % _buffer.Length;
                var item = _buffer[idx];
                if (item.UtcTimestamp >= from && item.UtcTimestamp <= to)
                    results.Add(item);
            }
            return results;
        }
    }
}
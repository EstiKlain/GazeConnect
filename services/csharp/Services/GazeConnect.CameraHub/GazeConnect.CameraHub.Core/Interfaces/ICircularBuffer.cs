namespace GazeConnect.CameraHub.Core.Interfaces;

/// <summary>
/// אינטרפייס ל-Buffer מעגלי — שומר N פריטים אחרונים בזיכרון.
/// כשה-Buffer מלא, הפריט הישן ביותר נמחק אוטומטית.
/// 
/// למה אינטרפייס? כדי שאפשר להחליף מימוש (thread-safe, lock-free וכו').
/// </summary>
public interface ICircularBuffer<T>
{
    /// <summary>מוסיף פריט ל-Buffer</summary>
    void Add(T item);

    /// <summary>
    /// מחזיר את כל הפריטים בטווח זמן נתון.
    /// משמש ל-TemporalMatching: "תן לי frames מהרגע הזה ±50ms"
    /// </summary>
    IReadOnlyList<T> GetInTimeRange(DateTimeOffset from, DateTimeOffset to);

    /// <summary>מספר הפריטים הנוכחי ב-Buffer</summary>
    int Count { get; }
}
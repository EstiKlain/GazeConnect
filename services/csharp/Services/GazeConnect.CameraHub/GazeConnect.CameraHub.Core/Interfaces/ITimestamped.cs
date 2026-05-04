// GazeConnect.CameraHub.Core/Interfaces/ITimestamped.cs
// ✅ חדש — Interface שמאחד GazePoint ו-TimeStampedFrame תחת constraint אחד
// בלעדיו, CircularBuffer לא יכול לקבל גם frames וגם gaze points

namespace GazeConnect.CameraHub.Core.Interfaces;

public interface ITimestamped
{
    /// מתי הפריט נוצר/נלכד — קריטי ל-TemporalMatching
    DateTimeOffset UtcTimestamp { get; }
}
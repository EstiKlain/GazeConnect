using GazeConnect.Shared.DTOs;
using GazeConnect.Shared.Events;

namespace GazeConnect.CameraHub.Core.Interfaces;

public interface ITemporalMatcher
{
    /// כמה מילישניות מרווח מותר בין זיהוי פנים לנקודת מבט
    int ToleranceMs { get; }

    /// מנסה לחבר תוצאת זיהוי פנים לנקודת מבט קרובה בזמן.
    /// מחזיר GazeEvent אם נמצאה התאמה, null אם הפנים נכנסות לqueue להמתנה.
    GazeEvent? TryMatch(FaceDetectionResult face);

    /// מנסה שוב לחבר פנים שהמתינו ללא match.
    /// קוראים לזה כשמגיע GazePoint חדש לBuffer.
    IReadOnlyList<GazeEvent> FlushPending();
}
using GazeConnect.CameraHub.Core.Models;

namespace GazeConnect.CameraHub.Core.Interfaces;

/// <summary>
/// אינטרפייס למקור מצלמה — מאפשר החלפה בין:
/// - מצלמה אמיתית (OpenCV)
/// - סימולציה (webcam בודדת)
/// - מצלמת עיניים (עתידי)
/// 
/// זה מה שמאפשר את ה"אלגנטיות" — הקוד הראשי לא יודע מאיפה מגיעים ה-frames.
/// </summary>
public interface ICameraSource : IAsyncDisposable
{
    /// <summary>מזהה ייחודי של המצלמה: "environment" | "eye-tracking"</summary>
    string CameraId { get; }

    /// <summary>פותח את חיבור המצלמה</summary>
    Task OpenAsync(CancellationToken ct);

    /// <summary>קורא frame הבא מהמצלמה. מחזיר null אם אין frame זמין.</summary>
    Task<TimeStampedFrame?> ReadFrameAsync(CancellationToken ct);

    /// <summary>האם המצלמה פועלת ומוכנה</summary>
    bool IsOpen { get; }
}
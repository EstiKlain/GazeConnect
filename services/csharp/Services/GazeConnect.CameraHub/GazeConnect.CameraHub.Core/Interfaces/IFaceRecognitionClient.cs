using GazeConnect.CameraHub.Core.Models;
using GazeConnect.Shared.DTOs;

namespace GazeConnect.CameraHub.Core.Interfaces;

/// <summary>
/// אינטרפייס לתקשורת עם Python Face Recognition Service (port 8001).
///
/// האבסטרקציה מאפשרת:
/// - Mock בבדיקות (ללא Python אמיתי)
/// - החלפת מימוש בעתיד (HTTP → gRPC)
///
/// FaceDetectionResult מגיע מ-GazeConnect.Shared כי
/// גם ה-Frontend וגם שירותים אחרים צריכים לדעת מה זה.
/// </summary>
public interface IFaceRecognitionClient
{
    /// <summary>
    /// שולח frame לשירות Python ומקבל רשימת פנים שזוהו.
    /// מחזיר רשימה ריקה אם לא נמצאו פנים או אם Python לא זמין.
    /// </summary>
    Task<IReadOnlyList<FaceDetectionResult>> RecognizeAsync(
        TimeStampedFrame frame,
        CancellationToken ct);
}
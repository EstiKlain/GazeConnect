namespace GazeConnect.CameraHub.Core.Models;

/// <summary>
/// מייצג frame בודד שצולם מהמצלמה.
/// record = immutable, value-based equality (C# 9+)
///
/// למה רק המודל הזה נשאר ב-CameraHub.Core?
/// כי TimeStampedFrame ייחודי לCameraHub בלבד.
/// GazePoint ו-FaceDetectionResult נמצאים ב-GazeConnect.Shared
/// כי שירותים אחרים (AACBoard, Frontend) גם משתמשים בהם.
/// </summary>
/// <param name="ImageData">תמונה גולמית בפורמט JPEG כ-bytes</param>
/// <param name="UtcTimestamp">מתי בדיוק צולמה התמונה (UTC) — קריטי ל-TemporalMatching</param>
/// <param name="CameraId">זיהוי המצלמה: "environment" | "eye-tracking"</param>
public record TimeStampedFrame(
    byte[] ImageData,
    DateTimeOffset UtcTimestamp,
    string CameraId
);
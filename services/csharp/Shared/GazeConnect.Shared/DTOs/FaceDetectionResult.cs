namespace GazeConnect.Shared.DTOs;
//Python מזהה פנים → שולח את זה ל-C# → C# יודע מי נמצא בחדר.
public record FaceDetectionResult(
    Guid PersonId,  // Unique identifier for the detected person
    float Confidence,  // Confidence score of the detection (0.0 to 1.0)
    BoundingBox BoundingBox,//איפה הפנים נמצאות בתמונה- מיקום וגודל
    long TimestampMs // מתי זוהה — לסנכרון עם מבט העיניים
);

public record BoundingBox(
    int X, int Y,  // נקודת התחלה של המלבן
    int Width, int Height // רוחב וגובה של המלבן סביב הפנים
);
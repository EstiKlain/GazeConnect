namespace GazeConnect.Shared.DTOs;

// Python מזהה פנים → שולח את זה ל-C# → C# יודע מי נמצא בחדר.
public record FaceDetectionResult(
    Guid? PersonId,        // מזהה האדם מה-DB (null אם לא מוכר)
    string? PersonName,    // שם לתצוגה על הכפתור (null אם לא מוכר)
    float Confidence,      // רמת ביטחון (0.0 עד 1.0) — סף: 0.5
    BoundingBox BoundingBox, // איפה הפנים בתמונה — מיקום וגודל
    long TimestampMs,      // מתי זוהה — לסנכרון עם מבט העיניים
    bool IsKnown           // האם האדם מוכר במערכת
);

public record BoundingBox(
    int X, int Y,          // נקודת התחלה של המלבן
    int Width, int Height  // רוחב וגובה של המלבן סביב הפנים
);
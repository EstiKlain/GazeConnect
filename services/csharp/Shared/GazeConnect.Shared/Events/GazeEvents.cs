// using GazeConnect.Shared.DTOs;  
// namespace GazeConnect.Shared.Events;
// //מטרה: אלו ה"הודעות" שהמערכת שולחת כשקורה משהו
// public record PersonDetectedEvent(
//     Guid PersonId, // מי זוהה
//     string PersonName,// אם ידוע, השם של האדם שזוהה
//     float Confidence,// כמה בטוח הזיהוי (0.0 עד 1.0)
//     DateTimeOffset DetectedAt// מתי זוהה האדם (בזמן אמת)
// );

// public record GazeTargetEvent(
//     Guid PersonId,//על מי הילד מסתכל
//     GazePoint GazePoint,// איפה הילד מסתכל
//     DateTimeOffset Timestamp// מתי נלכד מבט העיניים (בזמן אמת)
// );


using GazeConnect.Shared.DTOs;

namespace GazeConnect.Shared.Events;

public record GazeEvent
{
    public required FaceDetectionResult Face { get; init; }// מי זוהה
    public required GazePoint GazePoint { get; init; }// איפה הילד מסתכל
    public int DeltaMs { get; init; }// כמה מילישניות הפרש בין זיהוי הפנים לנקודת המבט (למדידת הדיוק של ההתאמה)
    public DateTimeOffset OccurredAt { get; init; }// מתי נוצר האירוע הזה במערכת (יכול להיות שונה מהזמנים של הפנים וה gaz, תלוי מתי הצלחנו להתאים ביניהם)
    public bool IsKnownPerson => Face.PersonId is not null;// האם האדם שזוהה הוא מישהו שידוע למערכת (יש לו PersonId) או שמדובר בפנים לא מזוהות
}
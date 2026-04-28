using GazeConnect.Shared.DTOs;  
namespace GazeConnect.Shared.Events;
//מטרה: אלו ה"הודעות" שהמערכת שולחת כשקורה משהו
public record PersonDetectedEvent(
    Guid PersonId, // מי זוהה
    string PersonName,// אם ידוע, השם של האדם שזוהה
    float Confidence,// כמה בטוח הזיהוי (0.0 עד 1.0)
    DateTimeOffset DetectedAt// מתי זוהה האדם (בזמן אמת)
);

public record GazeTargetEvent(
    Guid PersonId,//על מי הילד מסתכל
    GazePoint GazePoint,// איפה הילד מסתכל
    DateTimeOffset Timestamp// מתי נלכד מבט העיניים (בזמן אמת)
);
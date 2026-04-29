namespace GazeConnect.Shared.DTOs;
//מצלמת העיניים עוקבת → שולחת לאן הילד מסתכל.
public record GazePoint(
    float X,  // איפה על המסך — ציר אופקי
    float Y,  // איפה על המסך — ציר אנכי
    DateTimeOffset UtcTimestamp,// מתי נלכד מבט העיניים (בזמן אמת)
    float Confidence //כמה בטוח במיקום המבט
);
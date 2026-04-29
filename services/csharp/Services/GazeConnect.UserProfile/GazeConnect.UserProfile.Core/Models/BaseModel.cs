namespace GazeConnect.UserProfile.Core.Models;

public abstract class BaseModel
{
    // מפתח ראשי – Guid ייחודי לכל רשומה
    public Guid Id { get; set; } = Guid.NewGuid();

    // מתי הרשומה נוצרה – מוגדר אוטומטית ב-Context
    public DateTime CreatedAt { get; set; }

    // מתי הרשומה עודכנה לאחרונה – מתעדכן אוטומטית בכל שמירה
    public DateTime UpdatedAt { get; set; }
}
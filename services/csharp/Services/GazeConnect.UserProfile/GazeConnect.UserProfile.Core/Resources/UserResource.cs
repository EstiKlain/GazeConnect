// namespace GazeConnect.UserProfile.Core.Resources;

// // מה שמוחזר ב-GET
// public record UserResource(Guid Id, string Name, string? Diagnosis, string Settings);

// // מה שמתקבל ב-POST/PUT
// public record SaveUserResource(string Name, string? Diagnosis, string? Settings);
namespace GazeConnect.UserProfile.Core.Resources;

// record = סוג מיוחד ב-C# לDTOs
// init = אפשר לקבוע ערך רק בעת יצירה, אחר כך readonly
// זה מה שה-API מחזיר החוצה ב-GET

public record UserResource
{
    // ה-Id שהשרת יצר — הFrontend צריך אותו לפעולות עתידיות
    public Guid Id { get; init; }

    // שם המשתמש
    public string Name { get; init; } = string.Empty;

    // האבחנה — אופציונלי, יכול להיות null
    public string? Diagnosis { get; init; }

    // הגדרות JSON — ברירת מחדל אובייקט ריק
    public string Settings { get; init; } = "{}";

    // מתי נוצר — שימושי לDisplay בUI
    public DateTime CreatedAt { get; init; }
}

// זה מה שמגיע מהFrontend ב-POST (יצירה) וב-PUT (עדכון)
// שים לב: אין Id! — ה-Server הוא שקובע את ה-Id
public record SaveUserResource
{
    // שם — חובה
    public string Name { get; init; } = string.Empty;

    // אבחנה — אופציונלי
    public string? Diagnosis { get; init; }

    // הגדרות — אופציונלי, אם לא נשלח נישאר עם ברירת מחדל
    public string? Settings { get; init; }
}
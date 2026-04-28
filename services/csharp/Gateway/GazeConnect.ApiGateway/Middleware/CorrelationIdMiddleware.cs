namespace GazeConnect.ApiGateway.Middleware;
//מטרה: כל בקשה מקבלת מספר סידורי ייחודי. ככה אפשר לעקוב בלוגים אחרי בקשה אחת שעוברת דרך כמה סרוויסים.
public class CorrelationIdMiddleware
{
    // _next = ה-middleware הבא ב-pipeline
    private readonly RequestDelegate _next;

    // Dependency Injection – ASP.NET מזריק את _next אוטומטית
    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // בדוק אם הבקשה כבר מכילה Correlation ID (למשל מ-Angular)
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault();

        // אם אין – צור אחד חדש (GUID = מספר ייחודי אקראי)
        if (string.IsNullOrEmpty(correlationId))
        {
            correlationId = Guid.NewGuid().ToString();
        }

        // הוסף את ה-ID לבקשה שיוצאת לסרוויסים הפנימיים
        context.Request.Headers["X-Correlation-ID"] = correlationId;

        // הוסף את ה-ID גם לתגובה שחוזרת ל-Angular
        // ככה האנגולר יכול לראות איזה request-id היה לו
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-Correlation-ID"] = correlationId;
            return Task.CompletedTask;
        });

        // המשך ל-middleware הבא ב-pipeline
        await _next(context);
    }
}
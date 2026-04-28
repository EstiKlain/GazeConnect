namespace GazeConnect.ApiGateway.Middleware;
//מטרה: בודק שכל בקשה מגיעה עם token תקין. בלי זה, כל אחד יכול לגשת לכל ה-API.
public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<JwtMiddleware> _logger;

    public JwtMiddleware(RequestDelegate next, ILogger<JwtMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    // נתיבים שלא דורשים authentication
    // /health – כדי שמערכות ניטור יוכלו לבדוק
    private static readonly string[] PublicPaths =
    [
        "/health",
        "/api/users/login",
        "/api/users/register"
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // בדוק אם זה נתיב ציבורי שלא צריך token
        var isPublic = PublicPaths.Any(p =>
            path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (!isPublic)
        {
            // קרא את ה-Authorization header
            // פורמט תקין: "Bearer eyJhbGciOi..."
            var authHeader = context.Request.Headers.Authorization.FirstOrDefault();

            if (authHeader == null || !authHeader.StartsWith("Bearer "))
            {
                // אין token – החזר 401 Unauthorized
                _logger.LogWarning("Request to {Path} without auth token", path);
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Authentication required",
                    path = path
                });
                return; // עצור כאן! אל תעביר לסרוויסים
            }

            // בשלב 1.1 עושים validation בסיסי
            // בשלב 4 נוסיף JWT signature verification מלא
            var token = authHeader["Bearer ".Length..];

            if (string.IsNullOrWhiteSpace(token))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
        }

        // הכל תקין – המשך ל-middleware הבא
        await _next(context);
    }
}
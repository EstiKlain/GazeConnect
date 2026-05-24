using GazeConnect.UserProfile.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace GazeConnect.UserProfile.Api.Endpoints;

public static class UserSettingsEndpoints
{
    public static void MapUserSettingsRoutes(this IEndpointRouteBuilder app)
    {
        // ----------------------------------------------------------------
        // GET /users/{id}/settings
        // מחזיר: { "calibration": { "xMin":0.18, ... } }
        // ----------------------------------------------------------------
        app.MapGet("/users/{id:guid}/settings", async (
            Guid id,
            UserProfileContext db) =>
        {
            var user = await db.Users
                               .AsNoTracking()
                               .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null) return Results.NotFound();

            var settings = JsonNode.Parse(user.Settings ?? "{}") ?? new JsonObject();
            return Results.Ok(settings);
        })
        .WithTags("UserSettings")
        .WithName("GetUserSettings");

        // ----------------------------------------------------------------
        // PATCH /users/{id}/settings
        // body: { "calibration": { "xMin":0.18, "xMax":0.79, ... } }
        // עושה merge — לא מוחק שדות קיימים אחרים ב-Settings
        // ----------------------------------------------------------------
        app.MapPatch("/users/{id:guid}/settings", async (
            Guid id,
            HttpRequest request,
            UserProfileContext db) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user is null) return Results.NotFound();

            using var body   = await JsonDocument.ParseAsync(request.Body);
            var existing     = JsonNode.Parse(user.Settings ?? "{}") as JsonObject
                               ?? new JsonObject();

            // Merge: שומרים שדות קיימים, מעדכנים רק מה שנשלח
            foreach (var prop in body.RootElement.EnumerateObject())
                existing[prop.Name] = JsonNode.Parse(prop.Value.GetRawText());

            user.Settings = existing.ToJsonString();
            // SaveChanges מעדכן UpdatedAt אוטומטית דרך OnBeforeSaveChanges
            await db.SaveChangesAsync();

            return Results.Ok(existing);
        })
        .WithTags("UserSettings")
        .WithName("PatchUserSettings");
    }
}
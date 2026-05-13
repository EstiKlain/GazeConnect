using Carter;
using GazeConnect.AACBoard.Api.Hubs;
using GazeConnect.AACBoard.Core.Interfaces;
using GazeConnect.AACBoard.Core.Resources;
using Mapster;
using Microsoft.AspNetCore.SignalR;
using BoardModel = GazeConnect.AACBoard.Core.Models.AACBoard;

namespace GazeConnect.AACBoard.Api.Endpoints;

/// <summary>
/// כל ה-Endpoints של AAC Board — Carter Module
/// </summary>
public class BoardModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/boards").WithTags("Boards");

        // GET /boards/{userId}/active — הלוח הפעיל של משתמש
        group.MapGet("/{userId:guid}/active", async (
            Guid userId,
            IBoardService svc,
            CancellationToken ct) =>
        {
            var board = await svc.GetActiveBoardAsync(userId, ct);
            if (board is null) return Results.NotFound(new { message = "No active board found" });
            return Results.Ok(board.Adapt<BoardDto>());
        });

        // GET /boards/{userId} — כל הלוחות של משתמש
        group.MapGet("/{userId:guid}", async (
            Guid userId,
            IBoardService svc,
            CancellationToken ct) =>
        {
            var boards = await svc.GetUserBoardsAsync(userId, ct);
            return Results.Ok(boards.Adapt<IReadOnlyList<BoardDto>>());
        });

        // POST /boards — צור לוח חדש
        group.MapPost("/", async (
            CreateBoardRequest req,
            IBoardService svc,
            IHubContext<BoardHub> hub,
            CancellationToken ct) =>
        {
            var board = await svc.CreateBoardAsync(req.UserId, req.Name, ct);
            var dto = board.Adapt<BoardDto>();

            // שידור ל-Angular
            await hub.Clients.Group($"user-{req.UserId}")
                     .SendAsync("BoardUpdated", dto, ct);

            return Results.Created($"/boards/{req.UserId}/active", dto);
        });

        // נתיב נפרד מ-{boardId}/buttons כדי שלא יתנגש עם מזהה משתמש
        group.MapPost("/{boardId:guid}/buttons", async (
      Guid boardId,
      AddButtonRequest req,
      IBoardService svc,
      IBoardRepository boards,
      IHubContext<BoardHub> hub,
      CancellationToken ct) =>
  {
      var board = await boards.GetByIdAsync(boardId, ct);
      if (board is null) return Results.NotFound(new { message = "Board not found" });

      var button = await svc.AddButtonAsync(
          boardId, req.Text, req.Category,
          req.Icon, req.TtsText,
          req.IsContextual, req.PersonId, ct);

      var dto = button.Adapt<ButtonDto>();
      await hub.Clients.Group($"user-{board.UserId}").SendAsync("ButtonAdded", dto, ct);
      return Results.Created($"/boards/{boardId}/buttons/{button.Id}", dto);
  });

        // DELETE /boards/buttons/{buttonId} — מחק כפתור
        group.MapDelete("/buttons/{buttonId:guid}", async (
            Guid buttonId,
            IBoardService svc,
            CancellationToken ct) =>
        {
            await svc.DeleteButtonAsync(buttonId, ct);
            return Results.NoContent();
        });

        // POST /boards/buttons/{buttonId}/press — רישום לחיצה
        group.MapPost("/buttons/{buttonId:guid}/press", async (
            Guid buttonId,
            LogButtonPressRequest req,
            IBoardService svc,
            CancellationToken ct) =>
        {
            await svc.LogButtonPressAsync(req.UserId, buttonId, req.Context, ct);
            return Results.Ok();
        });
    }
}
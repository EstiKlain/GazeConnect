using GazeConnect.AACBoard.Core.Interfaces;
using GazeConnect.AACBoard.Core.Models;
using Microsoft.Extensions.Logging;
using BoardModel = GazeConnect.AACBoard.Core.Models.AACBoard;

namespace GazeConnect.AACBoard.Service;

public class BoardService : IBoardService
{
    private readonly IBoardRepository _boards;
    private readonly IButtonRepository _buttons;
    private readonly IUsageLogRepository _logs;
    private readonly ILogger<BoardService> _logger;

    public BoardService(
        IBoardRepository boards,
        IButtonRepository buttons,
        IUsageLogRepository logs,
        ILogger<BoardService> logger)
    {
        _boards = boards;
        _buttons = buttons;
        _logs = logs;
        _logger = logger;
    }

    public Task<BoardModel?> GetActiveBoardAsync(Guid userId, CancellationToken ct = default) =>
        _boards.GetActiveByUserIdAsync(userId, ct);

    public Task<IReadOnlyList<BoardModel>> GetUserBoardsAsync(Guid userId, CancellationToken ct = default) =>
        _boards.GetAllByUserIdAsync(userId, ct);

    public async Task<BoardModel> CreateBoardAsync(Guid userId, string name, CancellationToken ct = default)
    {
        var board = new BoardModel
        {
            UserId = userId,
            Name = name,
            Layout = "{}"
        };
        var created = await _boards.AddAsync(board, ct);
        _logger.LogInformation("Board {BoardId} created for user {UserId}", created.Id, userId);
        return created;
    }

    public async Task<Button> AddButtonAsync(
     Guid boardId, string text, string category,
     string? icon, string? ttsText,
     bool isContextual = false,
     Guid? personId = null,
     CancellationToken ct = default)
    {
        var button = new Button
        {
            BoardId = boardId,
            Text = text,
            Category = category,
            Icon = icon,
            TtsText = ttsText ?? text,  // fallback: אם אין TTS text — השתמש ב-Text
            IsContextual = isContextual,
            PersonId = personId
        };
        var created = await _buttons.AddAsync(button, ct);
        _logger.LogInformation("Button '{Text}' added to board {BoardId}", text, boardId);
        return created;
    }

    public async Task<Button?> UpsertContextualButtonFromFaceAsync(
        Guid boardOwnerUserId,
        Guid? detectedPersonId,
        string label,
        float confidence,
        CancellationToken ct = default)
    {
        var board = await _boards.GetActiveByUserIdAsync(boardOwnerUserId, ct);
        if (board is null)
        {
            _logger.LogWarning("No active board for user {UserId}; skip contextual button", boardOwnerUserId);
            return null;
        }
        var text = string.IsNullOrWhiteSpace(label) ? "לא מזוהה" : label.Trim();
        await _buttons.DeleteContextualByBoardAndPersonAsync(board.Id, detectedPersonId, ct);
        return await AddButtonAsync(
            board.Id,
            text,
            "contextual",
            icon: null,
            ttsText: text,
            isContextual: true,
            personId: detectedPersonId,
            ct);
    }
    public async Task DeleteButtonAsync(Guid buttonId, CancellationToken ct = default)
    {
        await _buttons.DeleteAsync(buttonId, ct);
        _logger.LogInformation("Button {ButtonId} deleted", buttonId);
    }

    public async Task LogButtonPressAsync(
        Guid userId, Guid buttonId,
        string context = "{}",
        CancellationToken ct = default)
    {
        var log = new UsageLog
        {
            UserId = userId,
            ButtonId = buttonId,
            Timestamp = DateTime.UtcNow,
            Context = context
        };
        await _logs.AddAsync(log, ct);
        _logger.LogDebug("Button {ButtonId} pressed by user {UserId}", buttonId, userId);
    }
}

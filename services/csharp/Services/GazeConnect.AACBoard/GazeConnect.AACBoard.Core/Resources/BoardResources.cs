namespace GazeConnect.AACBoard.Core.Resources;

// ── Response DTOs ──────────────────────────────────────────────────────────────

public record ButtonDto(
    Guid Id,
    Guid BoardId,
    string Text,
    string Category,
    string? Icon,
    string? TtsText,
    bool IsContextual,
    Guid? PersonId,
    DateTime CreatedAt
);

public record BoardDto(
    Guid Id,
    Guid UserId,
    string Name,
    string Layout,
    IReadOnlyList<ButtonDto> Buttons,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

// ── Request DTOs ───────────────────────────────────────────────────────────────

public record CreateBoardRequest(Guid UserId, string Name);

public record AddButtonRequest(
    string Text,
    string Category,
    string? Icon,
    string? TtsText,
     bool IsContextual = false,
    Guid? PersonId = null
);

public record LogButtonPressRequest(Guid UserId, string Context = "{}");

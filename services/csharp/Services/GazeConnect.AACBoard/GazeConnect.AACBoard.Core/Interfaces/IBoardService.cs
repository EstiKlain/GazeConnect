using GazeConnect.AACBoard.Core.Models;
using BoardModel = GazeConnect.AACBoard.Core.Models.AACBoard;

namespace GazeConnect.AACBoard.Core.Interfaces;

public interface IBoardService
{
    Task<BoardModel?> GetActiveBoardAsync(Guid userId, CancellationToken ct = default);//לוח פעיל
    Task<IReadOnlyList<BoardModel>> GetUserBoardsAsync(Guid userId, CancellationToken ct = default);//כל הלוחות של המשתמש
    Task<BoardModel> CreateBoardAsync(Guid userId, string name, CancellationToken ct = default);//צור לוח חדש
    Task<Button> AddButtonAsync(Guid boardId, string text, string category,
        string? icon, string? ttsText,  bool isContextual = false,
        Guid? personId = null,CancellationToken ct = default);//תוסיף כפתור חדש

       Task<Button?> UpsertContextualButtonFromFaceAsync(
        Guid boardOwnerUserId,
        Guid? detectedPersonId,
        string label,
        float confidence,
        CancellationToken ct = default);//עדכן או הוסף כפתור זיהוי פנים
    Task DeleteButtonAsync(Guid buttonId, CancellationToken ct = default);//תמחק כפתור לפי ID
    Task LogButtonPressAsync(Guid userId, Guid buttonId, string context = "{}", CancellationToken ct = default);//תוסיף רשומת שימוש חדשה
}

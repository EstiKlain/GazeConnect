using BoardModel = GazeConnect.AACBoard.Core.Models.AACBoard;

namespace GazeConnect.AACBoard.Core.Interfaces;

public interface IBoardRepository
{
    Task<BoardModel?> GetByIdAsync(Guid id, CancellationToken ct = default); //תביא לוח לפי ID
    Task<BoardModel?> GetActiveByUserIdAsync(Guid userId, CancellationToken ct = default);//תביא את הלוח האחרון שהמשתמש עבד עליו
    Task<IReadOnlyList<BoardModel>> GetAllByUserIdAsync(Guid userId, CancellationToken ct = default);//תביא את כל הלוחות של המשתמש
    Task<BoardModel> AddAsync(BoardModel board, CancellationToken ct = default);//תוסיף לוח חדש
    Task UpdateAsync(BoardModel board, CancellationToken ct = default);//תעדכן לוח קיים
    Task DeleteAsync(Guid id, CancellationToken ct = default);//תמחק לוח לפי ID
}

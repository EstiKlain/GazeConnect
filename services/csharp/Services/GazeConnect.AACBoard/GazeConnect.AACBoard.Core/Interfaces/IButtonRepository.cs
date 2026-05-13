using GazeConnect.AACBoard.Core.Models;

namespace GazeConnect.AACBoard.Core.Interfaces;

public interface IButtonRepository
{
    Task<Button?> GetByIdAsync(Guid id, CancellationToken ct = default);//תביא כפתור לפי ID
    Task<IReadOnlyList<Button>> GetByBoardIdAsync(Guid boardId, CancellationToken ct = default);//תביא את כל הכפתורים של לוח מסוים
    Task<Button> AddAsync(Button button, CancellationToken ct = default);//תוסיף כפתור חדש
    Task UpdateAsync(Button button, CancellationToken ct = default);//תעדכן כפתור קיים
    Task DeleteAsync(Guid id, CancellationToken ct = default);//תמחק כפתור לפי ID

     Task<int> DeleteContextualByBoardAndPersonAsync(Guid boardId, Guid? personId, CancellationToken ct = default);
}

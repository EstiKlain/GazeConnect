// מי משתמש בו: BoardService
// מה הוא אומר: "מי שמממש אותי חייב לדעת לשמור ולהביא לוגים של לחיצות"

using GazeConnect.AACBoard.Core.Models;

namespace GazeConnect.AACBoard.Core.Interfaces;

public interface IUsageLogRepository
{
    Task<UsageLog> AddAsync(UsageLog log, CancellationToken ct = default);//תוסיף רשומת שימוש חדשה
    Task<IReadOnlyList<UsageLog>> GetByUserIdAsync(Guid userId, int limit = 50, CancellationToken ct = default);//תביא50 לחיצות אחרונות
}

using GazeConnect.AACBoard.Core.Interfaces;
using GazeConnect.AACBoard.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace GazeConnect.AACBoard.Data.Repositories;

public class UsageLogRepository : IUsageLogRepository
{
    private readonly AACBoardContext _db;
    public UsageLogRepository(AACBoardContext db) => _db = db;

    public async Task<UsageLog> AddAsync(UsageLog log, CancellationToken ct = default)
    {
        _db.UsageLogs.Add(log);
        await _db.SaveChangesAsync(ct);
        return log;
    }

    public async Task<IReadOnlyList<UsageLog>> GetByUserIdAsync(Guid userId, int limit = 50, CancellationToken ct = default) =>
        await _db.UsageLogs
            .Include(l => l.Button)
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.Timestamp)
            .Take(limit)
            .ToListAsync(ct);
}

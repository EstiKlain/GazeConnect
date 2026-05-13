using GazeConnect.AACBoard.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using BoardModel = GazeConnect.AACBoard.Core.Models.AACBoard;

namespace GazeConnect.AACBoard.Data.Repositories;

public class BoardRepository : IBoardRepository
{
    private readonly AACBoardContext _db;
    public BoardRepository(AACBoardContext db) => _db = db;

    public async Task<BoardModel?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.AACBoards
            .Include(b => b.Buttons)
            .Include(b => b.Triggers)
            .FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task<BoardModel?> GetActiveByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await _db.AACBoards
            .Include(b => b.Buttons)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.UpdatedAt)
            .FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<BoardModel>> GetAllByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await _db.AACBoards
            .Include(b => b.Buttons)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.UpdatedAt)
            .ToListAsync(ct);

    public async Task<BoardModel> AddAsync(BoardModel board, CancellationToken ct = default)
    {
        _db.AACBoards.Add(board);
        await _db.SaveChangesAsync(ct);
        return board;
    }

    public async Task UpdateAsync(BoardModel board, CancellationToken ct = default)
    {
        _db.AACBoards.Update(board);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var board = await _db.AACBoards.FindAsync(new object[] { id }, ct);
        if (board is not null)
        {
            _db.AACBoards.Remove(board);
            await _db.SaveChangesAsync(ct);
        }
    }
}

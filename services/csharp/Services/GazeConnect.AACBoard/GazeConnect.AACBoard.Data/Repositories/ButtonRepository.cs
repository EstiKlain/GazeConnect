using GazeConnect.AACBoard.Core.Interfaces;
using GazeConnect.AACBoard.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace GazeConnect.AACBoard.Data.Repositories;

public class ButtonRepository : IButtonRepository
{
    private readonly AACBoardContext _db;
    public ButtonRepository(AACBoardContext db) => _db = db;

    public async Task<Button?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.Buttons.FindAsync(new object[] { id }, ct);

    public async Task<IReadOnlyList<Button>> GetByBoardIdAsync(Guid boardId, CancellationToken ct = default) =>
        await _db.Buttons
            .Where(b => b.BoardId == boardId)
            .OrderBy(b => b.Category)
            .ThenBy(b => b.Text)
            .ToListAsync(ct);

    public async Task<Button> AddAsync(Button button, CancellationToken ct = default)
    {
        _db.Buttons.Add(button);
        await _db.SaveChangesAsync(ct);
        return button;
    }

    public async Task UpdateAsync(Button button, CancellationToken ct = default)
    {
        _db.Buttons.Update(button);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var button = await _db.Buttons.FindAsync(new object[] { id }, ct);
        if (button is not null)
        {
            _db.Buttons.Remove(button);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<int> DeleteContextualByBoardAndPersonAsync(Guid boardId, Guid? personId, CancellationToken ct = default)
    {
        var q = _db.Buttons.Where(b => b.BoardId == boardId && b.IsContextual);
        q = personId.HasValue
            ? q.Where(b => b.PersonId == personId)
            : q.Where(b => b.PersonId == null);
        var rows = await q.ToListAsync(ct);
        if (rows.Count == 0) return 0;
        _db.Buttons.RemoveRange(rows);
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }
}

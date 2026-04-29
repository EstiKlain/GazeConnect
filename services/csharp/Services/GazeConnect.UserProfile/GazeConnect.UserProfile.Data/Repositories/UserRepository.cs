using GazeConnect.UserProfile.Core.Models;
using GazeConnect.UserProfile.Core.Repository;
using Microsoft.EntityFrameworkCore;

namespace GazeConnect.UserProfile.Data.Repositories;

public class UserRepository : IUserRepository
{
    private readonly UserProfileContext _context;

    public UserRepository(UserProfileContext context)
    {
        _context = context;
    }

    // שליפת כל המשתמשים כולל אנשי הקשר שלהם
    public async Task<IEnumerable<User>> GetAllAsync()
        => await _context.Users
                         .Include(u => u.Contacts)
                         .ToListAsync();

    // שליפת משתמש יחיד לפי ID
    public async Task<User?> GetByIdAsync(Guid id)
        => await _context.Users
                         .Include(u => u.Contacts)
                         .FirstOrDefaultAsync(u => u.Id == id);

    // הוספת משתמש חדש לDB
    public async Task<User> AddAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    // עדכון משתמש קיים בDB 
    public async Task<User> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    // מחיקת משתמש לפי ID
    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }
}
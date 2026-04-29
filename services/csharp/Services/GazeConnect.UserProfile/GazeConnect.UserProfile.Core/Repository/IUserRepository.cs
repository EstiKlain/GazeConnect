namespace GazeConnect.UserProfile.Core.Repository;

public interface IUserRepository
{
    // שליפת כל המשתמשים מהדאטהבייס
    Task<IEnumerable<Models.User>> GetAllAsync();

    // שליפת משתמש לפי ID – מחזיר null אם לא נמצא
    Task<Models.User?> GetByIdAsync(Guid id);

    // הוספת משתמש חדש לדאטהבייס
    Task<Models.User> AddAsync(Models.User user);

    // עדכון משתמש קיים
    Task<Models.User> UpdateAsync(Models.User user);

    // מחיקת משתמש לפי ID
    // מחזיר true אם נמחק, false אם לא נמצא
    Task<bool> DeleteAsync(Guid id);
}
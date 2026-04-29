 namespace GazeConnect.UserProfile.Core.Repository;

public interface IContactRepository
{
    // שליפת כל אנשי הקשר של משתמש מסוים
    Task<IEnumerable<Models.Contact>> GetByUserIdAsync(Guid userId);

    // שליפת איש קשר לפי ID
    Task<Models.Contact?> GetByIdAsync(Guid id);

    // הוספת איש קשר חדש
    Task<Models.Contact> AddAsync(Models.Contact contact);

    // עדכון איש קשר קיים (למשל עדכון face embedding)
    Task<Models.Contact> UpdateAsync(Models.Contact contact);

    // מחיקת איש קשר
    Task<bool> DeleteAsync(Guid id);
}
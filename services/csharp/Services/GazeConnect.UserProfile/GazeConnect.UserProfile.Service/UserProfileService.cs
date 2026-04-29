using GazeConnect.UserProfile.Core.Models;
using GazeConnect.UserProfile.Core.Repository;
using GazeConnect.UserProfile.Core.Resources;
using GazeConnect.UserProfile.Core.Services;
using Mapster;

namespace GazeConnect.UserProfile.Service;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    // שליפת כל המשתמשים + המרה ל-DTO
    public async Task<IEnumerable<UserResource>> GetAllAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Adapt<IEnumerable<UserResource>>();
    }

    // שליפת משתמש יחיד + המרה ל-DTO
    public async Task<UserResource?> GetByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user?.Adapt<UserResource>(); // אם null → מחזיר null
    }

    // יצירת משתמש חדש
    public async Task<UserResource> CreateAsync(SaveUserResource resource)
    {
        var user = resource.Adapt<User>(); // המרה מDTO ל-Model
        var created = await _userRepository.AddAsync(user);
        return created.Adapt<UserResource>(); // החזרת DTO
    }

    // עדכון משתמש קיים
    public async Task<UserResource?> UpdateAsync(Guid id, SaveUserResource resource)
    {
        var existing = await _userRepository.GetByIdAsync(id);
        if (existing == null) return null; // לא נמצא

        // עדכון השדות על האובייקט הקיים
        resource.Adapt(existing); // Mapster ממלא את existing מ-resource
        var updated = await _userRepository.UpdateAsync(existing);
        return updated.Adapt<UserResource>();
    }

    // מחיקת משתמש
    public async Task<bool> DeleteAsync(Guid id)
        => await _userRepository.DeleteAsync(id);
}
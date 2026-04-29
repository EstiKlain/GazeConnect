using GazeConnect.UserProfile.Core.Resources;
namespace GazeConnect.UserProfile.Core.Services;

public interface IUserService
{
    Task<IEnumerable<UserResource>> GetAllAsync();
    Task<UserResource?> GetByIdAsync(Guid id);
    Task<UserResource> CreateAsync(SaveUserResource resource);
    Task<UserResource?> UpdateAsync(Guid id, SaveUserResource resource);
    Task<bool> DeleteAsync(Guid id);
}
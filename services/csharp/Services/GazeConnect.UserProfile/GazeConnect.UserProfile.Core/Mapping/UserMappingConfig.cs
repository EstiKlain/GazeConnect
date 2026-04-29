using GazeConnect.UserProfile.Core.Models;
using GazeConnect.UserProfile.Core.Resources;
using Mapster;

namespace GazeConnect.UserProfile.Core.Mapping;

public class UserMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // User (DB Model) → UserResource (DTO לחוץ)
        config.NewConfig<User, UserResource>();

        // SaveUserResource (מהחוץ) → User (לשמירה בDB)
        config.NewConfig<SaveUserResource, User>()
            .Ignore(dest => dest.Id)           // Server קובע את ה-Id
            .Ignore(dest => dest.CreatedAt)    // Context קובע אוטומטית
            .Ignore(dest => dest.UpdatedAt)    // Context קובע אוטומטית
            .Ignore(dest => dest.Contacts);    // לא נוגעים ב-Contacts כאן
    }
}
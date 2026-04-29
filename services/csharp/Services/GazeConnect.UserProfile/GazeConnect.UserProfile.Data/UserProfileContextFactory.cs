using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Pgvector.EntityFrameworkCore;

namespace GazeConnect.UserProfile.Data;

public class UserProfileContextFactory : IDesignTimeDbContextFactory<UserProfileContext>
{
    public UserProfileContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<UserProfileContext>();
        
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=gazeconnect;Username=gazeuser;Password=GazePass2025!",
            o => o.UseVector()
        );

        return new UserProfileContext(optionsBuilder.Options);
    }
}
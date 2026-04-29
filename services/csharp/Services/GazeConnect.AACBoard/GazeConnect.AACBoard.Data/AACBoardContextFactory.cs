using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GazeConnect.AACBoard.Data;

public class AACBoardContextFactory : IDesignTimeDbContextFactory<AACBoardContext>
{
    public AACBoardContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AACBoardContext>();
        
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=gazeconnect;Username=gazeuser;Password=GazePass2025!"
        );

        return new AACBoardContext(optionsBuilder.Options);
    }
}
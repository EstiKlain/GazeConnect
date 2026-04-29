using GazeConnect.AACBoard.Core.Models;
using Microsoft.EntityFrameworkCore;
// שמי לב: אם יש התנגשות, נוסיף Alias
using BoardModel = GazeConnect.AACBoard.Core.Models.AACBoard; 

namespace GazeConnect.AACBoard.Data;

public class AACBoardContext : DbContext
{
    public AACBoardContext(DbContextOptions<AACBoardContext> options) : base(options) { }

    // שימוש ב-Alias כדי למנוע את שגיאה CS0118
    public DbSet<BoardModel> AACBoards { get; set; } = default!;
    public DbSet<Button> Buttons { get; set; } = default!;
    public DbSet<UsageLog> UsageLogs { get; set; } = default!;
    public DbSet<BoardTrigger> BoardTriggers { get; set; } = default!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // הגדרת קשר ללוח (מניעת שגיאה CS1660 ע"י שימוש ב-BoardModel)
        modelBuilder.Entity<BoardModel>()
            .HasMany(b => b.Buttons)
            .WithOne(btn => btn.Board)
            .HasForeignKey(btn => btn.BoardId);

        // קשר לטריגרים
        modelBuilder.Entity<BoardTrigger>()
            .HasOne(t => t.Board)
            .WithMany() // אפשר להוסיף ICollection<BoardTrigger> ב-AACBoard אם רוצים
            .HasForeignKey(t => t.BoardId);
    }

    // ... (כאן מגיעה הלוגיקה של SaveChanges שכתבנו קודם)
    public override int SaveChanges()
    {
        OnBeforeSaveChanges();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        OnBeforeSaveChanges();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void OnBeforeSaveChanges()
    {
        var entities = ChangeTracker.Entries()
            .Where(x => x.Entity is BaseModel && (x.State == EntityState.Added || x.State == EntityState.Modified));

        foreach (var entity in entities)
        {
            var model = (BaseModel)entity.Entity;
            if (entity.State == EntityState.Added) model.CreatedAt = DateTime.UtcNow;
            model.UpdatedAt = DateTime.UtcNow;
        }
    }
}
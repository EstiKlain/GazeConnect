using GazeConnect.UserProfile.Core.Models;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore; 

namespace GazeConnect.UserProfile.Data;

public class UserProfileContext : DbContext
{
    public UserProfileContext(DbContextOptions<UserProfileContext> options) : base(options) { }

    // טבלאות בדאטהבייס
    public DbSet<User> Users { get; set; } = default!;
    public DbSet<Contact> Contacts { get; set; } = default!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // הפעלת תמיכה ב-pgvector
        modelBuilder.HasPostgresExtension("vector");

        // הגדרת Vector כ-property רגיל — לא Entity!
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.Property(c => c.FaceEmbedding)
                  .HasColumnType("vector(512)");
        });
    }

    // Override של SaveChanges – נקרא בכל שמירה רגילה
    public override int SaveChanges()
    {
        OnBeforeSaveChanges();
        return base.SaveChanges();
    }

    // Override של SaveChangesAsync – נקרא בכל שמירה async
    public override async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        OnBeforeSaveChanges();
        return await base.SaveChangesAsync(cancellationToken);
    }

    // הלוגיקה האוטומטית – רץ לפני כל שמירה לDB
    private void OnBeforeSaveChanges()
    {
        // ChangeTracker עוקב אחרי כל הרשומות שהשתנו
        var entities = ChangeTracker.Entries()
            .Where(x => x.Entity is BaseModel &&
                   (x.State == EntityState.Added ||
                    x.State == EntityState.Modified))
            .ToList();

        foreach (var entity in entities)
        {
            // רשומה חדשה – הגדר CreatedAt פעם אחת בלבד
            if (entity.State == EntityState.Added)
            {
                ((BaseModel)entity.Entity).CreatedAt = DateTime.UtcNow;
            }

            // כל שמירה – עדכן UpdatedAt אוטומטית
            ((BaseModel)entity.Entity).UpdatedAt = DateTime.UtcNow;
        }
    }
}
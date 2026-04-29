using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GazeConnect.UserProfile.Core.Models;

public class User : BaseModel
{
    // שם המשתמש – חובה, מקסימום 100 תווים
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    // האבחנה הרפואית – אופציונלי (יכול להיות null)
    [MaxLength(200)]
    public string? Diagnosis { get; set; }

    // הגדרות אישיות בפורמט JSON – שומרים כ-JSONB בPostgres
    // לדוגמה: { "language": "he", "fontSize": "large" }
    // Column מגדיר את סוג העמודה בדאטהבייס
    [Column(TypeName = "jsonb")]
    public string Settings { get; set; } = "{}";

    // Navigation Property – קשר One-to-Many
    // משתמש אחד יכול להיות עם הרבה אנשי קשר
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
}
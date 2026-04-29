using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Pgvector;

namespace GazeConnect.UserProfile.Core.Models;

public class Contact : BaseModel  
{
    // Foreign Key – לאיזה משתמש שייך
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Role { get; set; }

    // וקטור פנים מ-InsightFace – 512 מספרים
    [Column(TypeName = "vector(512)")]
    public Vector? FaceEmbedding { get; set; }

    // Navigation Property – חזרה למשתמש
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}
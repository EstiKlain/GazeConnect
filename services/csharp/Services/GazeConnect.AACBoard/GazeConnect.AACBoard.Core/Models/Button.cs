using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GazeConnect.AACBoard.Core.Models;

public class Button : BaseModel
{
    [Required]
    public Guid BoardId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Text { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Icon { get; set; }

    [MaxLength(200)]
    public string? TtsText { get; set; }

    [ForeignKey(nameof(BoardId))]
    public AACBoard? Board { get; set; }
    public ICollection<UsageLog> UsageLogs { get; set; } = new List<UsageLog>();

}
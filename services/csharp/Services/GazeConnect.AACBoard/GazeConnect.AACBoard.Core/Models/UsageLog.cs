using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GazeConnect.AACBoard.Core.Models;

public class UsageLog : BaseModel
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid ButtonId { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "jsonb")]
    public string Context { get; set; } = "{}";

    [ForeignKey(nameof(ButtonId))]
    public Button? Button { get; set; }

}
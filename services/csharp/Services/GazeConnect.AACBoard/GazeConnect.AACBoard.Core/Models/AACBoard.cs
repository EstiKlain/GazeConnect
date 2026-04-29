using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GazeConnect.AACBoard.Core.Models;

public class AACBoard : BaseModel
{
    
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "jsonb")]
    public string Layout { get; set; } = "{}";

    public ICollection<Button> Buttons { get; set; } = new List<Button>();
}
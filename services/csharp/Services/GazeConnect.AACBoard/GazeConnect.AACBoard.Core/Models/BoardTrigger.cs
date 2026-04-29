using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using GazeConnect.AACBoard.Core.Models;
public class BoardTrigger : BaseModel
{

    [Required]
    public Guid BoardId { get; set; }
    
    // סוג הטריגר: 'Location', 'Time', 'ObjectDetected'
    [Required]
    [MaxLength(50)]
    public string TriggerType { get; set; } = string.Empty;

    // הערך: למשל 'Kitchen', '08:00-09:00', 'Spoon'
    [Required]
    [MaxLength(100)]
    public string TriggerValue { get; set; } = string.Empty;

    // תנאי הטריגר בפורמט JSON
    // למשל: { "person_id": "mom", "min_confidence": 0.8 }
    [Column(TypeName = "jsonb")]
    public string Condition { get; set; } = "{}";
    

    // עוצמת הקשר (לצורך ה-AI): כמה הטריגר הזה חזק (0.0 עד 1.0)
    public double ConfidenceWeight { get; set; } = 1.0;

    // האם הטריגר פעיל
    public bool IsActive { get; set; } = true;

    // קשר ל-AACBoard
    [ForeignKey(nameof(BoardId))]
    public AACBoard? Board { get; set; }
}
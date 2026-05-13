namespace GazeConnect.AACBoard.Api.Configuration;

/// <summary>הגדרות לקוח SignalR ל-CameraHub.</summary>
public sealed class CameraHubSubscriberOptions
{
    public const string SectionName = "CameraHubSubscriber";

    public bool Enabled { get; set; } = true;

    /// <summary>דוגמה מקומית: http://localhost:5001/hubs/camera — בדוקר: http://camerahub:8080/hubs/camera</summary>
    public string HubUrl { get; set; } = "http://localhost:5001/hubs/camera";

    /// <summary>משתמש שעל הלוח הפעיל שלו נוספים כפתורים הקשריים.</summary>
    public Guid BoardOwnerUserId { get; set; }

    public float MinConfidence { get; set; } = 0.5f;
}
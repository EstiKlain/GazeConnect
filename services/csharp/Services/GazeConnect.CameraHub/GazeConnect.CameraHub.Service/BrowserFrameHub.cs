using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// Angular שולח לכאן frames מהמצלמה:
/// connection.invoke("SendFrame", base64ImageData)
/// </summary>
public sealed class BrowserFrameHub : Hub
{
    private readonly BrowserCameraSource _cameraSource;
    private readonly ILogger<BrowserFrameHub> _logger;

    public BrowserFrameHub(
        BrowserCameraSource cameraSource,
        ILogger<BrowserFrameHub> logger)
    {
        _cameraSource = cameraSource;
        _logger = logger;
    }

    public void SendFrame(string base64Image)
    {
        var imageBytes = Convert.FromBase64String(base64Image);
        _cameraSource.PushFrame(imageBytes);
    }
}
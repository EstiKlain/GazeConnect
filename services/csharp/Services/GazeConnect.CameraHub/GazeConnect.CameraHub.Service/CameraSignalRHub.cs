using Microsoft.AspNetCore.SignalR;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// SignalR Hub — ערוץ real-time בין CameraHub לAngular Frontend.
///
/// שם השינוי: CameraHub → CameraSignalRHub
/// כדי למנוע conflict עם namespace GazeConnect.CameraHub.
///
/// Events שה-Hub שולח לFrontend:
/// - "FaceDetected"  → FaceDetectionResult (מ-Shared)  — כשמזהים פנים
/// (בעתיד) "GazeEvent" → GazePoint — כשהילד מביט על חפץ
/// </summary>
public sealed class CameraSignalRHub : Hub
{
    public override Task OnConnectedAsync()
    {
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        return base.OnDisconnectedAsync(exception);
    }
}
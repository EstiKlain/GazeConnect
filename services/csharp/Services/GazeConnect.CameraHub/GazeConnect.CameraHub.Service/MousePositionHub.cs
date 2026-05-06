using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// SignalR Hub לפיתוח בלבד.
///
/// Angular שולח כאן את מיקום העכבר בכל תנועה:
/// connection.invoke("UpdateMousePosition", x, y)
///
/// ה-Hub מעביר את המיקום ל-MouseGazeSimulator
/// שדוחף GazePoint ל-CircularBuffer.
///
/// זרימה מלאה:
/// עכבר זז → Angular → SignalR → Hub → Simulator → Buffer → TemporalMatcher
/// </summary>
public sealed class MousePositionHub : Hub
{
    private readonly MouseGazeSimulator _simulator;
    private readonly ILogger<MousePositionHub> _logger;

    public MousePositionHub(
        MouseGazeSimulator simulator,
        ILogger<MousePositionHub> logger)
    {
        _simulator = simulator;
        _logger    = logger;
    }

    /// <summary>
    /// Angular קורא לזה: connection.invoke("UpdateMousePosition", x, y)
    /// x, y — מיקום בפיקסלים על המסך
    /// </summary>
    public void UpdateMousePosition(float x, float y)
    {
        _simulator.UpdateMousePosition(x, y);

        _logger.LogTrace(
            "Mouse position updated: ({X:F0}, {Y:F0})", x, y);
    }
}
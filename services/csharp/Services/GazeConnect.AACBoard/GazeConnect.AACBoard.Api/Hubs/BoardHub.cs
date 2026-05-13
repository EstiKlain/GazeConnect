using Microsoft.AspNetCore.SignalR;

namespace GazeConnect.AACBoard.Api.Hubs;

/// <summary>
/// SignalR Hub — שידור עדכוני לוח ל-Angular בזמן אמת
/// Angular מתחבר ל: ws://localhost:5002/hubs/board
/// </summary>
public class BoardHub : Hub
{
    private readonly ILogger<BoardHub> _logger;

    public BoardHub(ILogger<BoardHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected to BoardHub: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected from BoardHub: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// הצטרף לקבוצה של משתמש ספציפי (כדי לקבל עדכונים רק של הלוח שלו)
    /// Angular קורא: hubConnection.invoke('JoinUserGroup', userId)
    /// </summary>
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        _logger.LogInformation("Connection {ConnectionId} joined group user-{UserId}", Context.ConnectionId, userId);
    }
}
using GazeConnect.AACBoard.Api.Configuration;
using GazeConnect.AACBoard.Api.Hubs;
using GazeConnect.AACBoard.Core.Interfaces;
using GazeConnect.AACBoard.Core.Resources;
using GazeConnect.Shared.DTOs;
using Mapster;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Options;

namespace GazeConnect.AACBoard.Api.BackgroundServices;

/// <summary>מאזין ל-FaceDetected מ-CameraHub ומעדכן לוח + BoardHub.</summary>
public sealed class CameraHubFaceSubscriberHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<CameraHubSubscriberOptions> _options;
    private readonly IHubContext<BoardHub> _boardHub;
    private readonly ILogger<CameraHubFaceSubscriberHostedService> _logger;

    public CameraHubFaceSubscriberHostedService(
        IServiceScopeFactory scopeFactory,
        IOptions<CameraHubSubscriberOptions> options,
        IHubContext<BoardHub> boardHub,
        ILogger<CameraHubFaceSubscriberHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _options      = options;
        _boardHub     = boardHub;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var opt = _options.Value;
            if (!opt.Enabled || opt.BoardOwnerUserId == Guid.Empty)
            {
                _logger.LogWarning("CameraHub subscriber disabled or BoardOwnerUserId empty; sleeping…");
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                continue;
            }

            try
            {
                await using var connection = new HubConnectionBuilder()
                    .WithUrl(opt.HubUrl)
                    .WithAutomaticReconnect()
                    .Build();

                connection.On<FaceDetectionResult>("FaceDetected", async face =>
                {
                    try
                    {
                        if (face.Confidence < opt.MinConfidence)
                            return;

                        await using var scope = _scopeFactory.CreateAsyncScope();
                        var boardService = scope.ServiceProvider.GetRequiredService<IBoardService>();

                        var label = string.IsNullOrWhiteSpace(face.PersonName)
                            ? "לא מזוהה"
                            : face.PersonName.Trim();

                        var button = await boardService.UpsertContextualButtonFromFaceAsync(
                            opt.BoardOwnerUserId,
                            face.PersonId,
                            label,
                            face.Confidence,
                            CancellationToken.None);

                        if (button is null)
                            return;

                        var dto = button.Adapt<ButtonDto>();
                        await _boardHub.Clients
                            .Group($"user-{opt.BoardOwnerUserId}")
                            .SendAsync("ButtonAdded", dto, CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "FaceDetected handler failed");
                    }
                });

                await connection.StartAsync(stoppingToken);
                _logger.LogInformation("Connected to CameraHub at {Url}", opt.HubUrl);

                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "CameraHub SignalR client error; retry in 5s");
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }
}
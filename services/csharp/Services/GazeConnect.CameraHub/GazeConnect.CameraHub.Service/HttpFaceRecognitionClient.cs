using System.Net.Http.Json;
using GazeConnect.CameraHub.Core.Interfaces;
using GazeConnect.CameraHub.Core.Models;
using GazeConnect.Shared.DTOs;
using Microsoft.Extensions.Logging;

namespace GazeConnect.CameraHub.Service;

/// <summary>
/// שולח frame ל-Python FastAPI (port 8001) ומקבל תוצאות זיהוי.
/// </summary>
public sealed class HttpFaceRecognitionClient : IFaceRecognitionClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HttpFaceRecognitionClient> _logger;

    public HttpFaceRecognitionClient(
        HttpClient httpClient,
        ILogger<HttpFaceRecognitionClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<IReadOnlyList<FaceDetectionResult>> RecognizeAsync(
        TimeStampedFrame frame,
        CancellationToken ct)
    {
        try
        {
            using var content = new MultipartFormDataContent();

            using var imageContent = new ByteArrayContent(frame.ImageData);
            imageContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");

            content.Add(imageContent, "file", "frame.jpg");
            content.Add(
                new StringContent(frame.UtcTimestamp.ToUnixTimeMilliseconds().ToString()),
                "timestamp_ms");

            var response = await _httpClient.PostAsync("/recognize", content, ct);
            response.EnsureSuccessStatusCode();

            var results = await response.Content
                .ReadFromJsonAsync<List<FaceDetectionDto>>(ct);

            if (results is null) return [];

            return results.Select(r => new FaceDetectionResult(
                PersonId:    r.PersonId,
                PersonName:  r.PersonName,
                Confidence:  r.Confidence,        // float → float ✅
                BoundingBox: r.BoundingBox,        // BoundingBox → BoundingBox ✅
                TimestampMs: frame.UtcTimestamp.ToUnixTimeMilliseconds(),
                IsKnown:     r.IsKnown
            )).ToList();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex,
                "Face recognition service unavailable for frame {Timestamp}",
                frame.UtcTimestamp);
            return [];
        }
    }

    // DTO פנימי — בדיוק מה שPython שולח ב-JSON
    private sealed record FaceDetectionDto(
        Guid?       PersonId,
        string?     PersonName,
        float       Confidence,      // ← float (לא double) כמו FaceDetectionResult
        BoundingBox BoundingBox,     // ← חייב להיות כאן כי Python שולח את זה
        bool        IsKnown
    );
}
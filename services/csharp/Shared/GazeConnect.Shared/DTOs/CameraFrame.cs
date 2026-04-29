namespace GazeConnect.Shared.DTOs;

//אוביקט שעובר בין הסרויסים כשהמצלמה לוכדת תמונה- מכיל את התמונה עצמה ואת המידע על התמונה (מתי נלכדה, מאיזו מצלמה וכו')
public record CameraFrame(
    Guid FrameId,// Unique identifier for the frame
    string CameraId,// Identifier for the camera that captured the frame
    DateTimeOffset UtcTimestamp,// Timestamp when the frame was captured (in UTC)
    byte[] ImageData//התמונה בעצמה- מערך 
);
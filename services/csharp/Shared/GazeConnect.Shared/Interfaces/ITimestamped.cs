namespace GazeConnect.Shared.Interfaces;

public interface ITimestamped
{
    DateTimeOffset UtcTimestamp { get; }
}
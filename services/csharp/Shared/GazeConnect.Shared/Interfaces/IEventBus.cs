namespace GazeConnect.Shared.Interfaces;

public interface IEventBus
{
    Task PublishAsync<T>(T eventData, CancellationToken cancellationToken = default);// לפרסם אירוע - לשלוח הודעה שקרה משהו
    Task SubscribeAsync<T>(Func<T, Task> handler, CancellationToken cancellationToken = default);//להירשם לאירוע - להאזין להודעות שיקרו
}
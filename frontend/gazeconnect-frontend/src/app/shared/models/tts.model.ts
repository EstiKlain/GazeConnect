// shared/models/tts.model.ts
// ITtsProvider — חוזה בלבד.
// ממומש כרגע ע"י WebSpeechProvider (ב-tts.service.ts).
// בשלב 3.5 יתווסף AzureProvider / ESpeakProvider — רק יממשו את זה.

export interface ITtsProvider {
  speak(text: string, lang?: string): Promise<void>;
  cancel(): void;
}
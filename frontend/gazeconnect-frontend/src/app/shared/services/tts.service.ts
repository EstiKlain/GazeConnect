import { Injectable } from '@angular/core';
import { ITtsProvider } from '../models/tts.model';

// ── Web Speech API — מימוש עכשיו ─────────────────────────────
class WebSpeechProvider implements ITtsProvider {
  private synth = window.speechSynthesis;

  speak(text: string, lang = 'he-IL'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;    // קצת יותר איטי — מותאם לילדים
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      this.synth.speak(utterance);
    });
  }

  cancel(): void {
    this.synth.cancel();
  }
}

// ── TtsService — הממשק של כל האפליקציה ──────────────────────
// FallbackChain לפי האפיון: Azure → eSpeak → Browser TTS
// כרגע: רק Browser TTS. Azure ו-eSpeak יתווספו בשלב 3.5
@Injectable({ providedIn: 'root' })
export class TtsService {
  private provider: ITtsProvider = new WebSpeechProvider();

  // החלפת provider — יקרא בשלב 3.5 כשנוסיף eSpeak/Azure
  setProvider(provider: ITtsProvider): void {
    this.provider = provider;
  }

  speak(text: string, lang = 'he-IL'): Promise<void> {
    if (!text?.trim()) return Promise.resolve();
    return this.provider.speak(text, lang);
  }

  cancel(): void {
    this.provider.cancel();
  }

  // נוחות — מדבר את ה-ttsText אם קיים, אחרת את ה-text
  speakButton(text: string, ttsText: string | null): Promise<void> {
    return this.speak(ttsText ?? text);
  }
}
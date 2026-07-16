import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/**
 * Spoken reminders (plan.md §3.3). Android WebView's speechSynthesis is
 * unreliable-to-absent, which is why the native plugin ships in the v1 shell
 * (spec §3.1). The browser falls back to speechSynthesis where it exists.
 *
 * There is no Uzbek system voice on most devices; the OS picks the closest
 * match. Natural Uzbek TTS via Muxlisa is a Phase 3 upgrade (plan.md §5).
 */
export async function speak(text: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({ text, lang: 'uz-UZ', rate: 1.0 });
      return;
    }
    if (typeof speechSynthesis === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    speechSynthesis.speak(utterance);
  } catch {
    /* Voice is an enhancement — never let it break a reminder. */
  }
}

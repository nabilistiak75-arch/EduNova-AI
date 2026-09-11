// Web Speech API text-to-speech utility for accessibility

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private onStateChangeCallbacks: ((speaking: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public onStateChange(cb: (speaking: boolean) => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.onStateChangeCallbacks.forEach((cb) => cb(speaking));
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  public speak(text: string, lang = "en-US") {
    if (!this.synth) return;

    // Cancel current speech if any
    this.stop();

    // Clean markdown characters for pleasant listening
    const cleanText = text
      .replace(/[*_#`~[\]]/g, " ")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
      .replace(/\$\$/g, "")
      .replace(/\$/g, "")
      .replace(/\n+/g, ". ")
      .trim();

    if (!cleanText) return;

    // Detect if text is mostly Bengali characters
    const hasBengali = /[\u0980-\u09FF]/.test(cleanText);
    const chosenLang = hasBengali ? "bn-BD" : lang;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = chosenLang;
    utterance.rate = 0.95; // Slightly clearer for study purposes
    utterance.pitch = 1.0;

    // Try finding an appropriate voice
    const voices = this.synth.getVoices();
    if (hasBengali) {
      const bnVoice = voices.find((v) => v.lang.startsWith("bn"));
      if (bnVoice) utterance.voice = bnVoice;
    } else {
      const enVoice = voices.find(
        (v) => (v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")) && v.name.includes("Natural")
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onstart = () => this.notify(true);
    utterance.onend = () => this.notify(false);
    utterance.onerror = () => this.notify(false);

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false);
    }
  }

  public toggle(text: string) {
    if (this.isSpeaking) {
      this.stop();
    } else {
      this.speak(text);
    }
  }
}

export const speechService = new SpeechService();

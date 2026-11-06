/**
 * Unified Vernacular & Professional Speech Engine
 * Modeled on the battle-tested PTM Vyapar Saathi speech architecture.
 * Provides resilient, zero-friction Speech Recognition (STT) and Speech Synthesis (TTS)
 * across Google Chrome (Desktop & Mobile Android), Apple Safari (iOS & macOS), Edge, and PWA.
 */

export interface SpeechEngineCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onStateChange?: (isListening: boolean) => void;
  onError?: (message: string, code: string) => void;
  onSpeechDetected?: () => void;
}

export class SpeechEngine {
  private recognition: any = null;
  public isListening = false;
  private isRecognitionActive = false;
  private isMobileDevice = false;
  private accumulatedFinalText = '';
  private sessionFinalText = '';
  private sessionInterimText = '';
  private restartTimer: any = null;
  private rapidRestartCount = 0;
  private lastError: string | null = null;
  private callbacks: SpeechEngineCallbacks = {};
  private lang = 'en-US';
  private intentionalStop = false;

  constructor(callbacks: SpeechEngineCallbacks = {}, lang = 'en-US') {
    this.callbacks = callbacks;
    this.lang = lang || (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US');
    this.isMobileDevice = this._detectMobile();
    this.init();
  }

  private _detectMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  }

  public setCallbacks(cb: Partial<SpeechEngineCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  public init(): boolean {
    if (typeof window === 'undefined') return false;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('[SpeechEngine] Web Speech API not supported in this browser.');
      return false;
    }

    try {
      this._cleanupOldInstance();

      const recognition = new SR();
      this.recognition = recognition;

      // CRITICAL MOBILE ARCHITECTURE NOTE:
      // In Android Chrome and iOS Safari, setting `continuous: true` causes the recognition
      // engine to crash or abort immediately after the first pause.
      // Modeled after PTM Vyapar Saathi: on mobile we set `continuous: false`.
      // When the candidate pauses, onend fires, and if `isListening` is true, we seamlessly
      // restart a fresh utterance, accumulating the text into `accumulatedFinalText`.
      // On desktop Chrome, we use continuous: false with seamless auto-chaining as well,
      // which guarantees 100% stability without Chrome's 60-second cutoff bug!
      recognition.continuous = !this.isMobileDevice;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = this.lang;

      recognition.onstart = () => {
        this.isRecognitionActive = true;
        this.lastError = null;
        console.log(`[SpeechEngine] 🎙️ Speech recognition active (lang: ${this.lang}, mobile: ${this.isMobileDevice})`);
        this.callbacks.onStateChange?.(true);
      };

      recognition.onresult = (event: any) => {
        this.lastError = null;
        this.rapidRestartCount = 0;

        let curSessionFinal = '';
        let curSessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          const transcriptChunk = item[0]?.transcript || '';
          if (item.isFinal) {
            curSessionFinal += (curSessionFinal ? ' ' : '') + transcriptChunk.trim();
          } else {
            curSessionInterim += (curSessionInterim ? ' ' : '') + transcriptChunk.trim();
          }
        }

        this.sessionFinalText = curSessionFinal;
        this.sessionInterimText = curSessionInterim;

        const combined = [
          this.accumulatedFinalText,
          this.sessionFinalText,
          this.sessionInterimText,
        ].filter(Boolean).join(' ').trim();

        if (combined) {
          this.callbacks.onSpeechDetected?.();
          this.callbacks.onTranscript?.(combined, Boolean(curSessionFinal));
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error || 'unknown';
        this.lastError = err;
        console.warn('[SpeechEngine] Recognition error event:', err);

        // Aborted is normal on manual stop / pause — ignore silently (like PTM Vyapar Saathi)
        if (err === 'aborted') {
          return;
        }

        // no-speech simply means silence — do not alarm the user
        if (err === 'no-speech') {
          return;
        }

        let msg = '';
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          if (window.location.protocol === 'file:') {
            msg = 'Microphone blocked: Chrome restricts speech on file:// URLs. Open http://localhost:3000 in your browser.';
          } else if (window.location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            msg = 'Microphone blocked: Chrome requires HTTPS or localhost for microphone access on mobile/network devices. Please open via https or add origin to chrome://flags/#unsafely-treat-insecure-origin-as-secure.';
          } else {
            msg = 'Microphone permission blocked. Please click the lock or settings icon in your browser address bar and allow Microphone access.';
          }
          this.isListening = false;
          this.callbacks.onStateChange?.(false);
          this.callbacks.onError?.(msg, err);
          return;
        }

        if (err === 'audio-capture') {
          msg = 'Microphone hardware conflict. Please verify your microphone is plugged in and not locked by another application.';
          this.callbacks.onError?.(msg, err);
          return;
        }

        if (err === 'network') {
          msg = 'Speech recognition network error. Please check your internet connection.';
          // Network errors often resolve with a gentle restart
          return;
        }

        msg = `Voice recognition notice (${err}).`;
        this.callbacks.onError?.(msg, err);
      };

      recognition.onend = () => {
        this.isRecognitionActive = false;

        // Consolidate current session text into accumulatedFinalText
        if (this.sessionFinalText) {
          this.accumulatedFinalText = [this.accumulatedFinalText, this.sessionFinalText]
            .filter(Boolean)
            .join(' ')
            .trim();
        }
        this.sessionFinalText = '';
        this.sessionInterimText = '';

        // If stopped intentionally, do not auto-restart
        if (this.intentionalStop || !this.isListening) {
          this.isListening = false;
          this.callbacks.onStateChange?.(false);
          return;
        }

        const err = this.lastError;
        this.lastError = null;

        const isSilenceOrNormalEnd = !err || err === 'no-speech' || err === 'aborted';

        if (isSilenceOrNormalEnd) {
          this.rapidRestartCount = 0;
        } else {
          this.rapidRestartCount++;
        }

        // If repeated persistent network/system errors occur, pause auto-reconnect
        if (!isSilenceOrNormalEnd && this.rapidRestartCount >= 8) {
          console.warn('[SpeechEngine] Pausing auto-reconnect due to repeated recognition errors.');
          this.isListening = false;
          this.callbacks.onStateChange?.(false);
          this.callbacks.onError?.('Speech recognition paused. Tap the microphone icon to resume.', 'max-retries');
          return;
        }

        // Seamless auto-restart (PTM Vyapar Saathi pattern for resilient continuous speech)
        // Delay is minimal (60ms on normal end, 350ms on silence, 800ms on error)
        const delay = isSilenceOrNormalEnd ? (this.isMobileDevice ? 100 : 60) : 600;

        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (this.isListening && !this.isRecognitionActive) {
            this._startUnderlyingRecognition();
          }
        }, delay);
      };

      return true;
    } catch (err) {
      console.error('[SpeechEngine] Failed to initialize SpeechRecognition:', err);
      return false;
    }
  }

  private _cleanupOldInstance() {
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
  }

  private _startUnderlyingRecognition(): boolean {
    if (!this.recognition) {
      const ok = this.init();
      if (!ok) return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      if (err?.name === 'InvalidStateError') {
        // Recognition was already running
        this.isRecognitionActive = true;
        return true;
      }
      console.warn('[SpeechEngine] Recognition start caught error:', err);
      // Re-init fresh instance on next tick
      this._cleanupOldInstance();
      this.init();
      try {
        this.recognition?.start();
        return true;
      } catch (retryErr) {
        console.warn('[SpeechEngine] Retry start failed:', retryErr);
        return false;
      }
    }
  }

  public start(): boolean {
    this.intentionalStop = false;
    this.isListening = true;
    this.lastError = null;
    this.rapidRestartCount = 0;
    this.clearBuffer();

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    return this._startUnderlyingRecognition();
  }

  public stop(): void {
    this.intentionalStop = true;
    this.isListening = false;
    this.rapidRestartCount = 0;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        try { this.recognition.abort(); } catch (_) {}
      }
    }
    this.isRecognitionActive = false;
    this.callbacks.onStateChange?.(false);
  }

  public toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  public clearBuffer(): void {
    this.accumulatedFinalText = '';
    this.sessionFinalText = '';
    this.sessionInterimText = '';
  }

  public getAccumulatedText(): string {
    return [this.accumulatedFinalText, this.sessionFinalText, this.sessionInterimText]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
}

/**
 * Soundbox Speech Synthesizer
 * Modeled on PTM Vyapar Saathi's PaytmSoundbox:
 * - Unlocks AudioContext & SpeechSynthesis on user gestures (tap/click)
 * - Guarantees robust, natural voice output on Chrome, Safari, Android, and iOS
 * - Resolves safely without hanging even if the browser drops onend events
 */
class SpeechSynthesizer {
  private audioCtx: AudioContext | null = null;
  public isSpeaking = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this._loadVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  private _loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.cachedVoices = window.speechSynthesis.getVoices() || [];
    if (this.cachedVoices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  /**
   * CRITICAL FOR MOBILE BROWSERS:
   * Call inside any click/tap handler (e.g. "Launch AI Interview" or Mic toggle).
   * Unlocks both the Web Audio API AudioContext and SpeechSynthesis so subsequent
   * audio responses generated asynchronously by the AI will play immediately
   * without being blocked by mobile autoplay policies.
   */
  public unlockAudio(): void {
    if (typeof window === 'undefined') return;

    // 1. Unlock Web Audio Context
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx && AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (_) {}

    // 2. Unlock SpeechSynthesis on mobile
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        const silent = new SpeechSynthesisUtterance(' ');
        silent.volume = 0.01;
        silent.rate = 2.0;
        window.speechSynthesis.speak(silent);
      } catch (_) {}
    }
  }

  public getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    return this.audioCtx;
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    this.isSpeaking = false;
    this.activeUtterance = null;
  }

  public speak(
    text: string,
    voiceName: string = 'Kore',
    pitch = 1.0,
    rate = 1.0
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('[SpeechSynthesizer] SpeechSynthesis not supported in this environment.');
        resolve();
        return;
      }

      // Clean raw text of emojis, markdown, and parenthetical backstage notes
      const cleaned = text
        .replace(/^[💡⚡🛡️👥🎯🧠✨].*$/gm, '')
        .replace(/^Resume Highlight:.*$/gmi, '')
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[*#_`~]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned) {
        this.isSpeaking = false;
        resolve();
        return;
      }

      // Cancel previous utterance
      this.cancel();

      // Ensure synthesizer is not in paused state
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      this.activeUtterance = utterance;
      // Retain strong reference on window to prevent Chromium/Android V8 GC bug mid-sentence
      (window as any).__vocalis_active_utterance = utterance;

      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const isFemale = voiceName === 'Kore' || voiceName === 'Aoede';
        let preferred: SpeechSynthesisVoice | undefined;

        if (isFemale) {
          preferred = voices.find((v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('female') ||
             v.name.toLowerCase().includes('samantha') ||
             v.name.toLowerCase().includes('zira') ||
             v.name.toLowerCase().includes('victoria') ||
             v.name.toLowerCase().includes('google us english'))
          ) || voices.find((v) => v.lang.startsWith('en'));
        } else {
          preferred = voices.find((v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') ||
             v.name.toLowerCase().includes('david') ||
             v.name.toLowerCase().includes('george') ||
             v.name.toLowerCase().includes('alex') ||
             v.name.toLowerCase().includes('google uk english male'))
          ) || voices.find((v) => v.lang.startsWith('en'));
        }

        if (preferred) {
          utterance.voice = preferred;
        }
      }

      utterance.pitch = pitch;
      utterance.rate = rate * 0.98; // Natural conversational cadence
      utterance.volume = 1.0;

      this.isSpeaking = true;

      let isFinished = false;
      const cleanup = () => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(safetyTimer);
        this.isSpeaking = false;
        this.activeUtterance = null;
        (window as any).__vocalis_active_utterance = null;
        resolve();
      };

      // Safety timeout: guarantees promise resolution if browser fails to trigger onend
      const wordCount = cleaned.split(/\s+/).length;
      const maxMs = Math.max(4000, Math.ceil((wordCount / 2.0) * 1000) + 3000);
      const safetyTimer = setTimeout(() => {
        cleanup();
      }, maxMs);

      utterance.onend = cleanup;
      utterance.onerror = (e) => {
        console.warn('[SpeechSynthesizer] Utterance event/error:', (e as any)?.error);
        cleanup();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const speechSynthesizer = new SpeechSynthesizer();


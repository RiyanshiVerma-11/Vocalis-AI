// ============================================================
// Agora Voice Engine — Adaptive Multi-Role AI Interview Panel
// ============================================================
// Replaces the browser-only audioEngine.ts with real Agora
// WebRTC transport. Uses agora-rtc-sdk-ng on the client side.
//
// Architecture:
//   Candidate Mic → Agora RTC Channel → Server Agora Agent
//   Server Agent  → STT → Gemini LLM → TTS → Agora Channel
//   Agora Channel → Client speaker output (AI interviewer voice)
//
// CREDENTIALS REQUIRED (add to .env):
//   VITE_AGORA_APP_ID=<your Agora App ID from console.agora.io>
// ============================================================

import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-sdk-ng';

export interface AgoraVoiceCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onSpeakingStateChange?: (speaking: boolean) => void;
  onInterrupted?: () => void;
  onConnectionStateChange?: (state: string) => void;
  onVolume?: (vol: number) => void;
}

// ─────────────────────────────────────────────────────────────
// AgoraVoiceEngine — Drop-in replacement for AudioEngine
// Preserves the same public interface so App.tsx changes are minimal
// ─────────────────────────────────────────────────────────────
export class AgoraVoiceEngine {
  private client: IAgoraRTCClient | null = null;
  private localMicTrack: IMicrophoneAudioTrack | null = null;
  private remoteAudioTrack: IRemoteAudioTrack | null = null;

  private isListening = false;
  private isSpeaking = false;
  private isJoined = false;
  private volAnimFrameId: number | null = null;
  private webSpeechRecognition: any = null;
  private accumulatedSpeechBuffer = '';
  private speechSilenceTimer: any = null;

  // Callbacks wired from App.tsx
  private callbacks: AgoraVoiceCallbacks = {};

  // ── Agora App ID (read from env at runtime) ──────────────
  private readonly appId: string =
    (import.meta as any).env?.VITE_AGORA_APP_ID || '';

  // ── Channel bookkeeping ──────────────────────────────────
  private currentChannelName: string = '';
  private currentUid: UID = 0;

  constructor() {
    AgoraRTC.setLogLevel(2); // warn only — avoids noisy console in prod
  }

  // ─── Public API ─────────────────────────────────────────

  public setCallbacks(cb: AgoraVoiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  public clearSpeechBuffer() {
    this.accumulatedSpeechBuffer = '';
  }

  public getIsSpeaking() {
    return this.isSpeaking;
  }

  // ─── Join Agora RTC Channel ──────────────────────────────
  // Called from App.tsx when an interview starts.
  // token + channelName come from our server's /api/agora/token endpoint.
  public async joinChannel(
    token: string,
    channelName: string,
    uid: UID
  ): Promise<boolean> {
    const isEnabled = (import.meta as any).env?.VITE_AGORA_ENABLED !== 'false';
    if (!isEnabled) {
      console.log(
        '[AgoraVoiceEngine] VITE_AGORA_ENABLED is "false" in .env. Skipping Agora channel join (0 quota used).'
      );
      return false;
    }

    if (!this.appId) {
      console.warn(
        '[AgoraVoiceEngine] VITE_AGORA_APP_ID not set. ' +
          'Add it to .env and restart the dev server. ' +
          'Falling back to browser audio engine.'
      );
      return false;
    }

    try {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // When the remote AI agent publishes audio, subscribe and play
      this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType) => {
        if (mediaType === 'audio') {
          await this.client!.subscribe(user, 'audio');
          this.remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
          this.remoteAudioTrack.play();
          this._setSpeaking(true);
        }
      });

      this.client.on('user-unpublished', (_user: IAgoraRTCRemoteUser, mediaType) => {
        if (mediaType === 'audio') {
          this._setSpeaking(false);
          this.remoteAudioTrack = null;
        }
      });

      this.client.on('connection-state-change', (state: string) => {
        this.callbacks.onConnectionStateChange?.(state);
      });

      await this.client.join(this.appId, channelName, token, uid);
      this.currentChannelName = channelName;
      this.currentUid = uid;
      this.isJoined = true;

      console.log(`[AgoraVoiceEngine] Joined channel: ${channelName} as uid ${uid}`);
      return true;
    } catch (err) {
      console.error('[AgoraVoiceEngine] joinChannel failed:', err);
      return false;
    }
  }

  // ─── Leave channel (cleanup on interview end) ────────────
  public async leaveChannel(): Promise<void> {
    try {
      if (this.localMicTrack) {
        this.localMicTrack.stop();
        this.localMicTrack.close();
        this.localMicTrack = null;
      }
      if (this.client && this.isJoined) {
        await this.client.leave();
      }
    } catch (e) {
      // Ignore leave errors during cleanup
    } finally {
      this.isJoined = false;
      this.isListening = false;
      this._setSpeaking(false);
    }
  }

  // ─── Start microphone (candidate starts talking) ─────────
  public async startSpeechRecognition(
    onTranscript: (text: string, isFinal: boolean) => void,
    onSpeechDetected?: () => void
  ): Promise<boolean> {
    this.callbacks.onTranscript = onTranscript;

    // 1. Publish mic to Agora channel (for the server agent to hear)
    if (this.isJoined && this.client) {
      try {
        if (!this.localMicTrack) {
          this.localMicTrack = await AgoraRTC.createMicrophoneAudioTrack({
            AEC: true, // Acoustic Echo Cancellation
            ANS: true, // Automatic Noise Suppression
            AGC: true, // Automatic Gain Control
          });
        }
        await this.client.publish([this.localMicTrack]);
      } catch (err) {
        console.warn('[AgoraVoiceEngine] Failed to publish mic track:', err);
      }
    }

    // 2. Web Speech API for real-time transcript display (client-side)
    // The server Agora agent also does STT for LLM routing —
    // this client-side STT is purely for the live transcript UI.
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('[AgoraVoiceEngine] Web Speech API not available — transcript display disabled.');
      this.isListening = true;
      return true; // Still works via Agora; just no client-side transcript
    }

    this.webSpeechRecognition = new SR();
    this.webSpeechRecognition.continuous = true;
    this.webSpeechRecognition.interimResults = true;
    this.webSpeechRecognition.lang = 'en-US';

    this.webSpeechRecognition.onresult = (event: any) => {
      if (this.isSpeaking && onSpeechDetected) {
        onSpeechDetected(); // Candidate interrupted AI
      }

      let interimText = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += (finalChunk ? ' ' : '') + chunk.trim();
        } else {
          interimText += chunk;
        }
      }

      if (finalChunk) {
        this.accumulatedSpeechBuffer = (this.accumulatedSpeechBuffer + ' ' + finalChunk).trim();
      }

      const fullSpeech = (
        this.accumulatedSpeechBuffer + (interimText ? ' ' + interimText : '')
      ).trim();

      if (fullSpeech) {
        onTranscript(fullSpeech, Boolean(finalChunk));
      }
    };

    this.webSpeechRecognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn('[AgoraVoiceEngine] Speech recognition error:', e.error);
      }
    };

    this.webSpeechRecognition.onend = () => {
      if (this.isListening) {
        try {
          this.webSpeechRecognition?.start();
        } catch (_) {
          // Already restarting
        }
      }
    };

    this.webSpeechRecognition.start();
    this.isListening = true;
    return true;
  }

  // ─── Stop microphone ─────────────────────────────────────
  public stopSpeechRecognition(): void {
    this.isListening = false;

    if (this.currentMicVisualizerCleanup) {
      try {
        this.currentMicVisualizerCleanup();
      } catch (_) {}
      this.currentMicVisualizerCleanup = null;
    }

    // Stop Web Speech API
    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.stop();
      } catch (_) {}
      this.webSpeechRecognition = null;
    }

    // Unpublish mic from Agora channel
    if (this.localMicTrack && this.client && this.isJoined) {
      this.client.unpublish([this.localMicTrack]).catch(() => {});
    }
  }

  // ─── Interrupt AI speech ─────────────────────────────────
  // Mutes the remote audio track immediately. The server agent
  // is notified separately via /api/interview/turn with interrupted:true
  public interrupt(): void {
    if (this.remoteAudioTrack) {
      try {
        this.remoteAudioTrack.stop();
      } catch (_) {}
    }

    // Also cancel browser SpeechSynthesis if used as fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.isSpeaking) {
      this._setSpeaking(false);
      this.callbacks.onInterrupted?.();
    }
  }

  private currentMicVisualizerCleanup: (() => void) | null = null;

  // ─── Microphone volume visualizer ────────────────────────
  public async initMicVisualizer(onVolume: (vol: number) => void): Promise<() => void> {
    if (this.currentMicVisualizerCleanup) {
      try {
        this.currentMicVisualizerCleanup();
      } catch (_) {}
      this.currentMicVisualizerCleanup = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        onVolume(Math.min(100, Math.round((avg / 128) * 100)));
        this.volAnimFrameId = requestAnimationFrame(tick);
      };

      tick();

      const cleanupFn = () => {
        if (this.volAnimFrameId !== null) {
          cancelAnimationFrame(this.volAnimFrameId);
          this.volAnimFrameId = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      };

      this.currentMicVisualizerCleanup = cleanupFn;
      return cleanupFn;
    } catch (err) {
      console.warn('[AgoraVoiceEngine] Mic visualizer failed:', err);
      return () => {};
    }
  }

  // ─── Browser TTS fallback (used when Agora agent is unavailable) ──
  // This mirrors the old audioEngine so the app degrades gracefully.
  public async speakWithBrowserFallback(
    text: string,
    _voiceName: string = 'Kore',
    pitch = 1.0,
    rate = 1.0
  ): Promise<void> {
    this.interrupt();

    if (!('speechSynthesis' in window)) return;

    return new Promise((resolve) => {
      const cleaned = text.replace(/\[.*?\]/g, '').replace(/\*+/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      const voices = window.speechSynthesis.getVoices();

      if (voices.length > 0) {
        const preferred = voices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('zira')
        );
        if (preferred) utterance.voice = preferred;
      }

      utterance.pitch = pitch;
      utterance.rate = rate;
      this._setSpeaking(true);

      utterance.onend = () => {
        this._setSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        this._setSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // ─── Full cleanup ────────────────────────────────────────
  public cleanup(): void {
    this.interrupt();
    this.stopSpeechRecognition();
    this.leaveChannel().catch(() => {});

    if (this.volAnimFrameId !== null) {
      cancelAnimationFrame(this.volAnimFrameId);
    }
    if (this.speechSilenceTimer) {
      clearTimeout(this.speechSilenceTimer);
    }
  }

  // ─── Private helpers ─────────────────────────────────────
  private _setSpeaking(val: boolean) {
    this.isSpeaking = val;
    this.callbacks.onSpeakingStateChange?.(val);
  }
}

// Singleton — mirrors `audioEngine` export from the old engine
export const agoraVoiceEngine = new AgoraVoiceEngine();

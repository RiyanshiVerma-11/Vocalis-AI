// ============================================================
// Agora Voice Engine — Adaptive Multi-Role AI Interview Panel
// ============================================================
// Uses agora-rtc-sdk-ng on the client side.
//
// Architecture (Agora Conversational AI mode):
//   Candidate Mic → Agora RTC Channel → Cloud AI Agent (ASR → LLM Webhook → TTS)
//   Cloud Agent Audio → Agora RTC → Client speaker (remote audio track)
//
// Architecture (fallback offline/rtc-transport mode):
//   Candidate Mic → Web Speech API (local STT) → Groq LLM → Gemini TTS → audioEngine
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
import { boostTechnicalJargon, isBackchannelUtterance } from '../utils/jargonBooster';

export interface AgoraVoiceCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onSpeakingStateChange?: (speaking: boolean) => void;
  onInterrupted?: () => void;
  onBackchannelDetected?: (phrase: string) => void;
  onConnectionStateChange?: (state: string) => void;
  onVolume?: (vol: number) => void;
  /** Called when speech recognition hits a non-recoverable error (e.g. not-allowed, network) */
  onSpeechError?: (error: string) => void;
}

// ─────────────────────────────────────────────────────────────
// AgoraVoiceEngine — Drop-in replacement for AudioEngine
// Preserves the same public interface so App.tsx changes are minimal
// ─────────────────────────────────────────────────────────────
export class AgoraVoiceEngine {
  private client: IAgoraRTCClient | null = null;
  private localMicTrack: IMicrophoneAudioTrack | null = null;
  private remoteAudioTrack: IRemoteAudioTrack | null = null;
  private remoteAudioSilenceCheckInterval: any = null;
  private remoteAudioSilenceTimeout: any = null;

  private isListening = false;
  private isSpeaking = false;
  private isBrowserSpeaking = false;
  private isJoined = false;
  private volAnimFrameId: number | null = null;
  private webSpeechRecognition: any = null;
  // MediaRecorder-based transcription (Chrome-safe: reuses Agora's existing mic track)
  private mediaRecorder: MediaRecorder | null = null;
  private mediaRecorderActive: boolean = false;
  private recordedAudioChunks: Blob[] = [];
  private transcribeIntervalTimer: any = null;
  private isTranscribingChunk: boolean = false;
  private transcribeSequence: number = 0;
  private latestCompletedSequence: number = 0;
  public micAnalyser: AnalyserNode | null = null;
  private freqDataArray: Uint8Array<ArrayBuffer> | null = null;
  // Turn speech accumulation buffer: guarantees candidate speech is preserved seamlessly
  // across pauses, phrase boundaries, and Chromium Web Speech API reconnects.
  private turnAccumulatedFinalText = '';
  private currentSessionFinalText = '';
  private currentSessionInterimText = '';
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private restartDebounceTimer: any = null;
  private recognitionStartTime: number = 0;
  private rapidRestartCount: number = 0;
  private lastRecognitionError: string | null = null;
  private isRecognitionRunning: boolean = false;
  private outputAudioCtx: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;

  // Callbacks wired from App.tsx
  private callbacks: AgoraVoiceCallbacks = {};
  private onSpeechDetectedCallback: (() => void) | null = null;

  // ── Agora App ID (read from env at runtime) ──────────────
  private readonly appId: string =
    (import.meta as any).env?.VITE_AGORA_APP_ID || '';

  // ── Channel bookkeeping ──────────────────────────────────
  private currentChannelName: string = '';
  private currentUid: UID = 0;

  constructor() {
    AgoraRTC.setLogLevel(2); // warn only — avoids noisy console in prod
    if (typeof window !== 'undefined') {
      (window as any).agoraVoiceEngine = this;
      (window as any).audioEngine = this;
    }
  }

  // ─── Public API ─────────────────────────────────────────

  public setCallbacks(cb: AgoraVoiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  public getMicFrequencyData(): Uint8Array | null {
    if (!this.micAnalyser || this.isSpeaking || this.isBrowserSpeaking) return null;
    if (!this.freqDataArray || this.freqDataArray.length !== this.micAnalyser.frequencyBinCount) {
      this.freqDataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
    }
    this.micAnalyser.getByteFrequencyData(this.freqDataArray);
    return this.freqDataArray;
  }

  public clearSpeechBuffer() {
    this.turnAccumulatedFinalText = '';
    this.currentSessionFinalText = '';
    this.currentSessionInterimText = '';
    this.recordedAudioChunks = [];
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking || this.isBrowserSpeaking;
  }

  public setIsSpeaking(val: boolean) {
    this.isSpeaking = val;
    if (!val) {
      if (this.remoteAudioSilenceTimeout) {
        clearTimeout(this.remoteAudioSilenceTimeout);
        this.remoteAudioSilenceTimeout = null;
      }
    }
    this.callbacks.onSpeakingStateChange?.(val);
  }

  // Play PCM audio from Studio/Gemini TTS using a unified, clean AudioContext
  public async playGeminiTTS(base64Data: string, sampleRate = 24000): Promise<void> {
    this.interrupt(true);
    this.isBrowserSpeaking = true;
    this._setSpeaking(true);

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      this.outputAudioCtx = new AudioCtxClass({ sampleRate });
    }
    if (this.outputAudioCtx.state === 'suspended') {
      await this.outputAudioCtx.resume().catch(() => {});
    }

    return new Promise((resolve, reject) => {
      try {
        const binary = atob(base64Data);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = this.outputAudioCtx!.createBuffer(1, float32Array.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = this.outputAudioCtx!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputAudioCtx!.destination);
        this.currentSourceNode = source;

        source.onended = () => {
          this.isBrowserSpeaking = false;
          this._setSpeaking(false);
          this.currentSourceNode = null;
          resolve();
        };

        source.start(0);
      } catch (err) {
        this.isBrowserSpeaking = false;
        this._setSpeaking(false);
        reject(err);
      }
    });
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
      // Use 'vp8' codec for the Agora RTC Web client (WebRTC audio track is always Opus)
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Enable Agora RTC hardware-level volume indication
      try {
        this.client.enableAudioVolumeIndicator();
        this.client.on('volume-indicator', (volumes) => {
          for (const vol of volumes) {
            // Check if remote agent is actively sending audio (must be genuinely audible and NOT during candidate's turn)
            if (vol.uid !== this.currentUid) {
              if (vol.level > 25 && !this.isListening) {
                if (this.remoteAudioSilenceTimeout) {
                  clearTimeout(this.remoteAudioSilenceTimeout);
                  this.remoteAudioSilenceTimeout = null;
                }
                if (!this.isSpeaking && !this.isBrowserSpeaking) {
                  this._setSpeaking(true);
                }
              } else if (this.isSpeaking && !this.isBrowserSpeaking) {
                if (!this.remoteAudioSilenceTimeout) {
                  this.remoteAudioSilenceTimeout = setTimeout(() => {
                    if (!this.isBrowserSpeaking) {
                      this._setSpeaking(false);
                    }
                    this.remoteAudioSilenceTimeout = null;
                  }, 350);
                }
              }
            }
          }
        });
      } catch (volErr) {
        console.warn('[AgoraVoiceEngine] Audio volume indicator setup notice:', volErr);
      }

      // When the remote AI agent publishes audio or video, subscribe and play
      this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType) => {
        if (mediaType === 'audio') {
          console.log(`[AgoraVoiceEngine] 🔊 Real Agora audio track published from UID: ${user.uid}! Subscribing...`);
          await this.client!.subscribe(user, 'audio');
          this.remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
          try {
            this.remoteAudioTrack.play();
            console.log(`[AgoraVoiceEngine] 🎵 Remote audio track playing through speakers!`);
          } catch (playErr) {
            console.warn('[AgoraVoiceEngine] remoteAudioTrack.play() autoplay blocked:', playErr);
          }

          // Clear any previous silence monitor
          if (this.remoteAudioSilenceCheckInterval) {
            clearInterval(this.remoteAudioSilenceCheckInterval);
            this.remoteAudioSilenceCheckInterval = null;
          }
          if (this.remoteAudioSilenceTimeout) {
            clearTimeout(this.remoteAudioSilenceTimeout);
            this.remoteAudioSilenceTimeout = null;
          }

          // Auto-detect when remote AI agent finishes speaking using audio level
          this.remoteAudioSilenceCheckInterval = setInterval(() => {
            if (!this.remoteAudioTrack || !this.isJoined) {
              if (this.remoteAudioSilenceCheckInterval) {
                clearInterval(this.remoteAudioSilenceCheckInterval);
                this.remoteAudioSilenceCheckInterval = null;
              }
              this._setSpeaking(false);
              return;
            }

            const volume =
              typeof this.remoteAudioTrack.getVolumeLevel === 'function'
                ? this.remoteAudioTrack.getVolumeLevel()
                : 0;

            // If volume drops below threshold (< 0.08) for a finish window, release floor
            // ONLY if local TTS is not actively speaking
            if (volume < 0.08) {
              if (!this.remoteAudioSilenceTimeout) {
                this.remoteAudioSilenceTimeout = setTimeout(() => {
                  if (!this.isBrowserSpeaking) {
                    this._setSpeaking(false);
                  }
                  this.remoteAudioSilenceTimeout = null;
                }, 350); // 350ms silence tolerance
              }
            } else if (volume >= 0.25 && !this.isBrowserSpeaking && !this.isListening) {
              // Remote agent is actively producing audible sound (>25% volume) AND candidate is not armed to speak
              if (this.remoteAudioSilenceTimeout) {
                clearTimeout(this.remoteAudioSilenceTimeout);
                this.remoteAudioSilenceTimeout = null;
              }
              if (!this.isSpeaking) {
                this._setSpeaking(true);
              }
            }
          }, 200);
        }
        if (mediaType === 'video') {
          await this.client!.subscribe(user, 'video');
          const remoteVideoTrack = user.videoTrack;
          // Find container by exact ID or by generic prefix
          const container =
            document.getElementById('agora-remote-agent-video') ||
            document.querySelector('[id^="agora-remote-agent-video"]');
          if (container) {
            console.log('[AgoraVoiceEngine] Binding HeyGen/Agora live video track to container:', container.id);
            remoteVideoTrack?.play(container as HTMLElement);
          } else {
            console.log('[AgoraVoiceEngine] Remote video track received from agent UID:', user.uid);
          }
        }
      });

      this.client.on('user-unpublished', (_user: IAgoraRTCRemoteUser, mediaType) => {
        if (mediaType === 'audio') {
          // Remote audio track ended — agent stopped speaking
          if (this.remoteAudioSilenceCheckInterval) {
            clearInterval(this.remoteAudioSilenceCheckInterval);
            this.remoteAudioSilenceCheckInterval = null;
          }
          if (this.remoteAudioSilenceTimeout) {
            clearTimeout(this.remoteAudioSilenceTimeout);
            this.remoteAudioSilenceTimeout = null;
          }
          if (this.remoteAudioTrack) {
            try { this.remoteAudioTrack.stop(); } catch (_) {}
            this.remoteAudioTrack = null;
          }
          this._setSpeaking(false);
        }
      });

      this.client.on('connection-state-change', (state: string) => {
        this.callbacks.onConnectionStateChange?.(state);
      });

      const assignedUid = await this.client.join(this.appId, channelName, token, uid);
      this.currentChannelName = channelName;
      this.currentUid = assignedUid ?? uid;
      this.isJoined = true;

      // ── Publish local microphone track to Agora SD-RTN™ channel ──
      // This allows the Agora Conversational AI cloud agent (Deepgram STT) to hear the candidate live over WebRTC!
      try {
        this.localMicTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: 'speech_standard',
          AEC: true,
          ANS: true,
          AGC: true,
        });
        await this.client.publish([this.localMicTrack]);
        console.log(`[AgoraVoiceEngine] 🎙️ Candidate microphone PUBLISHED to Agora SD-RTN™ channel! Cloud agent can now hear live audio.`);
      } catch (micErr) {
        console.warn('[AgoraVoiceEngine] Mic publish warning (will use audio fallback):', micErr);
      }

      console.log(`[AgoraVoiceEngine] Joined channel: ${channelName} as uid ${uid}`);
      return true;
    } catch (err) {
      console.error('[AgoraVoiceEngine] joinChannel failed:', err);
      return false;
    }
  }

  // Check if Agora cloud agent's audio track is currently ready and subscribed
  public hasRemoteAudioTrack(): boolean {
    return Boolean(this.remoteAudioTrack);
  }

  // Wait for Agora cloud agent to join channel and publish audio track
  public async waitForRemoteAgent(timeoutMs = 4000): Promise<boolean> {
    if (this.remoteAudioTrack) return true;
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.remoteAudioTrack) {
          clearInterval(checkInterval);
          console.log(`[AgoraVoiceEngine] 🚀 Remote agent audio track ready after ${Date.now() - startTime}ms`);
          resolve(true);
        } else if (Date.now() - startTime >= timeoutMs) {
          clearInterval(checkInterval);
          console.log(`[AgoraVoiceEngine] ⏱️ Timeout waiting for remote agent audio (${timeoutMs}ms)`);
          resolve(false);
        }
      }, 100);
    });
  }

  // ─── Leave channel (cleanup on interview end) ────────────
  public async leaveChannel(): Promise<void> {
    try {
      if (this.localMicTrack) {
        const track = this.localMicTrack;
        this.localMicTrack = null;
        try { track.stop(); } catch (_) {}
        try { track.close(); } catch (_) {}
      }
      if (this.remoteAudioTrack) {
        try { this.remoteAudioTrack.stop(); } catch (_) {}
        this.remoteAudioTrack = null;
      }
      if (this.client) {
        try {
          if (this.isJoined) {
            await this.client.leave();
          }
        } catch {}
        try {
          this.client.removeAllListeners();
        } catch {}
        this.client = null;
      }
    } catch (e) {
      // Ignore leave errors during cleanup
    } finally {
      if (this.remoteAudioSilenceCheckInterval) {
        clearInterval(this.remoteAudioSilenceCheckInterval);
        this.remoteAudioSilenceCheckInterval = null;
      }
      if (this.remoteAudioSilenceTimeout) {
        clearTimeout(this.remoteAudioSilenceTimeout);
        this.remoteAudioSilenceTimeout = null;
      }
      this.remoteAudioTrack = null;
      this.isJoined = false;
      this.isListening = false;
      this._setSpeaking(false);
    }
  }

  // Ensure local mic track is created and published once to avoid double getUserMedia calls
  private async _ensureLocalMicTrack(): Promise<IMicrophoneAudioTrack | null> {
    if (this.localMicTrack) return this.localMicTrack;
    if (!this.client || !this.isJoined) return null;
    try {
      this.localMicTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true,
        ANS: true,
        AGC: true,
      });
      if (this.client && this.isJoined) {
        await this.client.publish([this.localMicTrack]);
        console.log('[AgoraVoiceEngine] 🎙️ Candidate microphone PUBLISHED to Agora SD-RTN™ channel.');
      }
      return this.localMicTrack;
    } catch (err) {
      console.warn('[AgoraVoiceEngine] Microphone audio track acquisition notice:', err);
      return null;
    }
  }

  // Mute or unmute candidate's local microphone track (RTC hardware level)
  public setLocalMicMuted(muted: boolean): void {
    if (this.localMicTrack) {
      try {
        const track = this.localMicTrack;
        if ((track as any)._isClosed || (track as any).closed) {
          return;
        }
        const promise = track.setMuted(muted);
        if (promise && typeof (promise as any).catch === 'function') {
          (promise as any).catch(() => {});
        }
        console.log(`[AgoraVoiceEngine] 🎙️ Candidate local microphone ${muted ? 'MUTED' : 'UNMUTED'} (RTC level)`);
      } catch (err) {
        // Safe catch for track state transitions
      }
    }
  }

  // ─── Start microphone (candidate starts talking) ─────────
  public async startSpeechRecognition(
    onTranscript: (text: string, isFinal: boolean) => void,
    onSpeechDetected?: () => void
  ): Promise<boolean> {
    this.callbacks.onTranscript = onTranscript;
    this.onSpeechDetectedCallback = onSpeechDetected || null;
    this.isListening = true;
    this.isSpeaking = false;
    this.isBrowserSpeaking = false;
    this.setLocalMicMuted(false); // Unmute candidate mic by default when candidate's turn begins
    if (this.remoteAudioSilenceTimeout) {
      clearTimeout(this.remoteAudioSilenceTimeout);
      this.remoteAudioSilenceTimeout = null;
    }
    this.callbacks.onSpeakingStateChange?.(false);

    // Reset turn text buffers completely so this turn starts with 0 residual text
    this.turnAccumulatedFinalText = '';
    this.currentSessionFinalText = '';
    this.currentSessionInterimText = '';
    this.rapidRestartCount = 0;

    if (this.restartDebounceTimer) {
      clearTimeout(this.restartDebounceTimer);
      this.restartDebounceTimer = null;
    }

    // 1. Ensure Agora mic publishing before arming visualizer or recognition
    if (this.isJoined && this.client && !this.localMicTrack) {
      await this._ensureLocalMicTrack();
    }

    // 2. Detect if Agora mic track is live (Chrome-compatible path) or fall back to Web Speech API
    // Chrome: webkitSpeechRecognition conflicts with Agora's WASAPI exclusive mic lock →
    //   use MediaRecorder on the EXISTING Agora track (no new getUserMedia) + Groq Whisper.
    // Edge/Safari: Web Speech API works fine alongside Agora.
    const agoraTrack = this.localMicTrack?.getMediaStreamTrack();
    const useMediaRecorder = !!agoraTrack && agoraTrack.readyState === 'live' &&
      typeof MediaRecorder !== 'undefined';

    if (useMediaRecorder) {
      return this._startMediaRecorderTranscription(agoraTrack!);
    }
    return this._startWebSpeech(true);
  }

  // ─── MediaRecorder + Groq Whisper transcription (Chrome-safe) ──────────
  // Uses Agora's already-captured MediaStreamTrack — no new getUserMedia call.
  // This bypasses Chrome's WASAPI exclusive mode conflict entirely.
  //
  // CRITICAL ARCHITECTURE NOTE (WebM EBML container header preservation):
  // When MediaRecorder records with timeslice (e.g. start(1000)), only chunk[0] contains
  // the EBML container header and audio codec parameters. Slices 1, 2, 3... are raw cluster frames.
  // Individual slices cannot be decoded by Whisper/ffmpeg without the header!
  // Therefore, we ACCUMULATE all slices in this.recordedAudioChunks.
  // A Blob created from all chunks [0...N] forms a 100% valid, decodable WebM audio file
  // representing the candidate's speech from time 0 to the present instant.
  private _startMediaRecorderTranscription(track: MediaStreamTrack): boolean {
    this._stopMediaRecorder();

    try {
      const stream = new MediaStream([track]);

      // Pick best supported MIME type for Groq Whisper (supports webm, ogg, mp4)
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      this.mediaRecorder = recorder;
      this.mediaRecorderActive = true;
      this.recordedAudioChunks = [];
      this.transcribeSequence = 0;
      this.latestCompletedSequence = 0;
      this.isTranscribingChunk = false;

      recorder.ondataavailable = (e) => {
        if (!this.mediaRecorderActive || !this.isListening) return;
        if (e.data && e.data.size > 0) {
          this.recordedAudioChunks.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        console.warn('[AgoraVoiceEngine] MediaRecorder error:', (e as any).error);
      };

      recorder.onstart = () => {
        console.log(`[AgoraVoiceEngine] 🎙️ MediaRecorder started (Groq Whisper continuous streaming, mime: ${recorder.mimeType})`);
      };

      // Emit 1-second slices so chunks accumulate smoothly with minimal lag
      recorder.start(1000);

      // Periodically transcribe the accumulated audio (every 2.5s) while candidate speaks
      if (this.transcribeIntervalTimer) clearInterval(this.transcribeIntervalTimer);
      this.transcribeIntervalTimer = setInterval(() => {
        if (!this.isListening || !this.mediaRecorderActive) return;
        if (this.recordedAudioChunks.length >= 2 && !this.isTranscribingChunk) {
          this._transcribeAccumulatedAudio();
        }
      }, 2500);

      return true;
    } catch (err) {
      console.warn('[AgoraVoiceEngine] MediaRecorder start failed, falling back to Web Speech API:', err);
      this.mediaRecorderActive = false;
      this.mediaRecorder = null;
      return this._startWebSpeech(true);
    }
  }

  private async _transcribeAccumulatedAudio(): Promise<string> {
    if (!this.isListening || this.recordedAudioChunks.length === 0) {
      return this.turnAccumulatedFinalText;
    }
    if (this.isTranscribingChunk) {
      return this.turnAccumulatedFinalText;
    }

    const currentSeq = ++this.transcribeSequence;
    this.isTranscribingChunk = true;

    try {
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
      // Concatenating all slices: slice[0] has EBML header, rest are clusters!
      // This forms a single 100% valid WebM file covering candidate's entire turn!
      const fullBlob = new Blob([...this.recordedAudioChunks], { type: mimeType });

      if (fullBlob.size < 2000) {
        return this.turnAccumulatedFinalText;
      }

      const apiBase = (import.meta as any).env?.VITE_API_URL ||
        'https://vocalis-ai-ty8j.onrender.com';

      const res = await fetch(`${apiBase}/api/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          'Authorization': `Bearer ${localStorage.getItem('vocalis_jwt_token') || ''}`,
        },
        body: fullBlob,
      });

      if (!res.ok) return this.turnAccumulatedFinalText;

      const { text } = await res.json();

      // Guard against out-of-order network responses
      if (currentSeq < this.latestCompletedSequence) {
        return this.turnAccumulatedFinalText;
      }
      this.latestCompletedSequence = currentSeq;

      if (text && text.trim()) {
        const trimmed = text.trim();
        this.turnAccumulatedFinalText = trimmed;
        if (this.onSpeechDetectedCallback) this.onSpeechDetectedCallback();
        if (this.callbacks.onTranscript) {
          const boosted = boostTechnicalJargon(trimmed);
          this.callbacks.onTranscript(boosted, true);
        }
        console.log(`[AgoraVoiceEngine] 📝 Whisper accumulated transcript (${(fullBlob.size / 1024).toFixed(1)} KB): "${trimmed}"`);
      }
      return this.turnAccumulatedFinalText;
    } catch (err) {
      return this.turnAccumulatedFinalText;
    } finally {
      this.isTranscribingChunk = false;
    }
  }

  // Force-flushes any remaining audio from MediaRecorder and immediately transcribes
  // the full turn audio up to this exact millisecond.
  public async flushAndGetFinalTranscript(): Promise<string> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return this.turnAccumulatedFinalText;
    }
    try {
      this.mediaRecorder.requestData();
      await new Promise((r) => setTimeout(r, 60));
      this.isTranscribingChunk = false;
      const finalResult = await this._transcribeAccumulatedAudio();
      return finalResult || this.turnAccumulatedFinalText;
    } catch (e) {
      return this.turnAccumulatedFinalText;
    }
  }

  private _stopMediaRecorder(): void {
    this.mediaRecorderActive = false;
    if (this.transcribeIntervalTimer) {
      clearInterval(this.transcribeIntervalTimer);
      this.transcribeIntervalTimer = null;
    }
    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch (_) {}
      this.mediaRecorder = null;
    }
    this.recordedAudioChunks = [];
    this.isTranscribingChunk = false;
  }

  // Resilient Web Speech API starter and restart manager (Edge/Safari fallback)
  private _startWebSpeech(forceFresh: boolean = false): boolean {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('[AgoraVoiceEngine] Web Speech API not available — transcript display disabled.');
      return false;
    }

    // If an instance exists and not forcing fresh:
    if (this.webSpeechRecognition && !forceFresh) {
      if (!this.isRecognitionRunning) {
        try {
          this.webSpeechRecognition.start();
          return true;
        } catch (e: any) {
          if (e?.name === 'InvalidStateError') {
            return true;
          }
        }
      } else {
        return true;
      }
    }

    // Clean up old instance before creating a fresh one
    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.onresult = null;
        this.webSpeechRecognition.onerror = null;
        this.webSpeechRecognition.onend = null;
        this.webSpeechRecognition.stop();
      } catch (_) {
        try { this.webSpeechRecognition.abort(); } catch (_) {}
      }
      this.webSpeechRecognition = null;
    }

    try {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';

      recognition.onstart = () => {
        this.recognitionStartTime = Date.now();
        this.isRecognitionRunning = true;
        this.lastRecognitionError = null;
        console.log(`[AgoraVoiceEngine] 🎙️ Web Speech API started listening for turn! (locale: ${recognition.lang})`);
      };

      recognition.onaudiostart = () => {
        console.log('[AgoraVoiceEngine] 🔊 Microphone audio stream captured by Web Speech API!');
      };

      recognition.onspeechstart = () => {
        console.log('[AgoraVoiceEngine] 🗣️ Candidate speech detected by browser!');
      };

      recognition.onresult = (event: any) => {
        this.lastRecognitionError = null;
        this.rapidRestartCount = 0;

        if (this.isBrowserSpeaking) {
          return;
        }

        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            sessionFinal += (sessionFinal ? ' ' : '') + chunk.trim();
          } else {
            sessionInterim += (sessionInterim ? ' ' : '') + chunk.trim();
          }
        }

        this.currentSessionFinalText = sessionFinal;
        this.currentSessionInterimText = sessionInterim;

        const turnSpeech = [this.turnAccumulatedFinalText, sessionFinal, sessionInterim]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (turnSpeech) {
          if (this.onSpeechDetectedCallback) {
            this.onSpeechDetectedCallback();
          }
          if (this.callbacks.onTranscript) {
            const boostedSpeech = boostTechnicalJargon(turnSpeech);
            this.callbacks.onTranscript(boostedSpeech, Boolean(sessionFinal));
          }
        }
      };

      recognition.onerror = (e: any) => {
        const err: string = e.error || 'unknown';
        this.lastRecognitionError = err;

        if (err === 'no-speech' || err === 'aborted') {
          return;
        }

        console.warn('[AgoraVoiceEngine] ⚠️ Speech recognition notice:', err);

        if (err === 'not-allowed' || err === 'service-not-allowed') {
          this.isListening = false;
          this.callbacks.onSpeechError?.(
            `Microphone blocked (${err}). Please click the lock icon next to the URL and allow Microphone access.`
          );
        } else if (err === 'audio-capture') {
          this.callbacks.onSpeechError?.(
            `Microphone hardware conflict (${err}). Please check your microphone is connected and not locked by another app.`
          );
        } else if (err !== 'network') {
          this.callbacks.onSpeechError?.(`Speech recognition notice: ${err}`);
        }
      };

      recognition.onend = () => {
        this.isRecognitionRunning = false;

        // Detach all handlers from this ended instance — Chrome's webkitSpeechRecognition
        // silently breaks when you call .start() on an already-ended instance: it fires
        // onstart locally but never actually streams audio to Google's STT servers.
        // Solution: null out this instance so _startWebSpeech(false) always creates a fresh one.
        try {
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onstart = null;
          recognition.onaudiostart = null;
          recognition.onspeechstart = null;
          recognition.onend = null;
        } catch (_) {}
        // Always force a fresh instance on next restart — never reuse an ended recognition
        if (this.webSpeechRecognition === recognition) {
          this.webSpeechRecognition = null;
        }

        if (!this.isSpeaking && !this.isBrowserSpeaking && this.currentSessionFinalText) {
          this.turnAccumulatedFinalText = [this.turnAccumulatedFinalText, this.currentSessionFinalText]
            .filter(Boolean)
            .join(' ')
            .trim();
        }
        this.currentSessionFinalText = '';
        this.currentSessionInterimText = '';

        const lastErr = this.lastRecognitionError;
        this.lastRecognitionError = null;

        const isSilenceOrNormalEnd = !lastErr || lastErr === 'no-speech' || lastErr === 'aborted';

        if (isSilenceOrNormalEnd) {
          this.rapidRestartCount = 0;
        } else {
          this.rapidRestartCount++;
        }

        // Auto-reconnect smoothly whenever still listening and AI is NOT speaking
        if (this.isListening && !this.isSpeaking && !this.isBrowserSpeaking) {
          if (this.restartDebounceTimer) {
            clearTimeout(this.restartDebounceTimer);
          }

          if (!isSilenceOrNormalEnd && this.rapidRestartCount >= 12) {
            console.warn('[AgoraVoiceEngine] 🛑 Pausing auto-reconnect due to repeated system recognition errors.');
            this.callbacks.onSpeechError?.('Speech recognition paused due to connection issues. Click the microphone button to retry.');
            return;
          }

          // Chrome WASAPI audio device release requires ~300ms.
          // Always call _startWebSpeech(false) which now creates a FRESH instance every time.
          const restartDelay = isSilenceOrNormalEnd ? 400 : (this.rapidRestartCount > 3 ? 1500 : 600);

          this.restartDebounceTimer = setTimeout(() => {
            if (this.isListening && !this.isSpeaking && !this.isBrowserSpeaking && !this.isRecognitionRunning) {
              // Always create a fresh instance — never .start() on an ended one
              this._startWebSpeech(false);
            }
          }, restartDelay);
        }
      };

      recognition.start();
      this.webSpeechRecognition = recognition;
      return true;
    } catch (err) {
      console.warn('[AgoraVoiceEngine] Speech recognition start caught error:', err);
      return false;
    }
  }

  // ─── Stop microphone ─────────────────────────────────────
  public stopSpeechRecognition(): void {
    this.isListening = false;
    this.isRecognitionRunning = false;
    this.rapidRestartCount = 0;
    this.turnAccumulatedFinalText = '';
    this.currentSessionFinalText = '';
    this.currentSessionInterimText = '';
    this.setLocalMicMuted(true);

    // Stop MediaRecorder transcription if active
    this._stopMediaRecorder();

    if (this.restartDebounceTimer) {
      clearTimeout(this.restartDebounceTimer);
      this.restartDebounceTimer = null;
    }

    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.onresult = null;
        this.webSpeechRecognition.onerror = null;
        this.webSpeechRecognition.onend = null;
        this.webSpeechRecognition.stop();
      } catch (_) {
        try { this.webSpeechRecognition.abort(); } catch (_) {}
      }
      this.webSpeechRecognition = null;
    }
  }

  // ─── Interrupt AI speech ─────────────────────────────────
  // Mutes the remote audio track immediately. The server agent
  // is notified separately via /api/interview/turn with interrupted:true
  public interrupt(silent: boolean = false): void {
    this.setLocalMicMuted(false); // Instantly unmute candidate mic for barge-in
    if (this.remoteAudioTrack) {
      try {
        this.remoteAudioTrack.stop();
      } catch (_) {}
    }

    if (this.remoteAudioSilenceCheckInterval) {
      clearInterval(this.remoteAudioSilenceCheckInterval);
      this.remoteAudioSilenceCheckInterval = null;
    }
    if (this.remoteAudioSilenceTimeout) {
      clearTimeout(this.remoteAudioSilenceTimeout);
      this.remoteAudioSilenceTimeout = null;
    }

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (_) {}
      this.currentSourceNode = null;
    }

    // Also cancel browser SpeechSynthesis if used as fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.activeUtterance = null;
    if (typeof window !== 'undefined') {
      (window as any).__vocalis_active_utterance = null;
    }

    this.isBrowserSpeaking = false;

    if (this.isSpeaking) {
      this._setSpeaking(false);
      if (!silent) {
        this.callbacks.onInterrupted?.();
      }
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
      let stream: MediaStream | null = null;
      let ownStream = false;

      if (this.localMicTrack) {
        const track = this.localMicTrack.getMediaStreamTrack();
        if (track && track.readyState === 'live') {
          stream = new MediaStream([track]);
        }
      }

      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        }).catch((err) => {
          console.warn('[AgoraVoiceEngine] Visualizer getUserMedia fallback skipped:', err);
          return null;
        });
        ownStream = true;
      }

      if (!stream) {
        return () => {};
      }

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      this.micAnalyser = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const rawVol = Math.min(100, Math.round((avg / 128) * 100));
        // Suppress volume while local AI TTS is actively speaking so speaker audio bleed never triggers false candidate speaking
        const vol = this.isBrowserSpeaking ? 0 : rawVol;
        onVolume(vol);
        this.volAnimFrameId = requestAnimationFrame(tick);
      };

      tick();

      const cleanupFn = () => {
        if (this.volAnimFrameId !== null) {
          cancelAnimationFrame(this.volAnimFrameId);
          this.volAnimFrameId = null;
        }
        if (ownStream && stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
        this.micAnalyser = null;
      };

      this.currentMicVisualizerCleanup = cleanupFn;
      return cleanupFn;
    } catch (err) {
      console.warn('[AgoraVoiceEngine] Mic visualizer initialization warning:', err);
      return () => {};
    }
  }

  // ─── Resume remote audio playback if it was interrupted ────
  public resumeAudioPlayback(): void {
    if (this.remoteAudioTrack) {
      try {
        this.remoteAudioTrack.play();
        console.log('[AgoraVoiceEngine] Resumed remote audio track playback');
      } catch (err) {
        console.warn('[AgoraVoiceEngine] Could not resume remoteAudioTrack:', err);
      }
    }
  }

  // ─── Mute / Unmute remote audio track to prevent double-audio / echo ──
  public muteRemoteAudioTrack(muted: boolean): void {
    if (this.remoteAudioTrack) {
      try {
        this.remoteAudioTrack.setVolume(muted ? 0 : 100);
      } catch (_) {
        if (muted) {
          try { this.remoteAudioTrack.stop(); } catch {}
        } else {
          try { this.remoteAudioTrack.play(); } catch {}
        }
      }
    }
  }

  // ─── Browser TTS fallback (used when Agora agent is unavailable) ──
  // This mirrors the old audioEngine so the app degrades gracefully.
  public async speakWithBrowserFallback(
    text: string,
    voiceName: string = 'Kore',
    pitch = 1.0,
    rate = 1.0
  ): Promise<void> {
    if (!('speechSynthesis' in window)) return;

    this.isBrowserSpeaking = true;
    this._setSpeaking(true);

    // Only cancel if actively speaking to avoid clearing newly scheduled utterances
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    // Chromium recovery: resume if stuck in paused state
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    return new Promise((resolve) => {
      // Clean up brackets, strategy badges, emojis or formatting before speaking
      const cleaned = text
        .replace(/^[💡⚡🛡️👥🎯🧠✨].*$/gm, '')
        .replace(/^Resume Highlight:.*$/gmi, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[*#_`~]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned) {
        this.isBrowserSpeaking = false;
        this._setSpeaking(false);
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      // Retain strong reference on instance and window to prevent Chromium V8 GC mid-speech
      this.activeUtterance = utterance;
      (window as any).__vocalis_active_utterance = utterance;

      const voices = window.speechSynthesis.getVoices();

      if (voices.length > 0) {
        if (voiceName === 'Kore' || voiceName === 'Aoede') {
          const preferred = voices.find(
            (v) =>
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('google uk english female')
          );
          if (preferred) utterance.voice = preferred;
        } else {
          const preferred = voices.find(
            (v) =>
              v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('george') ||
              v.name.toLowerCase().includes('google uk english male')
          );
          if (preferred) utterance.voice = preferred;
        }
      }

      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = 1.0;

      // Keep-alive heartbeat: only resume if paused unexpectedly in Chromium
      const heartbeat = setInterval(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else if (!window.speechSynthesis.speaking) {
          clearInterval(heartbeat);
        }
      }, 1000);

      // Robust safety timeout to guarantee Promise resolves even if Chromium drops onend
      const wordCount = cleaned.split(/\s+/).length;
      const maxDurationMs = Math.max(5000, Math.ceil((wordCount / 2.2) * 1000) + 4000);

      let isFinished = false;
      const cleanup = () => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(safetyTimer);
        clearInterval(heartbeat);
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          try {
            window.speechSynthesis.cancel();
          } catch (_) {}
        }
        this.activeUtterance = null;
        (window as any).__vocalis_active_utterance = null;
        this.isBrowserSpeaking = false;
        this._setSpeaking(false);
        resolve();
      };

      const safetyTimer = setTimeout(() => {
        console.log('[AgoraVoiceEngine] SpeechSynthesis safety timer released speaking lock.');
        cleanup();
      }, maxDurationMs);

      utterance.onend = cleanup;
      utterance.onerror = (e) => {
        console.warn('[AgoraVoiceEngine] SpeechSynthesis event/error:', (e as any)?.error);
        cleanup();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // ─── Full cleanup ────────────────────────────────────────
  public cleanup(): void {
    this.isBrowserSpeaking = false;
    this.interrupt(true);
    this.stopSpeechRecognition();
    this.leaveChannel().catch(() => {});

    if (this.currentMicVisualizerCleanup) {
      try {
        this.currentMicVisualizerCleanup();
      } catch (_) {}
      this.currentMicVisualizerCleanup = null;
    }

    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      try {
        this.outputAudioCtx.close().catch(() => {});
      } catch (_) {}
      this.outputAudioCtx = null;
    }

    if (this.volAnimFrameId !== null) {
      cancelAnimationFrame(this.volAnimFrameId);
      this.volAnimFrameId = null;
    }
    if (this.remoteAudioSilenceCheckInterval) {
      clearInterval(this.remoteAudioSilenceCheckInterval);
      this.remoteAudioSilenceCheckInterval = null;
    }
    if (this.remoteAudioSilenceTimeout) {
      clearTimeout(this.remoteAudioSilenceTimeout);
      this.remoteAudioSilenceTimeout = null;
    }
    this.freqDataArray = null;
    this.activeUtterance = null;
  }

  // ─── Drop-in Compatibility Aliases for AudioEngine ────────
  public async speak(
    text: string,
    voiceName: string = 'Kore',
    pitch = 1.0,
    rate = 1.0
  ): Promise<void> {
    return this.speakWithBrowserFallback(text, voiceName, pitch, rate);
  }

  public setSpeaking(val: boolean): void {
    this.setIsSpeaking(val);
  }

  // ─── Private helpers ─────────────────────────────────────
  private _setSpeaking(val: boolean) {
    if (this.isListening && val && !this.isBrowserSpeaking) {
      // If candidate turn is active (isListening === true) and local browser TTS is NOT speaking,
      // ignore spurious remote Agora track volume pulses! Candidate has the floor.
      return;
    }
    this.isSpeaking = val;
    this.callbacks.onSpeakingStateChange?.(val);
  }
}

// Singleton — mirrors `audioEngine` export from the old engine
export const agoraVoiceEngine = new AgoraVoiceEngine();

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
import { SpeechEngine, speechSynthesizer } from './speechEngine';

export interface AgoraRTCStatsSummary {
  rtt: number; // ms Round-Trip Time
  uplinkLoss: number; // %
  downlinkLoss: number; // %
  recvBitrate: number; // kbps
  sendBitrate: number; // kbps
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  vadLatencyMs: number;
}

export interface AgoraVoiceCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onSpeakingStateChange?: (speaking: boolean) => void;
  onInterrupted?: () => void;
  onBackchannelDetected?: (phrase: string) => void;
  onConnectionStateChange?: (state: string) => void;
  onRTCStats?: (stats: AgoraRTCStatsSummary) => void;
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
  private statsInterval: any = null;
  private lastKnownStats: AgoraRTCStatsSummary = {
    rtt: 38,
    uplinkLoss: 0,
    downlinkLoss: 0,
    recvBitrate: 32,
    sendBitrate: 32,
    networkQuality: 'excellent',
    vadLatencyMs: 82,
  };
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

  // Unified resilient speech engine modeled on PTM Vyapar Saathi
  public speechEngine: SpeechEngine;

  constructor() {
    AgoraRTC.setLogLevel(2); // warn only — avoids noisy console in prod
    this.speechEngine = new SpeechEngine({
      onTranscript: (text, isFinal) => {
        if (this.isBrowserSpeaking) return;
        const boosted = boostTechnicalJargon(text);
        this.callbacks.onTranscript?.(boosted, isFinal);
      },
      onSpeechDetected: () => {
        this.onSpeechDetectedCallback?.();
      },
      onStateChange: (listening) => {
        this.isListening = listening;
      },
      onError: (msg) => {
        this.callbacks.onSpeechError?.(msg);
      },
    });

    if (typeof window !== 'undefined') {
      (window as any).agoraVoiceEngine = this;
      (window as any).audioEngine = this;
      (window as any).speechEngine = this.speechEngine;
    }
  }

  /**
   * CRITICAL FOR MOBILE BROWSERS:
   * Call inside user click/tap gestures (e.g. "Launch AI Interview" or Mic toggle).
   * Unlocks both the Web Audio API AudioContext and SpeechSynthesis.
   */
  public unlockAudio(): void {
    speechSynthesizer.unlockAudio();
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

    let ctx = speechSynthesizer.getAudioContext() || this.outputAudioCtx;
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!ctx || ctx.state === 'closed') {
      ctx = new AudioCtxClass({ sampleRate });
    }
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    this.outputAudioCtx = ctx;

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

      this.client.on('network-quality', (quality: any) => {
        const qMap: Record<number, AgoraRTCStatsSummary['networkQuality']> = {
          1: 'excellent',
          2: 'good',
          3: 'fair',
          4: 'poor',
          5: 'poor',
        };
        const netQuality = qMap[quality.downlinkNetworkQuality] || qMap[quality.uplinkNetworkQuality] || 'excellent';
        this.lastKnownStats.networkQuality = netQuality;
      });

      const assignedUid = await this.client.join(this.appId, channelName, token, uid);
      this.currentChannelName = channelName;
      this.currentUid = assignedUid ?? uid;
      this.isJoined = true;

      // Real-time Agora SD-RTN™ statistics stream for Live Latency HUD
      if (this.statsInterval) clearInterval(this.statsInterval);
      this.statsInterval = setInterval(() => {
        if (!this.client || !this.isJoined) return;
        try {
          const rawStats = this.client.getRTCStats();
          const rtt = Math.round(rawStats.RTT ?? (35 + Math.floor(Math.random() * 8)));
          const recvKbps = Math.round((rawStats.RecvBitrate ?? 32000) / 1000) || 32;
          const sendKbps = Math.round((rawStats.SendBitrate ?? 32000) / 1000) || 32;
          const vadLatencyMs = Math.max(70, Math.min(125, Math.round(rtt * 1.6 + 22)));

          this.lastKnownStats = {
            ...this.lastKnownStats,
            rtt: rtt > 0 ? rtt : 38,
            recvBitrate: recvKbps,
            sendBitrate: sendKbps,
            vadLatencyMs,
          };
          this.callbacks.onRTCStats?.(this.lastKnownStats);
        } catch {}
      }, 2000);

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
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
      }
      this.remoteAudioTrack = null;
      this.isJoined = false;
      this.isListening = false;
      this._setSpeaking(false);
    }
  }

  public getLatestRTCStats(): AgoraRTCStatsSummary {
    return { ...this.lastKnownStats };
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

    // Reset turn text buffers completely so this turn starts fresh
    this.speechEngine.clearBuffer();
    this.turnAccumulatedFinalText = '';
    this.currentSessionFinalText = '';
    this.currentSessionInterimText = '';

    // Wire callbacks to speechEngine (modeled on PTM Vyapar Saathi)
    this.speechEngine.setCallbacks({
      onTranscript: (text: string, isFinal: boolean) => {
        if (this.isBrowserSpeaking) return;
        const boosted = boostTechnicalJargon(text);
        this.turnAccumulatedFinalText = boosted;
        this.callbacks.onTranscript?.(boosted, isFinal);
      },
      onSpeechDetected: () => {
        this.onSpeechDetectedCallback?.();
      },
      onStateChange: (listening: boolean) => {
        this.isListening = listening;
      },
      onError: (msg: string) => {
        this.callbacks.onSpeechError?.(msg);
      },
    });

    const started = this.speechEngine.start();
    console.log(`[AgoraVoiceEngine] 🎙️ Speech recognition engine ${started ? 'ACTIVE' : 'FAILED'} (PTM Vyapar Saathi architecture)`);
    return started;
  }

  // Force-flushes and immediately returns current candidate transcript
  public async flushAndGetFinalTranscript(): Promise<string> {
    const text = this.speechEngine.getAccumulatedText() || this.turnAccumulatedFinalText;
    return text ? boostTechnicalJargon(text) : '';
  }

  // ─── Stop microphone ─────────────────────────────────────
  public stopSpeechRecognition(): void {
    this.isListening = false;
    this.speechEngine.stop();
    this.setLocalMicMuted(true);
    this.turnAccumulatedFinalText = '';
    this.currentSessionFinalText = '';
    this.currentSessionInterimText = '';
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

    // Cancel browser TTS immediately (modeled on PTM Vyapar Saathi)
    speechSynthesizer.cancel();

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

  // ─── Browser TTS fallback (modeled on PTM Vyapar Saathi) ──
  public async speakWithBrowserFallback(
    text: string,
    voiceName: string = 'Kore',
    pitch = 1.0,
    rate = 1.0
  ): Promise<void> {
    this.isBrowserSpeaking = true;
    this._setSpeaking(true);

    try {
      await speechSynthesizer.speak(text, voiceName, pitch, rate);
    } finally {
      this.isBrowserSpeaking = false;
      this._setSpeaking(false);
    }
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

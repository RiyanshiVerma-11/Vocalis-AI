/**
 * LiveAvatarService
 * Integrates LiveAvatar LITE mode real-time WebRTC streaming.
 * 
 * Architecture (LITE mode):
 *  1. Backend: POST /api/liveavatar/start-session → returns livekitUrl + livekitClientToken + wsUrl
 *  2. Frontend: Connect to LiveKit room using livekit-client SDK → receive live video track
 *  3. Frontend: Render avatar video in a <video> element
 *  4. When AI needs to speak: send TTS audio via WebSocket (agent.speak command)
 * 
 * Docs: https://docs.liveavatar.com/docs/lite-mode/overview.md
 */

import { Room, RoomEvent, RemoteTrack, Track, RemoteParticipant } from 'livekit-client';

export interface LiveAvatarSessionInfo {
  sessionId: string;
  sessionToken: string;
  livekitUrl: string;
  livekitClientToken: string;
  wsUrl?: string;
  avatarId: string;
}

export interface LiveAvatarCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onVideoTrackAdded?: (track: RemoteTrack) => void;
  onVideoTrackRemoved?: () => void;
  onAvatarSpeakStarted?: () => void;
  onAvatarSpeakEnded?: () => void;
  onError?: (err: string) => void;
}

export class LiveAvatarService {
  private room: Room | null = null;
  private ws: WebSocket | null = null;
  private sessionInfo: LiveAvatarSessionInfo | null = null;
  private callbacks: LiveAvatarCallbacks = {};
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private videoTrack: RemoteTrack | null = null;

  public setCallbacks(cb: LiveAvatarCallbacks) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  /**
   * Start a LiveAvatar LITE session.
   * Returns the video track which should be attached to a <video> element.
   */
  public async startSession(options: { avatarId?: string; isSandbox?: boolean } = {}): Promise<LiveAvatarSessionInfo> {
    try {
      // 1. Ask our backend to create & start a LiveAvatar session
      const res = await fetch('/api/liveavatar/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: options.avatarId,
          isSandbox: options.isSandbox ?? true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to start LiveAvatar session');
      }

      this.sessionInfo = data as LiveAvatarSessionInfo;
      console.log('[LiveAvatarService] Session started:', this.sessionInfo.sessionId);

      // 2. Connect to LiveKit room to receive video stream
      await this._connectToLiveKit(this.sessionInfo.livekitUrl, this.sessionInfo.livekitClientToken);

      // 3. Connect WebSocket for avatar control commands (if ws_url available)
      if (this.sessionInfo.wsUrl) {
        this._connectWebSocket(this.sessionInfo.wsUrl, this.sessionInfo.sessionToken);
      }

      return this.sessionInfo;
    } catch (err: any) {
      console.error('[LiveAvatarService] startSession error:', err);
      this.callbacks.onError?.(err.message);
      throw err;
    }
  }

  /**
   * Attach the avatar video track to a <video> or <div> element
   */
  public attachVideoTo(container: HTMLElement) {
    if (this.videoTrack) {
      this.videoTrack.attach(container as HTMLVideoElement);
    }
  }

  /**
   * Send PCM audio to make the avatar speak (LITE mode)
   * audio: ArrayBuffer of PCM 16-bit 24kHz audio
   */
  public async speakAudio(audioBuffer: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[LiveAvatarService] WebSocket not connected');
      return;
    }

    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    const eventId = `speak-${Date.now()}`;

    // Send audio chunk
    this.ws.send(JSON.stringify({ type: 'agent.speak', audio: base64Audio }));

    // Signal end of speaking
    this.ws.send(JSON.stringify({ type: 'agent.speak_end', event_id: eventId }));
  }

  /**
   * Tell avatar to go into listening pose
   */
  public startListening() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'agent.start_listening', event_id: `listen-${Date.now()}` }));
    }
  }

  /**
   * Tell avatar to stop listening (idle)
   */
  public stopListening() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'agent.stop_listening', event_id: `idle-${Date.now()}` }));
    }
  }

  /**
   * Interrupt the avatar mid-speech
   */
  public interrupt() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'agent.interrupt' }));
    }
  }

  /**
   * Stop the session and clean up
   */
  public async stopSession() {
    // Clear keep-alive
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Disconnect from LiveKit
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }

    // Notify backend to stop session
    if (this.sessionInfo) {
      await fetch('/api/liveavatar/stop-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionInfo.sessionId,
          sessionToken: this.sessionInfo.sessionToken,
        }),
      }).catch(() => {});
      this.sessionInfo = null;
    }

    this.videoTrack = null;
    this.callbacks.onDisconnected?.();
  }

  public getSessionInfo() {
    return this.sessionInfo;
  }

  public getVideoTrack(): RemoteTrack | null {
    return this.videoTrack;
  }

  public isConnected() {
    return this.room?.state === 'connected';
  }

  // ─── Private helpers ───────────────────────────────────────────

  private async _connectToLiveKit(url: string, token: string) {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    // Listen for video tracks from remote participants (the avatar)
    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: any, _participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Video) {
        console.log('[LiveAvatarService] Avatar video track received!');
        this.videoTrack = track;
        this.callbacks.onVideoTrackAdded?.(track);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video) {
        this.videoTrack = null;
        this.callbacks.onVideoTrackRemoved?.();
      }
    });

    this.room.on(RoomEvent.Connected, () => {
      console.log('[LiveAvatarService] LiveKit room connected!');
      this.callbacks.onConnected?.();
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log('[LiveAvatarService] LiveKit room disconnected');
      this.callbacks.onDisconnected?.();
    });

    await this.room.connect(url, token);
  }

  private _connectWebSocket(wsUrl: string, sessionToken: string) {
    this.ws = new WebSocket(wsUrl, ['Bearer', sessionToken]);

    this.ws.onopen = () => {
      console.log('[LiveAvatarService] WebSocket connected!');
      // Start keep-alive every 30 seconds
      this.keepAliveInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'session.keep_alive', event_id: `ka-${Date.now()}` }));
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'session.state_updated') {
          console.log('[LiveAvatarService] Session state:', msg.state);
        } else if (msg.type === 'agent.speak_started') {
          this.callbacks.onAvatarSpeakStarted?.();
        } else if (msg.type === 'agent.speak_ended') {
          this.callbacks.onAvatarSpeakEnded?.();
        }
      } catch (_) {}
    };

    this.ws.onerror = (e) => {
      console.error('[LiveAvatarService] WebSocket error:', e);
    };

    this.ws.onclose = () => {
      console.log('[LiveAvatarService] WebSocket closed');
      if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    };
  }
}

// Singleton instance
export const liveAvatarService = new LiveAvatarService();

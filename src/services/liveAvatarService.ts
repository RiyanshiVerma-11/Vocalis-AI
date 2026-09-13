/**
 * LiveAvatarService (Disabled / Stubbed)
 * Real-time live avatar has been completely removed in favor of high-fidelity persona photos.
 */

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
  onVideoTrackAdded?: (track: any) => void;
  onVideoTrackRemoved?: () => void;
  onAvatarSpeakStarted?: () => void;
  onAvatarSpeakEnded?: () => void;
  onError?: (err: string) => void;
}

export class LiveAvatarService {
  public setCallbacks(_cb: LiveAvatarCallbacks) {}
  public async startSession(_options: { avatarId?: string; isSandbox?: boolean } = {}): Promise<LiveAvatarSessionInfo> {
    return {
      sessionId: '',
      sessionToken: '',
      livekitUrl: '',
      livekitClientToken: '',
      avatarId: '',
    };
  }
  public attachVideoTo(_container: HTMLElement) {}
  public sendAudio(_audio: ArrayBuffer) {}
  public startListening() {}
  public stopListening() {}
  public interrupt() {}
  public async stopSession(): Promise<void> {}
  public isConnected(): boolean { return false; }
  public getVideoTrack(): null { return null; }
}

export const liveAvatarService = new LiveAvatarService();

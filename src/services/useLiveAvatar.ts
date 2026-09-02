/**
 * useLiveAvatar – React hook for LiveAvatar LITE mode
 * Manages session lifecycle and exposes a ref to attach video to.
 */

import React, { useCallback, useRef, useState } from 'react';
import { liveAvatarService, LiveAvatarSessionInfo } from '../services/liveAvatarService';
import type { RemoteTrack } from 'livekit-client';

export type LiveAvatarStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'stopped';

export interface UseLiveAvatarReturn {
  status: LiveAvatarStatus;
  sessionInfo: LiveAvatarSessionInfo | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  startAvatar: (options?: { avatarId?: string; isSandbox?: boolean }) => Promise<void>;
  stopAvatar: () => Promise<void>;
  setAvatarListening: (listening: boolean) => void;
  interruptAvatar: () => void;
  error: string | null;
}

export function useLiveAvatar(): UseLiveAvatarReturn {
  const [status, setStatus] = useState<LiveAvatarStatus>('idle');
  const [sessionInfo, setSessionInfo] = useState<LiveAvatarSessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startAvatar = useCallback(async (options?: { avatarId?: string; isSandbox?: boolean }) => {
    setStatus('connecting');
    setError(null);

    liveAvatarService.setCallbacks({
      onConnected: () => setStatus('connected'),
      onDisconnected: () => setStatus('stopped'),
      onVideoTrackAdded: (track: RemoteTrack) => {
        // Attach live video to the <video> element
        if (videoRef.current) {
          track.attach(videoRef.current);
          console.log('[useLiveAvatar] Avatar video attached to element!');
        }
      },
      onVideoTrackRemoved: () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      },
      onError: (err) => {
        setError(err);
        setStatus('error');
      },
    });

    try {
      const info = await liveAvatarService.startSession(options);
      setSessionInfo(info);
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  const stopAvatar = useCallback(async () => {
    await liveAvatarService.stopSession();
    setSessionInfo(null);
    setStatus('idle');
  }, []);

  const setAvatarListening = useCallback((listening: boolean) => {
    if (listening) liveAvatarService.startListening();
    else liveAvatarService.stopListening();
  }, []);

  const interruptAvatar = useCallback(() => {
    liveAvatarService.interrupt();
  }, []);

  return {
    status,
    sessionInfo,
    videoRef,
    startAvatar,
    stopAvatar,
    setAvatarListening,
    interruptAvatar,
    error,
  };
}

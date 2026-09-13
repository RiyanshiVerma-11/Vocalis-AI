/**
 * useLiveAvatar – Stubbed hook
 * Real-time live avatar has been completely removed in favor of high-fidelity persona photos.
 */

import React, { useRef } from 'react';

export type LiveAvatarStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'stopped';

export interface UseLiveAvatarReturn {
  status: LiveAvatarStatus;
  sessionInfo: null;
  videoRef: React.RefObject<HTMLVideoElement>;
  startAvatar: (options?: { avatarId?: string; isSandbox?: boolean }) => Promise<void>;
  stopAvatar: () => Promise<void>;
  setAvatarListening: (listening: boolean) => void;
  interruptAvatar: () => void;
  error: string | null;
}

export function useLiveAvatar(): UseLiveAvatarReturn {
  const videoRef = useRef<HTMLVideoElement>(null);

  return {
    status: 'idle',
    sessionInfo: null,
    videoRef,
    startAvatar: async () => {},
    stopAvatar: async () => {},
    setAvatarListening: () => {},
    interruptAvatar: () => {},
    error: null,
  };
}

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, User, Volume2, Sparkles, Video } from 'lucide-react';
import { TalkingFaceAvatar } from './TalkingFaceAvatar';

interface CandidateStageTileProps {
  candidateName?: string;
  candidateHeadline?: string;
  isListening?: boolean;
  candidateVolume?: number; // 0 to 1
  className?: string;
}

export const CandidateStageTile: React.FC<CandidateStageTileProps> = ({
  candidateName = 'Jordan Reed',
  candidateHeadline = 'Candidate • Full Stack AI Engineer',
  isListening = false,
  candidateVolume = 0,
  className = '',
}) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isSpeaking = isListening && candidateVolume > 0.08;

  // Auto-enable camera on mount when interview room opens
  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setCameraError(null);
      } catch (err: any) {
        console.warn('[CandidateStageTile] Camera auto-start failed:', err);
        if (isMounted) {
          setCameraError('Click Cam button to allow webcam access');
          setIsCameraOn(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Ensure video element receives mediaStream whenever camera is ON
  useEffect(() => {
    if (isCameraOn && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch((e) => console.warn('[CandidateStageTile] video.play error:', e));
    }
  }, [isCameraOn]);

  // Toggle Camera stream manually
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setCameraError(null);
      } catch (err: any) {
        console.warn('[CandidateStageTile] Camera request failed:', err);
        setCameraError('Camera access denied');
        setIsCameraOn(false);
      }
    }
  };

  return (
    <div
      className={`relative rounded-xl p-2 transition-all duration-200 flex flex-col justify-between border ${
        isSpeaking
          ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/30 translate-y-[-1px]'
          : 'bg-slate-900 text-white border-slate-700 shadow-xs'
      } ${className}`}
    >
      {/* Top Header: Candidate Badge & Camera Control Button */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-bold border uppercase tracking-wider ${
            isSpeaking
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-indigo-950 text-indigo-300 border-indigo-700/60'
          }`}
        >
          <User className="w-2.5 h-2.5 text-emerald-400" />
          <span>YOU (CANDIDATE)</span>
        </span>

        {/* Live Controls */}
        <div className="flex items-center gap-1">
          {isSpeaking && (
            <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300 uppercase tracking-wider animate-pulse">
              <Volume2 className="w-2.5 h-2.5" /> Speaking
            </span>
          )}

          <button
            type="button"
            onClick={toggleCamera}
            title={isCameraOn ? 'Turn Camera Off' : 'Enable Live Video Camera'}
            className={`p-0.5 px-1.5 rounded text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
              isCameraOn
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {isCameraOn ? <Camera className="w-2.5 h-2.5" /> : <CameraOff className="w-2.5 h-2.5" />}
            <span className="font-medium hidden sm:inline">
              {isCameraOn ? 'Cam ON' : 'Cam OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Face Tile: Live Camera Video vs AI Avatar Voice Presence (Passport Size Tile) */}
      <div className="relative w-full h-32 sm:h-36 max-h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center my-1 group">
        {isCameraOn ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100" // mirrored for selfie video
            />
            {/* Live Camera Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE CAM
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center w-full h-full p-2 bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950/60 select-none">
            {/* Pulsating Audio Rings when Candidate Speaks */}
            <div className="relative flex items-center justify-center mb-1">
              {isSpeaking && (
                <>
                  <span className="absolute w-16 h-16 rounded-full bg-emerald-500/20 animate-ping" />
                  <span className="absolute w-12 h-12 rounded-full bg-emerald-400/30 animate-pulse" />
                </>
              )}
              {/* Live Candidate Initials Avatar Badge */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center border-2 border-emerald-400/60 shadow-md relative z-10 transition-transform ${isSpeaking ? 'scale-105 ring-2 ring-emerald-400' : ''}`}>
                {candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CAN'}
              </div>
            </div>

            <span className="text-[10px] font-bold text-slate-300 truncate max-w-full">
              {isSpeaking ? '🎤 Speaking...' : 'Mic Ready • Voice Active'}
            </span>

            <button
              type="button"
              onClick={toggleCamera}
              className="mt-1 text-[9px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer truncate max-w-full px-1"
            >
              {cameraError || 'Click to Enable Camera'}
            </button>
          </div>
        )}

        {/* Audio Mic Spectrum Overlay */}
        {isListening && (
          <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-emerald-500/40 px-1.5 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs shadow-xs">
            <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
            <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${Math.min(100, candidateVolume * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="min-w-0 mt-0.5">
        <h3 className="text-[11px] font-bold text-slate-900 truncate flex items-center gap-1 leading-tight">
          <span className="truncate">{candidateName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        </h3>
        <p className="text-[9px] text-slate-500 truncate leading-tight">{candidateHeadline}</p>
      </div>
    </div>
  );
};

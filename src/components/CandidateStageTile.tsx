import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, User, Volume2, Sparkles, Video } from 'lucide-react';


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
      className={`relative rounded-xl transition-all duration-300 flex flex-col justify-between overflow-hidden border bg-[#0b101b] ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
          : 'border-slate-800/90 hover:border-slate-700 shadow-md'
      } ${className}`}
    >
      {/* Top Header: Candidate Badge & Camera Control Button */}
      <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 z-10">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${
            isSpeaking
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
          }`}
        >
          <User className="w-2.5 h-2.5 text-emerald-400" />
          <span>YOU (CANDIDATE)</span>
        </span>

        {/* Live Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleCamera}
            title={isCameraOn ? 'Turn Camera Off' : 'Enable Live Video Camera'}
            className={`p-0.5 px-1.5 rounded text-[8px] font-bold flex items-center gap-1 transition cursor-pointer ${
              isCameraOn
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/70'
            }`}
          >
            {isCameraOn ? <Camera className="w-2.5 h-2.5" /> : <CameraOff className="w-2.5 h-2.5" />}
            <span className="font-medium hidden sm:inline">
              {isCameraOn ? 'Cam ON' : 'Cam OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Face Tile: Live Camera Video vs AI Avatar Voice Presence */}
      <div className="relative w-full h-24 sm:h-28 md:h-30 bg-slate-950 overflow-hidden flex items-center justify-center group">
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
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-600/90 text-white text-[7px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center w-full h-full p-2 bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-emerald-950/40 select-none">
            {/* Pulsating Audio Rings when Candidate Speaks */}
            <div className="relative flex items-center justify-center mb-1">
              {isSpeaking && (
                <>
                  <span className="absolute w-14 h-14 rounded-full bg-emerald-500/20 animate-ping" />
                  <span className="absolute w-10 h-10 rounded-full bg-emerald-400/30 animate-pulse" />
                </>
              )}
              {/* Live Candidate Initials Avatar Badge */}
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xs flex items-center justify-center border-2 border-emerald-400/60 shadow-md relative z-10 transition-transform ${isSpeaking ? 'scale-105 ring-2 ring-emerald-400' : ''}`}>
                {candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CAN'}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCamera}
              className="text-[8px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer truncate max-w-full"
            >
              {cameraError || 'Enable Camera'}
            </button>
          </div>
        )}

        {/* Audio Equalizer Waveform Overlay at bottom of video card */}
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-0.5 h-3">
            {[30, 70, 45, 90, 60, 100, 50, 80, 40, 65, 85, 35].map((h, i) => {
              const barHeight = isSpeaking ? Math.max(20, Math.min(100, candidateVolume * (h * 1.5))) : (isListening ? 15 : 8);
              return (
                <div
                  key={i}
                  style={{ height: `${barHeight}%` }}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    isSpeaking ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-700/60'
                  }`}
                />
              );
            })}
          </div>
          {isSpeaking && (
            <span className="text-[7px] font-mono font-bold text-emerald-400 bg-slate-900/80 px-1 rounded border border-emerald-500/40 animate-pulse">
              SPEAKING
            </span>
          )}
        </div>
      </div>

      {/* Footer Bar inside card: Name & Headline */}
      <div className={`px-2 py-1 border-t border-slate-800/80 ${isSpeaking ? 'bg-emerald-950/40' : 'bg-slate-900/70'}`}>
        <p className="text-[10px] font-extrabold text-white truncate leading-tight flex items-center justify-between">
          <span className="truncate">{candidateName}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'} inline-block shrink-0`} />
        </p>
        <p className="text-[8px] text-emerald-400/90 font-medium truncate leading-tight mt-0.5">{candidateHeadline}</p>
      </div>
    </div>
  );
};

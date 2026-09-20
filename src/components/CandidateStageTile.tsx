import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, User, Volume2, Sparkles, Video } from 'lucide-react';


interface CandidateStageTileProps {
  candidateName?: string;
  candidateHeadline?: string;
  isListening?: boolean;
  isAISpeaking?: boolean;
  candidateVolume?: number; // 0 to 100
  className?: string;
}

export const CandidateStageTile: React.FC<CandidateStageTileProps> = ({
  candidateName = 'Jordan Reed',
  candidateHeadline = 'Candidate • Full Stack AI Engineer',
  isListening = false,
  isAISpeaking = false,
  candidateVolume = 0,
  className = '',
}) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isSpeaking = !isAISpeaking && isListening && candidateVolume > 15;

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
      className={`relative w-[185px] sm:w-[205px] md:w-[215px] shrink-0 rounded-xl transition-all duration-300 flex flex-col justify-between overflow-hidden border bg-[#0b101b] ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
          : 'border-slate-800/90 hover:border-slate-700 shadow-md'
      } ${className}`}
    >
      {/* Top Header: Candidate Badge & Camera Control Button */}
      <div className="px-1.5 py-0.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 z-10">
        <span
          className={`inline-flex items-center gap-1 px-1 py-0.2 rounded text-[7.5px] font-extrabold uppercase tracking-wider border ${
            isSpeaking
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
          }`}
        >
          <User className="w-2 h-2 text-emerald-400 shrink-0" />
          <span className="truncate">YOU</span>
        </span>

        {/* Live Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleCamera}
            title={isCameraOn ? 'Turn Camera Off' : 'Enable Live Video Camera'}
            className={`p-0.5 px-1 rounded text-[7.5px] font-bold flex items-center gap-0.5 transition cursor-pointer ${
              isCameraOn
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/70'
            }`}
          >
            {isCameraOn ? <Camera className="w-2 h-2" /> : <CameraOff className="w-2 h-2" />}
            <span className="font-medium hidden sm:inline text-[7.5px]">
              {isCameraOn ? 'Cam ON' : 'Cam OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Face Tile: Live Camera Video vs AI Avatar Voice Presence */}
      <div className="relative w-full h-24 sm:h-28 bg-slate-950 overflow-hidden flex items-center justify-center group">
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
            <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-600/90 text-white text-[6.5px] font-extrabold px-1 py-0.2 rounded-full uppercase tracking-wider backdrop-blur-xs">
              <span className="w-1 h-1 rounded-full bg-white animate-ping" />
              LIVE
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center w-full h-full p-1 bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-emerald-950/40 select-none">
            {/* Pulsating Audio Rings when Candidate Speaks */}
            <div className="relative flex items-center justify-center mb-0.5">
              {isSpeaking && (
                <>
                  <span className="absolute w-10 h-10 rounded-full bg-emerald-500/20 animate-ping" />
                  <span className="absolute w-8 h-8 rounded-full bg-emerald-400/30 animate-pulse" />
                </>
              )}
              {/* Live Candidate Initials Avatar Badge */}
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-[10px] flex items-center justify-center border border-emerald-400/60 shadow-md relative z-10 transition-transform ${isSpeaking ? 'scale-105 ring-2 ring-emerald-400' : ''}`}>
                {candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CAN'}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCamera}
              className="text-[7.5px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer truncate max-w-full"
            >
              {cameraError || 'Enable Camera'}
            </button>
          </div>
        )}

        {/* Audio Equalizer Waveform Overlay at bottom of video card */}
        <div className="absolute bottom-0.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-0.5 h-2.5">
            {[30, 70, 45, 90, 60, 100, 50, 80, 40, 65, 85, 35].map((h, i) => {
              const normVol = Math.min(1, candidateVolume / 65);
              const dynamicH = isSpeaking ? Math.max(25, Math.min(100, normVol * h * (0.8 + 0.35 * Math.sin(i * 1.5)))) : (isListening && !isAISpeaking ? 14 : 8);
              return (
                <div
                  key={i}
                  style={{
                    height: `${dynamicH}%`,
                    animation: isSpeaking ? `pulse 0.35s ease-in-out ${i * 0.04}s infinite alternate` : 'none',
                  }}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    isSpeaking ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-700/60'
                  }`}
                />
              );
            })}
          </div>
          {isSpeaking && (
            <span className="text-[6.5px] font-mono font-bold text-emerald-400 bg-slate-900/80 px-1 rounded border border-emerald-500/40 animate-pulse">
              SPEAKING
            </span>
          )}
        </div>
      </div>

      {/* Footer Bar inside card: Name & Headline */}
      <div className={`px-1.5 py-0.5 border-t border-slate-800/80 ${isSpeaking ? 'bg-emerald-950/40' : 'bg-slate-900/70'}`}>
        <p className="text-[9px] font-extrabold text-white truncate leading-tight flex items-center justify-between">
          <span className="truncate">{candidateName}</span>
          <span className={`w-1 h-1 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'} inline-block shrink-0`} />
        </p>
        <p className="text-[7.5px] text-emerald-400/90 font-medium truncate leading-tight mt-0.5">{candidateHeadline}</p>
      </div>
    </div>
  );
};

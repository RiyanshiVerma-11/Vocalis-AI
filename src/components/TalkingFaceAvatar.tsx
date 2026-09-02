import React, { useEffect } from 'react';
import { liveAvatarService } from '../services/liveAvatarService';
import { Cpu, Layers, Briefcase, Users, HeartPulse, Sparkles } from 'lucide-react';
import { PanelistReactionType } from '../types';

export interface TalkingFaceAvatarProps {
  avatarIcon?: string;
  avatarColor?: string;
  name: string;
  isSpeaking?: boolean;
  volume?: number;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  /** If provided, this video element ref is shown as the live avatar stream */
  liveVideoRef?: React.RefObject<HTMLVideoElement>;
  /** Whether LiveAvatar is actively connected and streaming */
  isLiveStreaming?: boolean;
  /** Inactive panelist ambient reaction state */
  ambientReaction?: { reactionType: PanelistReactionType; label: string };
}

const PALETTE_MAP: Record<string, { primary: string; secondary: string; glow: string; bgGrad: string }> = {
  blue:    { primary: '#38bdf8', secondary: '#0284c7', glow: 'rgba(56, 189, 248, 0.45)', bgGrad: 'from-sky-950/80 via-slate-900 to-slate-950' },
  purple:  { primary: '#c084fc', secondary: '#9333ea', glow: 'rgba(192, 132, 252, 0.45)', bgGrad: 'from-purple-950/80 via-slate-900 to-slate-950' },
  amber:   { primary: '#fbbf24', secondary: '#d97706', glow: 'rgba(251, 191, 36, 0.45)', bgGrad: 'from-amber-950/80 via-slate-900 to-slate-950' },
  emerald: { primary: '#34d399', secondary: '#059669', glow: 'rgba(52, 211, 153, 0.45)', bgGrad: 'from-emerald-950/80 via-slate-900 to-slate-950' },
  rose:    { primary: '#fb7185', secondary: '#e11d48', glow: 'rgba(251, 113, 133, 0.45)', bgGrad: 'from-rose-950/80 via-slate-900 to-slate-950' },
};

function resolvePalette(avatarColor?: string) {
  if (!avatarColor) return PALETTE_MAP.blue;
  if (avatarColor.includes('blue') || avatarColor.includes('cyan')) return PALETTE_MAP.blue;
  if (avatarColor.includes('purple') || avatarColor.includes('pink')) return PALETTE_MAP.purple;
  if (avatarColor.includes('amber') || avatarColor.includes('orange')) return PALETTE_MAP.amber;
  if (avatarColor.includes('emerald') || avatarColor.includes('teal')) return PALETTE_MAP.emerald;
  if (avatarColor.includes('rose') || avatarColor.includes('red')) return PALETTE_MAP.rose;
  return PALETTE_MAP.blue;
}

function getIconComponent(iconName?: string) {
  switch (iconName) {
    case 'Cpu': return Cpu;
    case 'Layers': return Layers;
    case 'Briefcase': return Briefcase;
    case 'Users': return Users;
    case 'HeartPulse': return HeartPulse;
    default: return Sparkles;
  }
}

const KF_ID = 'modern-digital-avatar-kf';
function injectKF() {
  if (typeof document === 'undefined' || document.getElementById(KF_ID)) return;
  const s = document.createElement('style');
  s.id = KF_ID;
  s.textContent = `
    @keyframes ma-digital-pulse {
      0%, 100% { transform: scale(1.0); opacity: 0.85; }
      50% { transform: scale(1.06); opacity: 1; }
    }
    @keyframes ma-speak-glow {
      0%, 100% { box-shadow: 0 0 0 2px var(--ma-primary), 0 0 24px 6px var(--ma-glow); }
      50%      { box-shadow: 0 0 0 4px var(--ma-primary), 0 0 36px 12px var(--ma-glow); }
    }
    @keyframes ma-ambient-nod {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(3px); }
    }
    @keyframes ma-ambient-jot {
      0%, 100% { transform: rotate(0deg); }
      25%      { transform: rotate(-2deg); }
      75%      { transform: rotate(2deg); }
    }
    @keyframes ma-bar {
      0%, 100% { transform: scaleY(0.25); }
      50%      { transform: scaleY(1); }
    }
  `;
  document.head.appendChild(s);
}

export const TalkingFaceAvatar: React.FC<TalkingFaceAvatarProps> = ({
  avatarIcon,
  avatarColor,
  name,
  isSpeaking = false,
  liveVideoRef,
  isLiveStreaming = false,
  ambientReaction,
}) => {
  useEffect(() => { injectKF(); }, []);

  // Ensure video track is attached whenever liveVideoRef mounts or isLiveStreaming turns true
  useEffect(() => {
    if (liveVideoRef?.current && isLiveStreaming) {
      const track = liveAvatarService.getVideoTrack();
      if (track) {
        track.attach(liveVideoRef.current);
        console.log('[TalkingFaceAvatar] Attached LiveAvatar WebRTC video track');
      }
    }
  }, [liveVideoRef, isLiveStreaming]);

  const palette = resolvePalette(avatarColor);
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const IconComponent = getIconComponent(avatarIcon);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#020617',
    overflow: 'hidden',
    '--ma-primary': palette.primary,
    '--ma-glow': palette.glow,
    animation: isSpeaking
      ? 'ma-speak-glow 0.9s ease-in-out infinite'
      : ambientReaction?.reactionType === 'nodding'
      ? 'ma-ambient-nod 2.2s ease-in-out infinite'
      : ambientReaction?.reactionType === 'taking_notes'
      ? 'ma-ambient-jot 2.5s ease-in-out infinite'
      : 'none',
  } as React.CSSProperties;

  return (
    <div style={containerStyle} className="group flex flex-col items-center justify-center">

      {/* ── LIVE VIDEO STREAM (LiveAvatar LITE mode WebRTC) ── */}
      {liveVideoRef && (
        <video
          ref={liveVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="absolute inset-0 w-full h-full object-cover z-20"
          style={{
            display: isLiveStreaming ? 'block' : 'none',
            objectPosition: '50% 15%',
          }}
        />
      )}

      {/* Digital Human Connecting State: Clean tech spinner (NO JPG EVER) */}
      {liveVideoRef && !isLiveStreaming && (
        <div className="absolute inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center z-15 p-4 text-center">
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest animate-pulse">
            Connecting Digital Human...
          </span>
          <span className="text-[8px] text-slate-500 mt-1 font-mono">
            Live WebRTC • LiveKit Cloud
          </span>
        </div>
      )}

      {/* ── PURE DIGITAL AI PERSONA CARD (When not streaming video) ── */}
      {!liveVideoRef && (
        <div
          className={`w-full h-full flex flex-col items-center justify-center relative p-3 bg-gradient-to-b ${palette.bgGrad}`}
        >
          {/* Subtle Ambient Cyber Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

          {/* Glowing Digital Persona Avatar Core */}
          <div
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shadow-2xl border transition-all duration-300 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${palette.primary}22, #0f172a 80%)`,
              borderColor: isSpeaking ? palette.primary : `${palette.primary}55`,
              boxShadow: isSpeaking
                ? `0 0 25px ${palette.glow}, inset 0 0 15px ${palette.glow}`
                : `0 8px 20px rgba(0,0,0,0.5)`,
              animation: isSpeaking ? 'ma-digital-pulse 1.2s ease-in-out infinite' : 'none',
            }}
          >
            <IconComponent
              className="w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-300"
              style={{ color: palette.primary }}
            />
            <span
              className="text-[9px] font-mono font-black tracking-wider mt-0.5"
              style={{ color: palette.primary }}
            >
              {initials}
            </span>
          </div>

          <span className="mt-2 text-[10px] font-bold text-slate-300 tracking-wider uppercase text-center truncate max-w-full px-2">
            {name}
          </span>
        </div>
      )}

      {/* Speaking Active Gradient Rim */}
      {isSpeaking && (
        <div
          className="absolute inset-0 pointer-events-none z-20 border-2"
          style={{ borderColor: palette.primary }}
        />
      )}

      {/* Speaking Audio Waveform HUD (Bottom-left) */}
      {isSpeaking && (
        <div className="absolute bottom-2 left-2 z-20 flex items-end gap-0.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700/50">
          {[0.35, 0.5, 0.3, 0.45, 0.38].map((dur, i) => (
            <span
              key={i}
              className="w-1 h-3 rounded-full inline-block"
              style={{
                backgroundColor: palette.primary,
                animation: `ma-bar ${dur}s ease-in-out infinite`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* LIVE Indicator (Bottom-right) */}
      {isSpeaking && (
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-indigo-600/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full backdrop-blur-md tracking-wider border border-indigo-400/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Interviewer } from '../types';
import {
  Cpu,
  Layers,
  Briefcase,
  Users,
  HeartPulse,
  Volume2,
  Sparkles,
  Info,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { InterviewerPersonaModal } from './InterviewerPersonaModal';
import { TalkingFaceAvatar } from './TalkingFaceAvatar';
import { CandidateStageTile } from './CandidateStageTile';
import { useLiveAvatar } from '../services/useLiveAvatar';

import { PanelistReactionType } from '../types';

interface InterviewerStageProps {
  panel: Interviewer[];
  activeSpeakerId: string | null;
  isAISpeaking: boolean;
  selectedTargetInterviewerId: string | null;
  onSelectTargetInterviewer: (id: string | null) => void;
  lastTurnTakingReason?: string;
  lastInternalThought?: string;
  candidateName?: string;
  candidateHeadline?: string;
  isListening?: boolean;
  candidateVolume?: number;
  onOpenWhiteboard?: () => void;
  isWhiteboardSynced?: boolean;
  ambientReactions?: Record<string, { reactionType: PanelistReactionType; label: string }>;
}

export const InterviewerStage: React.FC<InterviewerStageProps> = ({
  panel,
  activeSpeakerId,
  isAISpeaking,
  selectedTargetInterviewerId,
  onSelectTargetInterviewer,
  lastTurnTakingReason,
  lastInternalThought,
  candidateName = 'Jordan Reed',
  candidateHeadline = 'Candidate • Full Stack AI Engineer',
  isListening = false,
  candidateVolume = 0,
  onOpenWhiteboard,
  isWhiteboardSynced = false,
  ambientReactions = {},
}) => {
  const [selectedPersona, setSelectedPersona] = useState<Interviewer | null>(null);

  // ── LiveAvatar LITE mode integration ─────────────────────────
  const { status: liveStatus, videoRef: liveVideoRef, startAvatar, stopAvatar, setAvatarListening } = useLiveAvatar();
  const sessionStartedRef = useRef(false);

  // Auto-start LiveAvatar session when the panel is ready
  useEffect(() => {
    if (panel.length > 0 && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      console.log('[InterviewerStage] Starting LiveAvatar session...');
      startAvatar({ isSandbox: true }).catch(err => {
        console.warn('[InterviewerStage] LiveAvatar start failed (will use photo fallback):', err.message);
        sessionStartedRef.current = false;
      });
    }
    return () => {
      // stop session when component unmounts (interview ends)
    };
  }, [panel.length]);

  // Signal avatar listening state
  useEffect(() => {
    if (liveStatus === 'connected') {
      setAvatarListening(isListening && !isAISpeaking);
    }
  }, [isListening, isAISpeaking, liveStatus]);

  const isLiveStreaming = liveStatus === 'connected';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'technical':      return <Cpu className="w-3 h-3" />;
      case 'product':        return <Layers className="w-3 h-3" />;
      case 'hiring_manager': return <Briefcase className="w-3 h-3" />;
      case 'customer':       return <Users className="w-3 h-3" />;
      case 'behavioural':    return <HeartPulse className="w-3 h-3" />;
      default:               return <Sparkles className="w-3 h-3" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'technical':      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'product':        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'hiring_manager': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'customer':       return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'behavioural':    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:               return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getRoleGlowStyle = (role: string, isSpeaking: boolean, isTargeted: boolean) => {
    if (isSpeaking) {
      switch (role) {
        case 'technical':      return 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]';
        case 'product':        return 'border-purple-400 ring-2 ring-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
        case 'hiring_manager': return 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
        case 'customer':       return 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
        default:               return 'border-indigo-400 ring-2 ring-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.4)]';
      }
    }
    if (isTargeted) {
      return 'border-indigo-400 ring-1 ring-indigo-400/40 shadow-md';
    }
    return 'border-slate-800/90 hover:border-slate-700 shadow-md';
  };

  return (
    <div id="interviewer-stage-container" className="bg-[#0b101b] border border-slate-800/90 rounded-xl p-2 sm:p-2.5 shadow-xl relative overflow-hidden">
      {/* Sleek Stage Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <h2 className="text-[10px] font-extrabold text-slate-200 tracking-wider uppercase truncate">
            AI Committee Panel ({panel.length} Interviewers)
          </h2>
          <span className="hidden sm:inline-flex text-[9px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.2 rounded-full items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Multi-Role Deliberation Sync
          </span>
          {/* LiveAvatar Stream Status */}
          <span className={`text-[8px] font-bold px-2 py-0.2 rounded-full flex items-center gap-1 border ${
            isLiveStreaming
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : liveStatus === 'connecting'
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse'
              : 'text-slate-500 bg-slate-800/50 border-slate-700/40'
          }`}>
            {isLiveStreaming ? <Wifi className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />}
            {isLiveStreaming ? 'LIVE AVATAR' : liveStatus === 'connecting' ? 'CONNECTING...' : 'AVATAR READY'}
          </span>
          {/* Whiteboard Canvas Action */}
          {onOpenWhiteboard && (
            <button
              type="button"
              onClick={onOpenWhiteboard}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border transition cursor-pointer ${
                isWhiteboardSynced
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'
              }`}
              title="Open Interactive System Design Whiteboard"
            >
              <Layers className="w-2.5 h-2.5 text-indigo-400" />
              <span>{isWhiteboardSynced ? '🎨 Whiteboard (Synced)' : '🎨 Whiteboard'}</span>
            </button>
          )}
        </div>

        {/* Turn-Taking Deliberation Reason integrated directly into header */}
        <div className="flex items-center gap-2 min-w-0">
          {lastTurnTakingReason && (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 px-2 py-0.5 rounded-lg text-[9px] text-slate-300 max-w-sm truncate">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">Deliberation:</span>
              <span className="truncate text-slate-200">{lastTurnTakingReason}</span>
            </div>
          )}

          {selectedTargetInterviewerId && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-medium text-cyan-300">Targeted</span>
              <button
                onClick={() => onSelectTargetInterviewer(null)}
                className="text-[9px] font-bold text-slate-300 hover:text-white px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Cyber Panel Cards Grid (Fits Candidate + Panel Members in 1 Clean Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 items-stretch">
        {/* Candidate Live Stage Tile */}
        <CandidateStageTile
          candidateName={candidateName}
          candidateHeadline={candidateHeadline}
          isListening={isListening}
          candidateVolume={candidateVolume}
        />

        {panel.map((interviewer) => {
          const isSpeakingNow = activeSpeakerId === interviewer.id && isAISpeaking;
          const isTargeted   = selectedTargetInterviewerId === interviewer.id;
          
          const isFemaleInterviewer =
            interviewer.name.toLowerCase().includes('priya') ||
            interviewer.name.toLowerCase().includes('neha') ||
            interviewer.voiceName === 'Kore' ||
            interviewer.voiceName === 'Aoede';

          const isLiveTile =
            isFemaleInterviewer &&
            (activeSpeakerId === interviewer.id || (!activeSpeakerId && panel.find(p => p.name.toLowerCase().includes('priya'))?.id === interviewer.id));

          const reaction = ambientReactions[interviewer.id];

          return (
            <div
              key={interviewer.id}
              id={`panel-card-${interviewer.id}`}
              className={`relative rounded-xl border transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group bg-[#0b101b] ${getRoleGlowStyle(
                interviewer.role,
                isSpeakingNow,
                isTargeted
              )}`}
              onClick={() => onSelectTargetInterviewer(isTargeted ? null : interviewer.id)}
            >
              {/* Header Bar inside card */}
              <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 z-10">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${getRoleBadgeStyle(interviewer.role)}`}>
                  {getRoleIcon(interviewer.role)}
                  <span className="truncate max-w-[70px] sm:max-w-none">{interviewer.role.replace('_', ' ')}</span>
                </span>

                <div className="flex items-center gap-1">
                  {isSpeakingNow ? (
                    <span className="flex items-center gap-1 text-[8px] font-extrabold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-400/40 uppercase tracking-wider animate-pulse">
                      <Volume2 className="w-2 h-2" /> Speaking
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedPersona(interviewer); }}
                      className="p-0.5 px-1 rounded text-[8px] font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition flex items-center gap-0.5"
                    >
                      <Info className="w-2 h-2" /> Info
                    </button>
                  )}
                </div>
              </div>

              {/* Video Stream Stage Tile */}
              <div className="relative w-full h-24 sm:h-28 md:h-30 bg-slate-950 overflow-hidden">
                <TalkingFaceAvatar
                  avatarPhoto={interviewer.avatarPhoto}
                  avatarUrl={interviewer.avatarUrl}
                  avatarIcon={interviewer.avatarIcon}
                  avatarColor={interviewer.avatarColor}
                  objectPosition={interviewer.avatarObjectPosition}
                  name={interviewer.name}
                  isSpeaking={isSpeakingNow}
                  className="w-full h-full rounded-none"
                  liveVideoRef={isLiveTile ? liveVideoRef : undefined}
                  isLiveStreaming={isLiveTile && isLiveStreaming}
                  ambientReaction={reaction}
                />

                {/* Floating Ambient Reaction Badge on Inactive Tile */}
                {!isSpeakingNow && reaction && (
                  <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-slate-900/90 text-slate-100 text-[8px] font-bold border border-slate-700 shadow-md backdrop-blur-xs animate-in fade-in zoom-in duration-200">
                    <span>
                      {reaction.reactionType === 'taking_notes' && '📝'}
                      {reaction.reactionType === 'skeptical' && '🤔'}
                      {reaction.reactionType === 'nodding' && '👍'}
                      {reaction.reactionType === 'concerned' && '⚠️'}
                      {reaction.reactionType === 'intrigued' && '✨'}
                    </span>
                    <span className="truncate max-w-[70px]">{reaction.label}</span>
                  </div>
                )}

                {isTargeted && !isSpeakingNow && (
                  <div className="absolute top-1.5 left-1.5 z-20 bg-indigo-600/90 text-white font-mono text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider backdrop-blur-sm shadow-md">
                    Target
                  </div>
                )}

                {/* Audio Equalizer Waveform Overlay at bottom of video card (matching README design!) */}
                <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-0.5 h-3">
                    {[35, 80, 50, 95, 60, 100, 55, 85, 45, 75, 90, 40].map((h, i) => {
                      const barHeight = isSpeakingNow ? Math.max(25, h) : 12;
                      return (
                        <div
                          key={i}
                          style={{
                            height: `${barHeight}%`,
                            animation: isSpeakingNow ? 'pulse 0.32s ease-in-out infinite alternate' : undefined,
                            animationDelay: `${i * 0.05}s`,
                          }}
                          className={`w-0.5 rounded-full transition-all duration-100 ${
                            isSpeakingNow
                              ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]'
                              : 'bg-slate-700/60'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className={`text-[7px] font-mono font-bold px-1 rounded uppercase ${
                    isSpeakingNow
                      ? 'text-cyan-300 bg-slate-950/80 border border-cyan-500/40'
                      : 'text-slate-400 bg-slate-900/60 border border-slate-800'
                  }`}>
                    {isSpeakingNow ? 'SPEAKING' : 'ENGAGED'}
                  </span>
                </div>
              </div>

              {/* Footer Bar inside card: Name & Title */}
              <div className={`px-2 py-1 border-t border-slate-800/80 ${isSpeakingNow ? 'bg-cyan-950/40' : 'bg-slate-900/70'}`}>
                <p className="text-[10px] font-extrabold text-white truncate leading-tight flex items-center justify-between">
                  <span className="truncate">{interviewer.name}</span>
                  {isTargeted && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block shrink-0" />}
                </p>
                <p className="text-[8px] text-cyan-400/90 font-medium truncate leading-tight mt-0.5">{interviewer.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <InterviewerPersonaModal
        interviewer={selectedPersona}
        onClose={() => setSelectedPersona(null)}
      />
    </div>
  );
};

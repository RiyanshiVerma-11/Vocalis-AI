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
  candidateName = 'Riyanshi Verma',
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

  return (
    <div id="interviewer-stage-container" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl relative overflow-hidden">
      {/* Stage Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-[11px] font-extrabold text-slate-300 tracking-widest uppercase">
            Active Committee Stage ({panel.length} AI Interviewers)
          </h2>
          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Multi-Role Deliberation Sync
          </span>
          {/* LiveAvatar Stream Status */}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
            isLiveStreaming
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : liveStatus === 'connecting'
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse'
              : 'text-slate-500 bg-slate-800/50 border-slate-700/40'
          }`}>
            {isLiveStreaming ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            {isLiveStreaming ? 'LIVE AVATAR' : liveStatus === 'connecting' ? 'CONNECTING...' : 'AVATAR OFFLINE'}
          </span>
          {/* Whiteboard Canvas Action */}
          {onOpenWhiteboard && (
            <button
              type="button"
              onClick={onOpenWhiteboard}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition cursor-pointer ${
                isWhiteboardSynced
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'
              }`}
              title="Open Interactive System Design Whiteboard"
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>{isWhiteboardSynced ? '🎨 Whiteboard (Synced)' : '🎨 System Design Whiteboard'}</span>
            </button>
          )}
        </div>

        {selectedTargetInterviewerId && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-indigo-400">Directing answer to target interviewer</span>
            <button
              onClick={() => onSelectTargetInterviewer(null)}
              className="text-[10px] font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition cursor-pointer"
            >
              Clear Target
            </button>
          </div>
        )}
      </div>

      {/* Compact Passport-Size Video Panel Grid (Fits 5 Tiles: Candidate + Panel Members) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 items-start">
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
          const isLiveTile   = activeSpeakerId === interviewer.id || (!activeSpeakerId && panel[0]?.id === interviewer.id);
          const reaction     = ambientReactions[interviewer.id];

          return (
            <div
              key={interviewer.id}
              id={`panel-card-${interviewer.id}`}
              className={`relative rounded-xl border transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group bg-slate-950/80 ${
                isSpeakingNow
                  ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-950/50'
                  : isTargeted
                  ? 'border-indigo-400 ring-1 ring-indigo-400/40 shadow-md'
                  : 'border-slate-800 hover:border-slate-700 hover:shadow-md'
              }`}
              onClick={() => onSelectTargetInterviewer(isTargeted ? null : interviewer.id)}
            >
              {/* Header Bar inside card */}
              <div className="px-2 py-1.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 z-10">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${getRoleBadgeStyle(interviewer.role)}`}>
                  {getRoleIcon(interviewer.role)}
                  <span className="truncate max-w-[70px] sm:max-w-none">{interviewer.role.replace('_', ' ')}</span>
                </span>

                <div className="flex items-center gap-1">
                  {isSpeakingNow ? (
                    <span className="flex items-center gap-1 text-[8px] font-extrabold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-400/30 uppercase tracking-wider animate-pulse">
                      <Volume2 className="w-2.5 h-2.5" /> Speaking
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedPersona(interviewer); }}
                      className="p-0.5 px-1 rounded text-[8px] font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition flex items-center gap-0.5"
                    >
                      <Info className="w-2.5 h-2.5" /> Info
                    </button>
                  )}
                </div>
              </div>

              {/* Video Stream Stage Tile (Compact Passport Size Tile) */}
              <div className="relative w-full h-32 sm:h-36 max-h-36 bg-slate-950 overflow-hidden">
                <TalkingFaceAvatar
                  avatarIcon={interviewer.avatarIcon}
                  avatarColor={interviewer.avatarColor}
                  name={interviewer.name}
                  isSpeaking={isSpeakingNow}
                  className="w-full h-full rounded-none"
                  liveVideoRef={isLiveTile ? liveVideoRef : undefined}
                  isLiveStreaming={isLiveTile && isLiveStreaming}
                  ambientReaction={reaction}
                />

                {/* Floating Ambient Reaction Badge on Inactive Tile */}
                {!isSpeakingNow && reaction && (
                  <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-slate-100 text-[8px] font-bold border border-slate-700 shadow-md backdrop-blur-xs animate-in fade-in zoom-in duration-200">
                    <span>
                      {reaction.reactionType === 'taking_notes' && '📝'}
                      {reaction.reactionType === 'skeptical' && '🤔'}
                      {reaction.reactionType === 'nodding' && '👍'}
                      {reaction.reactionType === 'concerned' && '⚠️'}
                      {reaction.reactionType === 'intrigued' && '✨'}
                    </span>
                    <span className="truncate max-w-[75px] sm:max-w-[90px]">{reaction.label}</span>
                  </div>
                )}

                {isTargeted && !isSpeakingNow && (
                  <div className="absolute top-1.5 left-1.5 z-20 bg-indigo-600/90 text-white font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm shadow-md">
                    Target
                  </div>
                )}
              </div>

              {/* Footer Bar inside card: Name & Title */}
              <div className={`p-2 border-t border-slate-800/80 ${isSpeakingNow ? 'bg-indigo-950/40' : 'bg-slate-900/60'}`}>
                <p className="text-[11px] font-extrabold text-white truncate leading-tight flex items-center justify-between">
                  <span className="truncate">{interviewer.name}</span>
                  {isTargeted && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block shrink-0" />}
                </p>
                <p className="text-[9px] text-indigo-400 font-semibold truncate leading-tight mt-0.5">{interviewer.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backstage Rationale Banner */}
      {(lastTurnTakingReason || lastInternalThought) && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 font-bold font-mono text-[10px] uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Turn-Taking
            </span>
            <p className="font-semibold text-slate-300 truncate">
              <strong className="text-white">Deliberation:</strong>{' '}
              {lastTurnTakingReason || 'Next interviewer selected dynamically.'}
            </p>
          </div>
          {lastInternalThought && (
            <span className="text-[11px] text-slate-400 italic bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 max-w-sm truncate shrink-0">
              "{lastInternalThought}"
            </span>
          )}
        </div>
      )}

      <InterviewerPersonaModal
        interviewer={selectedPersona}
        onClose={() => setSelectedPersona(null)}
      />
    </div>
  );
};

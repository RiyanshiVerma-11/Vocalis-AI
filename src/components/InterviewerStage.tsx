import React, { useState } from 'react';
import { Interviewer } from '../types';
import {
  Cpu,
  Layers,
  Briefcase,
  Users,
  HeartPulse,
  Volume2,
  Sparkles,
  MessageSquare,
  Info,
} from 'lucide-react';
import { InterviewerPersonaModal } from './InterviewerPersonaModal';
import { renderAvatarIcon, getAvatarGradientClass } from '../utils/avatarUtils';

interface InterviewerStageProps {
  panel: Interviewer[];
  activeSpeakerId: string | null;
  isAISpeaking: boolean;
  selectedTargetInterviewerId: string | null;
  onSelectTargetInterviewer: (id: string | null) => void;
  lastTurnTakingReason?: string;
  lastInternalThought?: string;
}

export const InterviewerStage: React.FC<InterviewerStageProps> = ({
  panel,
  activeSpeakerId,
  isAISpeaking,
  selectedTargetInterviewerId,
  onSelectTargetInterviewer,
  lastTurnTakingReason,
  lastInternalThought,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<Interviewer | null>(null);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'technical':
        return <Cpu className="w-4 h-4" />;
      case 'product':
        return <Layers className="w-4 h-4" />;
      case 'hiring_manager':
        return <Briefcase className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'behavioural':
        return <HeartPulse className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'technical':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'product':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'hiring_manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'customer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'behavioural':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="interviewer-stage-container" className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-sm relative overflow-hidden">
      {/* Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
            Active Interview Panel ({panel.length} Specialized Roles)
          </h2>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Dynamic Calibration Aligned
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedTargetInterviewerId && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-indigo-600">Directing response to specific interviewer</span>
              <button
                onClick={() => onSelectTargetInterviewer(null)}
                className="text-[10px] font-medium text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interviewer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {panel.map((interviewer) => {
          const isCurrentSpeaker = activeSpeakerId === interviewer.id;
          const isSpeakingNow = isCurrentSpeaker && isAISpeaking;
          const isTargeted = selectedTargetInterviewerId === interviewer.id;

          return (
            <div
              key={interviewer.id}
              id={`panel-card-${interviewer.id}`}
              className={`relative rounded-xl p-2.5 transition-all duration-200 flex flex-col justify-between border ${
                isSpeakingNow
                  ? 'bg-indigo-50/90 border-indigo-500 shadow-md ring-2 ring-indigo-500/20 translate-y-[-1px]'
                  : isTargeted
                  ? 'bg-indigo-50/40 border-indigo-400 ring-1 ring-indigo-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Speaker Status Indicator & Info Button */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${getRoleBadgeStyle(
                    interviewer.role
                  )}`}
                >
                  {getRoleIcon(interviewer.role)}
                  <span>{interviewer.role.replace('_', ' ')}</span>
                </span>

                <div className="flex items-center gap-1">
                  {isSpeakingNow ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded border border-indigo-200 uppercase tracking-wider animate-pulse">
                      <Volume2 className="w-3 h-3" /> Speaking
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPersona(interviewer);
                      }}
                      title="View Persona & Speaking Style"
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar & Info */}
              <div
                onClick={() => onSelectTargetInterviewer(isTargeted ? null : interviewer.id)}
                className="flex items-start gap-2.5 mb-1.5 cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0 ${getAvatarGradientClass(interviewer.avatarColor)} ${
                    isSpeakingNow ? 'ring-2 ring-indigo-500 shadow-indigo-200 animate-pulse' : ''
                  }`}
                >
                  {renderAvatarIcon(interviewer.avatarIcon, "w-4 h-4 text-white")}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{interviewer.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{interviewer.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{interviewer.company}</p>
                </div>
              </div>

              {/* Focus Area */}
              <p
                onClick={() => onSelectTargetInterviewer(isTargeted ? null : interviewer.id)}
                className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 mb-2 cursor-pointer leading-tight"
              >
                <strong className="text-slate-800">Focus:</strong> {interviewer.focusArea}
              </p>

              {/* Traits & Action row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-auto">
                <div className="flex flex-wrap gap-1">
                  {interviewer.personalityTraits.slice(0, 2).map((trait, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPersona(interviewer)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  Personality
                </button>
              </div>

              {/* Speaking Waveform Pulse Overlay */}
              {isSpeakingNow && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 animate-pulse rounded-b-xl" />
              )}
            </div>
          );
        })}
      </div>

      {/* Backstage Rationale & Deliberation Sub-Banner */}
      {(lastTurnTakingReason || lastInternalThought) && (
        <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 font-bold font-mono text-[10px] uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Turn-Taking
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-200 truncate">
                <strong className="text-white">Deliberation:</strong>{' '}
                {lastTurnTakingReason || 'Next interviewer selected dynamically based on candidate response and role specializations.'}
              </p>
            </div>
          </div>
          {lastInternalThought && (
            <span className="text-[11px] text-slate-300 italic bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 max-w-lg truncate shrink-0">
              "{lastInternalThought}"
            </span>
          )}
        </div>
      )}

      {/* Persona Detail Modal */}
      <InterviewerPersonaModal
        interviewer={selectedPersona}
        onClose={() => setSelectedPersona(null)}
      />
    </div>
  );
};


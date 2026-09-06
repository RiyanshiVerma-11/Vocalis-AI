import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Bell,
  FileText,
  ChevronRight,
  BookOpen,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { ArchivedSession } from '../../services/sessionHistoryService';
import { StructuredAssessment } from '../../types';

interface CandidateSessionListProps {
  sessions: ArchivedSession[];
  filteredSessions: ArchivedSession[];
  filter: 'all' | 'high' | 'review';
  onSetFilter: (filter: 'all' | 'high' | 'review') => void;
  notifiedSessions: Set<string>;
  notifyingId: string | null;
  onNotifyRecruiter: (session: ArchivedSession, e: React.MouseEvent) => void;
  onSelectAssessment: (assessment: StructuredAssessment) => void;
  onBackToStudio: () => void;
  scoreToLabel: (score: number) => { label: string; color: string; bg: string; border: string };
}

export const CandidateSessionList: React.FC<CandidateSessionListProps> = ({
  sessions,
  filteredSessions,
  filter,
  onSetFilter,
  notifiedSessions,
  notifyingId,
  onNotifyRecruiter,
  onSelectAssessment,
  onBackToStudio,
  scoreToLabel,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              My Practice Sessions ({filteredSessions.length})
            </h2>
            <p className="text-[10px] text-slate-500">Click any session to view your full feedback report</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'high', 'review'] as const).map((f) => {
            const labels = {
              all: `All (${sessions.length})`,
              high: '70%+ Good',
              review: 'Needs Work',
            };
            const activeStyles = {
              all: 'bg-indigo-600 text-white border-indigo-600',
              high: 'bg-emerald-600 text-white border-emerald-600',
              review: 'bg-amber-500 text-white border-amber-500',
            };
            return (
              <button
                key={f}
                type="button"
                onClick={() => onSetFilter(f)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition cursor-pointer ${
                  filter === f
                    ? activeStyles[f]
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        {filteredSessions.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No sessions match this filter.
          </div>
        )}
        {filteredSessions.map((session, idx) => {
          const sLabel = scoreToLabel(session.overallScore);
          const isNotified = notifiedSessions.has(session.id);
          const isNotifying = notifyingId === session.id;
          return (
            <div
              key={session.id}
              onClick={() => onSelectAssessment(session.fullAssessment)}
              className="group p-2.5 sm:p-3 rounded-lg bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              {/* Left: session info */}
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {/* Score badge */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs font-mono shrink-0 border-2 ${
                    session.overallScore >= 70
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : session.overallScore >= 50
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {session.overallScore}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition truncate">
                      #{sessions.length - idx} · {session.scenarioTitle}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${sLabel.bg} ${sLabel.color} ${sLabel.border}`}
                    >
                      {sLabel.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono bg-slate-200/60 px-1.5 py-0.2 rounded">
                      {session.difficultyLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {session.dateFormatted}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {session.durationMinutes} min
                    </span>
                    {(session.city || session.location) && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {session.city && session.state
                            ? `${session.city}, ${session.state}`
                            : session.city || session.location}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate max-w-xs">{session.targetRole}</p>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                {/* Notify recruiter */}
                <button
                  type="button"
                  onClick={(e) => onNotifyRecruiter(session, e)}
                  disabled={isNotified || isNotifying}
                  title={isNotified ? 'Recruiter notified!' : 'Share this session with the recruiter team'}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
                    isNotified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                      : isNotifying
                      ? 'bg-indigo-50 text-indigo-500 border-indigo-200 animate-pulse cursor-default'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  {isNotified ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Notified
                    </>
                  ) : isNotifying ? (
                    <>
                      <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />{' '}
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell className="w-3 h-3" /> Notify Recruiter
                    </>
                  )}
                </button>

                {/* View feedback */}
                <button
                  type="button"
                  onClick={() => onSelectAssessment(session.fullAssessment)}
                  className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                  title="View your full feedback report"
                >
                  <FileText className="w-3 h-3" />
                  View Feedback
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      {sessions.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-900">{sessions.filter((s) => s.overallScore >= 70).length}</strong> of{' '}
            {sessions.length} sessions scored 70%+
          </p>
          <button
            type="button"
            onClick={onBackToStudio}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Start New Practice Session
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

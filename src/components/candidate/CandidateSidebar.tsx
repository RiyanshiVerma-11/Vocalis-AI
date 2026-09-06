import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  FileText,
  Sliders,
  CheckCircle2,
  Users,
  Radio,
  Zap,
  Layers,
  Clock,
  LogOut,
  TrendingUp,
  Brain,
  Wifi,
  WifiOff,
  Signal,
} from 'lucide-react';
import {
  Interviewer,
  SharedCandidateContext,
  CandidateResume,
  DifficultyLevel,
  UserSession,
} from '../../types';

export interface CandidateSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  candidateResume: CandidateResume;
  activePanel: Interviewer[];
  selectedTargetInterviewerId: string | null;
  onSelectTargetInterviewer: (id: string | null) => void;
  sharedContext: SharedCandidateContext;
  onOpenResumeDrawer: () => void;
  onEndInterview: () => void;
  isProcessing: boolean;
  agoraMode: 'conversational-ai' | 'rtc-transport' | 'offline';
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  silenceTimeoutMs: number;
  onChangeSilenceTimeout: (ms: number) => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onOpenProgressionHub?: () => void;
}

const roleColor: Record<string, { dot: string; badge: string; label: string }> = {
  technical:      { dot: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   label: 'Tech Lead' },
  product:        { dot: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20', label: 'Product' },
  hiring_manager: { dot: 'bg-amber-500',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  label: 'VP Eng' },
  customer:       { dot: 'bg-emerald-500',badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Client' },
  behavioural:    { dot: 'bg-pink-500',   badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',   label: 'Psych' },
};

const getDiffBadge = (level: DifficultyLevel) => {
  switch (level) {
    case 'Foundational':    return { text: 'Foundational', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' };
    case 'Intermediate':    return { text: 'Intermediate', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' };
    case 'Senior':          return { text: 'Senior', cls: 'bg-violet-500/15 text-violet-400 border-violet-500/25' };
    case 'Staff/Principal': return { text: 'Staff', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
  }
};

export const CandidateSidebar: React.FC<CandidateSidebarProps> = ({
  isOpen,
  onToggle,
  candidateResume,
  activePanel,
  selectedTargetInterviewerId,
  onSelectTargetInterviewer,
  sharedContext,
  onOpenResumeDrawer,
  onEndInterview,
  isProcessing,
  agoraMode,
  isFocusMode,
  onToggleFocusMode,
  silenceTimeoutMs,
  onChangeSilenceTimeout,
  currentUser,
  onLogout,
  onOpenProgressionHub,
}) => {
  const userInitials = (
    currentUser?.avatarInitials ||
    candidateResume.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2) ||
    'CA'
  ).toUpperCase();

  const userName = currentUser?.name || candidateResume.fullName || 'Candidate';
  const userEmail = currentUser?.email || candidateResume.headline || '';

  const agoraStatus =
    agoraMode === 'conversational-ai'
      ? { label: 'Live AI Voice', icon: <Wifi className="w-3 h-3" />, cls: 'text-emerald-400' }
      : agoraMode === 'rtc-transport'
      ? { label: 'RTC Active', icon: <Signal className="w-3 h-3" />, cls: 'text-blue-400' }
      : { label: 'Offline Mode', icon: <WifiOff className="w-3 h-3" />, cls: 'text-slate-500' };

  // ── COLLAPSED VIEW ──
  if (!isOpen) {
    return (
      <aside className="hidden md:flex w-[60px] bg-[#0a0e1a] border-r border-slate-800/80 flex-col items-center py-4 gap-3 shrink-0 z-30 sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
        {/* Expand */}
        <button
          type="button"
          onClick={onToggle}
          className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700/60"
          title="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4 text-indigo-400" />
        </button>

        <div className="w-7 h-px bg-slate-800" />

        {/* Avatar pill */}
        <div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg relative cursor-default select-none"
          title={`${userName} · Candidate`}
        >
          {userInitials}
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0e1a] absolute -bottom-0.5 -right-0.5" />
        </div>

        <button
          type="button"
          onClick={onOpenResumeDrawer}
          className="w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 flex items-center justify-center transition cursor-pointer border border-slate-700/50"
          title="Resume & Memory"
        >
          <FileText className="w-4 h-4" />
        </button>

        {onOpenProgressionHub && (
          <button
            type="button"
            onClick={onOpenProgressionHub}
            className="w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 flex items-center justify-center transition cursor-pointer border border-slate-700/50"
            title="My Growth Hub"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer border ${
            isFocusMode
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isFocusMode ? 'Focus Mode Active' : 'Enable Focus Mode'}
        >
          <Zap className="w-4 h-4" />
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-slate-800/30 hover:bg-rose-900/30 text-slate-500 hover:text-rose-400 flex items-center justify-center transition cursor-pointer mt-auto border border-slate-800/60 hover:border-rose-800/40"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </aside>
    );
  }

  // ── EXPANDED VIEW ──
  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onToggle}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 md:hidden"
      />

      <aside className="fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[270px] md:sticky md:top-[57px] md:w-64 md:h-[calc(100vh-57px)] bg-[#0a0e1a] border-r border-slate-800/80 text-slate-200 flex flex-col h-full shrink-0 shadow-2xl overflow-y-auto scrollbar-thin">
        {/* ── HEADER ── */}
        <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center">
              <Layers className="w-3 h-3 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-wider">Candidate Studio</p>
              <p className="text-[9px] text-slate-500">Autonomous Voice Interview</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-500 hover:text-white transition cursor-pointer"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── CANDIDATE PROFILE CARD ── */}
        <div className="p-2 border-b border-slate-800/60 bg-slate-950/30 space-y-1.5">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 text-white font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                {userInitials}
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0e1a] absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] font-bold text-white truncate">{userName}</p>
                <span className="inline-flex items-center text-[8px] font-bold px-1 py-0.5 rounded border uppercase tracking-tight bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shrink-0">
                  Candidate
                </span>
              </div>
              <p className="text-[9px] text-slate-400 truncate">{userEmail}</p>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1 rounded-md hover:bg-rose-900/30 text-slate-500 hover:text-rose-400 transition cursor-pointer shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onOpenResumeDrawer}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-1.5 rounded-md bg-slate-900/60 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800/60 hover:border-indigo-500/30 transition cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>Resume</span>
            </button>
            {onOpenProgressionHub && (
              <button
                type="button"
                onClick={onOpenProgressionHub}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-1.5 rounded-md bg-slate-900/60 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800/60 hover:border-emerald-500/30 transition cursor-pointer"
              >
                <TrendingUp className="w-3 h-3" />
                <span>My Growth</span>
              </button>
            )}
          </div>
        </div>

        {/* ── ACTIVE PANEL ── */}
        <div className="p-2 border-b border-slate-800/60 space-y-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Panel ({activePanel.length})
              </span>
            </div>
            {selectedTargetInterviewerId && (
              <button
                type="button"
                onClick={() => onSelectTargetInterviewer(null)}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-1">
            {activePanel.map((iv) => {
              const isSelected = selectedTargetInterviewerId === iv.id;
              const rc = roleColor[iv.role] ?? roleColor.technical;
              return (
                <button
                  key={iv.id}
                  type="button"
                  onClick={() => onSelectTargetInterviewer(isSelected ? null : iv.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rc.dot}`} />

                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-bold text-white truncate">{iv.name}</p>
                      <span
                        className={`text-[8px] font-bold px-1 py-0.5 rounded border uppercase tracking-tight shrink-0 ${
                          isSelected
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : `${rc.badge}`
                        }`}
                      >
                        {isSelected ? 'Direct' : rc.label}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate leading-none mt-0.5">{iv.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DIFFICULTY INDICATOR ── */}
        {(() => {
          const diff = getDiffBadge(sharedContext.currentDifficulty);
          return (
            <div className="px-2.5 py-1.5 border-b border-slate-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Brain className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Difficulty</span>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tight ${diff?.cls}`}>
                {diff?.text}
              </span>
            </div>
          );
        })()}

        {/* ── VOICE & PAUSE SETTINGS ── */}
        <div className="p-2 border-b border-slate-800/60 space-y-1.5">
          <div className="flex items-center gap-1.5 px-0.5">
            <Sliders className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Voice & Pause</span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-2.5 h-2.5 text-slate-500" />
              Pause
            </span>
            <select
              value={silenceTimeoutMs}
              onChange={(e) => onChangeSilenceTimeout(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-md text-slate-200 px-1.5 py-0.5 outline-none text-[10px] cursor-pointer focus:border-indigo-500/50 transition"
            >
              <option value={-1}>Manual Only</option>
              <option value={10000}>10s (Generous)</option>
              <option value={8000}>8s (Relaxed)</option>
              <option value={5000}>5s (Quick)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`w-full py-1.5 px-2 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isFocusMode
                ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-white border-slate-800/60'
            }`}
          >
            <Zap className="w-3 h-3" />
            {isFocusMode ? 'Focus Mode Active' : 'Telemetry HUD Active'}
          </button>
        </div>

        {/* ── VOICE TRANSPORT STATUS & FINISH CTA ── */}
        <div className="p-2 mt-auto space-y-1.5">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Radio className="w-2.5 h-2.5 text-slate-600" />
                Transport
              </span>
              <span className={`flex items-center gap-1 text-[9px] font-bold ${agoraStatus.cls}`}>
                {agoraStatus.icon}
                {agoraStatus.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  agoraMode !== 'offline' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <p className="text-[9px] text-slate-500 leading-tight truncate">
                {agoraMode !== 'offline'
                  ? 'Agora SD-RTN™ (sub-100ms)'
                  : 'WebSpeech API fallback'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEndInterview}
            disabled={isProcessing}
            className="w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Finish & Evaluate
          </button>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  User,
  FileText,
  Brain,
  Activity,
  Sliders,
  CheckCircle2,
  Users,
  Radio,
  Zap,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { Interviewer, SharedCandidateContext, CandidateResume, DifficultyLevel, UserSession } from '../types';
import { renderAvatarIcon, getAvatarGradientClass, InterviewerAvatar } from '../utils/avatarUtils';

interface StudioSidebarProps {
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

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
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
  const getDifficultyBadge = (level: DifficultyLevel) => {
    switch (level) {
      case 'Foundational':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Senior':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Staff/Principal':
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const userInitials = currentUser?.avatarInitials || candidateResume.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'US';

  if (!isOpen) {
    return (
      <aside className="hidden md:flex w-14 bg-slate-900 border-r border-slate-800 flex-col items-center py-4 gap-4 shrink-0 transition-all duration-300 z-30 sticky top-[61px] h-[calc(100vh-61px)] overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow-sm"
          title="Expand Sidebar"
        >
          <PanelLeft className="w-5 h-5 text-indigo-400" />
        </button>

        <div className="w-8 h-px bg-slate-800" />

        {/* Collapsed Profile Avatar Pill */}
        <div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md relative"
          title={`${currentUser?.name || candidateResume.fullName} (${currentUser?.role || 'Candidate'})`}
        >
          {userInitials}
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
        </div>

        <button
          type="button"
          onClick={onOpenResumeDrawer}
          className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="Candidate Resume & Memory"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
        </button>

        {onOpenProgressionHub && (
          <button
            type="button"
            onClick={onOpenProgressionHub}
            className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Skill Progression & Growth Analytics"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            isFocusMode
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
          }`}
          title={isFocusMode ? 'Focus Mode Active' : 'Enable Focus Mode'}
        >
          <Zap className="w-4 h-4" />
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-10 h-10 rounded-xl bg-slate-800/40 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer mt-auto"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onToggle}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        title="Close sidebar"
      />

      {/* Main Sidebar Container (Mobile Slide-over / Desktop Sticky) */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs md:sticky md:top-[61px] md:w-80 md:h-[calc(100vh-61px)] bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-full shrink-0 transition-all duration-300 shadow-2xl overflow-y-auto">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Studio Control</h3>
              <p className="text-[11px] text-slate-400">Multi-Role Committee Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

      {/* User & Candidate Profile Section */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <User className="w-3 h-3 text-indigo-400" />
            <span>User Profile</span>
          </span>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20"
              title="Sign out and return to landing page"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                {userInitials}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-white truncate">
                {currentUser?.name || candidateResume.fullName || 'Candidate User'}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser?.email || candidateResume.headline || 'Software Engineer'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenResumeDrawer}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Edit Resume & Shared Profile →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Panel Address Direct Selection */}
      <div className="p-4 border-b border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-400" />
            <span>Active Interviewers ({activePanel.length})</span>
          </span>
          {selectedTargetInterviewerId && (
            <button
              type="button"
              onClick={() => onSelectTargetInterviewer(null)}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Clear Direct Address
            </button>
          )}
        </div>

        <div className="space-y-2">
          {activePanel.map((interviewer) => {
            const isSelected = selectedTargetInterviewerId === interviewer.id;
            return (
              <button
                key={interviewer.id}
                type="button"
                onClick={() => onSelectTargetInterviewer(isSelected ? null : interviewer.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <InterviewerAvatar
                    avatarIcon={interviewer.avatarIcon}
                    avatarColor={interviewer.avatarColor}
                    name={interviewer.name}
                    className="w-7 h-7 rounded-lg border border-slate-700/80"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-white">{interviewer.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{interviewer.title}</p>
                  </div>
                </div>
                {isSelected && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500 text-white px-1.5 py-0.5 rounded">
                    Directing
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Controls & Pause Tolerance */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Sliders className="w-3 h-3 text-indigo-400" />
          <span>Speech & Pause Settings</span>
        </span>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Pause Tolerance</span>
            </span>
            <select
              value={silenceTimeoutMs}
              onChange={(e) => onChangeSilenceTimeout(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg text-white px-2 py-1 outline-none text-xs cursor-pointer"
            >
              <option value={-1}>Manual Send (No Cutoff)</option>
              <option value={10000}>10s Generous</option>
              <option value={8000}>8s Relaxed</option>
              <option value={5000}>5s Quick</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              isFocusMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isFocusMode ? 'Focus Mode (Clean HUD)' : 'Telemetry HUD Active'}</span>
          </button>
        </div>
      </div>

      {/* Live System Health & Agora Transport Badge */}
      <div className="p-4 mt-auto space-y-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-400" />
              <span>Voice Transport</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
              agoraMode === 'conversational-ai'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : agoraMode === 'rtc-transport'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {agoraMode}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Agora SD-RTN™ global real-time network with sub-100ms latency.
          </p>
        </div>

        {onOpenProgressionHub && (
          <button
            type="button"
            onClick={onOpenProgressionHub}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Skill Progression Hub</span>
          </button>
        )}

        <button
          type="button"
          onClick={onEndInterview}
          disabled={isProcessing}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Finish & Evaluate</span>
        </button>
      </div>
    </aside>
    </>
  );
};

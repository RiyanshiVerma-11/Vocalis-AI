import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  FileText,
  Users,
  LogOut,
  BarChart3,
  Building2,
  ShieldCheck,
  Award,
  Sliders,
  TrendingUp,
  Briefcase,
  Scale,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../../types';

export interface RecruiterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  activeTab: 'analytics' | 'candidates' | 'requisitions';
  onSelectTab: (tab: 'analytics' | 'candidates' | 'requisitions') => void;
  candidateCount?: number;
  femalePct?: number;
  malePct?: number;
  femaleCount?: number;
  maleCount?: number;
  onOpenResumeDrawer?: () => void;
  onOpenDemographicAudit?: () => void;
  onOpenParityShortlist?: () => void;
}

export const RecruiterSidebar: React.FC<RecruiterSidebarProps> = ({
  isOpen,
  onToggle,
  currentUser,
  onLogout,
  activeTab,
  onSelectTab,
  candidateCount = 24,
  femalePct = 67,
  malePct = 33,
  femaleCount = 16,
  maleCount = 8,
  onOpenResumeDrawer,
  onOpenDemographicAudit,
  onOpenParityShortlist,
}) => {
  const userInitials = (
    currentUser?.avatarInitials ||
    currentUser?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2) ||
    'RC'
  ).toUpperCase();

  const userName = currentUser?.name || 'Recruiter Lead';
  const userEmail = currentUser?.email || 'hiring@vocalis.ai';

  // ── COLLAPSED VIEW ──
  if (!isOpen) {
    return (
      <aside className="hidden md:flex w-[60px] bg-[#0a0e1a] border-r border-slate-800/80 flex-col items-center py-4 gap-3 shrink-0 z-30 sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
        {/* Expand toggle */}
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
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 via-indigo-600 to-violet-700 text-white font-extrabold text-[11px] flex items-center justify-center shadow-lg relative cursor-default select-none"
          title={`${userName} · Recruiter`}
        >
          {userInitials}
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0e1a] absolute -bottom-0.5 -right-0.5" />
        </div>

        <div className="w-7 h-px bg-slate-800" />

        {/* Tab 1: Talent Demographics & Top Performers */}
        <button
          type="button"
          onClick={() => onSelectTab('analytics')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer border ${
            activeTab === 'analytics'
              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/20'
              : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border-slate-700/50'
          }`}
          title="Talent Demographics & Top Performers"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Tab 2: Candidate Pipeline & Reports */}
        <button
          type="button"
          onClick={() => onSelectTab('candidates')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer border relative ${
            activeTab === 'candidates'
              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/20'
              : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border-slate-700/50'
          }`}
          title={`Candidate Pipeline & Reports (${candidateCount})`}
        >
          <Users className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 absolute top-1 right-1" />
        </button>

        {/* Tab 3: Job Openings & Committee Rubrics */}
        <button
          type="button"
          onClick={() => onSelectTab('requisitions')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer border ${
            activeTab === 'requisitions'
              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/20'
              : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border-slate-700/50'
          }`}
          title="Job Openings & Committee Rubrics"
        >
          <Building2 className="w-4 h-4" />
        </button>

        <div className="w-7 h-px bg-slate-800" />

        {onOpenDemographicAudit && (
          <button
            type="button"
            onClick={onOpenDemographicAudit}
            className="w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 flex items-center justify-center transition cursor-pointer border border-indigo-500/30"
            title="Inspect Demographic Parity Audit"
          >
            <Scale className="w-4 h-4" />
          </button>
        )}

        {onOpenParityShortlist && (
          <button
            type="button"
            onClick={onOpenParityShortlist}
            className="w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-pink-400 hover:text-pink-300 flex items-center justify-center transition cursor-pointer border border-pink-500/30"
            title="Shortlist by Gender Ratio"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {onOpenResumeDrawer && (
          <button
            type="button"
            onClick={onOpenResumeDrawer}
            className="w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 flex items-center justify-center transition cursor-pointer border border-slate-700/50"
            title="Inspect Current Candidate Resume"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}

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
            <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-wider">Hiring Committee</p>
              <p className="text-[9px] text-slate-500">Autonomous Evaluation Portal</p>
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

        {/* ── RECRUITER PROFILE CARD ── */}
        <div className="p-2 border-b border-slate-800/60 bg-slate-950/30 space-y-1.5">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 via-indigo-600 to-violet-700 text-white font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                {userInitials}
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0e1a] absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] font-bold text-white truncate">{userName}</p>
                <span className="inline-flex items-center text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tight bg-amber-500/15 text-amber-300 border-amber-500/30 shrink-0">
                  Hiring Team
                </span>
              </div>
              <p className="text-[9px] text-slate-400 truncate">{userEmail}</p>
              {currentUser?.companyName && (
                <div className="flex items-center gap-1 text-[9px] text-indigo-300 font-medium truncate pt-0.5">
                  <Building2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{currentUser.companyName}</span>
                  {currentUser.companySize && (
                    <span className="text-[8px] text-slate-500">({currentUser.companySize.split(' ')[0]})</span>
                  )}
                </div>
              )}
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
        </div>

        {/* ── HIRING COMMITTEE TABS NAVIGATION (NO EMOJIS, CLEAN ICONS) ── */}
        <div className="p-2 border-b border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              Committee Navigation
            </span>
            <span className="text-[8px] font-mono text-indigo-400 font-bold">3 Workspaces</span>
          </div>

          <div className="space-y-1">
            {/* Tab 1: Talent Demographics & Top Performers */}
            <button
              type="button"
              onClick={() => onSelectTab('analytics')}
              className={`w-full text-left px-2.5 py-2 rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-xs'
                  : 'bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-800/60 hover:border-slate-700'
              }`}
            >
              <BarChart3
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-500'
                }`}
              />
              <span className="text-[11px] font-bold truncate">
                Talent Demographics & Top Performers
              </span>
            </button>

            {/* Tab 2: Candidate Pipeline & Reports */}
            <button
              type="button"
              onClick={() => onSelectTab('candidates')}
              className={`w-full text-left px-2.5 py-2 rounded-lg border transition flex items-center justify-between gap-1.5 cursor-pointer ${
                activeTab === 'candidates'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-xs'
                  : 'bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <Users
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'candidates' ? 'text-indigo-400' : 'text-slate-500'
                  }`}
                />
                <span className="text-[11px] font-bold truncate">Candidate Pipeline & Reports</span>
              </div>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                  activeTab === 'candidates'
                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {candidateCount}
              </span>
            </button>

            {/* Tab 3: Job Openings & Committee Rubrics */}
            <button
              type="button"
              onClick={() => onSelectTab('requisitions')}
              className={`w-full text-left px-2.5 py-2 rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'requisitions'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-xs'
                  : 'bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-800/60 hover:border-slate-700'
              }`}
            >
              <Building2
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'requisitions' ? 'text-indigo-400' : 'text-slate-500'
                }`}
              />
              <span className="text-[11px] font-bold truncate">
                Job Openings & Committee Rubrics
              </span>
            </button>
          </div>
        </div>

        {/* ── COHORT TELEMETRY MINI BADGE ── */}
        <div className="p-2.5 border-b border-slate-800/60 space-y-2 bg-slate-950/20">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Cohort Highlights</span>
          </span>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <span className="text-slate-500 text-[9px] block">Evaluated</span>
              <span className="font-mono font-black text-white text-xs">{candidateCount} Dossiers</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <span className="text-slate-500 text-[9px] block">Diversity Ratio</span>
              <span className="font-mono font-bold text-pink-400 text-xs">
                {femalePct}% ♀ · {malePct}% ♂
              </span>
            </div>
          </div>

          {onOpenDemographicAudit && (
            <button
              type="button"
              onClick={onOpenDemographicAudit}
              className="w-full py-1.5 px-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-500/30 transition text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Scale className="w-3 h-3 text-indigo-400" />
              <span>Inspect Demographic Audit</span>
            </button>
          )}

          {onOpenParityShortlist && (
            <button
              type="button"
              onClick={onOpenParityShortlist}
              className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-sky-950/40 hover:from-pink-900/60 hover:to-sky-900/60 text-pink-300 hover:text-white border border-pink-500/30 transition text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Shortlist by Gender Ratio</span>
            </button>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="p-2 mt-auto space-y-1.5">
          {onOpenResumeDrawer && (
            <button
              type="button"
              onClick={onOpenResumeDrawer}
              className="w-full py-2 px-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 hover:border-slate-700 transition cursor-pointer text-xs font-bold flex items-center justify-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspect Resume Drawer</span>
            </button>
          )}

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-center">
            <p className="text-[9px] text-slate-500">
              AI Calibration Bar: <span className="text-emerald-400 font-bold">100% Quote-Backed</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

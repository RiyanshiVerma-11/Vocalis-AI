import React from 'react';
import { Users, TrendingUp, ShieldCheck, Sparkles, Sliders, Building2, Briefcase, Scale, ArrowRight } from 'lucide-react';
import { UserSession } from '../../types';

interface RecruiterHeaderStatsProps {
  totalEvaluated: number;
  femalePct: number;
  malePct: number;
  femaleCount?: number;
  maleCount?: number;
  overallAvgScore: number;
  passRate: number;
  strongHireCount: number;
  onOpenRubricModal: () => void;
  currentUser?: UserSession | null;
  onOpenDemographicAudit?: () => void;
  onOpenParityShortlist?: () => void;
}

export const RecruiterHeaderStats: React.FC<RecruiterHeaderStatsProps> = ({
  totalEvaluated,
  femalePct,
  malePct,
  femaleCount = 16,
  maleCount = 8,
  overallAvgScore,
  passRate,
  strongHireCount,
  onOpenRubricModal,
  currentUser,
  onOpenDemographicAudit,
  onOpenParityShortlist,
}) => {
  return (
    <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4">
      {/* Dynamic Recruiter Organization & Requisition Bar */}
      {(currentUser?.companyName || currentUser?.hiringRole) && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-purple-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-black shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">
                  {currentUser?.companyName || 'Enterprise Org'}
                </span>
                {currentUser?.companySize && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {currentUser.companySize}
                  </span>
                )}
                {currentUser?.industry && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {currentUser.industry}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-indigo-400" />
                  {currentUser?.hiringRole || 'Senior Staff Software Engineer'}
                </span>
                <span className="text-slate-500">•</span>
                <span>Exp: <strong className="text-slate-200">{currentUser?.experienceRequired || '5-8 Yrs'}</strong></span>
                <span className="text-slate-500">•</span>
                <span>Budget: <strong className="text-emerald-400 font-mono">{currentUser?.salaryBudget || 'Competitive'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-left sm:text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                Target Requisition Goal
              </span>
              <span className="text-xs font-bold text-pink-400 font-mono">
                {currentUser?.diversityGoal || 'Balanced Pipeline (~50:50)'}
              </span>
            </div>
            {onOpenParityShortlist && (
              <button
                type="button"
                onClick={onOpenParityShortlist}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Curate top performers matching target gender ratio"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Shortlist by Gender Ratio</span>
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Hiring Committee Workspace</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Pan-India Tech Talent Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Autonomous Committee Evaluation Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Multi-perspective synthetic voice interviews scored against objective calibration rubrics.
            Every score backed by direct candidate audio quotes, concrete metric audits, and Bar Raiser probes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenRubricModal}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition cursor-pointer flex items-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Calibration Specs & Rubrics</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Evaluated</span>
          </span>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalEvaluated}</p>
          <p className="text-[10px] text-slate-400">Pan-India Tech Hubs</p>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>Gender Representation</span>
            </span>
            {onOpenDemographicAudit && (
              <button
                type="button"
                onClick={onOpenDemographicAudit}
                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-0.5 cursor-pointer underline underline-offset-2"
                title="Inspect formula & transparency audit"
              >
                <Scale className="w-3 h-3" />
                <span>Audit</span>
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-pink-400 font-mono">{femalePct}%</span>
            <span className="text-xs text-slate-400 font-bold">♀ ({femaleCount})</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm font-bold text-sky-400 font-mono">{malePct}%</span>
            <span className="text-xs text-slate-400 font-bold">♂ ({maleCount})</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <p className="text-[10px] text-slate-400">
              Evaluated: <strong className="text-white font-mono">{totalEvaluated} Total</strong>
            </p>
            {onOpenDemographicAudit && (
              <button
                type="button"
                onClick={onOpenDemographicAudit}
                className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer flex items-center gap-0.5"
              >
                <span>100% Transparent</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cohort Average Score</span>
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {overallAvgScore} <span className="text-xs text-slate-400">/ 100</span>
          </p>
          <p className="text-[10px] text-slate-400">Standardized across 5 competencies</p>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Offer-Ready Bar Rate</span>
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{passRate}%</p>
          <p className="text-[10px] text-slate-400">{strongHireCount} verified Strong / Hire candidates</p>
        </div>
      </div>
    </div>
  );
};

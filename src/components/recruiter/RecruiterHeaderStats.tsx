import React from 'react';
import { Users, TrendingUp, ShieldCheck, Sparkles, Sliders } from 'lucide-react';

interface RecruiterHeaderStatsProps {
  totalEvaluated: number;
  femalePct: number;
  malePct: number;
  overallAvgScore: number;
  passRate: number;
  strongHireCount: number;
  onOpenRubricModal: () => void;
}

export const RecruiterHeaderStats: React.FC<RecruiterHeaderStatsProps> = ({
  totalEvaluated,
  femalePct,
  malePct,
  overallAvgScore,
  passRate,
  strongHireCount,
  onOpenRubricModal,
}) => {
  return (
    <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4">
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

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Gender Representation</span>
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-pink-400 font-mono">{femalePct}%</span>
            <span className="text-xs text-slate-400 font-bold">Female</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm font-bold text-sky-400 font-mono">{malePct}%</span>
            <span className="text-xs text-slate-400 font-bold">Male</span>
          </div>
          <p className="text-[10px] text-slate-400">High Diversity & Inclusion Balance</p>
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

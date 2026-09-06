import React from 'react';
import {
  Sparkles,
  MapPin,
  Download,
  Zap,
  ArrowRight,
  BookOpen,
  Trophy,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { AggregatedGrowthMetrics } from '../../services/sessionHistoryService';

interface CandidateHeroBannerProps {
  candidateName: string;
  targetRole: string;
  candidateLocation: string;
  sessionCount: number;
  metrics: AggregatedGrowthMetrics;
  scoreLabel: { label: string; color: string; bg: string; border: string };
  onExport: () => void;
  onBackToStudio: () => void;
}

export const CandidateHeroBanner: React.FC<CandidateHeroBannerProps> = ({
  candidateName,
  targetRole,
  candidateLocation,
  sessionCount,
  metrics,
  scoreLabel,
  onExport,
  onBackToStudio,
}) => {
  const firstName = candidateName.split(' ')[0] || candidateName;
  const latestScore = metrics.latestSessionScore;

  return (
    <div
      className="relative rounded-xl overflow-hidden p-4 sm:p-5"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    >
      {/* Glow blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> My Growth Dashboard
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {sessionCount} practice session{sessionCount !== 1 ? 's' : ''} tracked
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-400 text-xs max-w-lg leading-relaxed">
            Here's your personal interview coaching report. See what's working, what to practice next, and how far you've come.
          </p>
          <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-medium flex-wrap">
            <span>
              Practicing for: <span className="text-indigo-400 font-bold">{targetRole}</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span>{candidateLocation}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExport}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 flex items-center gap-1.5 transition cursor-pointer backdrop-blur-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Progress
          </button>
          <button
            type="button"
            onClick={onBackToStudio}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Practice Now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3.5 border-t border-white/10">
        {[
          {
            label: 'Sessions Done',
            value: `${metrics.totalSessions}`,
            sub: 'practice loops',
            icon: <BookOpen className="w-3.5 h-3.5 text-indigo-400" />,
          },
          {
            label: 'Latest Score',
            value: `${latestScore}%`,
            sub: scoreLabel.label,
            icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />,
            color: latestScore >= 70 ? 'text-emerald-400' : latestScore >= 50 ? 'text-amber-400' : 'text-rose-400',
          },
          {
            label: 'Average Score',
            value: `${metrics.averageScore}%`,
            sub: 'across all sessions',
            icon: <BarChart3 className="w-3.5 h-3.5 text-blue-400" />,
          },
          {
            label: '3-Month Change',
            value: `${metrics.scoreDelta >= 0 ? '+' : ''}${metrics.scoreDelta}%`,
            sub: `${metrics.firstSessionScore}% → ${metrics.latestSessionScore}%`,
            icon: metrics.scoreDelta >= 0
              ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />,
            color: metrics.scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-lg p-2.5 border border-white/10 space-y-0.5">
            <div className="flex items-center gap-1.5">
              {stat.icon}
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className={`text-lg font-black font-mono ${stat.color || 'text-white'}`}>{stat.value}</div>
            <p className="text-[10px] text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

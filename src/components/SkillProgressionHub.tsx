import React, { useState } from 'react';
import {
  sessionHistoryService,
  ArchivedSession,
  AggregatedGrowthMetrics,
} from '../services/sessionHistoryService';
import { StructuredAssessment } from '../types';
import {
  TrendingUp,
  Award,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  FileText,
  Trash2,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Users,
  Briefcase,
  HeartPulse,
} from 'lucide-react';

interface SkillProgressionHubProps {
  onSelectAssessment: (assessment: StructuredAssessment) => void;
  onBackToStudio: () => void;
  candidateName?: string;
  targetRole?: string;
}

export const SkillProgressionHub: React.FC<SkillProgressionHubProps> = ({
  onSelectAssessment,
  onBackToStudio,
  candidateName = 'Riyanshi Verma',
  targetRole = 'Senior / Staff Software Engineer',
}) => {
  const [sessions, setSessions] = useState<ArchivedSession[]>(() => sessionHistoryService.getStoredSessions());
  const [metrics, setMetrics] = useState<AggregatedGrowthMetrics>(() => sessionHistoryService.getAggregatedGrowthMetrics());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Hire' | 'NoHire'>('all');

  const refreshData = () => {
    const updatedSessions = sessionHistoryService.getStoredSessions();
    setSessions(updatedSessions);
    setMetrics(sessionHistoryService.getAggregatedGrowthMetrics());
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this interview session record from history?')) {
      sessionHistoryService.deleteSession(id);
      refreshData();
    }
  };

  const handleResetData = () => {
    if (confirm('Reset session history to default 3-month demo trajectory?')) {
      sessionHistoryService.resetToDefaultSeed();
      refreshData();
    }
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `VocalisAI_Interview_History_${candidateName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Strong Hire':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Hire':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'Leaning Hire':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Leaning No Hire':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Strong No Hire':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (selectedFilter === 'Hire') return s.hiringRecommendation.includes('Hire') && !s.hiringRecommendation.includes('No');
    if (selectedFilter === 'NoHire') return s.hiringRecommendation.includes('No Hire');
    return true;
  });

  // SVG Line Chart Dimensions
  const chartW = 600;
  const chartH = 140;
  const pad = { top: 20, right: 30, bottom: 25, left: 35 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  const trajectory = metrics.scoreTrajectory;
  const minScore = 40;
  const maxScore = 100;

  const getX = (idx: number) =>
    pad.left + (trajectory.length <= 1 ? innerW / 2 : (idx / (trajectory.length - 1)) * innerW);

  const getY = (val: number) =>
    pad.top + innerH - ((val - minScore) / (maxScore - minScore)) * innerH;

  const polylinePoints = trajectory
    .map((p, idx) => `${getX(idx).toFixed(1)},${getY(p.score).toFixed(1)}`)
    .join(' ');

  const areaPoints = trajectory.length > 0
    ? [
        `${getX(0).toFixed(1)},${(pad.top + innerH).toFixed(1)}`,
        ...trajectory.map((p, idx) => `${getX(idx).toFixed(1)},${getY(p.score).toFixed(1)}`),
        `${getX(trajectory.length - 1).toFixed(1)},${(pad.top + innerH).toFixed(1)}`,
      ].join(' ')
    : '';

  return (
    <div id="skill-progression-hub" className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Longitudinal Growth Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">
                3-Month Candidate Analytics (June – September 2026)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Skill Trajectory & Competency Evolution
            </h1>
            <p className="text-xs text-slate-400">
              Candidate: <strong className="text-slate-200">{candidateName}</strong> • Target: <span className="text-indigo-300">{targetRole}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportAll}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Download full 3-month session history as JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export History JSON</span>
            </button>
            <button
              onClick={handleResetData}
              className="text-xs font-semibold px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Reset to 3-month demo seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onBackToStudio}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Back to Live Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top 4 Key Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mock Sessions</span>
            <div className="text-xl font-black text-white font-mono flex items-center gap-1.5">
              <span>{metrics.totalSessions}</span>
              <span className="text-xs text-slate-500 font-normal">Loops</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3-Month Score Delta</span>
            <div className="text-xl font-black text-emerald-400 font-mono flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{metrics.scoreDelta}%</span>
              <span className="text-xs text-slate-500 font-normal">({metrics.firstSessionScore}% → {metrics.latestSessionScore}%)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Panel Score</span>
            <div className="text-xl font-black text-indigo-300 font-mono">
              {metrics.averageScore}<span className="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Level Readiness</span>
            <div className="text-xs font-bold text-purple-300 flex items-center gap-1 truncate pt-0.5">
              <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{metrics.readinessRating.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Score Trend Graph + Competency Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Score Progression Trendline (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Overall Score Progression Curve
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Trajectory: {metrics.firstSessionScore}% → {metrics.latestSessionScore}%
            </span>
          </div>

          {/* SVG Sparkline */}
          <div className="relative w-full overflow-x-auto py-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36">
              <defs>
                <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[50, 70, 90].map((score) => (
                <g key={score}>
                  <line
                    x1={pad.left}
                    y1={getY(score)}
                    x2={chartW - pad.right}
                    y2={getY(score)}
                    stroke="#1e293b"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={pad.left - 6}
                    y={getY(score) + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {score}%
                  </text>
                </g>
              ))}

              {/* Shaded Area */}
              {areaPoints && (
                <polygon points={areaPoints} fill="url(#scoreAreaGrad)" />
              )}

              {/* Progression Polyline */}
              {polylinePoints && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {trajectory.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(p.score);
                const isLatest = idx === trajectory.length - 1;
                return (
                  <g key={p.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isLatest ? 5.5 : 4}
                      fill={isLatest ? '#34d399' : '#6366f1'}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <text
                      x={cx}
                      y={cy - 9}
                      textAnchor="middle"
                      fill={isLatest ? '#34d399' : '#cbd5e1'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {p.score}%
                    </text>
                    <text
                      x={cx}
                      y={chartH - 6}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Baseline (June 26): <strong className="text-slate-300">{metrics.firstSessionScore}%</strong></span>
            <span className="text-emerald-400 font-bold">Latest (Aug 28): {metrics.latestSessionScore}% (+{metrics.scoreDelta}%)</span>
          </div>
        </div>

        {/* 5-Axis Competency Evolution Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
                5-Axis Competency Evolution
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Target: 80-85%</span>
          </div>

          <div className="space-y-3 pt-1">
            {metrics.competencyEvolution.map((comp) => {
              const hasGain = comp.delta > 0;
              return (
                <div key={comp.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-200 truncate pr-2">{comp.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                      <span className="text-slate-500">{comp.firstScore}%</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="font-bold text-white">{comp.latestScore}%</span>
                      <span className={`text-[10px] font-bold ${hasGain ? 'text-emerald-400' : 'text-slate-400'}`}>
                        ({hasGain ? `+${comp.delta}` : comp.delta}%)
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar (Baseline vs Current) */}
                  <div className="w-full bg-slate-800 rounded-full h-2 relative overflow-hidden">
                    {/* Benchmark marker */}
                    <div
                      style={{ left: `${comp.benchmarkTarget}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                      title={`Target Benchmark: ${comp.benchmarkTarget}%`}
                    />
                    {/* Active Bar */}
                    <div
                      style={{ width: `${comp.latestScore}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        comp.latestScore >= comp.benchmarkTarget
                          ? 'bg-emerald-500'
                          : comp.latestScore >= 70
                          ? 'bg-indigo-500'
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-amber-400 inline-block" /> Benchmark Bar (Staff Level)
            </span>
            <span className="text-emerald-400 font-bold">All 5 Competencies Met</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recurring Weaknesses & Strengths Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recurring Weakness & Habit Detector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <div>
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Recurring Blindspots & Feedback Patterns
              </h2>
              <p className="text-[10px] text-slate-400">Aggregated across all {metrics.totalSessions} past interview transcripts</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {metrics.recurringWeaknesses.map((w, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">{w.topic}</span>
                    <p className="text-[10px] text-slate-400">Flagged in {w.count} out of {metrics.totalSessions} sessions ({w.percentage}%)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                  {w.count >= 3 ? 'High Priority' : 'Focus Area'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Established Strengths & Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Demonstrated Engineering Strengths
              </h2>
              <p className="text-[10px] text-slate-400">Consistently verified by AI panel evaluation committee</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {metrics.recurringStrengths.map((s, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">{s.topic}</span>
                    <p className="text-[10px] text-slate-400">Validated in {s.count} sessions ({s.percentage}%)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Verified Anchor
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Session Archive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Archived Interview Session Reports ({filteredSessions.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('Hire')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                selectedFilter === 'Hire'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Hires Only
            </button>
            <button
              onClick={() => setSelectedFilter('NoHire')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                selectedFilter === 'NoHire'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Needs Work
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredSessions.map((session, idx) => (
            <div
              key={session.id}
              onClick={() => onSelectAssessment(session.fullAssessment)}
              className="p-3 sm:p-4 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                    #{sessions.length - idx} • {session.scenarioTitle}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getRecommendationBadge(
                      session.hiringRecommendation
                    )}`}
                  >
                    {session.hiringRecommendation}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
                    {session.difficultyLevel} Tier
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>📅 {session.dateFormatted}</span>
                  <span>⏱️ {session.durationMinutes} mins</span>
                  <span>🎯 {session.targetRole}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-lg font-black text-white font-mono">
                    {session.overallScore}
                    <span className="text-xs text-slate-500 font-normal"> / 100</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">Click to inspect</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectAssessment(session.fullAssessment)}
                    className="p-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
                    title="View Full Quote-Backed Scorecard"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  Bell,
  Star,
  User,
} from 'lucide-react';
import { CandidateDashboard } from './CandidateDashboard';

// Recruiter notifications stored in localStorage
const NOTIF_KEY = 'vocalis_recruiter_notifications';
const getNotifications = (): Array<{ id: string; candidateName: string; sessionTitle: string; score: number; date: string; read: boolean }> => {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
};
const addNotification = (session: ArchivedSession, candidateName: string) => {
  const existing = getNotifications();
  const notif = {
    id: `notif-${session.id}-${Date.now()}`,
    candidateName,
    sessionTitle: session.scenarioTitle,
    score: session.overallScore,
    date: session.dateFormatted,
    read: false,
  };
  localStorage.setItem(NOTIF_KEY, JSON.stringify([notif, ...existing].slice(0, 50)));
};

interface SkillProgressionHubProps {
  onSelectAssessment: (assessment: StructuredAssessment) => void;
  onBackToStudio: () => void;
  candidateName?: string;
  targetRole?: string;
  candidateLocation?: string;
  /** 'candidate' shows the coaching dashboard; 'recruiter' shows the hiring analytics view */
  viewerRole?: 'candidate' | 'recruiter';
}

export const SkillProgressionHub: React.FC<SkillProgressionHubProps> = ({
  onSelectAssessment,
  onBackToStudio,
  candidateName = 'Jordan Reed',
  targetRole = 'Senior / Staff Software Engineer',
  candidateLocation,
  viewerRole = 'candidate',
}) => {
  // All hooks must be at top level (React rules)
  const [sessions, setSessions] = useState<ArchivedSession[]>(() => sessionHistoryService.getStoredSessions());
  const [metrics, setMetrics] = useState<AggregatedGrowthMetrics>(() => sessionHistoryService.getAggregatedGrowthMetrics());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Hire' | 'NoHire'>('all');
  const [recruiterNotifs, setRecruiterNotifs] = useState(() => getNotifications());

  // ── Candidate view: delegate entirely to CandidateDashboard ──
  if (viewerRole === 'candidate') {
    return (
      <CandidateDashboard
        onSelectAssessment={onSelectAssessment}
        onBackToStudio={onBackToStudio}
        candidateName={candidateName}
        targetRole={targetRole}
        candidateLocation={candidateLocation}
        onNotifyRecruiter={(session) => {
          addNotification(session, candidateName);
          setRecruiterNotifs(getNotifications());
        }}
      />
    );
  }

  // ── Recruiter view continues below ──


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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Hire':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Leaning Hire':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Leaning No Hire':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Strong No Hire':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
    pad.top + innerH - ((Math.max(minScore, Math.min(maxScore, val)) - minScore) / (maxScore - minScore)) * innerH;

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
    <div id="skill-progression-hub" className="space-y-4 font-sans text-slate-900 animate-in fade-in duration-200">

      {/* ── RECRUITER ROLE BADGE + NOTIFICATIONS INBOX ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl px-5 py-3 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
            <Star className="w-3 h-3" /> Recruiter Analytics View
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Viewing: <strong className="text-white">{candidateName}</strong>
          </span>
        </div>
        {recruiterNotifs.length > 0 && (
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400">
              {recruiterNotifs.length} candidate session{recruiterNotifs.length !== 1 ? 's' : ''} shared with you
            </span>
          </div>
        )}
      </div>

      {/* ── CANDIDATE NOTIFICATIONS INBOX ── */}
      {recruiterNotifs.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Candidate Notifications</h2>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              {recruiterNotifs.length} new
            </span>
          </div>
          <div className="space-y-2">
            {recruiterNotifs.slice(0, 5).map((notif) => (
              <div key={notif.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{notif.candidateName} shared a session</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-xs">{notif.sessionTitle}</p>
                    <p className="text-[10px] text-slate-400">{notif.date}</p>
                  </div>
                </div>
                <div className={`text-right shrink-0`}>
                  <div className={`text-lg font-black font-mono ${
                    notif.score >= 70 ? 'text-emerald-700' : notif.score >= 50 ? 'text-amber-700' : 'text-rose-700'
                  }`}>{notif.score}<span className="text-xs font-normal text-slate-400">/100</span></div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    notif.score >= 70 ? 'bg-emerald-100 text-emerald-700' : notif.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {notif.score >= 70 ? 'Good Candidate' : notif.score >= 50 ? 'Developing' : 'Needs Coaching'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOP HEADER CARD (LIGHT THEME) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />


        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Longitudinal Growth Hub
              </span>
              <span className="text-xs text-slate-500 font-mono">
                3-Month Candidate Analytics (June – September 2026)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Skill Trajectory & Competency Evolution
            </h1>
            <p className="text-xs text-slate-500">
              Candidate: <strong className="text-slate-900">{candidateName}</strong> • Target:{' '}
              <span className="text-indigo-600 font-bold">{targetRole}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportAll}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Download full 3-month session history as JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export History JSON</span>
            </button>
            <button
              onClick={handleResetData}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs"
              title="Reset to 3-month demo seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onBackToStudio}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Back to Live Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top 4 Key Metric Badges (Light Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Mock Sessions</span>
            <div className="text-xl font-black text-slate-900 font-mono flex items-center gap-1.5">
              <span>{metrics.totalSessions}</span>
              <span className="text-xs text-slate-400 font-normal">Loops</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3-Month Score Delta</span>
            <div className="text-xl font-black text-emerald-600 font-mono flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>{metrics.scoreDelta >= 0 ? `+${metrics.scoreDelta}%` : `${metrics.scoreDelta}%`}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({metrics.firstSessionScore}% → {metrics.latestSessionScore}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Panel Score</span>
            <div className="text-xl font-black text-indigo-600 font-mono">
              {metrics.averageScore}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Level Readiness</span>
            <div className="text-xs font-bold text-purple-700 flex items-center gap-1 truncate pt-0.5">
              <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{metrics.readinessRating.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: SCORE TREND GRAPH + COMPETENCY EVOLUTION (LIGHT THEME) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Score Progression Trendline (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Overall Score Progression Curve
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              Trajectory: {metrics.firstSessionScore}% → {metrics.latestSessionScore}%
            </span>
          </div>

          {/* SVG Sparkline (Light Theme) */}
          <div className="relative w-full overflow-x-auto py-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36">
              <defs>
                <linearGradient id="scoreAreaGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
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
                    stroke="#e2e8f0"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={pad.left - 6}
                    y={getY(score) + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {score}%
                  </text>
                </g>
              ))}

              {/* Shaded Area */}
              {areaPoints && (
                <polygon points={areaPoints} fill="url(#scoreAreaGradLight)" />
              )}

              {/* Progression Polyline */}
              {polylinePoints && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#4f46e5"
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
                      fill={isLatest ? '#10b981' : '#4f46e5'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={cx}
                      y={cy - 8}
                      textAnchor="middle"
                      fill={isLatest ? '#059669' : '#1e293b'}
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

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>
              Baseline (June 26): <strong className="text-slate-800">{metrics.firstSessionScore}%</strong>
            </span>
            <span className="text-emerald-600 font-bold">
              Latest: {metrics.latestSessionScore}% ({metrics.scoreDelta >= 0 ? `+${metrics.scoreDelta}%` : `${metrics.scoreDelta}%`})
            </span>
          </div>
        </div>

        {/* 5-Axis Competency Evolution Matrix (5 cols) (Light Theme) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                5-Axis Competency Evolution
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Target: 80-85%</span>
          </div>

          <div className="space-y-3 pt-1">
            {metrics.competencyEvolution.map((comp) => {
              const hasGain = comp.delta > 0;
              return (
                <div key={comp.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800 truncate pr-2">{comp.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                      <span className="text-slate-400">{comp.firstScore}%</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-black text-slate-900">{comp.latestScore}%</span>
                      <span className={`text-[10px] font-bold ${hasGain ? 'text-emerald-600' : 'text-slate-400'}`}>
                        ({hasGain ? `+${comp.delta}` : comp.delta}%)
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar (Baseline vs Current) */}
                  <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden border border-slate-200/60">
                    {/* Benchmark marker */}
                    <div
                      style={{ left: `${comp.benchmarkTarget}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                      title={`Target Benchmark: ${comp.benchmarkTarget}%`}
                    />
                    {/* Active Bar */}
                    <div
                      style={{ width: `${comp.latestScore}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        comp.latestScore >= comp.benchmarkTarget
                          ? 'bg-emerald-500'
                          : comp.latestScore >= 70
                          ? 'bg-indigo-600'
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold">
              <span className="w-2 h-0.5 bg-amber-500 inline-block" /> Benchmark Bar (Staff Level)
            </span>
            <span className="text-emerald-600 font-bold">5-Axis Evolution Calibrated</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: RECURRING WEAKNESSES & STRENGTHS (LIGHT THEME) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recurring Weakness & Habit Detector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Recurring Blindspots & Feedback Patterns
              </h2>
              <p className="text-[10px] text-slate-500">Aggregated across all {metrics.totalSessions} past interview transcripts</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 -mx-1">
            {metrics.recurringWeaknesses.map((w, idx) => (
              <div
                key={idx}
                className="py-2.5 px-2 rounded-lg hover:bg-amber-50/40 transition flex items-center justify-between gap-3 text-xs group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-amber-100/70 border border-amber-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 group-hover:text-amber-950 transition truncate block">{w.topic}</span>
                    <p className="text-[10px] text-slate-500">Flagged in {w.count} out of {metrics.totalSessions} sessions ({w.percentage}%)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  {w.count >= 3 ? 'High Priority' : 'Focus Area'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Established Strengths & Assets */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Demonstrated Engineering Strengths
              </h2>
              <p className="text-[10px] text-slate-500">Consistently verified by AI panel evaluation committee</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 -mx-1">
            {metrics.recurringStrengths.map((s, idx) => (
              <div
                key={idx}
                className="py-2.5 px-2 rounded-lg hover:bg-emerald-50/40 transition flex items-center justify-between gap-3 text-xs group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 group-hover:text-emerald-950 transition truncate block">{s.topic}</span>
                    <p className="text-[10px] text-slate-500">Validated in {s.count} sessions ({s.percentage}%)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  Verified Anchor
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HISTORICAL SESSION ARCHIVE TABLE (LIGHT THEME) ───────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Archived Interview Session Reports ({filteredSessions.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('Hire')}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition cursor-pointer ${
                selectedFilter === 'Hire'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              Hires Only
            </button>
            <button
              onClick={() => setSelectedFilter('NoHire')}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition cursor-pointer ${
                selectedFilter === 'NoHire'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
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
              className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs hover:shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    #{sessions.length - idx} • {session.scenarioTitle}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono uppercase tracking-wider ${getRecommendationBadge(
                      session.hiringRecommendation
                    )}`}
                  >
                    {session.hiringRecommendation}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono bg-slate-200/60 px-2 py-0.5 rounded-md font-semibold">
                    {session.difficultyLevel} Tier
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                  <span>📅 {session.dateFormatted}</span>
                  <span>⏱️ {session.durationMinutes} mins</span>
                  <span>🎯 {session.targetRole}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {session.overallScore}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold">Click to inspect</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectAssessment(session.fullAssessment)}
                    className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-2xs"
                    title="View Full Quote-Backed Scorecard"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer shadow-2xs"
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

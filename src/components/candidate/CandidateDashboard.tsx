import React, { useState } from 'react';
import {
  sessionHistoryService,
  ArchivedSession,
  AggregatedGrowthMetrics,
} from '../../services/sessionHistoryService';
import { StructuredAssessment } from '../../types';
import { CandidateHeroBanner } from './CandidateHeroBanner';
import { CandidateReadinessCard } from './CandidateReadinessCard';
import { CandidateScoreTrajectoryChart } from './CandidateScoreTrajectoryChart';
import {
  CandidateSkillRadarGrid,
  CandidateFocusAndStrengths,
} from './CandidateSkillRadarGrid';
import { CandidateSessionList } from './CandidateSessionList';

export interface CandidateDashboardProps {
  onSelectAssessment: (assessment: StructuredAssessment) => void;
  onBackToStudio: () => void;
  candidateName?: string;
  targetRole?: string;
  candidateLocation?: string;
  onNotifyRecruiter?: (session: ArchivedSession) => void;
}

// Score → Friendly label
export const scoreToLabel = (
  score: number
): { label: string; color: string; bg: string; border: string } => {
  if (score >= 85)
    return { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 70)
    return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
  if (score >= 55)
    return { label: 'Developing', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 40)
    return { label: 'Needs Work', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { label: 'Keep Practicing', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
};

export const readinessToStep = (level: string): number => {
  const m: Record<string, number> = {
    Beginner: 0,
    Foundational: 0,
    Developing: 1,
    Intermediate: 2,
    Senior: 3,
    'Staff/Principal': 4,
    Expert: 4,
  };
  return m[level] ?? 2;
};

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  onSelectAssessment,
  onBackToStudio,
  candidateName = 'You',
  targetRole = 'Software Engineer',
  candidateLocation,
  onNotifyRecruiter,
}) => {
  const [sessions] = useState<ArchivedSession[]>(() => sessionHistoryService.getStoredSessions());
  const [metrics] = useState<AggregatedGrowthMetrics>(() =>
    sessionHistoryService.getAggregatedGrowthMetrics()
  );
  const [filter, setFilter] = useState<'all' | 'high' | 'review'>('all');
  const [notifiedSessions, setNotifiedSessions] = useState<Set<string>>(new Set());
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const candidateLoc =
    candidateLocation ||
    (sessions[0]?.city && sessions[0]?.state
      ? `${sessions[0].city}, ${sessions[0].state}`
      : sessions[0]?.location || 'Bengaluru, Karnataka');
  const latestScore = metrics.latestSessionScore;
  const scoreLabel = scoreToLabel(latestScore);
  const readinessStep = readinessToStep(metrics.readinessRating.level);

  // Export JSON
  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `VocalisAI_My_Progress_${candidateName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Notify recruiter for a session
  const handleNotifyRecruiter = async (session: ArchivedSession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notifiedSessions.has(session.id)) return;
    setNotifyingId(session.id);
    await new Promise((r) => setTimeout(r, 1200)); // simulate API call
    setNotifiedSessions((prev) => new Set([...prev, session.id]));
    setNotifyingId(null);
    onNotifyRecruiter?.(session);
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (filter === 'high') return s.overallScore >= 70;
    if (filter === 'review') return s.overallScore < 60;
    return true;
  });

  return (
    <div className="space-y-3.5 font-sans animate-in fade-in duration-200" id="candidate-dashboard">
      {/* ── HERO BANNER ── */}
      <CandidateHeroBanner
        candidateName={candidateName}
        targetRole={targetRole}
        candidateLocation={candidateLoc}
        sessionCount={sessions.length}
        metrics={metrics}
        scoreLabel={scoreLabel}
        onExport={handleExport}
        onBackToStudio={onBackToStudio}
      />

      {/* ── READINESS JOURNEY ── */}
      <CandidateReadinessCard
        level={metrics.readinessRating.level}
        readinessStep={readinessStep}
      />

      {/* ── SCORE TREND + SKILL BREAKDOWN ROW (PERFECTLY BALANCED HEIGHTS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <CandidateScoreTrajectoryChart
            trajectory={metrics.scoreTrajectory}
            scoreDelta={metrics.scoreDelta}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <CandidateSkillRadarGrid metrics={metrics} />
        </div>
      </div>

      {/* ── FOCUS AREAS & STRENGTHS ROW (NO SEPARATE CARDS, ZERO WASTED SPACE) ── */}
      <CandidateFocusAndStrengths metrics={metrics} />

      {/* ── MY PRACTICE SESSIONS ── */}
      <CandidateSessionList
        sessions={sessions}
        filteredSessions={filteredSessions}
        filter={filter}
        onSetFilter={setFilter}
        notifiedSessions={notifiedSessions}
        notifyingId={notifyingId}
        onNotifyRecruiter={handleNotifyRecruiter}
        onSelectAssessment={onSelectAssessment}
        onBackToStudio={onBackToStudio}
        scoreToLabel={scoreToLabel}
      />
    </div>
  );
};

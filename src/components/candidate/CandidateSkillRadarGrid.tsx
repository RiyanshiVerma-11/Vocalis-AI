import React from 'react';
import {
  Brain,
  BarChart3,
  MessageSquare,
  Users,
  Zap,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Star,
  Sparkles,
} from 'lucide-react';
import { AggregatedGrowthMetrics } from '../../services/sessionHistoryService';

interface CandidateSkillRadarGridProps {
  metrics: AggregatedGrowthMetrics;
}

// Skill axis labels — candidate-friendly
const SKILL_LABELS: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  technicalArchitecture: {
    label: 'Technical Depth',
    icon: <Brain className="w-3.5 h-3.5" />,
    desc: 'How well you explain systems, architecture, and technical decisions',
  },
  businessAndCustomerImpact: {
    label: 'Business Context',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    desc: 'Connecting your work to real-world outcomes, metrics, and ROI',
  },
  communicationAndClarity: {
    label: 'Communication',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    desc: 'How clearly and concisely you structure your answers',
  },
  leadershipAndOwnership: {
    label: 'Leadership',
    icon: <Users className="w-3.5 h-3.5" />,
    desc: 'Ownership, accountability, and driving team outcomes',
  },
  problemSolvingAndAgility: {
    label: 'Problem Solving',
    icon: <Zap className="w-3.5 h-3.5" />,
    desc: 'Navigating trade-offs, pivoting under pressure, structured thinking',
  },
};

// Map internal weakness topics → candidate-friendly coaching tips
const mapWeaknessToCoachingTip = (topic: string): string => {
  const m: Record<string, string> = {
    'Missing Business ROI & Conversion Justification':
      'When answering, tie your work to a business result — e.g., "this reduced churn by 12%" or "saved 3 hrs/week per engineer".',
    'Distributed Failure Modes & Network Partition Recovery':
      'Practice explaining how your system handles failures — cascading outages, partition tolerance, and graceful degradation strategies.',
    'Superficial Jargon vs Exact Lock Contention Mechanics':
      'Replace buzzwords with precise explanations — instead of "we used Redis for performance", say exactly why and by how much it improved latency.',
    'Enterprise SLA Contractual Downtime Negotiation':
      'Be ready to discuss uptime guarantees (99.9% vs 99.99%), how SLAs are negotiated, and what the contractual penalties are.',
  };
  return m[topic] || `Work on: ${topic}`;
};

export const CandidateSkillRadarGrid: React.FC<CandidateSkillRadarGridProps> = ({ metrics }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between h-full space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">My Skill Areas</h2>
          <p className="text-[10px] text-slate-500">How you score in each interview dimension</p>
        </div>
        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Target: 75%+
        </span>
      </div>

      <div className="space-y-2.5 my-auto py-1">
        {metrics.competencyEvolution.map((comp) => {
          const meta = SKILL_LABELS[comp.key] ?? { label: comp.label, icon: null, desc: '' };
          const score = comp.latestScore;
          const color = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-indigo-500' : 'bg-rose-400';
          const textColor = score >= 70 ? 'text-emerald-700' : score >= 50 ? 'text-indigo-700' : 'text-rose-700';
          return (
            <div key={comp.key} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`${textColor}`}>{meta.icon}</span>
                  <span className="font-bold text-slate-800">{meta.label}</span>
                </div>
                <span className={`font-black font-mono text-xs ${textColor}`}>{score}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60 relative">
                {/* Goal marker at 75% */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: '75%' }}
                  title="Goal: 75%"
                />
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 bg-amber-400 inline-block rounded-full" /> Goal Target (75%)
        </span>
        <span className="flex items-center gap-1 font-medium text-emerald-600">
          <span className="w-2 h-0.5 bg-emerald-500 inline-block rounded-full" /> Strong Signal ≥70%
        </span>
      </div>
    </div>
  );
};

export const CandidateFocusAndStrengths: React.FC<CandidateSkillRadarGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
      {/* What to Practice Next */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">What to Practice Next</h2>
                <p className="text-[10px] text-slate-500">Recurring blindspots spotted across {metrics.totalSessions} sessions</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {metrics.recurringWeaknesses.length} focus areas
            </span>
          </div>

          <div className="divide-y divide-slate-100 -mx-1 mt-1">
            {metrics.recurringWeaknesses.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                No recurring gaps spotted yet. Keep practicing!
              </div>
            ) : (
              metrics.recurringWeaknesses.map((w, i) => (
                <div
                  key={i}
                  className="py-2.5 px-2 rounded-lg hover:bg-amber-50/40 transition flex items-start gap-2.5 group"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-100/70 border border-amber-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-amber-950 transition">
                        {w.topic}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-slate-500">
                          {w.count}/{metrics.totalSessions} sessions ({w.percentage}%)
                        </span>
                        <span
                          className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            i === 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-100/80 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {i === 0 ? 'Priority' : 'Focus'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      <span className="font-semibold text-amber-800">Coaching Tip:</span>{' '}
                      {mapWeaknessToCoachingTip(w.topic)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Prioritized by recurrence frequency across mock loops</span>
          <span className="font-medium text-amber-700">Target: zero repeat blindspots</span>
        </div>
      </div>

      {/* Your Strengths */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">Your Strengths ⭐</h2>
                <p className="text-[10px] text-slate-500">Consistently confirmed by AI panel evaluation committee</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {metrics.recurringStrengths.length} verified
            </span>
          </div>

          <div className="divide-y divide-slate-100 -mx-1 mt-1">
            {metrics.recurringStrengths.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Sparkles className="w-6 h-6 mx-auto mb-1 text-indigo-400" />
                Complete more sessions to discover your strengths!
              </div>
            ) : (
              metrics.recurringStrengths.map((s, i) => (
                <div
                  key={i}
                  className="py-2.5 px-2 rounded-lg hover:bg-emerald-50/40 transition flex items-start gap-2.5 group"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 transition">
                        {s.topic}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-slate-500">
                          {s.count} sessions ({s.percentage}%)
                        </span>
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                          Anchor
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Strong positive signal demonstrated across multiple panel question rounds.
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Validated by structured rubric scoring</span>
          <span className="font-medium text-emerald-700">Maintain as your interview anchors</span>
        </div>
      </div>
    </div>
  );
};

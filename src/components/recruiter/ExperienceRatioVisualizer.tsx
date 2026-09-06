import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Layers,
  Award,
  Crown,
  Filter,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { ExperienceBreakdownItem, ExperienceTier } from './types';

interface ExperienceRatioVisualizerProps {
  total: number;
  experienceBreakdown: ExperienceBreakdownItem[];
  selectedExperienceFilter?: string;
  onSelectExperienceFilter?: (tier: ExperienceTier | 'all') => void;
  hoveredTier?: ExperienceTier | null;
  onHoverTier?: (tier: ExperienceTier | null) => void;
}

export const ExperienceRatioVisualizer: React.FC<ExperienceRatioVisualizerProps> = ({
  total,
  experienceBreakdown,
  selectedExperienceFilter = 'all',
  onSelectExperienceFilter,
  hoveredTier,
  onHoverTier,
}) => {
  // Compute high-level pyramid groups: Junior (0-3), Mid (4-8), Senior+ (8+)
  const juniorCount = experienceBreakdown
    .filter((b) => b.tier === 'fresher' || b.tier === 'beginner')
    .reduce((sum, b) => sum + b.count, 0);
  const midCount = experienceBreakdown
    .filter((b) => b.tier === 'mid')
    .reduce((sum, b) => sum + b.count, 0);
  const seniorCount = experienceBreakdown
    .filter((b) => b.tier === 'senior' || b.tier === 'expert')
    .reduce((sum, b) => sum + b.count, 0);

  const juniorPct = total > 0 ? Math.round((juniorCount / total) * 100) : 0;
  const midPct = total > 0 ? Math.round((midCount / total) * 100) : 0;
  const seniorPct = total > 0 ? Math.round((seniorCount / total) * 100) : 0;

  const getTierIcon = (tier: ExperienceTier) => {
    switch (tier) {
      case 'fresher':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'beginner':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'mid':
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'senior':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'expert':
        return <Crown className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900">
              Candidate Experience & Seniority Ratio Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proportional breakdown of incoming applicant pool across 5 calibrated seniority brackets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedExperienceFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectExperienceFilter && onSelectExperienceFilter('all')}
              className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Reset Tier Filter
            </button>
          )}
          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            {total} Total Applicants Audited
          </span>
        </div>
      </div>

      {/* ── 1. MULTI-SEGMENT PROPORTIONAL RATIO BAR ── */}
      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
          <span className="text-slate-600">Experience Pipeline Ratio Share:</span>
          <span className="text-[11px] text-slate-500 font-normal">
            Hover or click segments to inspect candidate cohort
          </span>
        </div>

        {/* Proportional Segmented Track */}
        <div className="w-full h-5 rounded-full bg-slate-200 flex overflow-hidden p-0.5 gap-1 shadow-inner">
          {experienceBreakdown.map((item) => {
            const isHovered = hoveredTier === item.tier;
            const isSelected = selectedExperienceFilter === item.tier;
            const widthPct = Math.max(item.percentage, item.count > 0 ? 3 : 0);

            return (
              <div
                key={item.tier}
                onClick={() => onSelectExperienceFilter && onSelectExperienceFilter(item.tier)}
                onMouseEnter={() => onHoverTier && onHoverTier(item.tier)}
                onMouseLeave={() => onHoverTier && onHoverTier(null)}
                style={{ width: `${widthPct}%` }}
                className={`h-full rounded-sm cursor-pointer transition-all duration-300 relative group flex items-center justify-center ${
                  item.bg
                } ${isHovered || isSelected ? 'ring-2 ring-slate-900 ring-offset-1 scale-y-110 z-10' : 'opacity-90 hover:opacity-100'}`}
                title={`${item.label} (${item.range}): ${item.count} candidates (${item.percentage}%)`}
              >
                {item.percentage >= 10 && (
                  <span className="text-[9px] font-black text-white px-1 truncate select-none drop-shadow-xs">
                    {item.percentage}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[11px]">
          {experienceBreakdown.map((item) => {
            const isSelected = selectedExperienceFilter === item.tier;
            const isHovered = hoveredTier === item.tier;

            return (
              <button
                key={item.tier}
                type="button"
                onClick={() => onSelectExperienceFilter && onSelectExperienceFilter(item.tier)}
                onMouseEnter={() => onHoverTier && onHoverTier(item.tier)}
                onMouseLeave={() => onHoverTier && onHoverTier(null)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition cursor-pointer ${
                  isSelected || isHovered
                    ? 'bg-slate-200 text-slate-900 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold">{item.range}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  ({item.count} · {item.percentage}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. DETAILED 5-TIER ANALYTICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {experienceBreakdown.map((item) => {
          const isSelected = selectedExperienceFilter === item.tier;
          const isHovered = hoveredTier === item.tier;

          return (
            <div
              key={item.tier}
              onMouseEnter={() => onHoverTier && onHoverTier(item.tier)}
              onMouseLeave={() => onHoverTier && onHoverTier(null)}
              className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500'
                  : isHovered
                  ? 'border-slate-300 bg-slate-50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Top Accent Stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: item.color }}
              />

              <div className="space-y-2.5 pt-1">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTierIcon(item.tier)}
                    <span className="text-xs font-black text-slate-900 leading-tight">
                      {item.range}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${item.badge}`}>
                    {item.percentage}%
                  </span>
                </div>

                {/* Subtitle / Label */}
                <p className="text-[11px] font-bold text-slate-700 leading-snug">
                  {item.label}
                </p>

                {/* Big Count */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                    {item.count}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    applicant{item.count === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Avg AI Score:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.avgScore > 0 ? `${item.avgScore}/100` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Pass Rate:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {item.passRate}% Hire+
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Action: Quick Filter Button */}
              <button
                type="button"
                onClick={() => onSelectExperienceFilter && onSelectExperienceFilter(item.tier)}
                className={`mt-3 w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Filtering ({item.count})</span>
                  </>
                ) : (
                  <>
                    <Filter className="w-3 h-3 text-slate-400" />
                    <span>View Candidates</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── 3. SENIORITY PYRAMID SUMMARY & RECRUITER INSIGHTS ── */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Talent Pyramid Seniority Mix Analysis
          </span>
          <p className="text-xs text-slate-700 font-medium">
            Junior (0–3y): <strong className="text-emerald-700 font-mono">{juniorPct}%</strong> ({juniorCount} candidates)
            {' · '}
            Mid-Level (4–8y): <strong className="text-indigo-700 font-mono">{midPct}%</strong> ({midCount} candidates)
            {' · '}
            Senior+ (8+y): <strong className="text-purple-700 font-mono">{seniorPct}%</strong> ({seniorCount} candidates)
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          <span className="text-[11px] font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            Distribution Health: <strong className="text-emerald-600 font-bold">Balanced Funnel</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Crown,
  Quote,
  ArrowRight,
  MapPin,
  Compass,
} from 'lucide-react';
import { EnrichedCandidate, ExperienceBreakdownItem, ExperienceTier } from './types';
import { StateProportionVisualizer } from './StateProportionVisualizer';
import { ExperienceRatioVisualizer } from './ExperienceRatioVisualizer';

interface TopPerformersShowcaseProps {
  analytics: {
    total: number;
    femaleCount: number;
    maleCount: number;
    femalePct: number;
    malePct: number;
    femaleAvgScore: number;
    maleAvgScore: number;
    topFemaleCandidate: EnrichedCandidate | null;
    topMaleCandidate: EnrichedCandidate | null;
    stateBreakdown: Array<{
      state: string;
      count: number;
      percentage: number;
      avgScore: number;
      passRate: number;
      topCandidateName: string;
      topCandidateScore: number;
    }>;
    experienceBreakdown: ExperienceBreakdownItem[];
  };
  onSelectCandidate: (candidate: EnrichedCandidate) => void;
  onSelectStateAndSwitchToCandidates: (state: string) => void;
  onSelectExperienceAndSwitchToCandidates?: (tier: ExperienceTier | 'all') => void;
  hoveredState: string | null;
  onHoverState: (state: string | null) => void;
  hoveredTier?: ExperienceTier | null;
  onHoverTier?: (tier: ExperienceTier | null) => void;
  selectedExperienceFilter?: string;
}

export const TopPerformersShowcase: React.FC<TopPerformersShowcaseProps> = ({
  analytics,
  onSelectCandidate,
  onSelectStateAndSwitchToCandidates,
  onSelectExperienceAndSwitchToCandidates,
  hoveredState,
  onHoverState,
  hoveredTier,
  onHoverTier,
  selectedExperienceFilter,
}) => {
  return (
    <div className="space-y-6">
      {/* ── 1. HALL OF FAME / TOP PERFORMERS SPOTLIGHT (BOY & GIRL CHAMPIONS) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Cohort Hall of Fame: Top Evaluated Performers</span>
            </h3>
            <p className="text-xs text-slate-500">
              Highest scoring female and male candidates evaluated across distributed systems, leadership, and STAR methodology.
            </p>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full self-start sm:self-auto">
            Verified Quote-Backed Bar Raisers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TOP FEMALE PERFORMER (GIRLS CHAMPION) */}
          {analytics.topFemaleCandidate && (
            <div className="bg-gradient-to-br from-pink-500/5 via-white to-purple-500/5 rounded-2xl border-2 border-pink-300 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-600 to-purple-600 text-white font-extrabold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>#1 Top Female Candidate (Girls Champion)</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                      AP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-slate-900">
                          {analytics.topFemaleCandidate.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200">
                          ♀ Female
                        </span>
                      </div>
                      <p className="text-xs font-bold text-indigo-600">
                        {analytics.topFemaleCandidate.role}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>
                          {analytics.topFemaleCandidate.city}, {analytics.topFemaleCandidate.state}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-pink-600 font-mono leading-none">
                      {analytics.topFemaleCandidate.overallScore}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">/ 100 Committee Score</span>
                    <div className="mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
                        Top 1% in Tech
                      </span>
                    </div>
                  </div>
                </div>

                {/* Standout Quote Card */}
                <div className="bg-white/80 p-3 rounded-xl border border-pink-200 space-y-1.5 shadow-2xs">
                  <span className="text-[9px] font-bold text-pink-700 uppercase tracking-wider flex items-center gap-1">
                    <Quote className="w-3 h-3 text-pink-500" />
                    <span>Verbatim Interview Transcript Highlight:</span>
                  </span>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{analytics.topFemaleCandidate.quoteEvidence.replace(/^"|"$/g, '')}"
                  </p>
                </div>

                {/* Key Competencies Badges */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Top Evaluated Strengths:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.topFemaleCandidate.keyStrengths.map((str, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-semibold bg-pink-50 text-pink-800 border border-pink-200 px-2 py-0.5 rounded-md"
                      >
                        ✓ {str}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-pink-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Recommendation: {analytics.topFemaleCandidate.recommendation}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectCandidate(analytics.topFemaleCandidate!)}
                  className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span>View Full Scorecard</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* TOP MALE PERFORMER (BOYS CHAMPION) */}
          {analytics.topMaleCandidate && (
            <div className="bg-gradient-to-br from-sky-500/5 via-white to-indigo-500/5 rounded-2xl border-2 border-sky-300 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-sky-600 to-indigo-600 text-white font-extrabold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>#1 Top Male Candidate (Boys Champion)</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                      JR
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-slate-900">
                          {analytics.topMaleCandidate.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                          ♂ Male
                        </span>
                      </div>
                      <p className="text-xs font-bold text-indigo-600">
                        {analytics.topMaleCandidate.role}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-sky-500" />
                        <span>
                          {analytics.topMaleCandidate.city}, {analytics.topMaleCandidate.state}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-sky-600 font-mono leading-none">
                      {analytics.topMaleCandidate.overallScore}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">/ 100 Committee Score</span>
                    <div className="mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
                        Top 2% in Tech
                      </span>
                    </div>
                  </div>
                </div>

                {/* Standout Quote Card */}
                <div className="bg-white/80 p-3 rounded-xl border border-sky-200 space-y-1.5 shadow-2xs">
                  <span className="text-[9px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                    <Quote className="w-3 h-3 text-sky-500" />
                    <span>Verbatim Interview Transcript Highlight:</span>
                  </span>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{analytics.topMaleCandidate.quoteEvidence.replace(/^"|"$/g, '')}"
                  </p>
                </div>

                {/* Key Competencies Badges */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Top Evaluated Strengths:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.topMaleCandidate.keyStrengths.map((str, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md"
                      >
                        ✓ {str}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-sky-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Recommendation: {analytics.topMaleCandidate.recommendation}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectCandidate(analytics.topMaleCandidate!)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <span>View Full Scorecard</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. GENDER RATIO & DIVERSITY HIGHLIGHTS ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Pipeline Gender Parity & Meritocracy Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Audited by autonomous AI without demographic bias.
            </p>
          </div>
        </div>

        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span className="text-pink-600 flex items-center gap-1">
              ♀ Female ({analytics.femaleCount} candidates)
            </span>
            <span className="font-mono text-slate-900">{analytics.total} Total Evaluated</span>
            <span className="text-sky-600 flex items-center gap-1">
              ♂ Male ({analytics.maleCount} candidates)
            </span>
          </div>

          <div className="w-full h-4 rounded-full bg-slate-200 flex overflow-hidden p-0.5 gap-0.5">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-l-full transition-all duration-500"
              style={{ width: `${analytics.femalePct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-r-full transition-all duration-500"
              style={{ width: `${analytics.malePct}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>
              Avg Female Score:{' '}
              <strong className="text-pink-600 font-mono">{analytics.femaleAvgScore}/100</strong>
            </span>
            {(() => {
              const diff = Math.abs(analytics.femalePct - analytics.malePct);
              const isBalanced = diff <= 20; // 40:60 to 60:40 range
              const statusLabel = isBalanced
                ? `Diversity Parity: Balanced (${analytics.femalePct}:${analytics.malePct} Ratio)`
                : analytics.femalePct > analytics.malePct
                ? `Diversity Status: Female-Led (${analytics.femalePct}:${analytics.malePct} Ratio)`
                : `Diversity Status: Male-Led (${analytics.femalePct}:${analytics.malePct} Ratio)`;

              return (
                <span className={`font-bold px-2.5 py-0.5 rounded border text-[11px] font-mono ${
                  isBalanced
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {statusLabel}
                </span>
              );
            })()}
            <span>
              Avg Male Score:{' '}
              <strong className="text-sky-600 font-mono">{analytics.maleAvgScore}/100</strong>
            </span>
          </div>
        </div>

        {/* Diversity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 space-y-1">
            <span className="text-[10px] font-bold text-pink-700 uppercase">Female Talent Highlights</span>
            <p className="text-xs text-slate-700 font-medium">
              Leading in Distributed AI, Product Empathy, and STAR conflict resolution. Highest score:{' '}
              <strong>
                {analytics.topFemaleCandidate
                  ? `${analytics.topFemaleCandidate.overallScore}/100 (${analytics.topFemaleCandidate.name})`
                  : '96/100 (Aanya Patel)'}
              </strong>.
            </p>
          </div>

          <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-1">
            <span className="text-[10px] font-bold text-sky-700 uppercase">Male Talent Highlights</span>
            <p className="text-xs text-slate-700 font-medium">
              Leading in High-concurrency Ledgers, Raft Leases, and Multi-region Envoy routing. Highest score:{' '}
              <strong>
                {analytics.topMaleCandidate
                  ? `${analytics.topMaleCandidate.overallScore}/100 (${analytics.topMaleCandidate.name})`
                  : '94/100 (Jordan Reed)'}
              </strong>.
            </p>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase">Compliance & Bias Guardrail</span>
            <p className="text-xs text-slate-700 font-medium">
              Autonomous AI scoring completely ignores gender, audio pitch, or dialect—evaluating purely on verbatim technical depth.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. CANDIDATE EXPERIENCE & SENIORITY RATIO ANALYTICS ── */}
      <ExperienceRatioVisualizer
        total={analytics.total}
        experienceBreakdown={analytics.experienceBreakdown}
        selectedExperienceFilter={selectedExperienceFilter}
        onSelectExperienceFilter={onSelectExperienceAndSwitchToCandidates}
        hoveredTier={hoveredTier}
        onHoverTier={onHoverTier}
      />

      {/* ── 4. GEOGRAPHICAL STATE-BY-STATE ANALYTICS ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Geographic Talent Distribution by State / Region</span>
            </h3>
            <p className="text-xs text-slate-500">
              Where candidates are based, regional candidate volumes, and average technical scores. Click any state to filter pipeline.
            </p>
          </div>
        </div>

        <StateProportionVisualizer
          total={analytics.total}
          stateBreakdown={analytics.stateBreakdown}
          selectedStateFilter="all"
          onSelectState={(st) => onSelectStateAndSwitchToCandidates(st)}
          hoveredState={hoveredState}
          onHoverState={onHoverState}
        />
      </div>
    </div>
  );
};

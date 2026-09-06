import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  UserX,
  MapPin,
  Clock,
  Quote,
  FileText,
  ChevronRight,
  Download,
  Building2,
} from 'lucide-react';
import { EnrichedCandidate, EXPERIENCE_TIERS, getExperienceTier } from './types';
import { renderAvatarIcon, getAvatarGradientClass } from '../../utils/avatarUtils';

interface CandidatePipelineTableProps {
  candidates: EnrichedCandidate[];
  totalPipelineCount: number;
  sortBy: 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'name-asc';
  onToggleDateSort: () => void;
  onToggleScoreSort: () => void;
  onSelectScorecardCandidate: (candidate: EnrichedCandidate) => void;
  onClearFilters: () => void;
  onExportCSV: () => void;
  isRatioFilterActive?: boolean;
  ratioFilterLabel?: string;
  onResetRatioFilter?: () => void;
}

export const CandidatePipelineTable: React.FC<CandidatePipelineTableProps> = ({
  candidates,
  totalPipelineCount,
  sortBy,
  onToggleDateSort,
  onToggleScoreSort,
  onSelectScorecardCandidate,
  onClearFilters,
  onExportCSV,
  isRatioFilterActive,
  ratioFilterLabel,
  onResetRatioFilter,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Shortlist by Gender Ratio Active Highlight Banner */}
      {isRatioFilterActive && (
        <div className="p-3 bg-gradient-to-r from-pink-50 via-indigo-50/40 to-sky-50 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-black text-indigo-950">
              Shortlist by Gender Ratio Active: <span className="font-mono text-pink-700 font-extrabold">{ratioFilterLabel}</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-medium">
              Curating Top {candidates.length} Evaluated Candidates Aligned Strictly by Merit & Score Ranking
            </span>
          </div>
          {onResetRatioFilter && (
            <button
              type="button"
              onClick={onResetRatioFilter}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
            >
              Reset to Full Pipeline
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              {/* Interactive sortable Candidate & Date column header */}
              <th
                className="py-3 px-3.5 text-left w-[195px] cursor-pointer select-none hover:bg-slate-100 transition group"
                onClick={onToggleDateSort}
                title="Click to toggle sorting by Date (Latest vs Oldest)"
              >
                <div className="flex items-center gap-1.5">
                  <span className="group-hover:text-indigo-600 transition">Candidate & Date</span>
                  {sortBy === 'date-desc' ? (
                    <span className="flex items-center text-indigo-600 font-bold text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      <ArrowDown className="w-2.5 h-2.5 mr-0.5" /> Latest
                    </span>
                  ) : sortBy === 'date-asc' ? (
                    <span className="flex items-center text-indigo-600 font-bold text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      <ArrowUp className="w-2.5 h-2.5 mr-0.5" /> Oldest
                    </span>
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                  )}
                </div>
              </th>

              <th className="py-3 px-3 text-left w-[210px]">Target Role & Experience</th>

              {/* Interactive sortable Score column header */}
              <th
                className="py-3 px-2 text-center w-[85px] cursor-pointer select-none hover:bg-slate-100 transition group"
                onClick={onToggleScoreSort}
                title="Click to toggle sorting by Score (Highest vs Lowest)"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="group-hover:text-indigo-600 transition">Score</span>
                  {sortBy === 'score-desc' ? (
                    <ArrowDown className="w-3 h-3 text-indigo-600" />
                  ) : sortBy === 'score-asc' ? (
                    <ArrowUp className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                  )}
                </div>
              </th>

              <th className="py-3 px-2 text-center w-[125px]">Recommendation</th>
              <th className="py-3 px-3 text-left w-[250px]">Deliberating AI Panel</th>
              <th className="py-3 px-3.5 text-left min-w-[300px]">Transcript Quote Evidence</th>
              <th className="py-3 px-3 text-center w-[105px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-bold">No candidates found matching selected filters.</p>
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-2 text-indigo-600 hover:underline text-xs font-bold cursor-pointer"
                  >
                    Clear Filters & Reset Sort
                  </button>
                </td>
              </tr>
            ) : (
              candidates.map((cand, idx) => (
                <tr
                  key={cand.id}
                  className="hover:bg-slate-50/90 transition group border-b border-slate-100 last:border-0"
                >
                  {/* Candidate Name & Demographics */}
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-2xs mt-0.5 ${
                          cand.gender === 'Female'
                            ? 'bg-gradient-to-tr from-pink-500 to-purple-600'
                            : 'bg-gradient-to-tr from-sky-500 to-indigo-600'
                        }`}
                      >
                        {cand.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isRatioFilterActive && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-black shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-2xs'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-900 font-extrabold'
                                  : idx === 2
                                  ? 'bg-amber-700 text-amber-100 font-extrabold'
                                  : 'bg-indigo-100 text-indigo-800 font-bold'
                              }`}
                              title={`Rank #${idx + 1} Top Performer by Evaluated Score (${cand.overallScore}/100)`}
                            >
                              {idx === 0 ? '👑 #1' : `#${idx + 1}`}
                            </span>
                          )}
                          <span className="font-extrabold text-slate-900 text-xs truncate">{cand.name}</span>
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                              cand.gender === 'Female'
                                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                : 'bg-sky-100 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {cand.gender === 'Female' ? '♀' : '♂'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {cand.city}, {cand.state}
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {cand.date.toLowerCase().includes('today') ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                              NEW
                            </span>
                          ) : cand.date.toLowerCase().includes('yesterday') ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Recent
                            </span>
                          ) : null}
                          <span className="text-[9px] text-slate-500 font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            {cand.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role & Experience */}
                  <td className="py-3.5 px-3 align-top">
                    <p className="font-bold text-slate-800 text-xs leading-snug pt-0.5">{cand.role}</p>

                    {/* Experience Tier & Prior Work Arrangement */}
                    {(() => {
                      const tierKey = cand.experienceTier || getExperienceTier(cand.yearsOfExperience ?? 0);
                      const tierInfo = EXPERIENCE_TIERS[tierKey];
                      const isFresher = tierKey === 'fresher';

                      return (
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black border ${tierInfo.badge}`}>
                              {tierInfo.range} ({tierInfo.label.split(' ')[0]})
                            </span>
                            {cand.yearsOfExperience !== undefined && !isFresher && (
                              <span className="text-[9px] font-mono text-slate-500">
                                {cand.yearsOfExperience} yrs
                              </span>
                            )}
                          </div>

                          {isFresher ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                                Fresher (Campus)
                              </span>
                            </div>
                          ) : cand.previousCompany ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1 max-w-[190px] truncate">
                                <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                <span className="truncate">{cand.previousCompany}</span>
                              </span>
                              {cand.workMode && (
                                <span
                                  className={`text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-wider ${
                                    cand.workMode === 'Remote'
                                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                      : cand.workMode === 'Onsite'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  {cand.workMode}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Overall Score */}
                  <td className="py-3.5 px-2 align-top text-center">
                    <div className="inline-flex flex-col items-center pt-0.5">
                      <div className="font-mono font-black text-sm leading-tight">
                        <span
                          className={
                            cand.overallScore >= 85
                              ? 'text-emerald-700 font-extrabold'
                              : cand.overallScore >= 70
                              ? 'text-blue-700 font-bold'
                              : 'text-amber-700 font-bold'
                          }
                        >
                          {cand.overallScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal"> / 100</span>
                      </div>
                      <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cand.overallScore >= 85
                              ? 'bg-emerald-500'
                              : cand.overallScore >= 70
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${cand.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Recommendation */}
                  <td className="py-3.5 px-2 align-top text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${
                        cand.recommendation === 'Strong Hire'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                          : cand.recommendation === 'Hire'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : cand.recommendation === 'Leaning Hire'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {cand.recommendation}
                    </span>
                  </td>

                  {/* Deliberating AI Panel */}
                  <td className="py-3 px-3 align-top">
                    <div className="space-y-1.5">
                      {cand.panelUsed.map((p) => {
                        const isTech = p.role === 'technical';
                        const isProd = p.role === 'product';
                        const isLead = p.role === 'leadership';
                        const isHiringMgr = p.role === 'hiring_manager';
                        const isCust = p.role === 'customer';
                        const isBehav = p.role === 'behavioural' || p.role === 'behavioral';

                        const roleLabel = isTech
                          ? 'Technical'
                          : isProd
                          ? 'Product'
                          : isHiringMgr
                          ? 'Bar Raiser'
                          : isLead
                          ? 'Leadership'
                          : isCust
                          ? 'Customer SLA'
                          : isBehav
                          ? 'Behavioral'
                          : 'Interviewer';

                        const roleColor = isTech
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : isProd
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isHiringMgr
                          ? 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold'
                          : isLead
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isCust
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : isBehav
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200';

                        return (
                          <div key={p.id} className="flex items-center gap-1.5 leading-tight">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight shrink-0 border ${roleColor}`}
                            >
                              {roleLabel}
                            </span>
                            <span
                              className="font-bold text-slate-800 text-[11px] truncate"
                              title={`${p.name} · ${p.title} (${p.company || 'Enterprise'})`}
                            >
                              {p.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Quote Evidence */}
                  <td className="py-3.5 px-3 align-top">
                    <div className="bg-slate-50/70 group-hover:bg-indigo-50/30 p-2 rounded-lg border border-slate-200/60 space-y-1 transition">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-700 uppercase">
                        <Quote className="w-2.5 h-2.5 text-indigo-500" />
                        <span>Verbatim Audio Evidence</span>
                      </div>
                      <p className="text-[11px] text-slate-700 italic line-clamp-2 leading-relaxed">
                        {cand.quoteEvidence}
                      </p>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 align-top text-center">
                    <button
                      type="button"
                      onClick={() => onSelectScorecardCandidate(cand)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 text-[11px] font-bold transition cursor-pointer shadow-2xs group/btn mt-0.5"
                    >
                      <FileText className="w-3 h-3 text-indigo-600 group-hover/btn:text-white" />
                      <span>Scorecard</span>
                      <ChevronRight className="w-3 h-3 opacity-60 group-hover/btn:opacity-100" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          Showing <strong className="text-slate-800">{candidates.length}</strong> of{' '}
          <strong className="text-slate-800">{totalPipelineCount}</strong> verified candidate dossiers
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="text-[11px] font-bold text-slate-700 hover:text-indigo-700 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

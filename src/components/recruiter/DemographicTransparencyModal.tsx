import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Calculator,
  Target,
  Sparkles,
  Users,
  CheckCircle2,
  FileText,
  Search,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { EnrichedCandidate } from './types';
import { CohortAnalytics } from '../../services/recruiterPipelineService';
import { UserSession } from '../../types';

interface DemographicTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: CohortAnalytics;
  candidates: EnrichedCandidate[];
  currentUser?: UserSession | null;
  onSelectCandidate?: (candidate: EnrichedCandidate) => void;
  onOpenParityShortlist?: () => void;
}

export const DemographicTransparencyModal: React.FC<DemographicTransparencyModalProps> = ({
  isOpen,
  onClose,
  analytics,
  candidates,
  currentUser,
  onSelectCandidate,
  onOpenParityShortlist,
}) => {
  const [filterGender, setFilterGender] = useState<'all' | 'Female' | 'Male'>('all');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const targetGoalStr = currentUser?.diversityGoal || 'Balanced Pipeline (~50:50 Ratio)';

  const filteredList = candidates.filter((c) => {
    const matchesGender = filterGender === 'all' || c.gender === filterGender;
    const matchesQuery =
      !filterQuery ||
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesGender && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Demographic Parity & Meritocracy Audit
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% Mathematically Transparent</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full transparency into intake data, calculation formulas, target vs actual ratios, and candidate-by-candidate ledger.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Target vs Actual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Card 1: Target Goal */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>Configured Requisition Target</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Hiring Policy
                </span>
              </div>
              <p className="text-lg font-black text-white font-mono">{targetGoalStr}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                This is the benchmark parity goal set by your hiring committee during requisition calibration. It guides shortlist quotas without compromising technical merit.
              </p>
            </div>

            {/* Card 2: Actual Evaluated Pipeline */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-pink-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Actual Evaluated Pipeline Intake</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30">
                  Empirical Data
                </span>
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-xl font-black text-pink-400">{analytics.femalePct}% Female</span>
                <span className="text-xs text-slate-500">({analytics.femaleCount})</span>
                <span className="text-slate-600">•</span>
                <span className="text-lg font-bold text-sky-400">{analytics.malePct}% Male</span>
                <span className="text-xs text-slate-500">({analytics.maleCount})</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Empirical distribution of the <strong>{analytics.total} evaluated dossiers</strong> across Pan-India hubs. Scores are calibrated autonomously against objective engineering bars.
              </p>
            </div>
          </div>

          {/* Mathematical Proof & Formula Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                <span>Exact Mathematical Formula & Calculation</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Deterministic Computation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-pink-950/20 border border-pink-500/30 space-y-1">
                <span className="text-pink-300 font-bold block text-[11px]">Female Representation Ratio:</span>
                <div className="text-sm font-black text-white">
                  ({analytics.femaleCount} Female / {analytics.total} Total) × 100% ={' '}
                  <span className="text-pink-400">
                    {((analytics.femaleCount / (analytics.total || 1)) * 100).toFixed(1)}% ≈ {analytics.femalePct}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block">
                  Standard mathematical rounding applied to nearest integer.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/30 space-y-1">
                <span className="text-sky-300 font-bold block text-[11px]">Male Representation Ratio:</span>
                <div className="text-sm font-black text-white">
                  ({analytics.maleCount} Male / {analytics.total} Total) × 100% ={' '}
                  <span className="text-sky-400">
                    {((analytics.maleCount / (analytics.total || 1)) * 100).toFixed(1)}% ≈ {analytics.malePct}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block">
                  Standard mathematical rounding applied to nearest integer.
                </span>
              </div>
            </div>

            {/* Zero-Bias AI Certification */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-emerald-300">Autonomous Non-Bias Guarantee:</strong> Vocalis AI evaluation models operate on strictly isolated audio evidence. Gender, demographics, and personal identifiers are completely excluded from the scoring context. Every score is derived 100% from technical depth, STAR examples, and concrete latency/metrics evidence.
              </div>
            </div>
          </div>

          {/* Quick Action: Open Parity Shortlist */}
          {onOpenParityShortlist && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Want to filter candidates matching your target ratio (e.g. 60:40 or 50:50)?</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  View top Strong Hire female and male candidates calibrated side-by-side.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenParityShortlist();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <span>Launch Shortlist by Gender Ratio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Verifiable Candidate Ledger */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Verifiable Candidate Audit Ledger ({candidates.length} Total Evaluated)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Every data point is tied to an authentic evaluated candidate dossier.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                  />
                </div>

                {/* Gender Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterGender('all')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      filterGender === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({candidates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterGender('Female')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      filterGender === 'Female'
                        ? 'bg-pink-600 text-white'
                        : 'text-pink-400 hover:text-pink-300'
                    }`}
                  >
                    ♀ Female ({analytics.femaleCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterGender('Male')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      filterGender === 'Male'
                        ? 'bg-sky-600 text-white'
                        : 'text-sky-400 hover:text-sky-300'
                    }`}
                  >
                    ♂ Male ({analytics.maleCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Candidate</th>
                      <th className="p-2.5">Gender</th>
                      <th className="p-2.5">Role & Exp</th>
                      <th className="p-2.5">Score</th>
                      <th className="p-2.5">Verdict</th>
                      {onSelectCandidate && <th className="p-2.5 text-right">Inspect</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {filteredList.map((cand, idx) => (
                      <tr key={cand.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-2.5 font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-white block">{cand.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {cand.city}, {cand.state}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              cand.gender === 'Female'
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {cand.gender === 'Female' ? '♀ Female' : '♂ Male'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="text-slate-200 block truncate max-w-[180px]">{cand.role}</span>
                          <span className="text-[10px] text-slate-400">{cand.yearsOfExperience} Yrs Exp</span>
                        </td>
                        <td className="p-2.5 font-mono font-black text-emerald-400">
                          {cand.overallScore}/100
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              cand.recommendation === 'Strong Hire'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {cand.recommendation}
                          </span>
                        </td>
                        {onSelectCandidate && (
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectCandidate(cand);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] transition cursor-pointer border border-slate-700 inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-indigo-400" />
                              <span>Scorecard</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Data Source: <strong className="text-slate-200">Autonomous Calibration Audit Engine</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer border border-slate-700"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};

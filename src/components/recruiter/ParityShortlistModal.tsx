import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Scale,
  Sparkles,
  Download,
  Users,
  Award,
  Quote,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Sliders,
  Building2,
  Crown,
  Search,
  Filter,
  Layers,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { EnrichedCandidate } from './types';
import {
  getParityBalancedShortlist,
  BalancedShortlistResult,
  parseDiversityGoalToRatio,
} from '../../services/recruiterPipelineService';
import { UserSession } from '../../types';

interface ParityShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: EnrichedCandidate[];
  currentUser?: UserSession | null;
  onSelectCandidate: (candidate: EnrichedCandidate) => void;
}

interface RatioPreset {
  key: string;
  female: number;
  male: number;
  label: string;
  shortLabel: string;
  category: 'parity' | 'women-focus' | 'balanced' | 'tech-intake' | 'extreme' | 'custom';
}

const RATIO_PRESETS: RatioPreset[] = [
  { key: '50-50', female: 50, male: 50, label: '50:50 (Exact Parity Goal)', shortLabel: '50:50 Parity', category: 'parity' },
  { key: '60-40', female: 60, male: 40, label: '60:40 (Women in Tech Focus)', shortLabel: '60:40 Focus', category: 'women-focus' },
  { key: '70-30', female: 70, male: 30, label: '70:30 (Accelerated Representation)', shortLabel: '70:30 Women', category: 'women-focus' },
  { key: '80-20', female: 80, male: 20, label: '80:20 (High Female Diversity)', shortLabel: '80:20 Diversity', category: 'women-focus' },
  { key: '90-10', female: 90, male: 10, label: '90:10 (Diversity Ramp)', shortLabel: '90:10 Ramp', category: 'women-focus' },
  { key: '45-55', female: 45, male: 55, label: '45:55 (Balanced Pipeline)', shortLabel: '45:55 Balanced', category: 'balanced' },
  { key: '40-60', female: 40, male: 60, label: '40:60 (Balanced Tech)', shortLabel: '40:60 Tech', category: 'balanced' },
  { key: '30-70', female: 30, male: 70, label: '30:70 (Engineering Pool)', shortLabel: '30:70 Pool', category: 'tech-intake' },
  { key: '20-80', female: 20, male: 80, label: '20:80 (Technical Intake)', shortLabel: '20:80 Intake', category: 'tech-intake' },
  { key: '10-90', female: 10, male: 90, label: '10:90 (Targeted Tech Pipeline)', shortLabel: '10:90 Tech', category: 'tech-intake' },
  { key: '100-0', female: 100, male: 0, label: '100:0 (All-Female Leadership Cohort)', shortLabel: '100:0 Women', category: 'extreme' },
  { key: '0-100', female: 0, male: 100, label: '0:100 (All-Male Cohort)', shortLabel: '0:100 Men', category: 'extreme' },
  { key: 'custom', female: 50, male: 50, label: 'Custom Ratio (Interactive Slider)...', shortLabel: 'Custom Ratio', category: 'custom' },
];

export const ParityShortlistModal: React.FC<ParityShortlistModalProps> = ({
  isOpen,
  onClose,
  candidates,
  currentUser,
  onSelectCandidate,
}) => {
  // Initialize ratio based on recruiter's requisition target
  const initialRatioKey = useMemo(() => {
    if (!currentUser?.diversityGoal) return '50-50';
    const goal = currentUser.diversityGoal.toLowerCase();
    if (goal.includes('60:40') || goal.includes('60/40')) return '60-40';
    if (goal.includes('45:55') || goal.includes('45/55')) return '45-55';
    if (goal.includes('70:30') || goal.includes('70/30')) return '70-30';
    if (goal.includes('10:90') || goal.includes('10/90')) return '10-90';
    return '50-50';
  }, [currentUser?.diversityGoal]);

  const [selectedRatioKey, setSelectedRatioKey] = useState<string>(initialRatioKey);
  const [customFemaleRatio, setCustomFemaleRatio] = useState<number>(50);
  const [cohortSize, setCohortSize] = useState<number>(10);
  const [filterMode, setFilterMode] = useState<'strongHireAndHire' | 'strongHireOnly' | 'all'>('strongHireAndHire');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCustomSlider, setShowCustomSlider] = useState<boolean>(false);

  // Sync initial ratio when requisition changes
  useEffect(() => {
    setSelectedRatioKey(initialRatioKey);
  }, [initialRatioKey]);

  // Extract unique roles from candidates for role filter
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.role) set.add(c.role);
    });
    return Array.from(set);
  }, [candidates]);

  // Determine active ratio numbers
  const activeRatio = useMemo(() => {
    if (selectedRatioKey === 'custom') {
      const female = Math.min(100, Math.max(0, customFemaleRatio));
      const male = 100 - female;
      return {
        female,
        male,
        label: `Custom ${female}:${male} (${female}% ♀ : ${male}% ♂)`,
      };
    }
    const found = RATIO_PRESETS.find((p) => p.key === selectedRatioKey);
    if (found) {
      return {
        female: found.female,
        male: found.male,
        label: found.label,
      };
    }
    return { female: 50, male: 50, label: '50:50 (Exact Parity Goal)' };
  }, [selectedRatioKey, customFemaleRatio]);

  // Compute balanced top-performer shortlist
  const balancedResult: BalancedShortlistResult = useMemo(() => {
    return getParityBalancedShortlist(
      candidates,
      activeRatio.female,
      activeRatio.male,
      cohortSize,
      filterMode,
      selectedRoleFilter
    );
  }, [candidates, activeRatio, cohortSize, filterMode, selectedRoleFilter]);

  // In-modal search filter applied to displayed cards
  const displayedFemaleCandidates = useMemo(() => {
    if (!searchQuery.trim()) return balancedResult.femaleCandidates;
    const q = searchQuery.toLowerCase();
    return balancedResult.femaleCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.previousCompany && c.previousCompany.toLowerCase().includes(q)) ||
        c.keyStrengths.some((s) => s.toLowerCase().includes(q))
    );
  }, [balancedResult.femaleCandidates, searchQuery]);

  const displayedMaleCandidates = useMemo(() => {
    if (!searchQuery.trim()) return balancedResult.maleCandidates;
    const q = searchQuery.toLowerCase();
    return balancedResult.maleCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.previousCompany && c.previousCompany.toLowerCase().includes(q)) ||
        c.keyStrengths.some((s) => s.toLowerCase().includes(q))
    );
  }, [balancedResult.maleCandidates, searchQuery]);

  if (!isOpen) return null;

  // Handle Export CSV
  const handleExportCSV = () => {
    const all = [
      ...balancedResult.femaleCandidates.map((c, i) => ({ ...c, genderRank: `♀ #${i + 1}` })),
      ...balancedResult.maleCandidates.map((c, i) => ({ ...c, genderRank: `♂ #${i + 1}` })),
    ];
    const headers = [
      'Rank',
      'Name',
      'Gender',
      'Role',
      'Experience (Years)',
      'Overall Score',
      'Technical Architecture Score',
      'Problem Solving Score',
      'Leadership Score',
      'Recommendation',
      'City',
      'State',
      'Previous Company',
      'Work Mode',
      'Key Strengths',
      'Audio Evidence Quote',
    ];
    const rows = all.map((c, i) => [
      c.genderRank,
      `"${c.name}"`,
      c.gender,
      `"${c.role}"`,
      c.yearsOfExperience ?? 0,
      c.overallScore,
      c.technicalScore ?? c.overallScore,
      c.problemSolvingScore ?? c.overallScore,
      c.leadershipScore ?? c.overallScore,
      `"${c.recommendation}"`,
      `"${c.city}"`,
      `"${c.state}"`,
      `"${c.previousCompany || 'N/A'}"`,
      `"${c.workMode || 'N/A'}"`,
      `"${c.keyStrengths.join('; ')}"`,
      `"${c.quoteEvidence.replace(/^"|"$/g, '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VocalisAI_Shortlist_GenderRatio_${activeRatio.female}_${activeRatio.male}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper for dynamic slot counts
  const calcSlotsForPreset = (fRatio: number) => {
    const fSlots = Math.round((cohortSize * fRatio) / 100);
    const mSlots = cohortSize - fSlots;
    return { fSlots, mSlots };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* ── HEADER ── */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-sky-500/30 border border-indigo-500/40 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Shortlist by Gender Ratio
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-pink-500/20 to-sky-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Calibrated Meritocracy Engine</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Dynamic Pipeline</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically curates evaluated <strong>Top Performers</strong> side-by-side strictly matching your configured gender ratio by merit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer shadow-xs"
              title="Export shortlist to CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── TOOLBAR CONTROLS (DYNAMIC DROPDOWN + PRESETS + FILTERS) ── */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Target Ratio Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Ratio:</span>
              </span>

              {/* 1. Main Target Ratio Dropdown (User specifically requested 10:90 and any custom choice) */}
              <div className="relative">
                <select
                  value={selectedRatioKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedRatioKey(val);
                    if (val === 'custom') {
                      setShowCustomSlider(true);
                    } else {
                      setShowCustomSlider(false);
                    }
                  }}
                  className="bg-slate-900 border-2 border-indigo-500/60 hover:border-indigo-400 rounded-xl px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm text-xs"
                >
                  <optgroup label="Standard Parity & Diversity Targets">
                    {RATIO_PRESETS.filter((p) => p.category === 'parity' || p.category === 'women-focus').map((p) => {
                      const { fSlots, mSlots } = calcSlotsForPreset(p.female);
                      return (
                        <option key={p.key} value={p.key}>
                          {p.shortLabel} — ({fSlots}♀ : {mSlots}♂)
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Balanced & Engineering Intake Targets (e.g. 10:90)">
                    {RATIO_PRESETS.filter((p) => p.category === 'balanced' || p.category === 'tech-intake').map((p) => {
                      const { fSlots, mSlots } = calcSlotsForPreset(p.female);
                      return (
                        <option key={p.key} value={p.key}>
                          {p.shortLabel} — ({fSlots}♀ : {mSlots}♂)
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Extreme Cohorts & Custom">
                    {RATIO_PRESETS.filter((p) => p.category === 'extreme' || p.category === 'custom').map((p) => {
                      if (p.key === 'custom') {
                        return (
                          <option key={p.key} value={p.key}>
                            Custom Ratio (Slider)...
                          </option>
                        );
                      }
                      const { fSlots, mSlots } = calcSlotsForPreset(p.female);
                      return (
                        <option key={p.key} value={p.key}>
                          {p.shortLabel} — ({fSlots}♀ : {mSlots}♂)
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>

              {/* 2. Quick Pill Presets for Fast 1-Click Access */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                {[
                  { key: '50-50', f: 50, label: '50:50 Parity' },
                  { key: '60-40', f: 60, label: '60:40 Focus' },
                  { key: '70-30', f: 70, label: '70:30 Women' },
                  { key: '45-55', f: 45, label: '45:55 Balanced' },
                  { key: '10-90', f: 10, label: '10:90 Tech' },
                ].map((p) => {
                  const { fSlots, mSlots } = calcSlotsForPreset(p.f);
                  const isSelected = selectedRatioKey === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setSelectedRatioKey(p.key);
                        setShowCustomSlider(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[9px] opacity-75 font-mono">
                        ({fSlots}♀:{mSlots}♂)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Batch Size & Filtering Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Batch Size Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Batch Size:</span>
                <select
                  value={cohortSize}
                  onChange={(e) => setCohortSize(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer text-xs"
                >
                  <option value={4}>4 Candidates</option>
                  <option value={6}>6 Candidates</option>
                  <option value={8}>8 Candidates</option>
                  <option value={10}>10 Candidates</option>
                  <option value={12}>12 Candidates</option>
                  <option value={14}>14 Candidates</option>
                  <option value={16}>16 Candidates</option>
                  <option value={20}>20 Candidates</option>
                </select>
              </div>

              {/* Recommendation Strictness Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Bar Strictness:</span>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer text-xs"
                >
                  <option value="strongHireAndHire">Strong Hire & Hire</option>
                  <option value="strongHireOnly">Strong Hire Only</option>
                  <option value="all">All Evaluated Candidates</option>
                </select>
              </div>

              {/* Role Filter */}
              {availableRoles.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Role:</span>
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-xs max-w-[140px] truncate"
                  >
                    <option value="all">All Roles</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ── CUSTOM RATIO SLIDER (Revealed if custom selected or toggled) ── */}
          {(showCustomSlider || selectedRatioKey === 'custom') && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-pink-400">♀ {customFemaleRatio}% Female</span>
                <span className="text-slate-500">/</span>
                <span className="text-[11px] font-bold text-sky-400">♂ {100 - customFemaleRatio}% Male</span>
                <span className="text-slate-400 text-[10px]">
                  (Target Slots: {Math.round((cohortSize * customFemaleRatio) / 100)} ♀ :{' '}
                  {cohortSize - Math.round((cohortSize * customFemaleRatio) / 100)} ♂)
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-80">
                <span className="text-[10px] text-pink-400 font-mono">0%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={customFemaleRatio}
                  onChange={(e) => {
                    setSelectedRatioKey('custom');
                    setCustomFemaleRatio(Number(e.target.value));
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-sky-400 font-mono">100%</span>
              </div>
            </div>
          )}

          {/* Search bar inside shortlist */}
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, skills, location..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* ── SHORTLIST SUMMARY STAT BAR ── */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-white">
              Target Ratio: <span className="text-indigo-400 font-mono">{activeRatio.female}% ♀ : {activeRatio.male}% ♂</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">
              Shortlist: <strong>{balancedResult.actualFemaleCount + balancedResult.actualMaleCount} / {cohortSize}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-pink-400 font-mono font-bold">
              {balancedResult.actualFemaleCount} Female ({balancedResult.actualFemaleRatio}%)
            </span>
            <span className="text-slate-600">+</span>
            <span className="text-sky-400 font-mono font-bold">
              {balancedResult.actualMaleCount} Male ({balancedResult.actualMaleRatio}%)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">♀ Avg: </span>
              <strong className="text-pink-400 font-mono">{balancedResult.femaleScoreAvg || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-400">♂ Avg: </span>
              <strong className="text-sky-400 font-mono">{balancedResult.maleScoreAvg || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Batch Avg: </span>
              <strong className="text-emerald-400 font-mono text-sm">{balancedResult.combinedScoreAvg} / 100</strong>
            </div>
          </div>
        </div>

        {/* Shortage notice if strict filter reduced candidates */}
        {(balancedResult.poolShortage.female || balancedResult.poolShortage.male) && (
          <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-600/30 flex items-center justify-between gap-2 text-xs text-amber-300">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Pool limit reached under current filter: Requested {balancedResult.targetFemaleSlots}♀ & {balancedResult.targetMaleSlots}♂, but {balancedResult.actualFemaleCount}♀ & {balancedResult.actualMaleCount}♂ met the bar criteria.
              </span>
            </div>
            {filterMode !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="underline font-bold text-amber-200 hover:text-white cursor-pointer shrink-0"
              >
                Include all evaluated candidates
              </button>
            )}
          </div>
        )}

        {/* ── SIDE-BY-SIDE CONTENT GRID ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ── LEFT COLUMN: TOP FEMALE SHORTLIST ── */}
            <div className="bg-slate-950/60 rounded-2xl border-2 border-pink-500/40 p-4 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-pink-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 flex items-center justify-center font-bold text-xs">
                      ♀
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>Top Female Shortlist</span>
                        <span className="text-pink-400 font-mono text-xs">({activeRatio.female}%)</span>
                      </h3>
                      <p className="text-[10px] text-pink-300">
                        Ranked strictly by overall score & system architecture rigor
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono font-bold text-xs">
                    {balancedResult.actualFemaleCount} / {balancedResult.targetFemaleSlots} Slots
                  </span>
                </div>

                {balancedResult.targetFemaleSlots === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                    0 slots allocated for Female candidates under current ratio ({activeRatio.female}:{activeRatio.male}).
                  </div>
                ) : displayedFemaleCandidates.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                    No candidates found matching the current search / filter criteria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedFemaleCandidates.map((cand, idx) => (
                      <div
                        key={cand.id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/60 transition space-y-2.5 group shadow-2xs relative overflow-hidden"
                      >
                        {/* Top Rank Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                                idx === 0
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black'
                                  : idx === 1
                                  ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950'
                                  : idx === 2
                                  ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100'
                                  : 'bg-gradient-to-br from-pink-500 to-purple-600 text-white'
                              }`}
                            >
                              {idx === 0 ? <Crown className="w-4 h-4 fill-current" /> : `#${idx + 1}`}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-white text-xs block group-hover:text-pink-300 transition truncate">
                                  {cand.name}
                                </span>
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                                    #1 Performer
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {cand.role} · {cand.yearsOfExperience}y Exp
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-pink-400 font-mono leading-none">
                              {cand.overallScore}
                            </span>
                            <span className="text-[9px] text-slate-400 block">/ 100 Score</span>
                          </div>
                        </div>

                        {/* Location, Previous Company & Recommendation */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                            <span className="truncate">
                              {cand.city}, {cand.state} • {cand.previousCompany || 'Campus Graduate'}
                            </span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                              cand.recommendation === 'Strong Hire'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {cand.recommendation}
                          </span>
                        </div>

                        {/* Key Evaluated Strengths */}
                        {cand.keyStrengths && cand.keyStrengths.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {cand.keyStrengths.slice(0, 3).map((str, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.2 rounded"
                              >
                                {str}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Audio Quote Evidence */}
                        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 italic line-clamp-2">
                          "{cand.quoteEvidence.replace(/^"|"$/g, '')}"
                        </div>

                        {/* Action: Inspect Scorecard */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectCandidate(cand);
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white font-bold text-[10px] transition cursor-pointer border border-slate-700 flex items-center gap-1"
                          >
                            <span>Inspect Full Scorecard</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: TOP MALE SHORTLIST ── */}
            <div className="bg-slate-950/60 rounded-2xl border-2 border-sky-500/40 p-4 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-sky-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center font-bold text-xs">
                      ♂
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>Top Male Shortlist</span>
                        <span className="text-sky-400 font-mono text-xs">({activeRatio.male}%)</span>
                      </h3>
                      <p className="text-[10px] text-sky-300">
                        Ranked strictly by overall score & system architecture rigor
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono font-bold text-xs">
                    {balancedResult.actualMaleCount} / {balancedResult.targetMaleSlots} Slots
                  </span>
                </div>

                {balancedResult.targetMaleSlots === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                    0 slots allocated for Male candidates under current ratio ({activeRatio.female}:{activeRatio.male}).
                  </div>
                ) : displayedMaleCandidates.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                    No candidates found matching the current search / filter criteria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedMaleCandidates.map((cand, idx) => (
                      <div
                        key={cand.id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 transition space-y-2.5 group shadow-2xs relative overflow-hidden"
                      >
                        {/* Top Rank Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                                idx === 0
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black'
                                  : idx === 1
                                  ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950'
                                  : idx === 2
                                  ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100'
                                  : 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white'
                              }`}
                            >
                              {idx === 0 ? <Crown className="w-4 h-4 fill-current" /> : `#${idx + 1}`}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-white text-xs block group-hover:text-sky-300 transition truncate">
                                  {cand.name}
                                </span>
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                                    #1 Performer
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {cand.role} · {cand.yearsOfExperience}y Exp
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-sky-400 font-mono leading-none">
                              {cand.overallScore}
                            </span>
                            <span className="text-[9px] text-slate-400 block">/ 100 Score</span>
                          </div>
                        </div>

                        {/* Location, Previous Company & Recommendation */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                            <span className="truncate">
                              {cand.city}, {cand.state} • {cand.previousCompany || 'Campus Graduate'}
                            </span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                              cand.recommendation === 'Strong Hire'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {cand.recommendation}
                          </span>
                        </div>

                        {/* Key Evaluated Strengths */}
                        {cand.keyStrengths && cand.keyStrengths.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {cand.keyStrengths.slice(0, 3).map((str, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.2 rounded"
                              >
                                {str}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Audio Quote Evidence */}
                        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 italic line-clamp-2">
                          "{cand.quoteEvidence.replace(/^"|"$/g, '')}"
                        </div>

                        {/* Action: Inspect Scorecard */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectCandidate(cand);
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white font-bold text-[10px] transition cursor-pointer border border-slate-700 flex items-center gap-1"
                          >
                            <span>Inspect Full Scorecard</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>
              Requisition Target: <strong className="text-white">{currentUser?.companyName || 'Enterprise Requisition'}</strong> (
              {currentUser?.hiringRole || 'Software Engineering'} · {activeRatio.label})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer border border-slate-700"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

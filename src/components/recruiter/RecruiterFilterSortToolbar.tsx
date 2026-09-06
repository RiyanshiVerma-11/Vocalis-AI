import React from 'react';
import {
  Filter,
  PieChart,
  X,
  ChevronDown,
  MapPin,
  Award,
  Clock,
  ArrowUpDown,
  GraduationCap,
  Scale,
  Sparkles,
} from 'lucide-react';

interface RecruiterFilterSortToolbarProps {
  totalCount: number;
  filteredCount: number;
  femaleCount: number;
  maleCount: number;
  stateBreakdown: Array<{ state: string; count: number }>;
  selectedGenderFilter: 'all' | 'Female' | 'Male';
  onGenderFilterChange: (gender: 'all' | 'Female' | 'Male') => void;
  selectedStateFilter: string;
  onStateFilterChange: (state: string) => void;
  selectedRecommendationFilter: string;
  onRecommendationFilterChange: (recommendation: string) => void;
  selectedDateRangeFilter: 'all' | 'new' | 'week';
  onDateRangeFilterChange: (range: 'all' | 'new' | 'week') => void;
  selectedExperienceFilter?: string;
  onExperienceFilterChange?: (tier: string) => void;
  experienceCounts?: Record<string, number>;
  sortBy: 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'name-asc';
  onSortByChange: (sortBy: 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'name-asc') => void;
  showStateCharts: boolean;
  onToggleStateCharts: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onOpenParityShortlist?: () => void;
  onOpenDemographicAudit?: () => void;
  selectedRatioFilter?: string;
  onRatioFilterChange?: (ratio: string) => void;
  customFemaleRatio?: number;
  onCustomFemaleRatioChange?: (female: number) => void;
  cohortLimit?: number;
  onCohortLimitChange?: (limit: number) => void;
}

export const RecruiterFilterSortToolbar: React.FC<RecruiterFilterSortToolbarProps> = ({
  totalCount,
  filteredCount,
  femaleCount,
  maleCount,
  stateBreakdown,
  selectedGenderFilter,
  onGenderFilterChange,
  selectedStateFilter,
  onStateFilterChange,
  selectedRecommendationFilter,
  onRecommendationFilterChange,
  selectedDateRangeFilter,
  onDateRangeFilterChange,
  selectedExperienceFilter = 'all',
  onExperienceFilterChange,
  experienceCounts = {},
  sortBy,
  onSortByChange,
  showStateCharts,
  onToggleStateCharts,
  onClearFilters,
  hasActiveFilters,
  onOpenParityShortlist,
  onOpenDemographicAudit,
  selectedRatioFilter = 'all',
  onRatioFilterChange,
  customFemaleRatio = 50,
  onCustomFemaleRatioChange,
  cohortLimit = 10,
  onCohortLimitChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      {/* Header: Title, Active Filter Summary, Clear Button, and State Chart Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter & Sort Pipeline:</span>
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Showing {filteredCount} of {totalCount} Candidates
          </span>
          {hasActiveFilters && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Filtered
            </span>
          )}
          {selectedRatioFilter !== 'all' && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-purple-700 border border-purple-300 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span>Ratio Active: {customFemaleRatio}% ♀ : {100 - customFemaleRatio}% ♂ (Top {cohortLimit})</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Smart Shortlist by Gender Ratio Button */}
          {onOpenParityShortlist && (
            <button
              type="button"
              onClick={onOpenParityShortlist}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 text-purple-700 border-purple-200 shadow-2xs"
              title="Open full Side-by-Side Shortlist by Gender Ratio modal"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Shortlist by Gender Ratio</span>
            </button>
          )}

          {/* Demographic Parity Audit Button */}
          {onOpenDemographicAudit && (
            <button
              type="button"
              onClick={onOpenDemographicAudit}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              title="Inspect Demographic Audit & Calculation"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>Demographic Audit</span>
            </button>
          )}

          {/* State Proportion Chart Quick Toggle */}
          <button
            type="button"
            onClick={onToggleStateCharts}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
              showStateCharts
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
            }`}
            title="Toggle State Proportion Pie Chart"
          >
            <PieChart className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showStateCharts ? 'Hide State Chart' : 'Show State Chart'}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Gender Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>Gender</span>
          </label>
          <div className="relative">
            <select
              value={selectedGenderFilter}
              onChange={(e) => onGenderFilterChange(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-2 pr-7 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white outline-none cursor-pointer transition shadow-2xs"
            >
              <option value="all">All ({totalCount})</option>
              <option value="Female">Female ({femaleCount})</option>
              <option value="Male">Male ({maleCount})</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Experience Tier Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-emerald-600" />
            <span>Seniority</span>
          </label>
          <div className="relative">
            <select
              value={selectedExperienceFilter}
              onChange={(e) => onExperienceFilterChange && onExperienceFilterChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-2 pr-7 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white outline-none cursor-pointer transition shadow-2xs"
            >
              <option value="all">All Experience ({totalCount})</option>
              <option value="fresher">Fresher: 0–1 Yrs ({experienceCounts['fresher'] || 0})</option>
              <option value="beginner">Beginner: 1–3 Yrs ({experienceCounts['beginner'] || 0})</option>
              <option value="mid">Mid-Level: 4–8 Yrs ({experienceCounts['mid'] || 0})</option>
              <option value="senior">Senior: 8–10 Yrs ({experienceCounts['senior'] || 0})</option>
              <option value="expert">Staff: 10+ Yrs ({experienceCounts['expert'] || 0})</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. State Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-500" />
            <span>State</span>
          </label>
          <div className="relative">
            <select
              value={selectedStateFilter}
              onChange={(e) => onStateFilterChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-2 pr-7 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white outline-none cursor-pointer transition shadow-2xs truncate"
            >
              <option value="all">All States ({totalCount})</option>
              {stateBreakdown.map((st) => (
                <option key={st.state} value={st.state}>
                  {st.state} ({st.count})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4. Outcome / Recommendation Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            <span>Outcome</span>
          </label>
          <div className="relative">
            <select
              value={selectedRecommendationFilter}
              onChange={(e) => onRecommendationFilterChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-2 pr-7 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white outline-none cursor-pointer transition shadow-2xs"
            >
              <option value="all">All Outcomes</option>
              <option value="Strong Hire">Strong Hire</option>
              <option value="Hire">Hire</option>
              <option value="Leaning Hire">Leaning Hire</option>
              <option value="Flagged">Flagged</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 5. Time Period Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Time Period</span>
          </label>
          <div className="relative">
            <select
              value={selectedDateRangeFilter}
              onChange={(e) => onDateRangeFilterChange(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-2 pr-7 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white outline-none cursor-pointer transition shadow-2xs"
            >
              <option value="all">All Time</option>
              <option value="new">New (Today & Yesterday)</option>
              <option value="week">Past 7 Days</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 6. Sort By Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-indigo-500" />
            <span>Sort By</span>
          </label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-2 pr-7 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:bg-white outline-none cursor-pointer transition shadow-2xs"
            >
              <option value="date-desc">Latest First (Newest)</option>
              <option value="date-asc">Oldest First (Earlier)</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 7. Shortlist by Gender Ratio Filter (Requested right where state/gender filters are) */}
        <div className="space-y-1 col-span-2 sm:col-span-3 lg:col-span-6 bg-gradient-to-r from-pink-50/60 via-indigo-50/30 to-sky-50/60 p-2.5 rounded-xl border border-indigo-200/80 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Shortlist by Gender Ratio (Meritocracy Filter):</span>
              </label>
              <span className="text-[10px] text-slate-500">
                Filters & ranks top performers side-by-side matching chosen ratio
              </span>
            </div>

            {selectedRatioFilter !== 'all' && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-600 text-white font-mono shadow-2xs">
                Active Ratio: {customFemaleRatio}% ♀ : {100 - customFemaleRatio}% ♂
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Target Ratio Dropdown */}
            <div className="relative min-w-[160px] sm:min-w-[200px]">
              <select
                value={selectedRatioFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  onRatioFilterChange && onRatioFilterChange(val);
                  if (val === '50-50') onCustomFemaleRatioChange && onCustomFemaleRatioChange(50);
                  if (val === '60-40') onCustomFemaleRatioChange && onCustomFemaleRatioChange(60);
                  if (val === '70-30') onCustomFemaleRatioChange && onCustomFemaleRatioChange(70);
                  if (val === '45-55') onCustomFemaleRatioChange && onCustomFemaleRatioChange(45);
                  if (val === '10-90') onCustomFemaleRatioChange && onCustomFemaleRatioChange(10);
                  if (val === '20-80') onCustomFemaleRatioChange && onCustomFemaleRatioChange(20);
                  if (val === '30-70') onCustomFemaleRatioChange && onCustomFemaleRatioChange(30);
                }}
                className="w-full appearance-none bg-white border border-indigo-300 hover:border-indigo-500 rounded-lg px-3 py-1.5 pr-7 text-xs font-bold text-indigo-950 focus:border-indigo-600 outline-none cursor-pointer shadow-2xs"
              >
                <option value="all">Off (Show All Pipeline Candidates)</option>
                <option value="50-50">50:50 Parity (50% ♀ : 50% ♂)</option>
                <option value="60-40">60:40 Focus (60% ♀ : 40% ♂)</option>
                <option value="70-30">70:30 Women (70% ♀ : 30% ♂)</option>
                <option value="45-55">45:55 Balanced (45% ♀ : 55% ♂)</option>
                <option value="10-90">10:90 Tech Pipeline (10% ♀ : 90% ♂)</option>
                <option value="20-80">20:80 Tech Intake (20% ♀ : 80% ♂)</option>
                <option value="30-70">30:70 Engineering (30% ♀ : 70% ♂)</option>
                <option value="custom">Custom Ratio (Editable Input Below)...</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Editable Input for Recruiter's exact criteria (e.g. 10 90, 15 85, etc.) */}
            {selectedRatioFilter !== 'all' && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500">Edit Ratio:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={customFemaleRatio}
                  onChange={(e) => {
                    const num = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                    onCustomFemaleRatioChange && onCustomFemaleRatioChange(num);
                    if (onRatioFilterChange) onRatioFilterChange('custom');
                  }}
                  className="w-11 text-center font-black text-pink-600 text-xs font-mono bg-pink-50 border border-pink-300 rounded py-0.5 outline-none focus:ring-1 focus:ring-pink-500"
                  title="Type any Female percentage (0-100)"
                />
                <span className="text-xs font-extrabold text-pink-500 font-mono">% ♀</span>
                <span className="text-slate-400 font-bold">:</span>
                <span className="w-11 text-center font-black text-sky-600 text-xs font-mono bg-sky-50 border border-sky-300 rounded py-0.5 select-none inline-block">
                  {100 - customFemaleRatio}
                </span>
                <span className="text-xs font-extrabold text-sky-500 font-mono">% ♂</span>
              </div>
            )}

            {/* Cohort Size Limit */}
            {selectedRatioFilter !== 'all' && (
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500">Cohort Size:</span>
                <select
                  value={cohortLimit}
                  onChange={(e) => onCohortLimitChange && onCohortLimitChange(Number(e.target.value))}
                  className="bg-transparent text-xs font-black text-indigo-700 outline-none cursor-pointer"
                >
                  <option value={6}>Top 6 Performers</option>
                  <option value={10}>Top 10 Performers</option>
                  <option value={14}>Top 14 Performers</option>
                  <option value={20}>Top 20 Performers</option>
                </select>
              </div>
            )}

            {/* Fast Reset button for Ratio Filter */}
            {selectedRatioFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onRatioFilterChange && onRatioFilterChange('all')}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-white transition cursor-pointer"
              >
                ✕ Reset Ratio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
        </div>

        <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
};

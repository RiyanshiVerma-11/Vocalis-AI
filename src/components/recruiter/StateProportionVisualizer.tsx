import React from 'react';
import { PieChart } from 'lucide-react';
import { getStateColor } from './types';

interface StateProportionVisualizerProps {
  total: number;
  stateBreakdown: Array<{
    state: string;
    count: number;
    percentage: number;
    avgScore: number;
    passRate: number;
    topCandidateName: string;
    topCandidateScore: number;
  }>;
  selectedStateFilter: string;
  onSelectState: (state: string) => void;
  hoveredState: string | null;
  onHoverState: (state: string | null) => void;
}

export const StateProportionVisualizer: React.FC<StateProportionVisualizerProps> = ({
  total,
  stateBreakdown,
  selectedStateFilter,
  onSelectState,
  hoveredState,
  onHoverState,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>State-Wise Candidate Proportion & Talent Distribution</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                {stateBreakdown.length} States
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">
              Interactive proportion chart: hover or click any state slice to filter candidate list.
            </p>
          </div>
        </div>

        {selectedStateFilter !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectState('all')}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer flex items-center gap-1"
          >
            <span>Filtered: <strong>{selectedStateFilter}</strong></span>
            <span className="text-slate-400 font-normal underline ml-1">Show All</span>
          </button>
        )}
      </div>

      {/* Proportional Stacked Segment Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Regional Talent Share Proportion</span>
          <span className="font-mono text-slate-700">{total} Total Candidates</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 shadow-inner">
          {stateBreakdown.map((st, idx) => {
            const isSelected = selectedStateFilter === st.state;
            const isHovered = hoveredState === st.state;
            const widthPct = total > 0 ? (st.count / total) * 100 : 0;
            return (
              <div
                key={st.state}
                onClick={() => onSelectState(isSelected ? 'all' : st.state)}
                onMouseEnter={() => onHoverState(st.state)}
                onMouseLeave={() => onHoverState(null)}
                title={`${st.state}: ${st.count} candidates (${st.percentage}%) • Avg Score: ${st.avgScore}`}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: getStateColor(st.state, idx),
                }}
                className={`h-full rounded-xs transition-all cursor-pointer hover:opacity-90 ${
                  isSelected ? 'ring-2 ring-indigo-600 z-10 scale-y-110' : ''
                } ${isHovered ? 'brightness-110' : ''}`}
              />
            );
          })}
        </div>
      </div>

      {/* Donut Chart & State Detail Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
        {/* SVG Donut Chart */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="22"
              />
              {(() => {
                const circ = 2 * Math.PI * 56; // ~351.858
                let accumulatedRatio = 0;
                return stateBreakdown.map((st, idx) => {
                  const ratio = total > 0 ? st.count / total : 0;
                  const dash = ratio * circ;
                  const gap = circ - dash;
                  const offset = -accumulatedRatio * circ;
                  accumulatedRatio += ratio;
                  const isSelected = selectedStateFilter === st.state;
                  const isHovered = hoveredState === st.state;
                  const color = getStateColor(st.state, idx);

                  return (
                    <circle
                      key={st.state}
                      cx="80"
                      cy="80"
                      r="56"
                      fill="transparent"
                      stroke={color}
                      strokeWidth={isSelected || isHovered ? 26 : 22}
                      strokeDasharray={`${Math.max(0, dash - 1.5)} ${gap + 1.5}`}
                      strokeDashoffset={offset}
                      className="transition-all duration-200 cursor-pointer hover:opacity-85"
                      onClick={() => onSelectState(isSelected ? 'all' : st.state)}
                      onMouseEnter={() => onHoverState(st.state)}
                      onMouseLeave={() => onHoverState(null)}
                    >
                      <title>{`${st.state}: ${st.count} (${st.percentage}%)`}</title>
                    </circle>
                  );
                });
              })()}
            </svg>

            {/* Centered Donut Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {hoveredState
                  ? stateBreakdown.find((s) => s.state === hoveredState)?.count || total
                  : total}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate max-w-[100px]">
                {hoveredState || 'Candidates'}
              </span>
              <span className="text-[9px] font-bold text-indigo-600 font-mono mt-0.5">
                {hoveredState
                  ? `${stateBreakdown.find((s) => s.state === hoveredState)?.percentage}% of Cohort`
                  : `${stateBreakdown.length} Tech Hubs`}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            {selectedStateFilter !== 'all' ? (
              <span className="text-indigo-600 font-bold">● Active: {selectedStateFilter}</span>
            ) : (
              'Click slice to filter candidates'
            )}
          </p>
        </div>

        {/* State Cards Grid / Legend */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stateBreakdown.map((st, idx) => {
            const isSelected = selectedStateFilter === st.state;
            const isHovered = hoveredState === st.state;
            const color = getStateColor(st.state, idx);

            return (
              <div
                key={st.state}
                onClick={() => onSelectState(isSelected ? 'all' : st.state)}
                onMouseEnter={() => onHoverState(st.state)}
                onMouseLeave={() => onHoverState(null)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-600/30'
                    : isHovered
                    ? 'bg-slate-50 border-slate-300'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{st.state}</span>
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900">{st.count}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{st.percentage}% share</span>
                  <span className="text-emerald-700 font-bold">{st.passRate}% Hire+</span>
                </div>

                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, st.percentage * 2)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-slate-100">
                  <span>
                    Avg: <strong className="text-slate-700 font-mono">{st.avgScore}</strong>
                  </span>
                  <span className="text-indigo-600 font-medium truncate max-w-[80px]">
                    {st.topCandidateName.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

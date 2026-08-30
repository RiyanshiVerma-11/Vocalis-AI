// DifficultyChart.tsx
// Live difficulty progression sparkline — shows how the interview
// difficulty has evolved turn-by-turn as the AI panel adapts.
// Used in LivePanelContext sidebar to visually demonstrate
// "Difficulty Adjustment based on Candidate Performance" (PS11 requirement).

import React from 'react';
import { QuestionHistoryItem, DifficultyLevel } from '../types';
import { TrendingUp } from 'lucide-react';

interface DifficultyChartProps {
  questionHistory: QuestionHistoryItem[];
  currentDifficulty: DifficultyLevel;
}

const LEVEL_VALUE: Record<DifficultyLevel, number> = {
  Foundational: 1,
  Intermediate: 2,
  Senior: 3,
  'Staff/Principal': 4,
};

const LEVEL_COLOR: Record<DifficultyLevel, string> = {
  Foundational: '#10b981',  // emerald
  Intermediate: '#3b82f6',  // blue
  Senior: '#8b5cf6',        // violet
  'Staff/Principal': '#f59e0b', // amber
};

const LEVEL_LABEL: Record<DifficultyLevel, string> = {
  Foundational: 'Found.',
  Intermediate: 'Inter.',
  Senior: 'Senior',
  'Staff/Principal': 'Staff+',
};

export const DifficultyChart: React.FC<DifficultyChartProps> = ({
  questionHistory,
  currentDifficulty,
}) => {
  // Build data points from question history (max last 10 turns)
  const dataPoints: Array<{ label: string; level: DifficultyLevel; value: number }> = [];

  questionHistory.slice(-10).forEach((q, idx) => {
    if (q.difficultyLevel) {
      dataPoints.push({
        label: `Q${q.turnNumber || idx + 1}`,
        level: q.difficultyLevel,
        value: LEVEL_VALUE[q.difficultyLevel],
      });
    }
  });

  if (dataPoints.length === 0) {
    dataPoints.push({ label: 'Start', level: currentDifficulty, value: LEVEL_VALUE[currentDifficulty] });
  }

  // Chart dimensions
  const W = 260;
  const H = 60;
  const PAD = { top: 6, right: 8, bottom: 4, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minVal = 1;
  const maxVal = 4;

  const toX = (idx: number) =>
    PAD.left + (dataPoints.length === 1 ? chartW / 2 : (idx / (dataPoints.length - 1)) * chartW);

  const toY = (val: number) =>
    PAD.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  // Build SVG polyline points
  const points = dataPoints
    .map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`)
    .join(' ');

  // Build filled area points (add bottom-left and bottom-right)
  const areaPoints = [
    `${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)}`,
    ...dataPoints.map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`),
    `${toX(dataPoints.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)}`,
  ].join(' ');

  const lastPoint = dataPoints[dataPoints.length - 1];

  // Trend: compare first and last
  const firstVal = dataPoints[0]?.value ?? LEVEL_VALUE[currentDifficulty];
  const lastVal = lastPoint?.value ?? LEVEL_VALUE[currentDifficulty];
  const trending = lastVal > firstVal ? 'up' : lastVal < firstVal ? 'down' : 'flat';

  return (
    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          Difficulty Trajectory
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
            style={{
              backgroundColor: `${LEVEL_COLOR[currentDifficulty]}18`,
              borderColor: `${LEVEL_COLOR[currentDifficulty]}55`,
              color: LEVEL_COLOR[currentDifficulty],
            }}
          >
            {currentDifficulty}
          </span>
          {trending !== 'flat' && (
            <span
              className={`text-[10px] font-bold ${trending === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}
            >
              {trending === 'up' ? '↑ Escalating' : '↓ Adjusted'}
            </span>
          )}
        </div>
      </div>

      {/* SVG Sparkline */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ maxHeight: 60 }}
      >
        {/* Gridlines at each difficulty level */}
        {[1, 2, 3, 4].map((v) => (
          <line
            key={v}
            x1={PAD.left}
            y1={toY(v)}
            x2={PAD.left + chartW}
            y2={toY(v)}
            stroke="#e2e8f0"
            strokeWidth={0.8}
            strokeDasharray="3,3"
          />
        ))}

        {/* Filled area under the line */}
        {dataPoints.length > 1 && (
          <polygon
            points={areaPoints}
            fill="url(#diffGradient)"
            opacity={0.25}
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="diffGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Polyline */}
        {dataPoints.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Data point dots */}
        {dataPoints.map((d, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(d.value)}
            r={3.5}
            fill={LEVEL_COLOR[d.level]}
            stroke="#fff"
            strokeWidth={1.5}
          />
        ))}

        {/* Y-axis labels */}
        {[1, 2, 3, 4].map((v) => {
          const levelMap: Record<number, DifficultyLevel> = {
            1: 'Foundational',
            2: 'Intermediate',
            3: 'Senior',
            4: 'Staff/Principal',
          };
          return (
            <text
              key={v}
              x={PAD.left - 2}
              y={toY(v) + 3}
              fontSize={7}
              fill="#94a3b8"
              textAnchor="end"
              fontFamily="monospace"
            >
              {LEVEL_LABEL[levelMap[v]]}
            </text>
          );
        })}
      </svg>

      <p className="text-[10px] text-slate-400 font-mono">
        {dataPoints.length} turns tracked · Panel adapts in real time
      </p>
    </div>
  );
};

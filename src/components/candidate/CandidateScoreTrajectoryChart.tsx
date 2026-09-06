import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ScoreTrajectoryPoint {
  id: string;
  score: number;
  label: string;
}

interface CandidateScoreTrajectoryChartProps {
  trajectory: ScoreTrajectoryPoint[];
  scoreDelta: number;
}

export const CandidateScoreTrajectoryChart: React.FC<CandidateScoreTrajectoryChartProps> = ({
  trajectory,
  scoreDelta,
}) => {
  const chartW = 600;
  const chartH = 130;
  const pad = { top: 20, right: 24, bottom: 22, left: 32 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  const getX = (i: number) =>
    pad.left + (trajectory.length <= 1 ? innerW / 2 : (i / (trajectory.length - 1)) * innerW);
  const getY = (v: number) =>
    pad.top + innerH - ((Math.max(30, Math.min(100, v)) - 30) / 70) * innerH;

  const polyline = trajectory
    .map((p, i) => `${getX(i).toFixed(1)},${getY(p.score).toFixed(1)}`)
    .join(' ');

  const area =
    trajectory.length > 0
      ? [
          `${getX(0).toFixed(1)},${(pad.top + innerH).toFixed(1)}`,
          ...trajectory.map((p, i) => `${getX(i).toFixed(1)},${getY(p.score).toFixed(1)}`),
          `${getX(trajectory.length - 1).toFixed(1)},${(pad.top + innerH).toFixed(1)}`,
        ].join(' ')
      : '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between h-full space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">My Score Over Time</h2>
            <p className="text-[10px] text-slate-500">Each point = one practice session</p>
          </div>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
            scoreDelta >= 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {scoreDelta >= 0 ? '↑' : '↓'} {Math.abs(scoreDelta)}% change
        </span>
      </div>

      <div className="w-full overflow-x-auto my-auto py-1 flex items-center">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-32 sm:h-36">
          <defs>
            <linearGradient id="candAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[40, 60, 80].map((score) => (
            <g key={score}>
              <line
                x1={pad.left}
                y1={getY(score)}
                x2={chartW - pad.right}
                y2={getY(score)}
                stroke="#f1f5f9"
                strokeDasharray="3,4"
              />
              <text
                x={pad.left - 4}
                y={getY(score) + 3}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
              >
                {score}%
              </text>
            </g>
          ))}
          {area && <polygon points={area} fill="url(#candAreaGrad)" />}
          {polyline && (
            <polyline
              points={polyline}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {trajectory.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.score);
            const isLast = i === trajectory.length - 1;
            return (
              <g key={p.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLast ? 5 : 3}
                  fill={p.score >= 70 ? '#10b981' : p.score >= 50 ? '#f59e0b' : '#ef4444'}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy - 7}
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {p.score}%
                </text>
                <text
                  x={cx}
                  y={chartH - 5}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-3 text-[10px] pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 70%+ Good
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 50–70% Developing
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Below 50% Needs Work
        </span>
      </div>
    </div>
  );
};

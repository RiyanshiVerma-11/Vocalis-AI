import React from 'react';
import { Target, CheckCircle2, Star } from 'lucide-react';

interface CandidateReadinessCardProps {
  level: string;
  readinessStep: number;
}

const JOURNEY_STEPS = ['Beginner', 'Developing', 'Intermediate', 'Senior', 'Expert'];

export const CandidateReadinessCard: React.FC<CandidateReadinessCardProps> = ({
  level,
  readinessStep,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">Your Readiness Journey</h2>
          <p className="text-[10px] text-slate-500">Based on your average performance across all sessions</p>
        </div>
      </div>

      <div className="flex items-center gap-1 relative">
        {JOURNEY_STEPS.map((step, i) => {
          const isActive = i === readinessStep;
          const isPast = i < readinessStep;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-100'
                      : isPast
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-[9px] font-bold text-center ${
                    isActive ? 'text-indigo-700' : isPast ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mb-3 rounded-full ${
                    i < readinessStep ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
        <Star className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <p className="text-xs text-indigo-800">
          <strong>You're at {level} level.</strong>{' '}
          {readinessStep < 4
            ? `Keep practicing — you're ${JOURNEY_STEPS.length - 1 - readinessStep} level${
                JOURNEY_STEPS.length - 1 - readinessStep !== 1 ? 's' : ''
              } away from Expert.`
            : `You've reached Expert level — outstanding work!`}
        </p>
      </div>
    </div>
  );
};

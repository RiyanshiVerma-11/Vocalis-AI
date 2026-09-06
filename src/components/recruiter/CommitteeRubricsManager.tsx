import React from 'react';
import { Plus, Play } from 'lucide-react';
import { CustomCompanyRubric, InterviewScenario, Interviewer, CandidateResume, DifficultyLevel } from '../../types';
import { INTERVIEW_SCENARIOS } from '../../data/scenarios';
import { ALL_INTERVIEWERS } from '../../data/interviewers';
import { createDefaultCandidateResume } from '../../data/resumes';

interface CommitteeRubricsManagerProps {
  customRubrics: CustomCompanyRubric[];
  onOpenRubricModal: (rubricToEdit?: CustomCompanyRubric | null) => void;
  onApplyCustomRubric: (rubric: CustomCompanyRubric, launchImmediately?: boolean) => void;
  onStartInterview: (config: {
    scenario: InterviewScenario;
    activePanel: Interviewer[];
    candidateName: string;
    targetRole: string;
    initialDifficulty: DifficultyLevel;
    candidateResume: CandidateResume;
    customRubric?: CustomCompanyRubric;
  }) => void;
}

export const CommitteeRubricsManager: React.FC<CommitteeRubricsManagerProps> = ({
  customRubrics,
  onOpenRubricModal,
  onApplyCustomRubric,
  onStartInterview,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Active Job Openings & Committee Leveling Rubrics
          </h3>
          <p className="text-xs text-slate-500">
            Auto-calibrated AI committee panels and strictness bars per opening.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenRubricModal(null)}
          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Import Custom Rubric PDF / Matrix</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Render Custom / Imported Rubrics */}
        {customRubrics.map((cr) => (
          <div
            key={cr.id}
            className="bg-white p-4 rounded-xl border border-indigo-200/80 space-y-3 hover:border-indigo-500 transition flex flex-col justify-between shadow-xs hover:shadow-md ring-1 ring-indigo-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold uppercase">
                  {cr.companyName} Bar
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    cr.strictnessRating === 'Exacting'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : cr.strictnessRating === 'Strict'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {cr.strictnessRating} Standard
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">{cr.targetLevel}</h4>
              <p className="text-[11px] text-slate-600 line-clamp-2">
                Calibrated weights: Arch {cr.rubricWeights.technicalArchitecture}%, Problem Solving{' '}
                {cr.rubricWeights.problemSolvingAndAgility}%, Leadership{' '}
                {cr.rubricWeights.leadershipAndOwnership}%.
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Key Signals: {cr.keySignals?.length || 0}</span>
                  <span>Must-Ask Qs: {cr.mandatoryQuestions?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenRubricModal(cr)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200 text-center"
              >
                Edit / Inspect
              </button>

              <button
                type="button"
                onClick={() => onApplyCustomRubric(cr, true)}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3" />
                <span>Launch Screen</span>
              </button>
            </div>
          </div>
        ))}

        {/* Standard Scenarios */}
        {INTERVIEW_SCENARIOS.slice(0, 2).map((sc, idx) => (
          <div
            key={sc.id}
            className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 hover:border-indigo-500/50 transition flex flex-col justify-between shadow-xs hover:shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold uppercase">
                  Standard Req #{101 + idx}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">{sc.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{sc.description}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                onStartInterview({
                  scenario: sc,
                  activePanel: ALL_INTERVIEWERS.slice(0, 3),
                  candidateName: 'Candidate',
                  targetRole: sc.title,
                  initialDifficulty: 'Senior',
                  candidateResume: createDefaultCandidateResume('Candidate', sc.targetRole),
                })
              }
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch Candidate Round</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

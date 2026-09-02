import React, { useState } from 'react';
import { TurnCheckpoint, CoachBlueprint, BranchComparison, turnForkService } from '../services/turnForkService';
import {
  GitFork,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Mic,
  ArrowRight,
  ShieldAlert,
  Zap,
  TrendingUp,
  Award,
  Layers,
  X,
  Clock,
  BookOpen,
} from 'lucide-react';

interface TurnTimeMachineModalProps {
  checkpoint: TurnCheckpoint;
  isOpen: boolean;
  onClose: () => void;
  onApplyFork: (checkpoint: TurnCheckpoint, newAnswer?: string) => void;
}

export const TurnTimeMachineModal: React.FC<TurnTimeMachineModalProps> = ({
  checkpoint,
  isOpen,
  onClose,
  onApplyFork,
}) => {
  if (!isOpen) return null;

  const [newAnswer, setNewAnswer] = useState(checkpoint.originalAnswer || '');
  const [activeTab, setActiveTab] = useState<'retry' | 'coach'>('retry');
  const [isDictating, setIsDictating] = useState(false);

  const blueprint: CoachBlueprint = turnForkService.generateCoachBlueprint(
    checkpoint.questionText,
    checkpoint.interviewerRole
  );

  const comparison: BranchComparison = turnForkService.evaluateRetryComparison(
    checkpoint.originalAnswer || '',
    newAnswer
  );

  const handleUseSampleFraming = () => {
    setNewAnswer(blueprint.idealSampleFraming.replace(/^"|"$/g, ''));
    setActiveTab('retry');
  };

  const handleForkWithAnswer = () => {
    if (!newAnswer.trim()) {
      alert('Please provide your revised answer before branching, or click "Rewind Floor" to answer live via voice.');
      return;
    }
    onApplyFork(checkpoint, newAnswer.trim());
    onClose();
  };

  const handleRewindOnly = () => {
    if (confirm('Rewind interview floor to this question? You can then speak your answer live using the microphone.')) {
      onApplyFork(checkpoint, undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200 animate-scale-up">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  ⚡ Interactive Turn Time-Machine
                </span>
                <span className="text-xs text-slate-400 font-mono">Turn #{checkpoint.turnIndex + 1}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">Fork & Retry Interview Branch</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Question Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {checkpoint.interviewerName[0]}
                </span>
                <span className="font-bold text-white">{checkpoint.interviewerName}</span>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.2 rounded border border-indigo-800/60 uppercase">
                  {checkpoint.interviewerRole.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(checkpoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 italic">
              "{checkpoint.questionText}"
            </p>
          </div>

          {/* Original Answer & Flags Summary */}
          {checkpoint.originalAnswer && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Original Attempt Response:
                </span>
                {checkpoint.flagsRaised.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {checkpoint.flagsRaised.length} Blindspots Flagged
                  </span>
                )}
              </div>
              <p className="text-slate-300 italic text-[11px] line-clamp-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                "{checkpoint.originalAnswer}"
              </p>

              {checkpoint.flagsRaised.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {checkpoint.flagsRaised.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    >
                      ⚠️ {f.type.replace('_', ' ')}: {f.explanation}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1 text-xs">
            <button
              onClick={() => setActiveTab('retry')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'retry'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Retry Sandbox & Score Diff</span>
            </button>
            <button
              onClick={() => setActiveTab('coach')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'coach'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>AI Coach Staff+ Blueprint</span>
            </button>
          </div>

          {/* Tab 1: Retry Sandbox & Live Diff */}
          {activeTab === 'retry' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Craft Your Improved Answer (Type or Edit Below):
                </label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  placeholder="Lead with concrete scale constraints, clear architectural trade-offs, and measurable business ROI..."
                />
              </div>

              {/* Side-by-side Live Diff / Improvement Score */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-Time Branch Quality Projection</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">{comparison.coachingSummary}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Technical Clarity</span>
                      <span className="text-white font-mono font-bold">{comparison.newClarity}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${comparison.newClarity}%` }}
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Business Impact Depth</span>
                      <span className="text-white font-mono font-bold">{comparison.newImpact}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${comparison.newImpact}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {comparison.flagsResolved.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400">Resolved Blindspots:</span>
                    {comparison.flagsResolved.map((res, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {res}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: AI Coach Staff+ Blueprint */}
          {activeTab === 'coach' && (
            <div className="space-y-3 text-xs animate-fade-in">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  Target Competency: {blueprint.targetCompetency}
                </span>
                <h3 className="font-bold text-white text-xs">Recommended 4-Step Structural Framework</h3>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {blueprint.recommendedStructure.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold font-mono">▸</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Staff+ Bar Raisers
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {blueprint.staffLevelKeyPoints.map((pt, idx) => (
                      <li key={idx}>• {pt}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" /> Common Pitfalls
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {blueprint.commonPitfallsToAvoid.map((pit, idx) => (
                      <li key={idx}>• {pit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Sample Gold-Standard Answer
                  </span>
                  <button
                    onClick={handleUseSampleFraming}
                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded-md transition cursor-pointer"
                  >
                    Copy to Sandbox
                  </button>
                </div>
                <p className="text-[11px] text-slate-200 italic leading-relaxed">
                  {blueprint.idealSampleFraming}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleRewindOnly}
            className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
            title="Roll back transcript to this point and speak your answer live via microphone"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Rewind Floor Only (Speak Live)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-1/2 sm:w-auto text-xs font-medium px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleForkWithAnswer}
              className="w-1/2 sm:w-auto text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork & Branch Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

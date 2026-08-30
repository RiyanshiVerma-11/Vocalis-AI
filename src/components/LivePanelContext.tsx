import React from 'react';
import { SharedCandidateContext, DifficultyLevel, AnalysisFlag } from '../types';
import { Gauge, ShieldAlert, CheckCircle2, AlertTriangle, MessageSquareCode, TrendingUp, HelpCircle, Activity, Zap, Radio, AlertCircle, CheckCircle } from 'lucide-react';
import { DifficultyChart } from './DifficultyChart';

interface LivePanelContextProps {
  context: SharedCandidateContext;
  onEndInterview: () => void;
  isProcessing: boolean;
  agoraMode?: 'conversational-ai' | 'rtc-transport' | 'offline';
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const LivePanelContext: React.FC<LivePanelContextProps> = ({
  context,
  onEndInterview,
  isProcessing,
  agoraMode = 'offline',
  isFocusMode = false,
  onToggleFocusMode,
}) => {
  const getDifficultyColor = (level: DifficultyLevel) => {
    switch (level) {
      case 'Foundational':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Intermediate':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Senior':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Staff/Principal':
        return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  const getDifficultyProgress = (level: DifficultyLevel) => {
    switch (level) {
      case 'Foundational':
        return 25;
      case 'Intermediate':
        return 50;
      case 'Senior':
        return 75;
      case 'Staff/Principal':
        return 100;
    }
  };

  const getFlagStyle = (flag: AnalysisFlag) => {
    switch (flag.type) {
      case 'contradiction': return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />, label: '⚡ Contradiction' };
      case 'vague': return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600" />, label: '⚠️ Vague Answer' };
      case 'missing_impact': return { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800', icon: <AlertCircle className="w-3.5 h-3.5 text-purple-600" />, label: '🎯 Missing Business Impact' };
      case 'strong_insight': return { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />, label: '✨ Strong Insight' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: <Zap className="w-3.5 h-3.5" />, label: flag.type };
    }
  };

  const recentFlags = (context.flaggedItems || []).slice(-3).reverse();

  const competencies = [
    { label: 'Technical Architecture & Scale', val: context.competencyScores.technicalArchitecture, color: 'bg-blue-600' },
    { label: 'Business & Customer Impact', val: context.competencyScores.businessAndCustomerImpact, color: 'bg-purple-600' },
    { label: 'Communication & Conciseness', val: context.competencyScores.communicationAndClarity, color: 'bg-emerald-600' },
    { label: 'Leadership & Team Ownership', val: context.competencyScores.leadershipAndOwnership, color: 'bg-amber-600' },
    { label: 'Problem Solving & Agility', val: context.competencyScores.problemSolvingAndAgility, color: 'bg-indigo-600' },
  ];

  if (isFocusMode) {
    return (
      <div id="live-panel-context-container" className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧘</span>
            <div>
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Focus Mode Active</h2>
              <p className="text-[11px] text-slate-400">Zero-Distraction Candidate View</p>
            </div>
          </div>
          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
            >
              Show Telemetry 📊
            </button>
          )}
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/80 space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Relax & Speak Naturally</span>
          </p>
          <p>
            Backstage thoughts, difficulty sparklines, and flag indicators are hidden during live speech so you can answer with maximum confidence.
          </p>
          <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside pt-1">
            <li>Need time to think? Click <strong>⏸️ Hold Floor</strong> anytime.</li>
            <li>Didn't understand a question? Say <em>"Could you rephrase that?"</em> for a penalty-free clarification!</li>
            <li>All transcript evidence & evaluation metrics are saved for your final assessment.</li>
          </ul>
        </div>

        <button
          id="btn-complete-and-assess"
          type="button"
          onClick={onEndInterview}
          disabled={isProcessing}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Finish & Evaluate Interview</span>
        </button>
      </div>
    );
  }

  return (
    <div id="live-panel-context-container" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-5">
      {/* Top Header with Agora Mode Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Shared Panel Context & State
          </h2>
          {/* Agora connection status badge */}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider flex items-center gap-1 ${
            agoraMode === 'conversational-ai'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : agoraMode === 'rtc-transport'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <Radio className="w-2.5 h-2.5" />
            {agoraMode === 'conversational-ai' ? 'Agora AI' : agoraMode === 'rtc-transport' ? 'Agora RTC' : 'Offline'}
          </span>
        </div>

        <button
          id="btn-complete-and-assess"
          type="button"
          onClick={onEndInterview}
          disabled={isProcessing}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Finish & Evaluate</span>
        </button>
      </div>

      {/* ⚡ LIVE ALERT FEED — Real-time contradiction/vague/impact detection */}
      {recentFlags.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-widest">Live Alerts</span>
            <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold">{recentFlags.length}</span>
          </div>
          <div className="space-y-1.5">
            {recentFlags.map((flag, idx) => {
              const style = getFlagStyle(flag);
              return (
                <div key={idx} className={`p-2.5 rounded-xl border ${style.bg} ${style.border} space-y-0.5`}>
                  <div className="flex items-center gap-1.5">
                    {style.icon}
                    <span className={`text-[11px] font-bold ${style.text}`}>{style.label}</span>
                    <span className={`ml-auto text-[10px] font-medium uppercase ${flag.severity === 'high' ? 'text-red-600' : flag.severity === 'medium' ? 'text-amber-600' : 'text-slate-400'}`}>
                      {flag.severity}
                    </span>
                  </div>
                  {flag.quote && (
                    <p className={`text-[11px] italic ${style.text} opacity-90 leading-relaxed`}>
                      "{flag.quote.length > 80 ? flag.quote.slice(0, 80) + '…' : flag.quote}"
                    </p>
                  )}
                  {flag.suggestedProbe && (
                    <p className="text-[10px] text-indigo-600 font-medium">
                      → {flag.suggestedProbe}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Adaptive Difficulty Trajectory Chart */}
      <DifficultyChart
        questionHistory={context.questionHistory || []}
        currentDifficulty={context.currentDifficulty}
      />

      {/* Real-time Competency Scorecard */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Live Competency Calibration
          </span>
          <span className="text-[11px] text-slate-400 font-medium">0-100 Scale</span>
        </div>

        <div className="space-y-2">
          {competencies.map((comp, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 truncate max-w-[200px]">{comp.label}</span>
                <span className="text-slate-900 font-mono font-bold">{comp.val}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full ${comp.color} transition-all duration-500`}
                  style={{ width: `${comp.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Running Solution Summary */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>Synthesized Candidate Profile</span>
        </span>
        <p className="text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
          {context.runningSummary || 'Awaiting candidate responses...'}
        </p>
      </div>

      {/* Unresolved Probes & Questions Tracked by Panel */}
      {context.unresolvedProbes && context.unresolvedProbes.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Active Panel Probes to Resolve ({context.unresolvedProbes.length})</span>
          </span>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {context.unresolvedProbes.map((probe, pIdx) => (
              <div
                key={pIdx}
                className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg font-medium"
              >
                • {probe}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backstage Internal Panel Notes Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquareCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Backstage Interviewer Notes ({context.backstagePanelNotes.length})</span>
          </span>
        </div>

        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {context.backstagePanelNotes.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No internal notes yet.</p>
          ) : (
            context.backstagePanelNotes.slice(-5).map((note, nIdx) => (
              <div
                key={nIdx}
                className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-indigo-700 capitalize">
                    {note.authorName} ({note.authorRole.replace('_', ' ')})
                  </span>
                  <span className="text-slate-400 font-mono">
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{note.note}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

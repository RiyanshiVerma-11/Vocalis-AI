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

  const isCalibrated = Boolean(
    context.competencyScores?.isCalibrated ||
    (context.questionHistory || []).some((q) => q.candidateResponseSummary || q.candidateDepth)
  );

  if (isFocusMode) {
    return (
      <div id="live-panel-context-container" className="bg-[#0b101b] text-white rounded-xl p-3 shadow-xl border border-slate-800/90 h-full flex flex-col justify-between min-h-0">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🧘</span>
            <div>
              <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Focus Mode Active</h2>
              <p className="text-[9px] text-slate-400">Zero-Distraction View</p>
            </div>
          </div>
          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
            >
              Show Telemetry 📊
            </button>
          )}
        </div>

        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 space-y-2 text-[11px] leading-relaxed text-slate-300 flex-1 min-h-0 overflow-y-auto my-2">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Relax & Speak Naturally</span>
          </p>
          <p>
            Backstage thoughts, difficulty graphs, and flag indicators are hidden so you can answer with maximum confidence.
          </p>
          <ul className="space-y-1 text-[10px] text-slate-400 list-disc list-inside pt-1">
            <li>Need time to think? Click <strong>⏸️ Hold Floor</strong> anytime.</li>
            <li>Direct your answer to any specific interviewer by clicking their card above.</li>
            <li>Voice engine adapts difficulty to your depth without penalty for clarifying questions.</li>
          </ul>
        </div>

        <button
          id="btn-complete-and-assess-focus"
          type="button"
          onClick={onEndInterview}
          disabled={isProcessing}
          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Finish & Evaluate Interview</span>
        </button>
      </div>
    );
  }

  return (
    <div id="live-panel-context-container" className="bg-[#0b101b] text-slate-200 rounded-xl border border-slate-800/90 p-2 sm:p-2.5 shadow-xl flex flex-col h-full min-h-0 space-y-2">
      {/* Top Header with Agora Mode Indicator */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-[10px] font-extrabold text-slate-200 uppercase tracking-widest">
              Competency Scorecard
            </h2>
            <p className="text-[8px] text-slate-400">Synchronized memory across panel</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Agora connection status badge */}
          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider flex items-center gap-1 ${
            agoraMode === 'conversational-ai'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : agoraMode === 'rtc-transport'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
          }`}>
            <Radio className="w-2 h-2" />
            {agoraMode === 'conversational-ai' ? 'Voice AI' : agoraMode === 'rtc-transport' ? 'Agora RTC' : 'Local'}
          </span>

          <button
            id="btn-complete-and-assess"
            type="button"
            onClick={onEndInterview}
            disabled={isProcessing}
            className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition cursor-pointer flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Internal Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {/* 🧠 ACTIVE ADAPTIVE STRATEGY HUD */}
        {context.latestAdaptiveAnalysis?.lastStrategy && (
          <div className="p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-cyan-400" /> Strategy Applied
              </span>
              <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                {context.latestAdaptiveAnalysis.lastStrategy}
              </span>
            </div>
            {context.latestAdaptiveAnalysis.detectedKeywords && context.latestAdaptiveAnalysis.detectedKeywords.length > 0 && (
              <p className="text-[9px] text-slate-400 pt-0.5">
                <strong>Analyzed:</strong> {context.latestAdaptiveAnalysis.detectedKeywords.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* ⚡ LIVE ALERT FEED */}
        {recentFlags.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-rose-400 animate-pulse" />
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Live Deliberation Flags</span>
              <span className="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 rounded-full font-bold">{recentFlags.length}</span>
            </div>
            <div className="space-y-1">
              {recentFlags.map((flag, idx) => {
                const style = getFlagStyle(flag);
                return (
                  <div key={idx} className="p-2 rounded-lg border border-slate-800 bg-slate-900/90 space-y-0.5">
                    <div className="flex items-center gap-1">
                      {style.icon}
                      <span className="text-[10px] font-bold text-slate-200">{style.label}</span>
                      <span className="ml-auto text-[8px] font-mono uppercase text-rose-400">
                        {flag.severity}
                      </span>
                    </div>
                    {flag.quote && (
                      <p className="text-[10px] italic text-slate-400 leading-tight">
                        "{flag.quote.length > 70 ? flag.quote.slice(0, 70) + '…' : flag.quote}"
                      </p>
                    )}
                    {flag.suggestedProbe && (
                      <p className="text-[9px] text-cyan-300">
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Live Competency Calibration
          </span>
          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${
            isCalibrated 
              ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' 
              : 'bg-amber-950/60 text-amber-400 border-amber-500/30 animate-pulse'
          }`}>
            {isCalibrated ? '0-100% Dynamic' : 'Calibrating Baseline...'}
          </span>
        </div>

        <div className="space-y-1.5">
          {competencies.map((comp, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-300 truncate max-w-[180px]">{comp.label}</span>
                <span className={`font-mono font-bold text-[10px] ${isCalibrated ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {isCalibrated ? `${comp.val}%` : '--% (Pending)'}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${comp.color} transition-all duration-500 ${
                    isCalibrated ? 'shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'opacity-20'
                  }`}
                  style={{ width: isCalibrated ? `${comp.val}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
        {!isCalibrated && (
          <p className="text-[9px] text-amber-400/90 italic flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Awaiting candidate answer to calibrate baseline
          </p>
        )}
      </div>

      {/* Running Solution Summary */}
      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
        <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-cyan-400" />
          <span>Synthesized Candidate Profile</span>
        </span>
        <p className="text-[11px] text-slate-400 leading-relaxed max-h-20 overflow-y-auto">
          {context.runningSummary || 'Awaiting candidate responses...'}
        </p>
      </div>

      {/* Unresolved Probes & Questions Tracked by Panel */}
      {context.unresolvedProbes && context.unresolvedProbes.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Active Probes ({context.unresolvedProbes.length})</span>
          </span>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {context.unresolvedProbes.map((probe, pIdx) => (
              <div
                key={pIdx}
                className="text-[10px] text-amber-200 bg-amber-950/50 border border-amber-800/50 p-1.5 rounded-lg font-medium"
              >
                • {probe}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backstage Internal Panel Notes Feed */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <MessageSquareCode className="w-3 h-3 text-cyan-400" />
            <span>Panel Notes ({context.backstagePanelNotes.length})</span>
          </span>
        </div>

        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
          {context.backstagePanelNotes.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic">No internal notes yet.</p>
          ) : (
            context.backstagePanelNotes.slice(-5).map((note, nIdx) => (
              <div
                key={nIdx}
                className="text-[10px] p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5"
              >
                <div className="flex items-center justify-between text-[9px]">
                  <span className="font-bold text-cyan-400 capitalize">
                    {note.authorName} ({note.authorRole.replace('_', ' ')})
                  </span>
                  <span className="text-slate-500 font-mono">
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 text-[10px] leading-relaxed">{note.note}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

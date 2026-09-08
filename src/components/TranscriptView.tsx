import React, { useRef, useEffect, useState } from 'react';
import { TranscriptMessage, AnalysisFlag, AdaptiveStrategy } from '../types';
import {
  AlertCircle,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Sparkles,
  Zap,
  Target,
  Brain,
  FileText,
  GitFork,
} from 'lucide-react';

interface TranscriptViewProps {
  transcript: TranscriptMessage[];
  isProcessing: boolean;
  activeInterviewerName?: string;
  isFocusMode?: boolean;
  onForkTurn?: (turnIndex: number) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  isProcessing,
  isFocusMode = false,
  onForkTurn,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }, [transcript, isProcessing]);

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getFlagBadge = (flag: AnalysisFlag) => {
    if (isFocusMode) return null; // Hide intimidating red flags during Focus Mode!

    switch (flag.type) {
      case 'contradiction':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Contradiction Detected
          </span>
        );
      case 'vague':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
            <HelpCircle className="w-3 h-3" /> Vague / Needs Probing
          </span>
        );
      case 'missing_impact':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> Missing Business/Customer Impact
          </span>
        );
      case 'strong_insight':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            <CheckCircle className="w-3 h-3" /> Strong Architectural Insight
          </span>
        );
      default:
        return null;
    }
  };

  const getStrategyBadge = (strategy?: AdaptiveStrategy | string) => {
    if (!strategy) return null;
    if (strategy === 'Clarify & Simplify' || strategy === 'Simplify & Rephrase') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <Sparkles className="w-3 h-3 text-teal-600" /> 💡 Question Rephrased (No Penalty)
        </span>
      );
    }

    switch (strategy) {
      case 'Deep Probe':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Target className="w-3 h-3" /> Deep Architectural Probe
          </span>
        );
      case 'Challenge Assumption':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Zap className="w-3 h-3" /> Challenge Assumption
          </span>
        );
      case 'Explore Alternative':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Brain className="w-3 h-3" /> Explore Alternatives & Trade-offs
          </span>
        );
      case 'Off-Script Pivot':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3 h-3" /> Dynamic Resume Pivot
          </span>
        );
      case 'Cross-Role Handoff':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <User className="w-3 h-3" /> Cross-Role Handoff
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="transcript-view-panel" className="bg-[#0b101b] rounded-xl border border-slate-800/90 p-2 sm:p-2.5 shadow-xl flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-[10px] font-extrabold text-slate-200 uppercase tracking-widest">
            Real-Time Transcript
          </h2>
          <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded-full border border-cyan-500/30">
            {transcript.length} turns
          </span>
        </div>
        <div className="text-[9px] font-medium text-slate-400 hidden sm:block">
          Timestamped & Quote-Indexed
        </div>
      </div>

      {/* Transcript Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <User className="w-7 h-7 mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-semibold text-slate-300">The interview room is open and ready.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Click "Enable Mic" or choose a prompt to begin the panel conversation.
            </p>
          </div>
        ) : (
          transcript.map((msg, index) => {
            const isCandidate = msg.speakerRole === 'candidate';
            const isThoughtOpen = expandedThoughts[msg.id] ?? false;

            return (
              <div
                key={msg.id}
                id={`transcript-turn-${index + 1}`}
                className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                  isCandidate
                    ? 'bg-indigo-950/40 border-indigo-500/30 ml-2 sm:ml-4 text-slate-100 shadow-xs'
                    : 'bg-slate-900/80 border-slate-800/90 mr-2 sm:mr-4 text-slate-200'
                }`}
              >
                {/* Message Header */}
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isCandidate
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {msg.speakerName[0]}
                    </span>
                    <span className="text-[11px] font-bold text-white">
                      {msg.speakerName}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800/80 px-1 py-0.2 rounded border border-slate-700/60">
                      {msg.speakerRole.replace('_', ' ')}
                    </span>
                    {msg.isDebateTurn && (
                      <span className="text-[8px] bg-amber-500/10 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-2 h-2 text-amber-400" /> Debate
                      </span>
                    )}
                    {msg.interrupted && (
                      <span className="text-[8px] bg-rose-500/10 text-rose-300 px-1 py-0.2 rounded border border-rose-500/30 font-bold uppercase tracking-wider">
                        Interrupted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    {msg.difficultyAtTurn && (
                      <span className="text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded font-mono font-bold border border-cyan-800/60 text-[8px]">
                        {msg.difficultyAtTurn}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-slate-400 text-[9px]">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    {onForkTurn && (
                      <button
                        type="button"
                        onClick={() => onForkTurn(index)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/60 text-[8px] font-bold transition cursor-pointer ml-0.5"
                        title="Fork & Retry from this turn using the Time-Machine"
                      >
                        <GitFork className="w-2.5 h-2.5" />
                        <span>Fork</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Adaptive Strategy & Resume Reference Header for Interviewers */}
                {!isCandidate && (msg.adaptiveStrategy || msg.referencedResumePoint) && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-200/80">
                    {getStrategyBadge(msg.adaptiveStrategy)}
                    {msg.referencedResumePoint && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <FileText className="w-3 h-3" /> Resume Highlight: {msg.referencedResumePoint}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <p className="text-xs sm:text-[12px] text-slate-100 leading-snug whitespace-pre-wrap">
                  {msg.content?.trim() ||
                    (msg.speakerRole === 'candidate'
                      ? '...'
                      : 'Could you walk us through the system architecture, component boundaries, and key technical trade-offs you evaluated?')}
                </p>

                {/* Adaptive Answer Evaluation (for Candidate Turns) */}
                {isCandidate && msg.adaptiveAnalysis && (
                  <div className="mt-1.5 pt-1 border-t border-indigo-500/20 flex flex-wrap items-center gap-1 text-[9px]">
                    {msg.adaptiveAnalysis.depthLevel === 'Clarification Requested' ||
                    (msg.adaptiveAnalysis.detectedKeywords && msg.adaptiveAnalysis.detectedKeywords.includes('clarification_request')) ||
                    /rephrase|repeat|clarify|what do you mean|didn't understand|could you explain/i.test(msg.content) ? (
                      <span className="inline-flex items-center gap-1 text-teal-300 bg-teal-950/80 px-1.5 py-0.2 rounded border border-teal-700/60 font-semibold text-[9px]">
                        <Sparkles className="w-2.5 h-2.5 text-teal-400" /> Clarification Requested (No Penalty)
                      </span>
                    ) : (
                      <>
                        <span className="text-slate-400 font-medium">Depth:</span>
                        <span className="px-1 py-0.2 rounded bg-indigo-900/80 text-indigo-200 font-bold font-mono text-[8px] border border-indigo-700/50">
                          {msg.adaptiveAnalysis.depthLevel}
                        </span>
                        <span className="text-slate-400 font-medium ml-1">Confidence:</span>
                        <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-medium text-[8px] border border-slate-700">
                          {msg.adaptiveAnalysis.sentiment}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Flagged Items on Candidate Turns */}
                {msg.detectedFlags && msg.detectedFlags.filter((f) => f.quote && f.quote.trim().length > 0).length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-indigo-500/20 space-y-1.5">
                    {msg.detectedFlags.filter((f) => f.quote && f.quote.trim().length > 0).map((flag, fIdx) => (
                      <div
                        key={fIdx}
                        className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          {getFlagBadge(flag)}
                          <span className="text-[9px] text-slate-400 font-mono capitalize">{flag.severity}</span>
                        </div>
                        <p className="text-slate-300">
                          <strong className="text-white">Quote:</strong> "{flag.quote}"
                        </p>
                        {flag.suggestedProbe && (
                          <p className="text-cyan-300 text-[10px]">
                            → {flag.suggestedProbe}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Internal Backstage Deliberation Thought (for Interviewers) */}
                {msg.internalThought && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                    <button
                      onClick={() => toggleThought(msg.id)}
                      className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-semibold transition cursor-pointer"
                    >
                      {isThoughtOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                      <span>Panel Backstage Deliberation Thought</span>
                    </button>
                    {isThoughtOpen && (
                      <div className="mt-1 p-2 bg-slate-950/90 rounded-lg border border-slate-800/80 text-[10px] text-slate-300 italic">
                        {msg.internalThought}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Real-time Thinking / Deliberating Indicator */}
        {isProcessing && (
          <div className="p-2 rounded-xl bg-indigo-950/50 border border-indigo-500/40 flex items-center gap-2 text-[11px] text-indigo-300 animate-pulse font-medium">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Panel is deliberating turn-taking and formulating follow-up...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};


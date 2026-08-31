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
} from 'lucide-react';

interface TranscriptViewProps {
  transcript: TranscriptMessage[];
  isProcessing: boolean;
  activeInterviewerName?: string;
  isFocusMode?: boolean;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  isProcessing,
  isFocusMode = false,
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
    <div id="transcript-view-panel" className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-sm flex flex-col h-[360px] sm:h-[400px] lg:h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Live Synchronized Interview Transcript
          </h2>
          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            {transcript.length} turns
          </span>
        </div>
        <div className="text-[10px] font-medium text-slate-400">
          Timestamped & Quote-Indexed
        </div>
      </div>

      {/* Transcript Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <User className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-semibold text-slate-600">The interview room is open and ready.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
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
                className={`p-3 rounded-xl border transition-all ${
                  isCandidate
                    ? 'bg-indigo-50/70 border-indigo-100 ml-2 sm:ml-6 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 mr-2 sm:mr-6 text-slate-800'
                }`}
              >
                {/* Message Header */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCandidate
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-300 text-slate-800'
                      }`}
                    >
                      {msg.speakerName[0]}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {msg.speakerName}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      {msg.speakerRole.replace('_', ' ')}
                    </span>
                    {msg.interrupted && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-200 font-bold uppercase tracking-wider">
                        Interrupted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    {msg.difficultyAtTurn && (
                      <span className="text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-mono font-medium border border-indigo-200 text-[9px]">
                        {msg.difficultyAtTurn}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-slate-400 text-[10px]">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
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
                <p className="text-xs sm:text-[13px] text-slate-800 leading-snug whitespace-pre-wrap">
                  {msg.content}
                </p>

                {/* Adaptive Answer Evaluation (for Candidate Turns) */}
                {isCandidate && msg.adaptiveAnalysis && (
                  <div className="mt-2 pt-1.5 border-t border-indigo-100/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-500 font-medium">Evaluated Depth:</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold font-mono text-[9px]">
                      {msg.adaptiveAnalysis.depthLevel}
                    </span>
                    <span className="text-slate-500 font-medium ml-1">Confidence:</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium text-[9px]">
                      {msg.adaptiveAnalysis.sentiment}
                    </span>
                    {msg.adaptiveAnalysis.detectedKeywords && msg.adaptiveAnalysis.detectedKeywords.length > 0 && (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-slate-400 text-[9px]">Keywords:</span>
                        {msg.adaptiveAnalysis.detectedKeywords.slice(0, 3).map((kw, kIdx) => (
                          <span key={kIdx} className="bg-white border border-slate-200 text-slate-600 px-1 py-0.2 rounded text-[9px] font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Flagged Items on Candidate Turns */}
                {msg.detectedFlags && msg.detectedFlags.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-indigo-100 space-y-2">
                    {msg.detectedFlags.map((flag, fIdx) => (
                      <div
                        key={fIdx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          {getFlagBadge(flag)}
                          <span className="text-[10px] text-slate-400 font-medium capitalize">Severity: {flag.severity}</span>
                        </div>
                        <p className="text-slate-700">
                          <strong className="text-slate-900">Cited Quote:</strong> "{flag.quote}"
                        </p>
                        <p className="text-slate-500">{flag.explanation}</p>
                        {flag.suggestedProbe && (
                          <p className="text-indigo-600 text-[11px] font-medium">
                            <strong>Suggested Probe:</strong> {flag.suggestedProbe}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Internal Backstage Deliberation Thought (for Interviewers) */}
                {msg.internalThought && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => toggleThought(msg.id)}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold transition cursor-pointer"
                    >
                      {isThoughtOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>Panel Backstage Deliberation Thought</span>
                    </button>
                    {isThoughtOpen && (
                      <div className="mt-1.5 p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 italic">
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
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2.5 text-xs text-indigo-800 animate-pulse font-medium">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span>Panel is deliberating turn-taking and formulating adaptive follow-up...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};


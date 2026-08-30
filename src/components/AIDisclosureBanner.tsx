import React, { useState } from 'react';
import { ShieldCheck, Info, X, Sparkles } from 'lucide-react';

export const AIDisclosureBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div id="ai-disclosure-banner" className="bg-slate-950 text-slate-300 border-b border-slate-800/70 text-xs transition-all">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 py-1.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-indigo-400" /> AI Interactive Demo
          </span>
          <p className="text-slate-400 text-xs">
            <strong className="text-slate-200">Synthetic Voice Panel:</strong> You are interviewing with autonomous AI interviewers representing distinct functional roles.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="btn-disclosure-details"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Info className="w-3 h-3 text-indigo-400" />
            {isExpanded ? 'Hide Info' : 'Guidelines & Ethics'}
          </button>
          <button
            id="btn-dismiss-disclosure"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div id="disclosure-expanded-panel" className="bg-slate-900 border-t border-slate-800 px-4 sm:px-8 lg:px-12 py-3.5 text-xs text-slate-300 shadow-xl">
          <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Real-Time Sub-100ms Voice</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Interviews are interactive. You can speak naturally or barge-in at any time to clarify trade-offs.
              </p>
            </div>

            <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Role AI Panel</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                4 distinct personas (Architect, Product VP, Engineering Director, Security Lead) deliberate backstage in real time.
              </p>
            </div>

            <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quote-Backed Scorecard</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Generates evidence scorecards with transcript citations after every session.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

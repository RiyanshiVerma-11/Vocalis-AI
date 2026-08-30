import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Bot, Cpu, Radio, ShieldCheck, Zap } from 'lucide-react';
import { CandidateResume, Interviewer, InterviewScenario } from '../types';

interface LaunchSessionModalProps {
  isOpen: boolean;
  candidateResume: CandidateResume;
  activePanel: Interviewer[];
  scenario: InterviewScenario;
  onComplete: () => void;
}

export const LaunchSessionModal: React.FC<LaunchSessionModalProps> = ({
  isOpen,
  candidateResume,
  activePanel,
  scenario,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'profile',
      label: `Synchronizing Resume: ${candidateResume.fullName || 'Candidate'}`,
      detail: `${candidateResume.headline || 'Software Engineer'} • ${candidateResume.notableProjects?.length || 0} Resume Projects Loaded`,
      icon: Cpu,
    },
    {
      id: 'panel',
      label: `Calibrating ${activePanel.length} AI Interview Panel Roles`,
      detail: activePanel.map((p) => p.name).join(', '),
      icon: Bot,
    },
    {
      id: 'audio',
      label: 'Initializing Sub-100ms Voice Transport & Audio Engine',
      detail: 'Connecting WebRTC / Agora Global SD-RTN Edge Nodes',
      icon: Radio,
    },
    {
      id: 'ready',
      label: 'Panel Calibrated & Room Live!',
      detail: `Initial opening question assigned to ${activePanel[0]?.name || 'Lead Interviewer'}`,
      icon: ShieldCheck,
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const timer1 = setTimeout(() => setCurrentStep(1), 400);
    const timer2 = setTimeout(() => setCurrentStep(2), 800);
    const timer3 = setTimeout(() => setCurrentStep(3), 1200);
    const timer4 = setTimeout(() => {
      onComplete();
    }, 1700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <Zap className="w-8 h-8 animate-pulse text-indigo-400" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Launching Real-Time Room</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Starting Voice Interview Session
          </h2>
          <p className="text-xs text-slate-400">
            Enterprise Multi-Role AI Panel calibrating personalized scenario context
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-3 relative z-10 pt-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3.5 ${
                  isDone
                    ? 'bg-slate-800/80 border-emerald-500/40 text-slate-200'
                    : isCurrent
                    ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 text-white shadow-lg'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCurrent
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Icon className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-200 truncate">{step.label}</p>
                    {isDone && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">READY</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-500 font-mono">
          Sub-100ms Voice Transport • Agora SD-RTN Enabled • Persona Sync
        </div>
      </div>
    </div>
  );
};

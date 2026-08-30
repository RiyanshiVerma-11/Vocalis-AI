import React from 'react';
import { X, Sparkles, Volume2, ShieldCheck, HelpCircle, BookOpen, Quote } from 'lucide-react';
import { Interviewer } from '../types';
import { renderAvatarIcon, getAvatarGradientClass } from '../utils/avatarUtils';

interface InterviewerPersonaModalProps {
  interviewer: Interviewer | null;
  onClose: () => void;
}

export const InterviewerPersonaModal: React.FC<InterviewerPersonaModalProps> = ({
  interviewer,
  onClose,
}) => {
  if (!interviewer) return null;

  const style = interviewer.speakingStyle;

  return (
    <div
      id="interviewer-persona-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="interviewer-persona-modal"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm ${getAvatarGradientClass(interviewer.avatarColor)}`}
            >
              {renderAvatarIcon(interviewer.avatarIcon, "w-6 h-6 text-white")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{interviewer.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase tracking-wider">
                  {interviewer.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {interviewer.title} • {interviewer.company}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Bio & Focus */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Role Focus & Objective
            </span>
            <p className="text-slate-600 leading-relaxed">{interviewer.focusArea}</p>
            <p className="text-slate-500 text-[11px] pt-1 border-t border-slate-200/80">
              {interviewer.defaultBio}
            </p>
          </div>

          {style && (
            <>
              {/* Speaking Style & Tone */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Distinct Speaking Style & Tone</span>
                </span>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 font-medium">
                  {style.tone}
                </div>
              </div>

              {/* Sample Voice Phrase */}
              {style.samplePhrase && (
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1">
                  <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Quote className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Signature Spoken Dialogue Example</span>
                  </span>
                  <p className="text-indigo-950 font-medium italic">"{style.samplePhrase}"</p>
                </div>
              )}

              {/* Questioning Strategy */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Adaptive Questioning Strategy</span>
                </span>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {style.questioningStrategy}
                </div>
              </div>

              {/* Signature Jargon */}
              {style.signatureJargon && style.signatureJargon.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Signature Domain Concepts & Terminology</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {style.signatureJargon.map((term, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-[10px] font-semibold border border-slate-200"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Typical Areas of Questioning */}
              {style.typicalAreasOfQuestioning && style.typicalAreasOfQuestioning.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Typical Probing Topics</span>
                  </span>
                  <ul className="space-y-1.5">
                    {style.typicalAreasOfQuestioning.map((area, i) => (
                      <li
                        key={i}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Personality Traits */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Core Behavioral Traits
            </span>
            <div className="flex flex-wrap gap-1.5">
              {interviewer.personalityTraits.map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            TTS Voice: {interviewer.voiceName} (pitch: {interviewer.pitch}x)
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
          >
            Close Persona Guide
          </button>
        </div>
      </div>
    </div>
  );
};

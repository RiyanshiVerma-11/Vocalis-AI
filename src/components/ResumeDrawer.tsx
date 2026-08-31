import React, { useState, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  X,
  Edit3,
  Check,
  Building2,
  BrainCircuit,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { CandidateResume, QuestionHistoryItem, SharedCandidateContext } from '../types';
import { RESUME_PRESETS } from '../data/resumes';
import { parseResumeText, parseResumeTextAsync } from '../utils/resumeParser';

interface ResumeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: CandidateResume;
  onResumeChange?: (resume: CandidateResume) => void;
  onUpdateResume?: (resume: CandidateResume) => void;
  sharedContext?: SharedCandidateContext;
  questionHistory?: QuestionHistoryItem[];
  isDemo?: boolean;
}

export const ResumeDrawer: React.FC<ResumeDrawerProps> = ({
  isOpen,
  onClose,
  currentResume,
  onResumeChange,
  onUpdateResume,
  sharedContext,
  questionHistory,
  isDemo = false,
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'memory'>('resume');
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState<CandidateResume>(currentResume);
  const [rawPasteText, setRawPasteText] = useState('');
  const [showRawPaste, setShowRawPaste] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    setEditedResume(currentResume);
  }, [currentResume]);

  if (!isOpen) return null;

  const notifyChange = (newResume: CandidateResume) => {
    if (onUpdateResume) onUpdateResume(newResume);
    if (onResumeChange) onResumeChange(newResume);
    setEditedResume(newResume);
    setSuccessBanner(`✓ Resume Loaded: ${newResume.fullName} (${newResume.headline || 'Engineer'}) — ${newResume.notableProjects?.length || 0} Projects Synced`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleSelectPreset = (preset: CandidateResume) => {
    notifyChange(preset);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    notifyChange(editedResume);
    setIsEditing(false);
  };

  const handleApplyRawPaste = async () => {
    if (!rawPasteText.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseResumeTextAsync(rawPasteText, currentResume.fullName || 'Candidate');
      notifyChange(parsed);
      setShowRawPaste(false);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div
      id="candidate-resume-drawer-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end"
    >
      <div
        id="candidate-resume-drawer"
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Candidate Profile & Shared Context
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold uppercase">
                  Synchronized
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Shared in real-time across all active AI interviewers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4">
          <button
            onClick={() => setActiveTab('resume')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'resume'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Candidate Resume Details</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'memory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Panel Memory & Question Trail ({sharedContext?.questionHistory?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-700">
          {activeTab === 'resume' ? (
            <>
              {/* Success Notification Banner */}
              {successBanner && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-semibold text-xs flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                      ✓
                    </div>
                    <span>{successBanner}</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="ml-3 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer shrink-0"
                  >
                    Done / Close Drawer
                  </button>
                </div>
              )}
              {/* Preset Selector — only shown for demo accounts */}
              {isDemo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Demo Candidate Profiles
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {RESUME_PRESETS.map((preset) => {
                      const isSelected = currentResume.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-600 ring-1 ring-indigo-600/30'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="font-bold text-slate-900 truncate">{preset.fullName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{preset.headline}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Your Resume Profile
                    </span>
                    <button
                      onClick={() => setShowRawPaste(!showRawPaste)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold underline text-[11px] cursor-pointer"
                    >
                      {showRawPaste ? 'Hide' : 'Update Resume'}
                    </button>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                    <p className="font-extrabold">{currentResume.fullName}</p>
                    <p className="text-indigo-700 font-medium">{currentResume.headline}</p>
                    <p className="text-slate-500 line-clamp-2 text-[11px]">{currentResume.summary}</p>
                  </div>
                </div>
              )}

              {/* Paste Raw Text Section */}
              {showRawPaste && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-800">
                    Paste Candidate Resume or LinkedIn Bio:
                  </label>
                  <textarea
                    rows={4}
                    value={rawPasteText}
                    onChange={(e) => setRawPasteText(e.target.value)}
                    placeholder="Paste resume text, projects, company history, or target competencies here..."
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleApplyRawPaste}
                      disabled={isParsing}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {isParsing ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>AI Parsing Resume...</span>
                        </>
                      ) : (
                        <span>Update Candidate Profile</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Candidate Info Overview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {currentResume.fullName}
                    </h3>
                    <p className="text-xs text-indigo-700 font-semibold">
                      {currentResume.headline}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {currentResume.yearsOfExperience} Years Exp • {currentResume.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Info'}</span>
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Full Name</label>
                      <input
                        type="text"
                        value={editedResume.fullName}
                        onChange={(e) => setEditedResume({ ...editedResume, fullName: e.target.value })}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Headline</label>
                      <input
                        type="text"
                        value={editedResume.headline}
                        onChange={(e) => setEditedResume({ ...editedResume, headline: e.target.value })}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Executive Summary</label>
                      <textarea
                        rows={3}
                        value={editedResume.summary}
                        onChange={(e) => setEditedResume({ ...editedResume, summary: e.target.value })}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200/80 pt-2">
                    {currentResume.summary}
                  </p>
                )}
              </div>

              {/* Skills Grid */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Technical & Architectural Stack</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 text-[11px]">Core Architecture</span>
                    <div className="flex flex-wrap gap-1">
                      {currentResume.skills.coreArchitecture.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 text-[11px]">Languages & Frameworks</span>
                    <div className="flex flex-wrap gap-1">
                      {currentResume.skills.languagesAndFrameworks.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 text-[11px]">Cloud & Infra</span>
                    <div className="flex flex-wrap gap-1">
                      {currentResume.skills.cloudAndInfrastructure.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 text-[11px]">Practices & Methodologies</span>
                    <div className="flex flex-wrap gap-1">
                      {currentResume.skills.practicesAndMethodologies.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Work Experience & Past Positions</span>
                </h4>
                <div className="space-y-2.5">
                  {currentResume.workExperience.map((exp, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{exp.role}</span>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{exp.company}</span>
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                          {exp.duration}
                        </span>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                        {exp.highlights.map((hl, hIdx) => (
                          <li key={hIdx}>{hl}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notable Projects */}
              {currentResume.notableProjects && currentResume.notableProjects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Notable Projects & Metric Highlights</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {currentResume.notableProjects.map((p, pIdx) => (
                      <div key={pIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{p.name}</span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {p.metrics}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Live Panel Memory & Question Trail Tab */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-indigo-900 text-xs">
                    Continuous Shared Memory Engine
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Every question asked by any panel member, along with evaluated candidate depth and resume points referenced, is shared instantly across all active AI interviewers to guarantee conversational continuity.
                </p>
              </div>

              {/* Question History Trail */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Questions Asked by Panel ({sharedContext?.questionHistory?.length || 0})</span>
                  <span className="text-slate-400 font-mono text-[10px]">Chronological</span>
                </h4>

                {(!sharedContext?.questionHistory || sharedContext.questionHistory.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    <Layers className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No questions asked yet. The interview question trail will log here in real time.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sharedContext.questionHistory.map((q: QuestionHistoryItem, idx: number) => (
                      <div
                        key={q.id || idx}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                              Q{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {q.interviewerName} ({q.interviewerRole})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                            {q.adaptiveStrategyUsed || 'Initial Question'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 font-medium">"{q.questionText}"</p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                          <span>Topic: <strong className="text-slate-700">{q.topic}</strong></span>
                          <span>•</span>
                          <span>Target: <strong className="text-slate-700">{q.targetCompetency}</strong></span>
                          {q.candidateDepth && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-bold">Depth: {q.candidateDepth}</span>
                            </>
                          )}
                          {q.resumeReferenceUsed && (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Referenced Resume: {q.resumeReferenceUsed}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Running Panel Summary & Unresolved Probes */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Running Panel Synthesis Summary
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sharedContext?.runningSummary || 'Interview in progress. Summary generates dynamically.'}
                  </p>
                </div>

                {sharedContext?.unresolvedProbes && sharedContext.unresolvedProbes.length > 0 && (
                  <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
                    <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      <span>Unresolved Discussion Threads Queued for Panel:</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                      {sharedContext.unresolvedProbes.map((probe, pIdx) => (
                        <li key={pIdx}>{probe}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {activeTab === 'resume'
              ? `Profile active: ${currentResume.fullName}`
              : `Total questions logged: ${sharedContext?.questionHistory?.length || 0}`}
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
          >
            Done / Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { InterviewScenario, Interviewer, InterviewerRole, DifficultyLevel, CandidateResume, UserSession } from '../types';
import { INTERVIEW_SCENARIOS } from '../data/scenarios';
import { ALL_INTERVIEWERS } from '../data/interviewers';
import { RESUME_PRESETS, createDefaultCandidateResume } from '../data/resumes';
import { parseResumeText } from '../utils/resumeParser';
import { generateDynamicPanel } from '../utils/dynamicPanelGenerator';
import {
  Play,
  Sparkles,
  Check,
  Users,
  Sliders,
  Briefcase,
  FileText,
  UserCheck,
  ArrowRight,
  Zap,
  CheckCircle2,
  UploadCloud,
  Edit3,
  User as UserIcon,
} from 'lucide-react';

interface ScenarioSelectorProps {
  onStartInterview: (config: {
    scenario: InterviewScenario;
    activePanel: Interviewer[];
    candidateName: string;
    targetRole: string;
    initialDifficulty: DifficultyLevel;
    candidateResume: CandidateResume;
    panelStrictness?: 'Supportive' | 'Balanced' | 'Strict' | 'Relentless Bar Raiser';
    rubricWeights?: {
      technicalArchitecture: number;
      businessAndCustomerImpact: number;
      communicationAndClarity: number;
      leadershipAndOwnership: number;
      problemSolvingAndAgility: number;
    };
  }) => void;
  currentUser?: UserSession | null;
  currentCandidateName?: string;
  currentCandidateResume?: CandidateResume;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  onStartInterview,
  currentUser,
  currentCandidateName,
  currentCandidateResume,
}) => {
  const defaultResumeObj =
    currentCandidateResume ||
    (currentCandidateName ? createDefaultCandidateResume(currentCandidateName) : RESUME_PRESETS[0]);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(INTERVIEW_SCENARIOS[0].id);
  const [trackMode, setTrackMode] = useState<'preset' | 'custom'>('preset');
  const [selectedResumeId, setSelectedResumeId] = useState<string>(defaultResumeObj.id);
  const [candidateName, setCandidateName] = useState<string>(defaultResumeObj.fullName);
  const [targetRole, setTargetRole] = useState<string>(defaultResumeObj.headline || 'Senior / Staff Software Engineer');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Senior');
  const [panelStrictness, setPanelStrictness] = useState<'Supportive' | 'Balanced' | 'Strict' | 'Relentless Bar Raiser'>('Balanced');
  const [customTradeOffConstraints, setCustomTradeOffConstraints] = useState<string>('');

  useEffect(() => {
    if (currentCandidateResume) {
      setSelectedResumeId(currentCandidateResume.id);
      setCandidateName(currentCandidateResume.fullName);
      if (currentCandidateResume.headline) {
        setTargetRole(currentCandidateResume.headline);
      }
    } else if (currentCandidateName) {
      setCandidateName(currentCandidateName);
    }
  }, [currentCandidateResume, currentCandidateName]);
  
  // Rubric weights state (percentages)
  const [rubricPreset, setRubricPreset] = useState<'balanced' | 'tech_heavy' | 'product_heavy' | 'leadership_heavy'>('balanced');
  const [rubricWeights, setRubricWeights] = useState({
    technicalArchitecture: 30,
    businessAndCustomerImpact: 25,
    communicationAndClarity: 15,
    leadershipAndOwnership: 15,
    problemSolvingAndAgility: 15,
  });

  const [selectedRoleKeys, setSelectedRoleKeys] = useState<InterviewerRole[]>([
    'technical',
    'product',
    'customer',
  ]);
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customResume, setCustomResume] = useState<CandidateResume | null>(null);
  const [pastedText, setPastedText] = useState<string>('');

  const handleRubricPresetChange = (preset: 'balanced' | 'tech_heavy' | 'product_heavy' | 'leadership_heavy') => {
    setRubricPreset(preset);
    switch (preset) {
      case 'balanced':
        setRubricWeights({ technicalArchitecture: 30, businessAndCustomerImpact: 25, communicationAndClarity: 15, leadershipAndOwnership: 15, problemSolvingAndAgility: 15 });
        break;
      case 'tech_heavy':
        setRubricWeights({ technicalArchitecture: 50, businessAndCustomerImpact: 15, communicationAndClarity: 10, leadershipAndOwnership: 10, problemSolvingAndAgility: 15 });
        break;
      case 'product_heavy':
        setRubricWeights({ technicalArchitecture: 15, businessAndCustomerImpact: 45, communicationAndClarity: 15, leadershipAndOwnership: 10, problemSolvingAndAgility: 15 });
        break;
      case 'leadership_heavy':
        setRubricWeights({ technicalArchitecture: 15, businessAndCustomerImpact: 20, communicationAndClarity: 15, leadershipAndOwnership: 35, problemSolvingAndAgility: 15 });
        break;
    }
  };

  const currentScenario =
    trackMode === 'custom'
      ? INTERVIEW_SCENARIOS.find((s) => s.id === 'custom-freeform') || INTERVIEW_SCENARIOS[3]
      : INTERVIEW_SCENARIOS.find((s) => s.id === selectedScenarioId) || INTERVIEW_SCENARIOS[0];

  const currentResume =
    customResume && selectedResumeId === customResume.id
      ? customResume
      : currentCandidateResume && selectedResumeId === currentCandidateResume.id
      ? currentCandidateResume
      : RESUME_PRESETS.find((r) => r.id === selectedResumeId) || defaultResumeObj;

  const handleToggleRole = (role: InterviewerRole) => {
    if (selectedRoleKeys.includes(role)) {
      if (selectedRoleKeys.length <= 1) return;
      setSelectedRoleKeys(selectedRoleKeys.filter((r) => r !== role));
    } else {
      setSelectedRoleKeys([...selectedRoleKeys, role]);
    }
  };

  const handleSelectTrackMode = (mode: 'preset' | 'custom') => {
    setTrackMode(mode);
    if (mode === 'custom') {
      setSelectedScenarioId('custom-freeform');
      if (!targetRole || targetRole === 'Senior / Staff Software Engineer') {
        setTargetRole('Lead Full-Stack & AI Engineer');
      }
    } else {
      if (selectedScenarioId === 'custom-freeform') {
        setSelectedScenarioId(INTERVIEW_SCENARIOS[0].id);
      }
    }
  };

  const handleScenarioChange = (scenario: InterviewScenario) => {
    setSelectedScenarioId(scenario.id);
    setSelectedDifficulty(scenario.difficulty);
    setSelectedRoleKeys(scenario.recommendedPanel);
    setTargetRole(scenario.targetRole);
  };

  const handleResumeSelect = (preset: CandidateResume) => {
    setSelectedResumeId(preset.id);
    setCandidateName(preset.fullName);
    if (preset.headline) {
      setTargetRole(preset.headline);
    }
  };

  const handleApplyPastedResume = () => {
    if (!pastedText.trim()) return;
    const parsed = parseResumeText(pastedText);
    setCustomResume(parsed);
    setSelectedResumeId(parsed.id);
    setCandidateName(parsed.fullName);
    setTargetRole(parsed.headline);
  };

  const handleCustomJdChange = (val: string) => {
    setCustomDescription(val);
    if (val.toLowerCase().includes('data science') || val.toLowerCase().includes('ai')) {
      if (!targetRole || targetRole.includes('Senior')) {
        setTargetRole('Full-Stack AI & Data Science Engineer');
      }
    }
  };

  const handleStart = () => {
    const candidateProfile: CandidateResume = {
      ...currentResume,
      fullName: candidateName.trim() || currentResume.fullName,
      headline: targetRole.trim() || currentResume.headline,
    };

    const finalScenario: InterviewScenario = {
      ...currentScenario,
      targetRole: targetRole.trim() || 'Software Engineer',
      difficulty: selectedDifficulty,
      context:
        trackMode === 'custom' && customDescription.trim()
          ? customDescription
          : currentScenario.context,
      customConstraints: customTradeOffConstraints.trim() || undefined,
    };

    const calibratedPanel = generateDynamicPanel(
      targetRole.trim() || currentResume.headline,
      candidateProfile,
      finalScenario,
      selectedRoleKeys
    );

    onStartInterview({
      scenario: finalScenario,
      activePanel: calibratedPanel.length > 0 ? calibratedPanel : ALL_INTERVIEWERS.slice(0, 3),
      candidateName: candidateName.trim() || currentResume.fullName,
      targetRole: targetRole.trim() || 'Software Engineer',
      initialDifficulty: selectedDifficulty,
      candidateResume: candidateProfile,
      panelStrictness,
      rubricWeights,
    });
  };

  const presetScenarios = INTERVIEW_SCENARIOS.filter((s) => s.id !== 'custom-freeform');

  return (
    <div id="scenario-selector-screen" className="w-full max-w-[1920px] mx-auto py-4 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* SaaS Product Onboarding Bar */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              <span>Candidate Practice Studio Workspace</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              AI Voice Interview Studio
            </h1>
            <p className="text-slate-400 text-[11px]">
              Follow 3 steps: Submit Resume ➔ Select Job Track / Paste JD ➔ Launch Voice Room
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold">Sub-100ms Voice Engine</span>
          </div>
        </div>

        {/* 3 Step Visual Flow Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition ${
            currentResume.fullName ? 'bg-indigo-950/60 border-indigo-500/50 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <p className="text-[11px] font-bold text-white">Step 1: Your Resume</p>
              <p className="text-[10px] text-slate-300 truncate">
                {currentResume.fullName ? `Active: ${currentResume.fullName}` : 'Paste resume text'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <p className="text-[11px] font-bold text-white">Step 2: Job / Track</p>
              <p className="text-[10px] text-slate-300 truncate">
                {trackMode === 'custom' ? 'Custom Company JD' : currentScenario.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <p className="text-[11px] font-bold text-white">Step 3: Launch Panel</p>
              <p className="text-[10px] text-slate-400">Interactive Voice Room</p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Submit & Parse Resume */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Step 1: Submit Your Candidate Resume
            </h2>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            AI Resume Parser
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Paste Resume Box */}
          <div className="lg:col-span-2 space-y-2.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Paste Your Full Resume or LinkedIn Bio:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Auto-detects Name, Projects & Tech Stack</span>
            </label>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste plain text resume here (e.g. Riyanshi Verma, B.Tech CSE Data Science, HospiSynAI, VoteWise AI, Infosys Springboard 7.0, Python, FastAPI, Docker, RAG...)"
              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white outline-none font-sans"
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleApplyPastedResume}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition"
              >
                <Check className="w-4 h-4" />
                <span>Parse Resume & Load Profile</span>
              </button>

              <span className="text-[11px] text-slate-500">
                Or choose a sample preset ➔
              </span>
            </div>
          </div>

          {/* Right 1 Col: Active Candidate Profile Summary */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Parsed Profile Overview:</span>
            </span>

            <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-slate-900 text-xs">{currentResume.fullName}</p>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Active
                </span>
              </div>
              <p className="text-[11px] text-indigo-700 font-semibold">{currentResume.headline}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                {currentResume.summary}
              </p>
              {currentResume.notableProjects && currentResume.notableProjects.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {currentResume.notableProjects.map((p, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-bold">
                      {p.name.split('(')[0].trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-1 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select Profile / Preset:
              </span>
              <div className="grid grid-cols-1 gap-1">
                {currentCandidateResume && (
                  <button
                    type="button"
                    onClick={() => handleResumeSelect(currentCandidateResume)}
                    className={`p-1.5 rounded-lg text-left border transition text-[11px] cursor-pointer flex items-center justify-between ${
                      selectedResumeId === currentCandidateResume.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-indigo-600" />
                      <span>My Profile: {currentCandidateResume.fullName}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-extrabold uppercase shrink-0">
                      User
                    </span>
                  </button>
                )}
                {RESUME_PRESETS.map((preset) => {
                  const isSelected = selectedResumeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleResumeSelect(preset)}
                      className={`p-1.5 rounded-lg text-left border transition text-[11px] cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.fullName} ({preset.headline.split('|')[0].trim()})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: Job Role / Track Selection (Segmented Toggle) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Step 2: Target Role & Practice Track
            </h2>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleSelectTrackMode('preset')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                trackMode === 'preset'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Practice Track Scenarios</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTrackMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                trackMode === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Paste Custom Job Description</span>
            </button>
          </div>
        </div>

        {/* MODE A: Practice Track Cards */}
        {trackMode === 'preset' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {presetScenarios.map((sc) => {
              const isSelected = selectedScenarioId === sc.id;
              return (
                <div
                  key={sc.id}
                  id={`scenario-card-${sc.id}`}
                  onClick={() => handleScenarioChange(sc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/60 border-2 border-indigo-600 ring-2 ring-indigo-500/10 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        {sc.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-700 font-mono font-bold border border-slate-200">
                        {sc.difficulty}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
                      <span>{sc.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>

                  <div className="mt-3 bg-white p-2.5 rounded-xl text-[11px] text-slate-700 border border-slate-200">
                    <strong className="text-indigo-700 block mb-0.5">Panel Dynamics:</strong>
                    <span className="text-slate-600 leading-tight">{sc.exampleDynamics}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MODE B: Custom Job Description Input */
          <div className="bg-indigo-50/50 p-5 rounded-2xl border-2 border-indigo-600 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Paste Company Job Description or Domain Requirements:</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase font-mono">
                CUSTOM JD ACTIVE
              </span>
            </div>

            <textarea
              value={customDescription}
              onChange={(e) => handleCustomJdChange(e.target.value)}
              placeholder="Paste company JD here (e.g., We are looking for a Senior Full-Stack AI Engineer experienced with Python, FastAPI, Groq Llama 3.3, Docker, RAG pipelines, and microservice architecture to build enterprise clinical applications...)"
              rows={4}
              className="w-full bg-white rounded-xl p-3.5 text-xs text-slate-900 border border-indigo-200 focus:border-indigo-600 outline-none font-sans leading-relaxed shadow-inner"
            />

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>The AI Panel will calibrate questions dynamically to the requirements in this JD.</span>
              {customDescription.trim() && (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>JD Loaded ({customDescription.length} chars)</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: Calibration & Launch AI Room */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Step 3: Calibrate Panel & Launch Interview Room
            </h2>
          </div>
          <span className="text-xs font-bold text-indigo-600 font-mono">
            Candidate: {candidateName}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Difficulty & Target Role */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Difficulty Tier</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Foundational', 'Intermediate', 'Senior', 'Staff/Principal'] as DifficultyLevel[]).map(
                  (diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`text-xs py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {diff}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Target Role Title</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-50 rounded-xl px-3.5 py-2 text-xs text-slate-900 border border-slate-200 focus:border-indigo-600 focus:bg-white outline-none font-medium"
                placeholder="e.g. B.Tech CS (Data Science) | Full-Stack & AI Engineer"
              />
            </div>

            {/* Recruiter Persona Strictness Calibration */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Panel Strictness & Tone Bar</span>
                <span className="text-[11px] font-mono text-indigo-600 font-bold">{panelStrictness}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['Supportive', 'Balanced', 'Strict', 'Relentless Bar Raiser'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPanelStrictness(s)}
                    className={`text-[11px] py-1.5 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                      panelStrictness === s
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Rubric Weight Presets */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Rubric Scoring Weights</span>
                <span className="text-[10px] text-slate-500 font-mono">Custom Weighting</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'balanced', label: 'Balanced (30/25)' },
                  { id: 'tech_heavy', label: 'Tech Heavy (50%)' },
                  { id: 'product_heavy', label: 'Product (45%)' },
                  { id: 'leadership_heavy', label: 'Leadership (35%)' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleRubricPresetChange(p.id as any)}
                    className={`text-[10px] py-1.5 px-2 rounded-lg font-bold border transition cursor-pointer text-center ${
                      rubricPreset === p.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bespoke Scenario Trade-off Prompt Constraints */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Custom Roleplay Trade-Off Constraints (Optional)</span>
                <span className="text-[10px] text-indigo-600 font-mono">Recruiter Rules</span>
              </label>
              <textarea
                value={customTradeOffConstraints}
                onChange={(e) => setCustomTradeOffConstraints(e.target.value)}
                rows={2}
                placeholder="e.g. Budget capped at $5,000/mo; system must handle 50,000 req/sec; zero downtime migration allowed."
                className="w-full bg-slate-50 rounded-xl p-2.5 text-xs text-slate-900 border border-slate-200 focus:border-indigo-600 focus:bg-white outline-none font-medium"
              />
            </div>
          </div>

          {/* Right Column: Panel Members Selection & Launch */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Interviewer Panel Members</span>
                </label>
                <span className="text-[11px] text-indigo-600 font-mono font-bold">
                  {selectedRoleKeys.length} Selected
                </span>
              </div>

              <div className="space-y-1.5">
                {ALL_INTERVIEWERS.map((interviewer) => {
                  const isChecked = selectedRoleKeys.includes(interviewer.role);
                  return (
                    <div
                      key={interviewer.id}
                      onClick={() => handleToggleRole(interviewer.role)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer border transition ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-300 text-slate-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-semibold text-xs">{interviewer.name} ({interviewer.title})</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono capitalize">
                        {interviewer.role.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Launch CTA Button */}
            <button
              id="btn-launch-interview"
              type="button"
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold py-4 px-5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer text-sm sm:text-base tracking-wide"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>🚀 Launch Real-Time Voice Interview Room</span>
              <ArrowRight className="w-5 h-5 text-indigo-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

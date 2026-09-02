import React, { useState } from 'react';
import {
  Users,
  Building2,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart3,
  Search,
  Sparkles,
  Sliders,
  ShieldCheck,
  Zap,
  Play,
  Layers,
  ChevronRight,
  UserCheck,
  UserX,
  HelpCircle,
  Clock,
  Filter,
  FileDown,
  X,
  Quote,
} from 'lucide-react';
import { InterviewScenario, Interviewer, CandidateResume, DifficultyLevel, CustomCompanyRubric } from '../types';
import { ALL_INTERVIEWERS } from '../data/interviewers';
import { renderAvatarIcon, getAvatarGradientClass, InterviewerAvatar } from '../utils/avatarUtils';
import { INTERVIEW_SCENARIOS } from '../data/scenarios';
import { DEFAULT_RESUME, createDefaultCandidateResume } from '../data/resumes';
import { RubricImporterModal } from './RubricImporterModal';
import { ENTERPRISE_RUBRIC_TEMPLATES } from '../utils/rubricParser';

interface RecruiterDashboardProps {
  onStartInterview: (config: {
    scenario: InterviewScenario;
    activePanel: Interviewer[];
    candidateName: string;
    targetRole: string;
    initialDifficulty: DifficultyLevel;
    candidateResume: CandidateResume;
    customRubric?: CustomCompanyRubric;
  }) => void;
  onOpenResumeDrawer: () => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  onStartInterview,
  onOpenResumeDrawer,
}) => {
  const [activeTab, setActiveTab] = useState<'requisitions' | 'candidates'>('requisitions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScorecardCandidate, setSelectedScorecardCandidate] = useState<any | null>(null);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [selectedEditingRubric, setSelectedEditingRubric] = useState<CustomCompanyRubric | null>(null);
  const [customRubrics, setCustomRubrics] = useState<CustomCompanyRubric[]>(() => ENTERPRISE_RUBRIC_TEMPLATES);

  // Sample Evaluated Candidates Pipeline for Hiring Team
  const [candidatePipeline, setCandidatePipeline] = useState([
    {
      id: 'cand-1',
      name: 'Jordan Reed',
      role: 'Senior Distributed Systems Architect',
      date: 'Today, 2:15 PM',
      overallScore: 88,
      recommendation: 'Strong Hire',
      panelUsed: [ALL_INTERVIEWERS[0], ALL_INTERVIEWERS[1], ALL_INTERVIEWERS[2]], // Rohan, Priya, Vikram
      keyStrengths: ['Distributed Cache Invalidation', 'p99 Latency SLAs', 'System Trade-offs'],
      quoteEvidence: '"We enforce write-through caching with Redis Pub/Sub invalidation channels for patient records..."',
      status: 'Evaluated',
    },
    {
      id: 'cand-2',
      name: 'Aanya Patel',
      role: 'Principal AI & RAG Engineer',
      date: 'Yesterday, 4:30 PM',
      overallScore: 92,
      recommendation: 'Strong Hire',
      panelUsed: [ALL_INTERVIEWERS[0], ALL_INTERVIEWERS[4], ALL_INTERVIEWERS[2]], // Rohan, Dr. Meera, Vikram
      keyStrengths: ['Vector Embedding Latency', 'Multi-Agent State Sync', 'RAG Context Compression'],
      quoteEvidence: '"Context window compression is done via semantic vector pruning before sending prompts to Llama..."',
      status: 'Evaluated',
    },
    {
      id: 'cand-3',
      name: 'Aryan Shah',
      role: 'Staff Full-Stack Tech Lead',
      date: 'Aug 28, 2026',
      overallScore: 71,
      recommendation: 'Leaning Hire',
      panelUsed: [ALL_INTERVIEWERS[1], ALL_INTERVIEWERS[2], ALL_INTERVIEWERS[3]], // Priya, Vikram, Neha
      keyStrengths: ['User Conversion SLAs', 'API Design'],
      quoteEvidence: '"We migrated to GraphQL micro-services, though cache TTL invalidation caused temporary stale reads..."',
      status: 'Under Review',
    },
    {
      id: 'cand-4',
      name: 'Sophia Patel',
      role: 'DevOps & SRE Lead',
      date: 'Aug 26, 2026',
      overallScore: 54,
      recommendation: 'Leaning No Hire',
      panelUsed: [ALL_INTERVIEWERS[0], ALL_INTERVIEWERS[2], ALL_INTERVIEWERS[3]], // Alex, Marcus, Sarah
      keyStrengths: ['Canary Deployments'],
      quoteEvidence: '"We used Kubernetes rolling updates without explicit RTO failover circuit breakers under spike load..."',
      status: 'Evaluated',
    },
  ]);

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Strong Hire':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Hire':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Leaning Hire':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Leaning No Hire':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const filteredCandidates = candidatePipeline.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyCustomRubric = (newRubric: CustomCompanyRubric, launchImmediately?: boolean) => {
    setCustomRubrics((prev) => {
      const exists = prev.some((r) => r.id === newRubric.id || r.companyName === newRubric.companyName);
      if (exists) {
        return prev.map((r) => (r.id === newRubric.id || r.companyName === newRubric.companyName ? newRubric : r));
      }
      return [newRubric, ...prev];
    });

    if (launchImmediately) {
      const defaultDiff: DifficultyLevel = newRubric.strictnessRating === 'Exacting' ? 'Staff/Principal' : 'Senior';
      onStartInterview({
        scenario: {
          ...INTERVIEW_SCENARIOS[0],
          id: `custom-req-${newRubric.id}`,
          title: `${newRubric.companyName} - ${newRubric.targetLevel}`,
          targetRole: newRubric.targetLevel,
          context: `Target Level: ${newRubric.targetLevel} at ${newRubric.companyName}. Evaluation strictly calibrated to custom rubric.`,
          customConstraints: `Strictness: ${newRubric.strictnessRating}. Key signals: ${(newRubric.keySignals || []).join('; ')}`,
          customRubric: newRubric,
        },
        activePanel: ALL_INTERVIEWERS.slice(0, 3),
        candidateName: 'Candidate',
        targetRole: newRubric.targetLevel,
        initialDifficulty: defaultDiff,
        candidateResume: createDefaultCandidateResume('Candidate', newRubric.targetLevel),
        customRubric: newRubric,
      });
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto py-4 px-4 sm:px-6 lg:px-8 space-y-4 text-slate-900 font-sans">
      {/* Recruiter Product Header Banner */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4 relative z-10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-mono font-bold uppercase tracking-wider">
                Recruiter & Hiring Team Mode
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Hiring Team Evaluation & Committee Pipeline
            </h1>
            <p className="text-[11px] text-slate-400">
              Manage candidate screenings, configure AI-suggested committee panels, and review quote-backed evaluation scorecards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedEditingRubric(null);
                setIsRubricModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>📄 Upload Rubric / JD (PDF)</span>
            </button>

            <button
              type="button"
              onClick={onOpenResumeDrawer}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Parse Resume</span>
            </button>

            <button
              type="button"
              onClick={() => onStartInterview({
                scenario: INTERVIEW_SCENARIOS[0],
                activePanel: ALL_INTERVIEWERS.slice(0, 3),
                candidateName: 'Candidate',
                targetRole: 'Senior Distributed Systems Architect',
                initialDifficulty: 'Senior',
                candidateResume: createDefaultCandidateResume('Candidate', 'Senior Distributed Systems Architect'),
              })}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Launch Standard Screen</span>
            </button>
          </div>
        </div>

        {/* 4 Step Product Onboarding Guide Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 relative z-10">
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[9px]">1</span>
              <span>Parse Resume</span>
            </span>
            <p className="text-[11px] font-bold text-white">Upload / Paste Resume</p>
            <p className="text-[9px] text-slate-400">Auto-configures AI committee roles</p>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[9px]">2</span>
              <span>Assign AI Panel</span>
            </span>
            <p className="text-[11px] font-bold text-white">Select 3–5 Personas</p>
            <p className="text-[9px] text-slate-400">Systems, Product & VP roles</p>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">3</span>
              <span>Run Screen</span>
            </span>
            <p className="text-[11px] font-bold text-white">Sub-100ms Voice Round</p>
            <p className="text-[9px] text-slate-400">Real-time barge-in VAD enabled</p>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[9px]">4</span>
              <span>Review Scorecard</span>
            </span>
            <p className="text-[11px] font-bold text-white">Verbatim Quote Citations</p>
            <p className="text-[9px] text-slate-400">Exportable ATS assessment</p>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards (Clean Light Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Evaluated Candidates</span>
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">42 Candidates</p>
          <p className="text-[10px] text-emerald-600 font-bold">↑ +14 evaluated this month</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Avg Panel Score</span>
          </span>
          <p className="text-xl font-black text-indigo-600 font-mono">78.4 / 100</p>
          <p className="text-[10px] text-slate-500">Across 5 core competencies</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Sprint Hours Saved</span>
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">189 Hours</p>
          <p className="text-[10px] text-slate-500">Reclaimed for Lead engineers</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-0.5">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Pass Rate (Strong/Hire)</span>
          </span>
          <p className="text-xl font-black text-purple-600 font-mono">47.6%</p>
          <p className="text-[10px] text-slate-500">Standardized Bar-Raiser</p>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('requisitions')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'requisitions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Open Job Requisitions & Panels</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'candidates'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Evaluated Candidate Pipeline</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or role..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 shadow-xs transition"
          />
        </div>
      </div>

      {/* TAB 1: JOB REQUISITIONS & DYNAMIC AI PANEL CONFIGURATION */}
      {activeTab === 'requisitions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Active Job Requisitions & Leveling Rubrics</h3>
              <p className="text-xs text-slate-500">Auto-calibrated AI committee panels and strictness bars per opening.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedEditingRubric(null);
                setIsRubricModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Custom Rubric PDF / Matrix</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Render Custom / Imported Rubrics first */}
            {customRubrics.map((cr, idx) => (
              <div
                key={cr.id}
                className="bg-white p-4 rounded-xl border border-indigo-200/80 space-y-3 hover:border-indigo-500 transition flex flex-col justify-between shadow-xs hover:shadow-md ring-1 ring-indigo-500/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold uppercase">
                      🏢 {cr.companyName} Bar
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      cr.strictnessRating === 'Exacting'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : cr.strictnessRating === 'Strict'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {cr.strictnessRating} Standard
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{cr.targetLevel}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    Calibrated weights: Arch {cr.rubricWeights.technicalArchitecture}%, Problem Solving {cr.rubricWeights.problemSolvingAndAgility}%, Leadership {cr.rubricWeights.leadershipAndOwnership}%.
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>Key Signals: {cr.keySignals?.length || 0}</span>
                      <span>Must-Ask Qs: {cr.mandatoryQuestions?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEditingRubric(cr);
                      setIsRubricModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200 text-center"
                  >
                    Edit / Inspect
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyCustomRubric(cr, true)}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Launch Screen</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Standard Scenarios */}
            {INTERVIEW_SCENARIOS.slice(0, 2).map((sc, idx) => (
              <div
                key={sc.id}
                className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 hover:border-indigo-500/50 transition flex flex-col justify-between shadow-xs hover:shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold uppercase">
                      Standard Req #{101 + idx}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{sc.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{sc.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onStartInterview({
                      scenario: sc,
                      activePanel: ALL_INTERVIEWERS.slice(0, 3),
                      candidateName: 'Candidate',
                      targetRole: sc.title,
                      initialDifficulty: 'Senior',
                      candidateResume: createDefaultCandidateResume('Candidate', sc.targetRole),
                    })
                  }
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Candidate Round</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EVALUATED CANDIDATES PIPELINE TABLE */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Evaluated Candidate Scorecard Pipeline</h3>
              <p className="text-xs text-slate-500">Verbatim transcript quotes, competency breakdowns, and calibration verifications.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Candidate & Role</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Hiring Recommendation</th>
                    <th className="py-3.5 px-4">AI Committee Panel</th>
                    <th className="py-3.5 px-4">Transcript Quote Citation</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{cand.name}</p>
                          <p className="text-[11px] text-slate-500">{cand.role}</p>
                          <span className="text-[10px] text-slate-400">{cand.date}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-sm">
                        <span className={cand.overallScore >= 80 ? 'text-emerald-700' : cand.overallScore >= 70 ? 'text-indigo-700' : 'text-amber-700'}>
                          {cand.overallScore} / 100
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${getRecommendationBadge(cand.recommendation)}`}>
                          {cand.recommendation}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {cand.panelUsed.map((p) => (
                            <div
                              key={p.id}
                              className={`w-6 h-6 rounded-md text-white font-bold text-[10px] flex items-center justify-center shadow-xs ${getAvatarGradientClass(p.avatarColor)}`}
                              title={p.name}
                            >
                              {renderAvatarIcon(p.avatarIcon, "w-3.5 h-3.5 text-white")}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-600 italic truncate" title={cand.quoteEvidence}>
                          {cand.quoteEvidence}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedScorecardCandidate(cand)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition cursor-pointer"
                        >
                          View Scorecard →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EVALUATED CANDIDATE SCORECARD MODAL */}
      {selectedScorecardCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Bar */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Evaluated Candidate Scorecard & Calibration Report
                  </h2>
                  <p className="text-xs text-slate-500">
                    Candidate: <strong className="text-slate-900">{selectedScorecardCandidate.name}</strong> • {selectedScorecardCandidate.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedScorecardCandidate, null, 2));
                    const a = document.createElement('a');
                    a.href = dataStr;
                    a.download = `Scorecard_${selectedScorecardCandidate.name.replace(/\s+/g, '_')}.json`;
                    a.click();
                  }}
                  className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScorecardCandidate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Score & Recommendation Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Committee Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-600 font-mono">{selectedScorecardCandidate.overallScore}</span>
                    <span className="text-xs font-semibold text-slate-500">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hiring Recommendation</span>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border font-mono ${getRecommendationBadge(selectedScorecardCandidate.recommendation)}`}>
                      {selectedScorecardCandidate.recommendation}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Timestamp</span>
                  <p className="text-xs font-bold text-slate-800">{selectedScorecardCandidate.date}</p>
                </div>
              </div>

              {/* Verbatim Transcript Quote Citation */}
              <div className="bg-indigo-50/60 p-4.5 rounded-xl border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
                  <Quote className="w-4 h-4 text-indigo-600" />
                  <span>Verbatim Candidate Transcript Quote Citation</span>
                </div>
                <p className="text-xs text-slate-800 italic leading-relaxed font-medium pl-2.5 border-l-2 border-indigo-500">
                  {selectedScorecardCandidate.quoteEvidence}
                </p>
              </div>

              {/* AI Committee Panel Members */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deliberating AI Committee Panel
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedScorecardCandidate.panelUsed.map((interviewer: any) => (
                    <div key={interviewer.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-xs">
                      <InterviewerAvatar
                        avatarIcon={interviewer.avatarIcon}
                        avatarColor={interviewer.avatarColor}
                        name={interviewer.name}
                        className="w-8 h-8 rounded-lg border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{interviewer.name}</p>
                        <p className="text-[10px] text-indigo-600 font-semibold truncate">{interviewer.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Strengths & Probes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Validated Technical Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedScorecardCandidate.keyStrengths.map((str: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{str}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Competency Matrix Breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Competency Matrix Evaluation
                </h4>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                      <span>Distributed Architecture & System Design</span>
                      <span className="font-mono text-indigo-600">{selectedScorecardCandidate.overallScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedScorecardCandidate.overallScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                      <span>Product Trade-offs & Customer Empathy</span>
                      <span className="font-mono text-purple-600">{Math.max(50, selectedScorecardCandidate.overallScore - 5)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.max(50, selectedScorecardCandidate.overallScore - 5)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                      <span>Communication & Technical Clarity</span>
                      <span className="font-mono text-emerald-600">{Math.min(98, selectedScorecardCandidate.overallScore + 4)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(98, selectedScorecardCandidate.overallScore + 4)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onStartInterview({
                    scenario: INTERVIEW_SCENARIOS[0],
                    activePanel: selectedScorecardCandidate.panelUsed,
                    candidateName: selectedScorecardCandidate.name,
                    targetRole: selectedScorecardCandidate.role,
                    initialDifficulty: 'Senior',
                    candidateResume: createDefaultCandidateResume(selectedScorecardCandidate.name, selectedScorecardCandidate.role),
                  });
                  setSelectedScorecardCandidate(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Re-Interview / Probe Deeper</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScorecardCandidate(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Enterprise Rubric / JD PDF Importer Modal */}
      <RubricImporterModal
        isOpen={isRubricModalOpen}
        onClose={() => setIsRubricModalOpen(false)}
        initialRubric={selectedEditingRubric}
        onApplyRubric={handleApplyCustomRubric}
      />
    </div>
  );
};

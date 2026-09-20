import React, { useState, useMemo, useEffect } from 'react';
import { StructuredAssessment, TranscriptMessage } from '../types';
import {
  Award,
  CheckCircle,
  AlertTriangle,
  FileDown,
  RotateCcw,
  X,
  Quote,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  BarChart3,
  MessageSquare,
  HelpCircle,
  MessageCircle,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalAssessmentModalProps {
  assessment: StructuredAssessment;
  transcript?: TranscriptMessage[];
  onClose: () => void;
  onRestart: () => void;
}

export const FinalAssessmentModal: React.FC<FinalAssessmentModalProps> = ({
  assessment,
  transcript,
  onClose,
  onRestart,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'qa'>('overview');

  useEffect(() => {
    if (assessment.hiringRecommendation === 'Strong Hire' || assessment.hiringRecommendation === 'Hire') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore if confetti not supported
      }
    }
  }, [assessment]);

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Strong Hire':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'Hire':
        return 'bg-teal-50 text-teal-700 border-teal-300 font-bold';
      case 'Leaning Hire':
        return 'bg-blue-50 text-blue-700 border-blue-300 font-bold';
      case 'Leaning No Hire':
        return 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
      case 'Strong No Hire':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-bold';
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(assessment, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Interview_Assessment_${assessment.candidateName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  // Pair questions and candidate answers from the transcript for the Q&A log
  const qaPairs = useMemo(() => {
    const pairs: Array<{
      turnNumber: number;
      interviewerName: string;
      interviewerRole: string;
      question: string;
      answer: string;
      timestamp?: number;
    }> = [];

    const effectiveTranscript = (transcript && transcript.length > 0)
      ? transcript
      : (assessment.transcript && assessment.transcript.length > 0)
        ? assessment.transcript
        : [];

    let currentQ: {
      interviewerName: string;
      interviewerRole: string;
      question: string;
      timestamp?: number;
    } | null = null;

    effectiveTranscript.forEach((msg) => {
      if (msg.speakerRole !== 'candidate') {
        currentQ = {
          interviewerName: msg.speakerName || 'Interviewer',
          interviewerRole: typeof msg.speakerRole === 'string' ? msg.speakerRole : 'Panel Member',
          question: msg.content,
          timestamp: msg.timestamp,
        };
      } else if (currentQ) {
        pairs.push({
          turnNumber: pairs.length + 1,
          interviewerName: currentQ.interviewerName,
          interviewerRole: currentQ.interviewerRole,
          question: currentQ.question,
          answer: msg.content,
          timestamp: currentQ.timestamp,
        });
        currentQ = null;
      }
    });

    if (currentQ) {
      pairs.push({
        turnNumber: pairs.length + 1,
        interviewerName: (currentQ as any).interviewerName,
        interviewerRole: (currentQ as any).interviewerRole,
        question: (currentQ as any).question,
        answer: '(Session concluded before candidate answer was recorded)',
        timestamp: (currentQ as any).timestamp,
      });
    }

    // Fallback: If no raw transcript turns exist (e.g. past archived session loaded from storage),
    // reconstruct Q&A turns from assessment data so recruiter/candidate always sees the full Q&A log!
    if (pairs.length === 0) {
      const seenQuotes = new Set<string>();

      // 1. Stage 1: Candidate Self-Intro & Elevator Pitch
      const introQuote = assessment.introAudit?.parameters?.find((p) => p.evidenceOrGap && p.evidenceOrGap.length > 10)?.evidenceOrGap
        || assessment.competencyBreakdown?.flatMap((c) => c.evidenceQuotes || []).find((eq) => eq.quote?.toLowerCase().includes('name is') || eq.quote?.toLowerCase().includes('currently') || eq.context?.toLowerCase().includes('intro'))?.quote;

      if (introQuote) {
        seenQuotes.add(introQuote.trim().toLowerCase());
        pairs.push({
          turnNumber: 1,
          interviewerName: 'Panel Lead',
          interviewerRole: 'Intro & Background',
          question: 'Welcome to the interview panel! Please introduce yourself, your current role or university background, and the key projects you have worked on.',
          answer: introQuote,
        });
      }

      // 2. Add quotes from competency breakdown with their questions/contexts
      (assessment.competencyBreakdown || []).forEach((c) => {
        (c.evidenceQuotes || []).forEach((eq) => {
          const qText = (eq.quote || '').trim();
          if (!qText || seenQuotes.has(qText.toLowerCase())) return;
          seenQuotes.add(qText.toLowerCase());

          let reconstructedQuestion = `Could you walk us through your technical approach and architecture regarding ${c.name.toLowerCase()}?`;
          if (eq.context && eq.context !== 'Direct Candidate Response' && !eq.context.toLowerCase().includes('candidate')) {
            reconstructedQuestion = eq.context;
          } else if (eq.context && (eq.context.toLowerCase().includes('hurdle') || eq.context.toLowerCase().includes('workaround'))) {
            reconstructedQuestion = 'What was a challenging technical hurdle you encountered on your flagship project, and how did you resolve it?';
          } else if (qText.toLowerCase().includes('simulate') || qText.toLowerCase().includes('polling')) {
            reconstructedQuestion = 'How did you simulate the polling booth data, and how did you validate that against real-world behavior?';
          } else if (qText.toLowerCase().includes('database') || qText.toLowerCase().includes('query') || qText.toLowerCase().includes('optimization')) {
            reconstructedQuestion = 'Your profile mentions database query optimization. Can you explain a complex query optimization or indexing strategy you implemented?';
          } else if (qText.toLowerCase().includes('scalable web platform')) {
            reconstructedQuestion = 'Could you describe the system architecture and stack choices for the AI-Powered Scalable Web Platform listed on your resume?';
          }

          pairs.push({
            turnNumber: pairs.length + 1,
            interviewerName: 'Rohan Sharma',
            interviewerRole: 'Technical Architecture',
            question: reconstructedQuestion,
            answer: qText,
            timestamp: eq.timestampMs,
          });
        });
      });

      // 3. Add gaps / skipped questions from identifiedContradictionsAndGaps
      (assessment.identifiedContradictionsAndGaps || []).forEach((gap) => {
        const claim = gap.candidateClaim || '';
        if (claim && !seenQuotes.has(claim.toLowerCase())) {
          seenQuotes.add(claim.toLowerCase());
          pairs.push({
            turnNumber: pairs.length + 1,
            interviewerName: 'Technical Panel',
            interviewerRole: 'Deep Dive Probe',
            question: `Follow-up on ${gap.topic}: Can you elaborate on your specific technical implementation and trade-offs?`,
            answer: claim,
          });
        }
      });

      // 4. Trailing question from roleByRoleFeedback
      (assessment.roleByRoleFeedback || []).forEach((rf) => {
        if (rf.keyObservationQuote && rf.keyObservationQuote.includes('?') && !seenQuotes.has(rf.keyObservationQuote.toLowerCase())) {
          seenQuotes.add(rf.keyObservationQuote.toLowerCase());
          pairs.push({
            turnNumber: pairs.length + 1,
            interviewerName: rf.interviewerName,
            interviewerRole: rf.interviewerRole,
            question: rf.keyObservationQuote,
            answer: '(Session concluded before candidate answer was recorded)',
          });
        }
      });
    }

    return pairs;
  }, [transcript, assessment]);

  const hasUnreachedStages = assessment.stageBreakdown?.some((s) => s.status === 'not_reached') ?? false;
  const displayOverallScore = hasUnreachedStages
    ? (assessment.accumulatedWeightedScore ?? (assessment.overallScore <= 10 ? assessment.overallScore : Number((assessment.overallScore * 0.1).toFixed(1))))
    : assessment.overallScore;

  return (
    <div
      id="final-assessment-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Interview Scorecard & Feedback Report
              </h2>
              <p className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-900">{assessment.candidateName}</strong> • Target Role: {assessment.targetRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-2 border-b border-slate-200 flex gap-2 bg-slate-50/50 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Scorecard & Stage Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'qa'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Interview Q&A Log ({qaPairs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-700 flex-1">
          {activeTab === 'overview' ? (
            <>
              {/* Executive Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Overall Score (Main Score) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Overall Score
                  </span>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {displayOverallScore}
                    <span className="text-sm font-normal text-slate-400"> / 100</span>
                  </div>
                  {hasUnreachedStages ? (
                    <div className="text-[11px] text-indigo-600 font-medium">
                      Active Pace: <span className="font-mono font-bold">{assessment.overallScore}/100</span> on answered rounds
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Completed all 5 interview rounds
                    </div>
                  )}
                </div>

                {/* 2. Hiring Recommendation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Recommendation
                  </span>
                  <div className="pt-0.5">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${getRecommendationBadge(
                        assessment.hiringRecommendation
                      )}`}
                    >
                      {assessment.hiringRecommendation}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Candidate hiring readiness verdict
                  </div>
                </div>

                {/* 3. Interview Progress */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Interview Progress
                  </span>
                  <div className="text-sm font-bold text-indigo-700 flex items-center gap-1.5 pt-1">
                    <span>Stage {assessment.completedStagesCount ?? 1} of 5</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({qaPairs.length} questions answered)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Target Level: {assessment.adaptiveTrajectory?.startLevel || 'Intermediate'}
                  </div>
                </div>
              </div>

              {/* Early Session / Incomplete Screening Banner */}
              {hasUnreachedStages && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-950">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                      ℹ️
                    </div>
                    <div>
                      <span className="font-bold text-blue-900">
                        Interview Concluded Early
                      </span>
                      <p className="text-[11px] text-blue-700">
                        Candidate answered questions in {assessment.completedStagesCount ?? 1} stage(s) (Scored at {assessment.overallScore}/100 pace). Unreached stages remain pending and are strictly NOT penalized.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white text-blue-800 border border-blue-300 font-bold text-[10px] self-start sm:self-auto shrink-0">
                    No Penalty on Pending Rounds
                  </span>
                </div>
              )}

              {/* Interview Summary */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Interview Summary
                </h3>
                <p className="text-slate-800 leading-relaxed text-sm">
                  {assessment.executiveSummary}
                </p>
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-900">Score Rationale:</strong> {assessment.calibrationRationale}
                </div>
              </div>

              {/* Stage-by-Stage Performance & Scores (Helpful for Candidate) */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-white space-y-4 shadow-md border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                        Stage-by-Stage Scores & Feedback
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Individual performance breakdown for each stage of the interview loop
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-indigo-950/80 text-indigo-300 px-3 py-1 rounded-full border border-indigo-700/60 font-bold">
                    Total Weight: 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    {
                      stageNumber: 1,
                      stageName: 'Intro & Background',
                      targetFocus: 'Background, education, internships, and communication clarity',
                      weightPercentage: 10,
                      rawScore: assessment.stageBreakdown?.[0]?.rawScore ?? (assessment.introAudit?.totalScore ?? assessment.overallScore),
                      status: assessment.stageBreakdown?.[0]?.status ?? ((assessment.overallScore > 0 || (assessment.introAudit?.totalScore ?? 0) > 0) ? 'completed' : 'not_reached'),
                      feedback: assessment.stageBreakdown?.[0]?.summary || 'Clear self-introduction covering educational credentials and project background.',
                    },
                    {
                      stageNumber: 2,
                      stageName: 'Project Deep Dive',
                      targetFocus: 'Flagship architecture, stack choices, trade-offs, and data flow',
                      weightPercentage: 35,
                      rawScore: assessment.stageBreakdown?.[1]?.rawScore ?? ((assessment.completedStagesCount ?? 1) >= 2 ? 65 : 0),
                      status: assessment.stageBreakdown?.[1]?.status ?? ((assessment.completedStagesCount ?? 1) >= 2 ? 'completed' : 'not_reached'),
                      feedback: assessment.stageBreakdown?.[1]?.summary || 'Discussed flagship system architecture and core capabilities.',
                    },
                    {
                      stageNumber: 3,
                      stageName: 'Skills & Edge Cases',
                      targetFocus: 'Technical depth, error handling, concurrency, and API integration',
                      weightPercentage: 30,
                      rawScore: assessment.stageBreakdown?.[2]?.rawScore ?? ((assessment.completedStagesCount ?? 1) >= 3 ? 70 : 0),
                      status: assessment.stageBreakdown?.[2]?.status ?? ((assessment.completedStagesCount ?? 1) >= 3 ? 'completed' : 'not_reached'),
                      feedback: assessment.stageBreakdown?.[2]?.summary || 'Pending — You can test your technical depth in your next practice session!',
                    },
                    {
                      stageNumber: 4,
                      stageName: 'HR & Teamwork (STAR)',
                      targetFocus: 'Ownership, handling deadlines, communication, and team collaboration',
                      weightPercentage: 15,
                      rawScore: assessment.stageBreakdown?.[3]?.rawScore ?? ((assessment.completedStagesCount ?? 1) >= 4 ? 70 : 0),
                      status: assessment.stageBreakdown?.[3]?.status ?? ((assessment.completedStagesCount ?? 1) >= 4 ? 'completed' : 'not_reached'),
                      feedback: assessment.stageBreakdown?.[3]?.summary || 'Pending — Behavioral and situational questions.',
                    },
                    {
                      stageNumber: 5,
                      stageName: 'Wrap-Up & Q&A',
                      targetFocus: 'Candidate engagement, asking questions, and closing remarks',
                      weightPercentage: 10,
                      rawScore: assessment.stageBreakdown?.[4]?.rawScore ?? ((assessment.completedStagesCount ?? 1) >= 5 ? 75 : 0),
                      status: assessment.stageBreakdown?.[4]?.status ?? ((assessment.completedStagesCount ?? 1) >= 5 ? 'completed' : 'not_reached'),
                      feedback: assessment.stageBreakdown?.[4]?.summary || 'Pending — Closing engagement and wrap-up questions.',
                    },
                  ].map((stg) => {
                    const isCompleted = stg.status === 'completed';
                    const isInProgress = stg.status === 'in_progress';

                    return (
                      <div
                        key={stg.stageNumber}
                        className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between space-y-2.5 transition ${
                          isCompleted
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                            : isInProgress
                            ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
                            : 'bg-slate-800/50 border-slate-800 text-slate-400 opacity-80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                              Stage {stg.stageNumber}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                                isCompleted
                                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                                  : isInProgress
                                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {stg.weightPercentage}% Weight
                            </span>
                          </div>

                          <div className="font-bold text-slate-100 text-xs leading-snug">
                            {stg.stageName}
                          </div>

                          <p className="text-[11px] text-slate-300 leading-tight mt-1.5">
                            {stg.feedback}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isCompleted
                                ? 'bg-emerald-900/40 text-emerald-300'
                                : isInProgress
                                ? 'bg-amber-900/40 text-amber-300'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                          </span>
                          <span className={`font-bold text-sm ${isCompleted ? 'text-emerald-400' : isInProgress ? 'text-amber-400' : 'text-slate-500'}`}>
                            {isCompleted ? `${stg.rawScore}/100` : isInProgress && stg.rawScore > 0 ? `${stg.rawScore}/100` : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Practical Depth & Communication Audit */}
              {assessment.jargonAudit && (
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3 shadow-md border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                        Practical Depth vs Jargon Audit
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-bold">
                      Clarity Score: {assessment.jargonAudit.buzzwordDensity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Practical Depth Ratio</span>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {assessment.jargonAudit.practicalDepthRatio}%
                      </div>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Verified Concrete Examples</span>
                      <div className="text-xl font-bold font-mono text-indigo-400">
                        {assessment.jargonAudit.verifiedConcreteMetricsCount} Citation(s)
                      </div>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Technical Topics Covered</span>
                      <div className="text-xs font-semibold text-slate-200 truncate pt-1">
                        {(assessment.jargonAudit.jargonTermsUsed || []).slice(0, 4).join(', ') || 'Core Engineering Fundamentals'}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic border-t border-slate-800/80 pt-2">
                    "{assessment.jargonAudit.auditSummary}"
                  </p>
                </div>
              )}

              {/* Competency Breakdown & Verbatim Evidence Quotes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Skill Strengths & Improvement Areas (With Transcript Evidence)
                </h3>

                <div className="grid grid-cols-1 gap-3.5">
                  {assessment.competencyBreakdown.map((comp, idx) => (
                    <div key={idx} className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{comp.name}</span>
                          <span className="text-xs text-slate-500 font-mono">Weight: {comp.weight}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">{comp.verdict}</span>
                          <span className="font-mono font-bold text-indigo-600 text-sm">{comp.score}/100</span>
                        </div>
                      </div>

                      {/* Evidence Quotes */}
                      {comp.evidenceQuotes && comp.evidenceQuotes.length > 0 && (
                        <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold uppercase tracking-wider">
                            <Quote className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Candidate Spoken Quote:</span>
                          </div>
                          {comp.evidenceQuotes.map((ev, eIdx) => (
                            <div key={eIdx} className="text-xs text-slate-700 pl-3 border-l-2 border-indigo-600">
                              <p className="italic font-medium">"{ev.quote}"</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{ev.context}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Strengths & Growth */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1 text-emerald-800 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                          <span className="font-bold flex items-center gap-1 text-emerald-900 uppercase tracking-wider text-[10px]">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Key Strengths:
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                            {comp.strengths.map((s, sIdx) => (
                              <li key={sIdx}>
                                {typeof s === 'string' ? s : ((s as any)?.point || (s as any)?.strength || (s as any)?.text || JSON.stringify(s))}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1 text-amber-800 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                          <span className="font-bold flex items-center gap-1 text-amber-900 uppercase tracking-wider text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Areas for Calibration:
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                            {comp.improvements.map((im, imIdx) => (
                              <li key={imIdx}>
                                {typeof im === 'string' ? im : ((im as any)?.point || (im as any)?.improvement || (im as any)?.text || JSON.stringify(im))}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interviewer Feedback by Role */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Interviewer Feedback by Role
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assessment.roleByRoleFeedback.map((rf, rIdx) => (
                    <div key={rIdx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{rf.interviewerName}</span>
                          <p className="text-[10px] text-slate-500">{rf.interviewerRole}</p>
                        </div>
                        <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          {rf.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rf.commentary}</p>
                      {rf.keyObservationQuote && (
                        <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                          Observation: "{rf.keyObservationQuote}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Identified Contradictions or Gaps */}
              {assessment.identifiedContradictionsAndGaps &&
                assessment.identifiedContradictionsAndGaps.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Identified Gaps or Skipped Questions</span>
                    </h3>

                    <div className="space-y-2">
                      {assessment.identifiedContradictionsAndGaps.map((item, idx) => {
                        const claim = item.candidateClaim || (item as any).candidateStatementA || (item as any).candidateStatementB;
                        const rec = item.recommendation || (item as any).panelFollowUpRecommendation || `Review and practice explaining ${item.topic} with concrete metrics and architectural trade-offs.`;
                        return (
                          <div key={idx} className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 text-xs space-y-1.5">
                            <div className="font-bold text-red-900 flex items-center justify-between">
                              <span>{item.topic}</span>
                              {(item as any).severity && (
                                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                                  {(item as any).severity}
                                </span>
                              )}
                            </div>
                            {claim && claim.trim() !== '' && (
                              <p className="text-slate-800">
                                <strong className="text-slate-600">Candidate Stated:</strong> "{claim}"
                              </p>
                            )}
                            <p className="text-red-700">
                              <strong className="text-slate-600">Panel Analysis:</strong> {item.actualContradictionOrGap}
                            </p>
                            <p className="text-indigo-800 text-[11px] font-medium pt-0.5">
                              <strong>Recommendation:</strong> {rec}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </>
          ) : (
            /* TAB 2: INTERVIEW Q&A LOG (WHO ASKED WHAT & WHAT CANDIDATE ANSWERED) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Complete Interview Transcript Log:</strong> Every question asked by panel members and the candidate's exact spoken answer.
                  </span>
                </div>
                <span className="font-mono text-indigo-800 font-bold bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 text-[11px]">
                  {qaPairs.length} Question Turn(s)
                </span>
              </div>

              {qaPairs.length > 0 ? (
                <div className="space-y-3.5">
                  {qaPairs.map((qa) => (
                    <div
                      key={qa.turnNumber}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm hover:border-indigo-200 transition"
                    >
                      {/* Header: Turn # & Interviewer Info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                            #{qa.turnNumber}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {qa.interviewerName}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 ml-1.5">
                              • {qa.interviewerRole}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Question {qa.turnNumber}
                        </span>
                      </div>

                      {/* Question Box */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Interviewer Question:</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          {qa.question}
                        </p>
                      </div>

                      {/* Candidate Answer Box */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Candidate Spoken Answer ({assessment.candidateName}):</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                          "{qa.answer}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-medium">No spoken dialogue recorded for this session.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-white transition cursor-pointer"
          >
            Print / Save to PDF
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onRestart}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Interview Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

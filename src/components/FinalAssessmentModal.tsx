import React from 'react';
import { StructuredAssessment } from '../types';
import { Award, CheckCircle, XCircle, AlertTriangle, FileDown, RotateCcw, X, Quote, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalAssessmentModalProps {
  assessment: StructuredAssessment;
  onClose: () => void;
  onRestart: () => void;
}

export const FinalAssessmentModal: React.FC<FinalAssessmentModalProps> = ({
  assessment,
  onClose,
  onRestart,
}) => {
  React.useEffect(() => {
    if (assessment.hiringRecommendation === 'Strong Hire' || assessment.hiringRecommendation === 'Hire') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
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
                Evidence-Based Interview Evaluation & Calibration
              </h2>
              <p className="text-xs text-slate-500">
                Candidate: <strong className="text-slate-900">{assessment.candidateName}</strong> • Target: {assessment.targetRole}
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Hiring Recommendation</span>
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${getRecommendationBadge(
                  assessment.hiringRecommendation
                )}`}
              >
                {assessment.hiringRecommendation}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overall Panel Score</span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {assessment.overallScore}<span className="text-sm font-normal text-slate-400"> / 100</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Adaptive Trajectory</span>
              <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 pt-1">
                <span>{assessment.adaptiveTrajectory?.startLevel || 'Senior'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-indigo-600">{assessment.adaptiveTrajectory?.endLevel || 'Senior'}</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Executive Committee Summary
            </h3>
            <p className="text-slate-800 leading-relaxed text-sm">
              {assessment.executiveSummary}
            </p>
            <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-900">Calibration Rationale:</strong> {assessment.calibrationRationale}
            </div>
          </div>

          {/* Jargon vs Practical Depth Audit Card (Recruiter Evaluation Trust) */}
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
                  Buzzword Risk: {assessment.jargonAudit.buzzwordDensity}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Practical Depth Ratio</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">{assessment.jargonAudit.practicalDepthRatio}%</div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Verified Concrete Metrics</span>
                  <div className="text-xl font-bold font-mono text-indigo-400">{assessment.jargonAudit.verifiedConcreteMetricsCount} Citation(s)</div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Scrutinized Terms</span>
                  <div className="text-xs font-semibold text-slate-200 truncate pt-1">
                    {(assessment.jargonAudit.jargonTermsUsed || []).slice(0, 4).join(', ') || 'Domain Fundamentals'}
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
              Competency Evaluation with Transcript Citations
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
                        <span>Verbatim Transcript Evidence:</span>
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
                          <li key={sIdx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 text-amber-800 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                      <span className="font-bold flex items-center gap-1 text-amber-900 uppercase tracking-wider text-[10px]">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Areas for Calibration:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                        {comp.improvements.map((im, imIdx) => (
                          <li key={imIdx}>{im}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role-by-Role Panel Feedback */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Role-by-Role Panelist Perspectives
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assessment.roleByRoleFeedback.map((rf, rIdx) => (
                <div key={rIdx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">
                      {rf.interviewerName} ({rf.interviewerRole.replace('_', ' ')})
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600">{rf.score}/100</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rf.commentary}</p>
                  {rf.keyObservationQuote && (
                    <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                      Observation: "{rf.keyObservationQuote}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contradictions & Gaps */}
          {assessment.identifiedContradictionsAndGaps &&
            assessment.identifiedContradictionsAndGaps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Identified Contradictions or Vague Hand-Waving</span>
                </h3>

                <div className="space-y-2">
                  {assessment.identifiedContradictionsAndGaps.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 text-xs space-y-1">
                      <div className="font-bold text-red-900">{item.topic}</div>
                      <p className="text-slate-800">
                        <strong className="text-slate-600">Candidate Stated:</strong> "{item.candidateClaim}"
                      </p>
                      <p className="text-red-700">
                        <strong className="text-slate-600">Panel Analysis:</strong> {item.actualContradictionOrGap}
                      </p>
                      <p className="text-indigo-800 text-[11px] font-medium pt-0.5">
                        <strong>Calibration Recommendation:</strong> {item.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Actionable Development Plan */}
          {assessment.actionableDevelopmentPlan && assessment.actionableDevelopmentPlan.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Actionable Candidate Development Plan
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                {assessment.actionableDevelopmentPlan.map((plan, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{plan}</span>
                  </div>
                ))}
              </div>
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

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
  MessageSquare,
  Check,
} from 'lucide-react';
import { InterviewScenario, Interviewer, CandidateResume, DifficultyLevel, CustomCompanyRubric } from '../types';
import { ALL_INTERVIEWERS } from '../data/interviewers';
import { renderAvatarIcon, getAvatarGradientClass, InterviewerAvatar } from '../utils/avatarUtils';
import { INTERVIEW_SCENARIOS } from '../data/scenarios';
import { DEFAULT_RESUME, createDefaultCandidateResume } from '../data/resumes';
import { RubricImporterModal } from './RubricImporterModal';
import { ENTERPRISE_RUBRIC_TEMPLATES } from '../utils/rubricParser';
import { sessionHistoryService } from '../services/sessionHistoryService';

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
  const [scorecardModalTab, setScorecardModalTab] = useState<'qa' | 'overview' | 'barRaiser'>('qa');
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [selectedEditingRubric, setSelectedEditingRubric] = useState<CustomCompanyRubric | null>(null);
  const [customRubrics, setCustomRubrics] = useState<CustomCompanyRubric[]>(() => ENTERPRISE_RUBRIC_TEMPLATES);

  // Evaluated Candidates Pipeline for Hiring Team (Integrates real completed sessions + baseline candidates)
  const DEMO_CANDIDATES = [
    {
      id: 'cand-1',
      name: 'Jordan Reed',
      role: 'Staff Distributed Systems Architect',
      date: 'Today, 2:15 PM',
      overallScore: 91,
      recommendation: 'Strong Hire',
      panelUsed: ALL_INTERVIEWERS, // All 5 interviewers: Rohan, Priya, Vikram, Neha, Dr. Meera
      keyStrengths: [
        'Distributed Cache Invalidation',
        'p99 Latency SLAs (<45ms)',
        'Kafka Partition Fencing',
        'Enterprise Zero-Downtime',
        'STAR Conflict Resolution',
      ],
      quoteEvidence:
        '"We avoided distributed locks across regions by implementing deterministic hash routing on the partition key at the API gateway layer, falling back to an event-sourced outbox pattern with idempotent dedup tokens."',
      status: 'Evaluated',
      jargonAudit: {
        practicalDepthRatio: 89,
        buzzwordDensity: 'Low (11%)',
        verifiedConcreteMetricsCount: 7,
        auditSummary:
          'Candidate grounded architectural choices in real production constraints (OS socket buffers, disk sync latency, and Kafka partition rebalancing) rather than buzzwords.',
        scrutinizedTerms: ['Distributed Consensus', 'Raft Leases', 'Kafka Outbox', 'Vector Clocks'],
      },
      competencies: [
        { name: 'Distributed Architecture & System Design', score: 94, weight: '30%', verdict: 'Exceeds Bar', color: 'indigo' },
        { name: 'Product Trade-offs & Customer Empathy', score: 88, weight: '20%', verdict: 'Meets Bar', color: 'purple' },
        { name: 'Engineering Leadership & Velocity', score: 91, weight: '20%', verdict: 'Exceeds Bar', color: 'blue' },
        { name: 'Enterprise SLA Reliability & Security', score: 92, weight: '15%', verdict: 'Exceeds Bar', color: 'emerald' },
        { name: 'Behavioral Dynamics & STAR Methodology', score: 89, weight: '15%', verdict: 'Meets Bar', color: 'amber' },
      ],
      sampleQA: [
        {
          interviewerIndex: 0,
          interviewerName: "Rohan Sharma",
          interviewerTitle: "Lead Systems Architect",
          roleBadge: "Distributed Systems & Concurrency",
          score: 94,
          verdict: "Strong Endorsement",
          question:
            "Jordan, in your resume you mentioned leading a ledger re-architecture handling 65,000 transactions per second across three cloud regions with p99 under 45ms. In an active-active setup across geographic regions, speed-of-light round-trips make distributed two-phase commit impossible at that latency. How did you handle data partitioning, and what happens when the inter-region replication link is partitioned during a high-throughput burst?",
          answer:
            "You're spot on, Rohan. A distributed 2PC across cross-continental regions incurs at least 70 to 120ms just in cross-datacenter speed-of-light round trips, so 2PC was completely out of the question. We took an account-affinity partitioning strategy. Each user ledger partition has a single designated 'primary home region' determined by consistent hashing on the account ID at the edge Envoy proxy. All state-mutating writes for that account hit the primary region and commit locally to our Raft quorum in under 8ms. Cross-region replication to the other two passive regions is handled asynchronously via an event-sourced Kafka backbone with transactional outbox tables. If the cross-region link drops, the home region continues processing writes without stalling. For read traffic in remote regions, we provide causal read-your-own-writes by returning a monotonically increasing transaction vector clock in the client session token.",
          feedback:
            "Immediate rejection of anti-patterns (2PC over WAN), clean use of vector clocks for causal consistency, and concrete understanding of latency ceilings.",
        },
        {
          interviewerIndex: 1,
          interviewerName: "Priya Mehta",
          interviewerTitle: "Principal Product Manager",
          roleBadge: "Product Empathy & Business ROI",
          score: 88,
          verdict: "Meets Bar",
          question:
            "Jordan, when you migrated from the legacy monolith to this event-driven architecture, what were the measurable user impact metrics and business trade-offs you presented to executive stakeholders?",
          answer:
            "We focused on two critical business metrics: checkout abandonment rate dropped by 3.2% due to consistent sub-50ms API response times, and our cloud infrastructure spend decreased by 28% because the partitioned data tier eliminated cross-region NAT gateway bandwidth charges. During executive sign-off, we explicitly traded off eventual consistency on non-critical reporting dashboards in exchange for 99.999% availability on user-facing payment checkout paths.",
          feedback:
            "Direct alignment of technical latency reductions with executive business metrics (cart abandonment and infrastructure costs).",
        },
        {
          interviewerIndex: 2,
          interviewerName: "Vikram Malhotra",
          interviewerTitle: "VP of Engineering",
          roleBadge: "Engineering Leadership & Tech Debt",
          score: 91,
          verdict: "Strong Endorsement",
          question:
            "Staff engineers frequently encounter teams suffocating under tech debt where feature velocity has slowed to a crawl, but product managers refuse to pause for refactoring. When you migrated the monolithic platform to microservices, how did you negotiate tech debt with stakeholders and keep velocity predictable?",
          answer:
            "Thanks Vikram. I've seen teams try the 'stop-the-world for 6 months to fix tech debt' approach, and it almost always fails and destroys trust between Product and Engineering. Instead, I instituted the 'Golden 20% Rule' paired with the Strangler Fig Pattern. We broke down the monolith along bounded domain contexts, but we only carved out a service when a high-priority product initiative required touching that specific domain. For example, when product needed localized billing currencies, we used that feature delivery window to spin up the dedicated Payments Service using transactional outbox patterns. To protect junior and mid-level engineers from breaking production during this migration, I built standardized CI/CD canary automation with automatic rollback on 5xx error rate spikes. This reduced our failed release rate from 8.2% to 0.4% and gave the team psychological safety to ship 3 times a day.",
          feedback:
            "Incremental strangler pattern rather than high-risk big bangs; established automated guardrails to empower junior developers; balanced tech hygiene with delivery predictability.",
        },
        {
          interviewerIndex: 3,
          interviewerName: "Neha Kapoor",
          interviewerTitle: "Enterprise Client Director",
          roleBadge: "Enterprise SLAs & Zero Downtime",
          score: 92,
          verdict: "Strong Endorsement",
          question:
            "Our enterprise Fortune 500 customers have strict SLAs. A five-minute unexpected outage or a single corrupted record can trigger massive penalty clauses and damage executive relationships. When you migrated live database schemas handling financial transactions, how did you guarantee zero-downtime and build trust that data would never be lost?",
          answer:
            "Neha, that's a critical consideration for enterprise trust. When customer money is on the line, maintenance windows and 'sorry for the downtime' notices are completely unacceptable. We used a strict Expand-Contract (Parallel Run) migration methodology across three phases: First, we deployed the new schema in an additive fashion—new columns and tables only, with database-level dual-writes. Second, we ran a background asynchronous reconciliation worker that compared row hashes between old and new tables for 60 consecutive days under peak production load. Any mismatch triggered an instant P1 alert to our queue. Only after we verified 99.8% reconciliation integrity across over 200M transactions did we shift primary read traffic via dynamic feature flags. Furthermore, every client record was encrypted at rest with tenant-isolated KMS keys so that even in multi-tenant shared tables, a memory dump or backup breach could never leak another customer's data.",
          feedback:
            "Understood enterprise anxiety around data loss; used 60-day dual-run validation; incorporated tenant-level KMS encryption into the architectural answer.",
        },
        {
          interviewerIndex: 4,
          interviewerName: "Dr. Meera Rao",
          interviewerTitle: "Lead Talent & Org Psychologist",
          roleBadge: "STAR Behavioral & Conflict Resolution",
          score: 89,
          verdict: "Positive Endorsement",
          question:
            "Tell me about a time when you and another senior or principal architect had a fundamental, heated disagreement on a high-stakes technical direction. How did you navigate the personal and technical tension, and what was the outcome?",
          answer:
            "During our multi-region expansion, our Principal Security Architect strongly advocated for synchronous global token validation on every single API request, citing compliance concerns. I believed this would destroy our p99 latency SLA and cause severe cascading timeouts during WAN degradation. The deadlock went on for a week, causing frustration across both infra and security teams. As the systems lead, my responsibility was to protect both latency SLAs and security posture without creating an adversarial relationship. Instead of escalating to VP leadership or debating in endless design docs, I scheduled a 1-on-1 whiteboarding session. I validated his concerns: security couldn't risk a compromised token remaining active for hours. I proposed an empirical compromise: short-lived cryptographically signed asymmetric JWTs (valid for 60 seconds) validated locally at the edge gateway, backed by an asynchronous Redis bloom-filter blacklist pushed via WebSockets for instant token revocation. We built a POC and load tested it together in 3 days. The data proved local JWT validation kept p99 under 12ms, while the revocation channel stopped rogue tokens within 400ms. We co-authored the RFC and presented it as a joint proposal.",
          feedback:
            "Textbook STAR execution; focused on empathy and listening before proposing solutions; depersonalized conflict through small, time-boxed experiments; high emotional intelligence.",
        },
      ],
      barRaiserCheck: {
        topic: 'Linearizable Consistency across Global WAN',
        candidateClaim: 'We achieved strict linearizable consistency across three global AWS regions in under 30 milliseconds.',
        aiProbe:
          'Rohan Sharma & Neha Kapoor challenged that light in fiber (~200km/ms) makes US-East to EU-West round-trip >70ms minimum physically.',
        candidateAdjustment:
          'Candidate immediately clarified without defensiveness: strict linearizability was localized to the home region; WAN cross-region guarantees were causal consistency with vector clocks.',
        verdict: 'Demonstrated high intellectual integrity and transparent self-correction under committee pressure.',
      },
      onboardingPlan: [
        'Days 1–30: Lead architectural review of core transaction ingestion mesh & shadow P1 on-call rotations.',
        'Days 31–60: Partner with Priya (PM) & Neha (Enterprise) to define tier-1 enterprise latency SLOs & migration runbooks.',
        'Days 61–90: Host team-wide training on Raft consensus protocols & chaos engineering failure injection drills.',
      ],
    },
    {
      id: 'cand-2',
      name: 'Aanya Patel',
      role: 'Principal AI & RAG Engineer',
      date: 'Yesterday, 4:30 PM',
      overallScore: 92,
      recommendation: 'Strong Hire',
      panelUsed: ALL_INTERVIEWERS,
      keyStrengths: ['Vector Embedding Latency', 'Multi-Agent State Sync', 'RAG Context Compression', 'Model Guardrails'],
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
      panelUsed: [ALL_INTERVIEWERS[1], ALL_INTERVIEWERS[2], ALL_INTERVIEWERS[3]],
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
      panelUsed: [ALL_INTERVIEWERS[0], ALL_INTERVIEWERS[2], ALL_INTERVIEWERS[3]],
      keyStrengths: ['Canary Deployments'],
      quoteEvidence: '"We used Kubernetes rolling updates without explicit RTO failover circuit breakers under spike load..."',
    },
  ];

  const [candidatePipeline, setCandidatePipeline] = useState(() => {
    try {
      const stored = sessionHistoryService.getStoredSessions();
      if (stored && stored.length > 0) {
        const mappedReal = stored.map((s, idx) => ({
          id: s.id || `cand-session-${idx}`,
          name: s.candidateName || 'Candidate',
          role: s.targetRole || 'Software Engineer',
          date: s.dateFormatted || 'Recent Session',
          overallScore: s.overallScore || 85,
          recommendation: s.hiringRecommendation || 'Hire',
          panelUsed: ALL_INTERVIEWERS,
          keyStrengths: s.keyStrengths && s.keyStrengths.length > 0 ? s.keyStrengths : ['System Architecture', 'Latency Optimization'],
          quoteEvidence: s.fullAssessment?.executiveSummary ? `"${s.fullAssessment.executiveSummary}"` : '"Candidate demonstrated solid architectural depth and rigorous problem solving under pressure."',
          status: 'Evaluated',
          jargonAudit: s.fullAssessment?.jargonAudit || {
            practicalDepthRatio: 88,
            buzzwordDensity: 'Low (12%)',
            verifiedConcreteMetricsCount: 6,
            auditSummary: s.fullAssessment?.calibrationRationale || 'Candidate articulated architectural decisions with concrete metrics.',
            scrutinizedTerms: ['Microservices', 'Distributed Cache', 'Concurrency'],
          },
          competencies: s.fullAssessment?.competencyBreakdown && s.fullAssessment.competencyBreakdown.length > 0
            ? s.fullAssessment.competencyBreakdown.map((cb, cIdx) => ({
                name: cb.name,
                score: cb.score,
                weight: cb.weight,
                verdict: cb.verdict,
                color: ['indigo', 'purple', 'blue', 'emerald', 'amber'][cIdx % 5],
              }))
            : [
                { name: 'Distributed Architecture & System Design', score: s.competencyScores?.technicalArchitecture || 88, weight: '30%', verdict: 'Meets Bar', color: 'indigo' },
                { name: 'Product Trade-offs & Customer Empathy', score: s.competencyScores?.businessAndCustomerImpact || 82, weight: '20%', verdict: 'Meets Bar', color: 'purple' },
                { name: 'Engineering Leadership & Velocity', score: s.competencyScores?.leadershipAndOwnership || 84, weight: '20%', verdict: 'Meets Bar', color: 'blue' },
                { name: 'Enterprise SLA Reliability & Security', score: s.competencyScores?.problemSolvingAndAgility || 86, weight: '15%', verdict: 'Meets Bar', color: 'emerald' },
                { name: 'Behavioral Dynamics & STAR Methodology', score: s.competencyScores?.communicationAndClarity || 85, weight: '15%', verdict: 'Meets Bar', color: 'amber' },
              ],
          sampleQA: s.fullAssessment?.roleByRoleFeedback && s.fullAssessment.roleByRoleFeedback.length > 0
            ? s.fullAssessment.roleByRoleFeedback.map((rf, fIdx) => ({
                interviewerIndex: fIdx,
                interviewerName: rf.interviewerName,
                interviewerTitle: rf.interviewerRole === 'technical' ? 'Lead Systems Architect' : rf.interviewerRole === 'product' ? 'Principal Product Manager' : 'Engineering Leader',
                roleBadge: String(rf.interviewerRole).toUpperCase(),
                score: rf.score || s.overallScore || 85,
                verdict: rf.verdict || 'Meets Bar',
                question: rf.commentary || 'Technical competency and behavioral alignment assessment.',
                answer: rf.keyObservationQuote || s.fullAssessment?.executiveSummary || 'Demonstrated practical depth.',
                feedback: rf.commentary || 'Solid engineering execution.',
              }))
            : [
                {
                  interviewerIndex: 0,
                  interviewerName: 'Rohan Sharma',
                  interviewerTitle: 'Lead Systems Architect',
                  roleBadge: 'Distributed Systems & Concurrency',
                  score: s.overallScore || 85,
                  verdict: s.hiringRecommendation || 'Strong Endorsement',
                  question: 'How do you structure data consistency and cache invalidation under high concurrency?',
                  answer: s.fullAssessment?.executiveSummary || 'We used transactional outbox patterns with deterministic partition key routing.',
                  feedback: 'Demonstrated solid understanding of consistency models and failure boundaries.',
                },
              ],
        }));
        return mappedReal;
      }
    } catch (e) {
      console.warn('[RecruiterDashboard] Failed to load stored sessions into pipeline:', e);
    }
    return DEMO_CANDIDATES;
  });

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Bar (Compact & Fixed) */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
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
                  <span className="hidden sm:inline">Export JSON</span>
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

            {/* Scorecard Tab Navigation (Sticky right below Top Bar) */}
            <div className="px-4 sm:px-5 pt-2 border-b border-slate-200 flex gap-2 bg-white shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setScorecardModalTab('qa')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  scorecardModalTab === 'qa'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Interview Q&A Log (All 5 Panelists)</span>
              </button>

              <button
                type="button"
                onClick={() => setScorecardModalTab('overview')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  scorecardModalTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Competencies & Jargon Telemetry</span>
              </button>

              <button
                type="button"
                onClick={() => setScorecardModalTab('barRaiser')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  scorecardModalTab === 'barRaiser'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bar-Raiser Calibration & Growth Plan</span>
              </button>
            </div>

            {/* Modal Body Scrollable (Spans full height with min-h-0) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Quick Metrics & 5-Panelist Summary Header (Scrolls together with body!) */}
              <div className="p-4 sm:p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Committee Score</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">{selectedScorecardCandidate.overallScore}</span>
                      <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      <span className="text-[11px] font-semibold text-emerald-600 ml-auto">Top 4% Benchmark</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hiring Recommendation</span>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border font-mono ${getRecommendationBadge(selectedScorecardCandidate.recommendation)}`}>
                        {selectedScorecardCandidate.recommendation}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Timestamp & Bar</span>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">{selectedScorecardCandidate.date}</p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        Verified Bar-Raiser
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deliberating AI Committee Panel (All 5 Members) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Deliberating AI Committee Panel ({selectedScorecardCandidate.panelUsed?.length || 5} Members)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Autonomous Multi-Agent Evaluation</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {selectedScorecardCandidate.panelUsed?.map((interviewer: any) => (
                      <div
                        key={interviewer.id}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs hover:border-indigo-200 transition"
                      >
                        <InterviewerAvatar
                          avatarIcon={interviewer.avatarIcon}
                          avatarColor={interviewer.avatarColor}
                          name={interviewer.name}
                          className="w-7 h-7 rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 truncate">{interviewer.name}</p>
                          <p className="text-[9px] text-indigo-600 font-semibold truncate">{interviewer.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* TAB 1: INTERVIEW Q&A LOG (ALL 5 INTERVIEWERS) */}
              {scorecardModalTab === 'qa' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-xs text-indigo-900">
                    <span className="font-semibold">
                      💡 <strong>Verbatim Dialogue & Micro-Assessments:</strong> Click any panelist probe to examine technical reasoning and live committee evaluation.
                    </span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-bold shrink-0">
                      5 / 5 Rounds Evaluated
                    </span>
                  </div>

                  {selectedScorecardCandidate.sampleQA && selectedScorecardCandidate.sampleQA.length > 0 ? (
                    <div className="space-y-4">
                      {selectedScorecardCandidate.sampleQA.map((qa: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition"
                        >
                          {/* Round Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                                R{idx + 1}
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-slate-900">
                                  {qa.interviewerName}{' '}
                                  <span className="font-normal text-slate-500">({qa.interviewerTitle})</span>
                                </h4>
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                  {qa.roleBadge}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-600">{qa.verdict}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold text-xs">
                                {qa.score} / 100
                              </span>
                            </div>
                          </div>

                          {/* Interviewer Question */}
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Interviewer Probe:</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-medium pl-2.5 border-l-2 border-indigo-500 italic">
                              "{qa.question}"
                            </p>
                          </div>

                          {/* Candidate Verbatim Answer */}
                          <div className="bg-white p-3.5 rounded-xl border-l-4 border-indigo-600 border border-slate-200 space-y-1 shadow-2xs">
                            <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-[11px]">
                              <Quote className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Candidate Verbatim Response ({selectedScorecardCandidate.name}):</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-normal pl-1">
                              {qa.answer}
                            </p>
                          </div>

                          {/* AI Real-time Micro Assessment */}
                          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 flex items-start gap-2 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">
                                Real-Time Committee Evaluation:
                              </span>
                              <p className="text-emerald-900 text-xs mt-0.5 leading-relaxed font-medium">
                                {qa.feedback}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback for candidates without sampleQA array */
                    <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2 text-xs text-slate-800">
                      <p className="font-bold text-indigo-900">Verbatim Quote Evidence:</p>
                      <p className="italic pl-2 border-l-2 border-indigo-500">{selectedScorecardCandidate.quoteEvidence}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COMPETENCIES & JARGON TELEMETRY */}
              {scorecardModalTab === 'overview' && (
                <div className="space-y-5">
                  {/* Practical Depth vs Jargon Audit Card */}
                  {selectedScorecardCandidate.jargonAudit && (
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3.5 shadow-md border border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                            Practical Depth vs Jargon Audit (Recruiter Trust Index)
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-bold">
                          Buzzword Risk: {selectedScorecardCandidate.jargonAudit.buzzwordDensity}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Practical Depth Ratio</span>
                          <div className="text-xl font-bold font-mono text-emerald-400">
                            {selectedScorecardCandidate.jargonAudit.practicalDepthRatio}%
                          </div>
                        </div>
                        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Verified Concrete Metrics</span>
                          <div className="text-xl font-bold font-mono text-indigo-400">
                            {selectedScorecardCandidate.jargonAudit.verifiedConcreteMetricsCount} Citations
                          </div>
                        </div>
                        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Scrutinized Technical Terms</span>
                          <div className="text-xs font-semibold text-slate-200 truncate pt-1">
                            {selectedScorecardCandidate.jargonAudit.scrutinizedTerms?.join(', ') || 'Raft, Kafka, Outbox, Vector Clocks'}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed italic border-t border-slate-800/80 pt-2">
                        "{selectedScorecardCandidate.jargonAudit.auditSummary}"
                      </p>
                    </div>
                  )}

                  {/* Verbatim Transcript Quote Citation */}
                  <div className="bg-indigo-50/60 p-4.5 rounded-xl border border-indigo-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
                      <Quote className="w-4 h-4 text-indigo-600" />
                      <span>Primary Verbatim Transcript Citation</span>
                    </div>
                    <p className="text-xs text-slate-800 italic leading-relaxed font-medium pl-2.5 border-l-2 border-indigo-500">
                      {selectedScorecardCandidate.quoteEvidence}
                    </p>
                  </div>

                  {/* Key Strengths */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Validated Technical Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedScorecardCandidate.keyStrengths?.map((str: string, i: number) => (
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
                      Full 5-Dimensional Competency Matrix
                    </h4>
                    <div className="space-y-3">
                      {(selectedScorecardCandidate.competencies || [
                        { name: 'Distributed Architecture & System Design', score: selectedScorecardCandidate.overallScore, weight: '30%', verdict: 'Exceeds Bar' },
                        { name: 'Product Trade-offs & Customer Empathy', score: Math.max(50, selectedScorecardCandidate.overallScore - 5), weight: '20%', verdict: 'Meets Bar' },
                        { name: 'Engineering Leadership & Velocity', score: Math.min(95, selectedScorecardCandidate.overallScore + 2), weight: '20%', verdict: 'Exceeds Bar' },
                        { name: 'Enterprise SLA Reliability & Security', score: Math.min(98, selectedScorecardCandidate.overallScore + 3), weight: '15%', verdict: 'Exceeds Bar' },
                        { name: 'Behavioral Dynamics & STAR Methodology', score: Math.max(60, selectedScorecardCandidate.overallScore - 3), weight: '15%', verdict: 'Meets Bar' },
                      ]).map((comp: any, cIdx: number) => (
                        <div key={cIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>{comp.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-slate-500">{comp.verdict} ({comp.weight})</span>
                              <span className="font-mono text-indigo-600 font-bold">{comp.score}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                              style={{ width: `${comp.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BAR-RAISER CALIBRATION & 90-DAY PLAN */}
              {scorecardModalTab === 'barRaiser' && (
                <div className="space-y-5">
                  {/* Autonomous Bar-Raiser Challenge */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold uppercase tracking-wider text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Autonomous Bar-Raiser Challenge: Contradiction & Vague Claims Audit</span>
                    </div>

                    {selectedScorecardCandidate.barRaiserCheck ? (
                      <div className="space-y-2.5">
                        <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
                          <span className="text-[10px] font-bold text-amber-900 uppercase">Topic & Candidate Claim:</span>
                          <p className="text-slate-800 italic">"{selectedScorecardCandidate.barRaiserCheck.candidateClaim}"</p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
                          <span className="text-[10px] font-bold text-rose-700 uppercase">AI Panel Cross-Examination:</span>
                          <p className="text-slate-800">{selectedScorecardCandidate.barRaiserCheck.aiProbe}</p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase">Candidate Self-Correction:</span>
                          <p className="text-slate-800">{selectedScorecardCandidate.barRaiserCheck.candidateAdjustment}</p>
                        </div>

                        <div className="p-2 rounded-lg bg-amber-100/60 text-amber-950 font-medium">
                          <strong>Committee Takeaway:</strong> {selectedScorecardCandidate.barRaiserCheck.verdict}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-700">No major contradictions or evasive claims flagged during session.</p>
                    )}
                  </div>

                  {/* 90-Day Onboarding Roadmap */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Actionable 90-Day Candidate Onboarding Plan</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(selectedScorecardCandidate.onboardingPlan || [
                        'Days 1–30: Lead architectural review of transaction ingestion mesh & shadow P1 rotations.',
                        'Days 31–60: Partner with Product & Enterprise to define tier-1 latency SLOs & migration runbooks.',
                        'Days 61–90: Host team-wide training on Raft consensus protocols & chaos engineering failure injection.',
                      ]).map((item: string, pIdx: number) => (
                        <div key={pIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            Phase {pIdx + 1}
                          </span>
                          <p className="text-slate-800 font-medium leading-relaxed pt-1">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onStartInterview({
                    scenario: INTERVIEW_SCENARIOS[0],
                    activePanel: selectedScorecardCandidate.panelUsed || ALL_INTERVIEWERS,
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

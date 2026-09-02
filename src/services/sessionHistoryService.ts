import { StructuredAssessment, DifficultyLevel, InterviewerRole } from '../types';

export interface ArchivedSession {
  id: string;
  candidateName: string;
  targetRole: string;
  scenarioTitle: string;
  timestamp: number;
  dateFormatted: string;
  durationMinutes: number;
  overallScore: number;
  hiringRecommendation: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Leaning No Hire' | 'Strong No Hire';
  difficultyLevel: DifficultyLevel;
  competencyScores: {
    technicalArchitecture: number;
    businessAndCustomerImpact: number;
    communicationAndClarity: number;
    leadershipAndOwnership: number;
    problemSolvingAndAgility: number;
  };
  keyStrengths: string[];
  keyGaps: string[];
  fullAssessment: StructuredAssessment;
}

export interface CompetencyEvolution {
  key: string;
  label: string;
  firstScore: number;
  latestScore: number;
  delta: number;
  benchmarkTarget: number;
}

export interface RecurringPattern {
  topic: string;
  count: number;
  percentage: number;
  category: 'strength' | 'weakness';
}

export interface AggregatedGrowthMetrics {
  totalSessions: number;
  averageScore: number;
  firstSessionScore: number;
  latestSessionScore: number;
  scoreDelta: number;
  readinessRating: {
    level: string;
    percentage: number;
    verdict: string;
  };
  scoreTrajectory: Array<{
    id: string;
    label: string;
    date: string;
    score: number;
    scenario: string;
    recommendation: string;
  }>;
  competencyEvolution: CompetencyEvolution[];
  recurringWeaknesses: RecurringPattern[];
  recurringStrengths: RecurringPattern[];
  recommendationBreakdown: Record<string, number>;
}

const STORAGE_KEY = 'vocalis_session_history_v2';

// ── Default Seed Data (Provides instant realistic 3-month longitudinal history) ──
const INITIAL_SEED_SESSIONS: ArchivedSession[] = [
  {
    id: 'arch-session-101',
    candidateName: 'Riyanshi Verma',
    targetRole: 'Senior / Staff Software Engineer',
    scenarioTitle: 'System Design & Distributed Cache',
    timestamp: Date.now() - 68 * 24 * 60 * 60 * 1000, // ~68 days ago
    dateFormatted: 'June 26, 2026',
    durationMinutes: 24,
    overallScore: 64,
    hiringRecommendation: 'Leaning No Hire',
    difficultyLevel: 'Intermediate',
    competencyScores: {
      technicalArchitecture: 70,
      businessAndCustomerImpact: 45,
      communicationAndClarity: 65,
      leadershipAndOwnership: 60,
      problemSolvingAndAgility: 68,
    },
    keyStrengths: [
      'Good baseline understanding of Redis cache TTLs',
      'Clear explanation of REST API routing structure'
    ],
    keyGaps: [
      'Missed failure semantics when distributed cache goes offline',
      'Completely omitted business ROI and checkout conversion impact',
      'Used vague terms for database locking mechanisms'
    ],
    fullAssessment: {
      candidateName: 'Riyanshi Verma',
      targetRole: 'Senior / Staff Software Engineer',
      interviewDate: 'June 26, 2026',
      durationMinutes: 24,
      overallScore: 64,
      hiringRecommendation: 'Leaning No Hire',
      executiveSummary: 'Candidate demonstrated solid technical fundamentals in caching, but struggled to explain business implications and network partition recovery.',
      calibrationRationale: 'Score reflects good coding instincts but requires stronger Staff-level trade-off defense and cross-functional empathy.',
      competencyBreakdown: [
        {
          name: 'Technical Architecture & Scale',
          score: 70,
          weight: '30%',
          verdict: 'Meets Baseline',
          evidenceQuotes: [{ quote: 'We can place Redis in front of the database with a 10 min TTL.', context: 'Opening architecture solution' }],
          strengths: ['Understands write-through caching basics'],
          improvements: ['Explain cache stampede prevention and distributed locking'],
        },
        {
          name: 'Business & Customer Impact',
          score: 45,
          weight: '25%',
          verdict: 'Needs Improvement',
          evidenceQuotes: [{ quote: 'I focus mainly on backend latency rather than revenue metrics.', context: 'Response to Priya Mehta' }],
          strengths: ['Acknowledged latency matters'],
          improvements: ['Directly link system uptime to user conversion and SLA penalties'],
        }
      ],
      roleByRoleFeedback: [
        {
          interviewerRole: 'technical',
          interviewerName: 'Rohan Sharma',
          score: 70,
          verdict: 'Passable',
          commentary: 'Understands Redis basics, but needs to go deeper into quorum writes and failover.',
          keyObservationQuote: 'Proposed standard Redis cache but lacked cache invalidation strategy.'
        },
        {
          interviewerRole: 'product',
          interviewerName: 'Priya Mehta',
          score: 45,
          verdict: 'Needs Work',
          commentary: 'Did not consider user experience during stale pricing windows.',
          keyObservationQuote: 'Did not connect system speed to customer churn.'
        }
      ],
      identifiedContradictionsAndGaps: [
        {
          topic: 'Business Impact',
          candidateClaim: 'Latency is the only metric that matters',
          actualContradictionOrGap: 'Ignored data consistency impact on e-commerce checkout',
          recommendation: 'Adopt RICE framework to prioritize architectural refactors'
        }
      ],
      adaptiveTrajectory: {
        startLevel: 'Intermediate',
        endLevel: 'Intermediate',
        trajectoryDescription: 'Maintained intermediate level throughout the session.'
      },
      actionableDevelopmentPlan: [
        'Study distributed cache stampede mitigation (Probabilistic early expiration / mutex locks)',
        'Frame all system design solutions with user & revenue impact'
      ]
    }
  },
  {
    id: 'arch-session-102',
    candidateName: 'Riyanshi Verma',
    targetRole: 'Senior / Staff Software Engineer',
    scenarioTitle: 'Critical Outage Post-Mortem & Stakeholder Crisis',
    timestamp: Date.now() - 44 * 24 * 60 * 60 * 1000, // ~44 days ago
    dateFormatted: 'July 20, 2026',
    durationMinutes: 28,
    overallScore: 73,
    hiringRecommendation: 'Leaning Hire',
    difficultyLevel: 'Senior',
    competencyScores: {
      technicalArchitecture: 76,
      businessAndCustomerImpact: 64,
      communicationAndClarity: 74,
      leadershipAndOwnership: 72,
      problemSolvingAndAgility: 78,
    },
    keyStrengths: [
      'Structured post-mortem approach using blameless retrospectives',
      'Good understanding of database connection pool exhaustion'
    ],
    keyGaps: [
      'Hesitant when negotiating enterprise SLA credits with client director',
      'Could provide more concrete recovery point objectives (RPO)'
    ],
    fullAssessment: {
      candidateName: 'Riyanshi Verma',
      targetRole: 'Senior / Staff Software Engineer',
      interviewDate: 'July 20, 2026',
      durationMinutes: 28,
      overallScore: 73,
      hiringRecommendation: 'Leaning Hire',
      executiveSummary: 'Noticeable improvement in blameless leadership and incident command. Communicated technical root cause effectively.',
      calibrationRationale: 'Solid Senior-level incident handling. Needs more executive polish during client SLA crisis discussions.',
      competencyBreakdown: [
        {
          name: 'Leadership & Team Ownership',
          score: 72,
          weight: '20%',
          verdict: 'Solid Senior',
          evidenceQuotes: [{ quote: 'I organized a 5-whys post-mortem without pointing fingers at the junior on-call engineer.', context: 'Incident post-mortem' }],
          strengths: ['Blameless mindset', 'Clear action item ownership'],
          improvements: ['Include cross-functional executive communications in timeline'],
        }
      ],
      roleByRoleFeedback: [],
      identifiedContradictionsAndGaps: [],
      adaptiveTrajectory: {
        startLevel: 'Intermediate',
        endLevel: 'Senior',
        trajectoryDescription: 'Successfully stepped up from Intermediate to Senior difficulty.'
      },
      actionableDevelopmentPlan: ['Practice contractual SLA dispute negotiation']
    }
  },
  {
    id: 'arch-session-103',
    candidateName: 'Riyanshi Verma',
    targetRole: 'Senior / Staff Software Engineer',
    scenarioTitle: '⭐ The Missing Business Impact [PS11 Demo]',
    timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000, // ~20 days ago
    dateFormatted: 'August 13, 2026',
    durationMinutes: 32,
    overallScore: 82,
    hiringRecommendation: 'Hire',
    difficultyLevel: 'Senior',
    competencyScores: {
      technicalArchitecture: 88,
      businessAndCustomerImpact: 78,
      communicationAndClarity: 82,
      leadershipAndOwnership: 79,
      problemSolvingAndAgility: 84,
    },
    keyStrengths: [
      'Proactively linked p99 latency reduction to checkout conversion uplift',
      'Defended WAL and two-phase commit failure boundaries under high load',
      'Smooth conversational handoff responses to panel members'
    ],
    keyGaps: [
      'Minor vagueness on zero-downtime database index migrations'
    ],
    fullAssessment: {
      candidateName: 'Riyanshi Verma',
      targetRole: 'Senior / Staff Software Engineer',
      interviewDate: 'August 13, 2026',
      durationMinutes: 32,
      overallScore: 82,
      hiringRecommendation: 'Hire',
      executiveSummary: 'Strong Senior/Staff performance. Successfully balanced distributed systems rigor with product conversion metrics and enterprise SLA guarantees.',
      calibrationRationale: 'Clear Hire recommendation. Candidate displayed mature engineering judgment and cross-functional empathy.',
      competencyBreakdown: [],
      roleByRoleFeedback: [],
      identifiedContradictionsAndGaps: [],
      adaptiveTrajectory: {
        startLevel: 'Senior',
        endLevel: 'Senior',
        trajectoryDescription: 'Maintained strong Senior caliber throughout high-load cross-examination.'
      },
      actionableDevelopmentPlan: ['Study zero-downtime schema migrations (e.g. pg_repack / gh-ost)']
    }
  },
  {
    id: 'arch-session-104',
    candidateName: 'Riyanshi Verma',
    targetRole: 'Senior / Staff Software Engineer',
    scenarioTitle: 'Staff Engineering Roadmap & Monolith Migration',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // ~5 days ago
    dateFormatted: 'August 28, 2026',
    durationMinutes: 35,
    overallScore: 89,
    hiringRecommendation: 'Strong Hire',
    difficultyLevel: 'Staff/Principal',
    competencyScores: {
      technicalArchitecture: 94,
      businessAndCustomerImpact: 88,
      communicationAndClarity: 86,
      leadershipAndOwnership: 90,
      problemSolvingAndAgility: 90,
    },
    keyStrengths: [
      'Mastery of multi-agent state synchronization and event-driven architecture',
      'Deep alignment of technical debt amortization with product quarterly milestones',
      'Superb STAR framework structured leadership stories'
    ],
    keyGaps: [
      'None significant; ready for top-tier Staff / Principal engineering bar'
    ],
    fullAssessment: {
      candidateName: 'Riyanshi Verma',
      targetRole: 'Senior / Staff Software Engineer',
      interviewDate: 'August 28, 2026',
      durationMinutes: 35,
      overallScore: 89,
      hiringRecommendation: 'Strong Hire',
      executiveSummary: 'Exceptional Staff-level candidate. Articulated system design trade-offs with mathematical precision while anchoring every decision in business revenue and team velocity.',
      calibrationRationale: 'Top 5% candidate benchmark for Staff Engineering loops.',
      competencyBreakdown: [],
      roleByRoleFeedback: [],
      identifiedContradictionsAndGaps: [],
      adaptiveTrajectory: {
        startLevel: 'Senior',
        endLevel: 'Staff/Principal',
        trajectoryDescription: 'Elevated from Senior to Staff/Principal tier with stellar cross-role defense.'
      },
      actionableDevelopmentPlan: ['Ready for real-world Staff/Principal engineering loops!']
    }
  }
];

export const sessionHistoryService = {
  getStoredSessions(): ArchivedSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[SessionHistoryService] Failed to read storage:', e);
    }
    // Pre-seed default realistic historical data if first time
    this.saveAllSessions(INITIAL_SEED_SESSIONS);
    return INITIAL_SEED_SESSIONS;
  },

  saveAllSessions(sessions: ArchivedSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('[SessionHistoryService] Failed to write storage:', e);
    }
  },

  saveSession(
    assessment: StructuredAssessment,
    scenarioTitle: string = 'System Design & Product Impact',
    durationMinutes: number = 25,
    difficultyLevel: DifficultyLevel = 'Senior'
  ): ArchivedSession {
    const sessions = this.getStoredSessions();
    const newId = `arch-session-${Date.now()}`;
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const cScores = {
      technicalArchitecture: 50,
      businessAndCustomerImpact: 50,
      communicationAndClarity: 50,
      leadershipAndOwnership: 50,
      problemSolvingAndAgility: 50,
    };

    if (assessment.competencyBreakdown) {
      assessment.competencyBreakdown.forEach((cb) => {
        const nameLower = cb.name.toLowerCase();
        if (nameLower.includes('tech') || nameLower.includes('arch')) cScores.technicalArchitecture = cb.score;
        if (nameLower.includes('business') || nameLower.includes('product') || nameLower.includes('customer')) cScores.businessAndCustomerImpact = cb.score;
        if (nameLower.includes('comm') || nameLower.includes('concise') || nameLower.includes('clarity')) cScores.communicationAndClarity = cb.score;
        if (nameLower.includes('leader') || nameLower.includes('owner')) cScores.leadershipAndOwnership = cb.score;
        if (nameLower.includes('problem') || nameLower.includes('agil') || nameLower.includes('trouble')) cScores.problemSolvingAndAgility = cb.score;
      });
    }

    const keyStrengths: string[] = [];
    const keyGaps: string[] = [];

    (assessment.competencyBreakdown || []).forEach((c) => {
      (c.strengths || []).forEach((s) => keyStrengths.push(s));
      (c.improvements || []).forEach((imp) => keyGaps.push(imp));
    });

    (assessment.identifiedContradictionsAndGaps || []).forEach((g) => {
      keyGaps.push(`${g.topic}: ${g.actualContradictionOrGap}`);
    });

    const newSession: ArchivedSession = {
      id: newId,
      candidateName: assessment.candidateName || 'Candidate',
      targetRole: assessment.targetRole || 'Senior Engineer',
      scenarioTitle,
      timestamp: Date.now(),
      dateFormatted,
      durationMinutes: durationMinutes || assessment.durationMinutes || 20,
      overallScore: assessment.overallScore,
      hiringRecommendation: assessment.hiringRecommendation,
      difficultyLevel: (assessment.adaptiveTrajectory?.endLevel as DifficultyLevel) || difficultyLevel,
      competencyScores: cScores,
      keyStrengths: keyStrengths.slice(0, 4),
      keyGaps: keyGaps.slice(0, 4),
      fullAssessment: assessment,
    };

    const updated = [...sessions, newSession];
    this.saveAllSessions(updated);
    return newSession;
  },

  deleteSession(id: string): ArchivedSession[] {
    const sessions = this.getStoredSessions().filter((s) => s.id !== id);
    this.saveAllSessions(sessions);
    return sessions;
  },

  resetToDefaultSeed(): ArchivedSession[] {
    this.saveAllSessions(INITIAL_SEED_SESSIONS);
    return INITIAL_SEED_SESSIONS;
  },

  getAggregatedGrowthMetrics(): AggregatedGrowthMetrics {
    const sessions = this.getStoredSessions().sort((a, b) => a.timestamp - b.timestamp);

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        firstSessionScore: 0,
        latestSessionScore: 0,
        scoreDelta: 0,
        readinessRating: { level: 'Intermediate', percentage: 50, verdict: 'Initial Evaluation' },
        scoreTrajectory: [],
        competencyEvolution: [],
        recurringWeaknesses: [],
        recurringStrengths: [],
        recommendationBreakdown: {},
      };
    }

    const first = sessions[0];
    const latest = sessions[sessions.length - 1];
    const totalScore = sessions.reduce((sum, s) => sum + s.overallScore, 0);
    const averageScore = Math.round(totalScore / sessions.length);
    const scoreDelta = latest.overallScore - first.overallScore;

    // Build Trajectory Points
    const scoreTrajectory = sessions.map((s, idx) => ({
      id: s.id,
      label: `S${idx + 1}`,
      date: s.dateFormatted,
      score: s.overallScore,
      scenario: s.scenarioTitle,
      recommendation: s.hiringRecommendation,
    }));

    // 5-Axis Competency Evolution
    const competencyEvolution: CompetencyEvolution[] = [
      {
        key: 'technicalArchitecture',
        label: 'Technical Architecture & Scale',
        firstScore: first.competencyScores.technicalArchitecture,
        latestScore: latest.competencyScores.technicalArchitecture,
        delta: latest.competencyScores.technicalArchitecture - first.competencyScores.technicalArchitecture,
        benchmarkTarget: 85,
      },
      {
        key: 'businessAndCustomerImpact',
        label: 'Business & Customer Impact (ROI)',
        firstScore: first.competencyScores.businessAndCustomerImpact,
        latestScore: latest.competencyScores.businessAndCustomerImpact,
        delta: latest.competencyScores.businessAndCustomerImpact - first.competencyScores.businessAndCustomerImpact,
        benchmarkTarget: 80,
      },
      {
        key: 'communicationAndClarity',
        label: 'Communication & Conciseness',
        firstScore: first.competencyScores.communicationAndClarity,
        latestScore: latest.competencyScores.communicationAndClarity,
        delta: latest.competencyScores.communicationAndClarity - first.competencyScores.communicationAndClarity,
        benchmarkTarget: 80,
      },
      {
        key: 'leadershipAndOwnership',
        label: 'Leadership & Team Ownership',
        firstScore: first.competencyScores.leadershipAndOwnership,
        latestScore: latest.competencyScores.leadershipAndOwnership,
        delta: latest.competencyScores.leadershipAndOwnership - first.competencyScores.leadershipAndOwnership,
        benchmarkTarget: 80,
      },
      {
        key: 'problemSolvingAndAgility',
        label: 'Problem Solving & Trade-off Agility',
        firstScore: first.competencyScores.problemSolvingAndAgility,
        latestScore: latest.competencyScores.problemSolvingAndAgility,
        delta: latest.competencyScores.problemSolvingAndAgility - first.competencyScores.problemSolvingAndAgility,
        benchmarkTarget: 85,
      },
    ];

    // Recurring Gaps & Strengths Aggregation
    const gapCounts: Record<string, number> = {};
    const strengthCounts: Record<string, number> = {};
    const recCounts: Record<string, number> = {};

    sessions.forEach((s) => {
      recCounts[s.hiringRecommendation] = (recCounts[s.hiringRecommendation] || 0) + 1;
      (s.keyGaps || []).forEach((g) => {
        // Group similar gaps
        let category = g;
        if (g.toLowerCase().includes('business') || g.toLowerCase().includes('roi') || g.toLowerCase().includes('revenue')) {
          category = 'Missing Business ROI & Conversion Justification';
        } else if (g.toLowerCase().includes('fail') || g.toLowerCase().includes('partition') || g.toLowerCase().includes('split')) {
          category = 'Distributed Failure Modes & Network Partition Recovery';
        } else if (g.toLowerCase().includes('sla') || g.toLowerCase().includes('credit') || g.toLowerCase().includes('contract')) {
          category = 'Enterprise SLA Contractual Downtime Negotiation';
        } else if (g.toLowerCase().includes('vague') || g.toLowerCase().includes('lock')) {
          category = 'Superficial Jargon vs Exact Lock Contention Mechanics';
        }
        gapCounts[category] = (gapCounts[category] || 0) + 1;
      });

      (s.keyStrengths || []).forEach((st) => {
        let category = st;
        if (st.toLowerCase().includes('cache') || st.toLowerCase().includes('redis')) {
          category = 'High-Throughput Caching & Low-Latency API Design';
        } else if (st.toLowerCase().includes('blameless') || st.toLowerCase().includes('leader') || st.toLowerCase().includes('star')) {
          category = 'Structured STAR Leadership & Blameless Retrospectives';
        } else if (st.toLowerCase().includes('multi-agent') || st.toLowerCase().includes('event') || st.toLowerCase().includes('rag')) {
          category = 'AI Multi-Agent Systems & Distributed Synchronization';
        }
        strengthCounts[category] = (strengthCounts[category] || 0) + 1;
      });
    });

    const recurringWeaknesses: RecurringPattern[] = Object.entries(gapCounts)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: Math.round((count / sessions.length) * 100),
        category: 'weakness' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const recurringStrengths: RecurringPattern[] = Object.entries(strengthCounts)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: Math.round((count / sessions.length) * 100),
        category: 'strength' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Readiness Level Calculation
    let readinessLevel = 'Intermediate Engineer';
    let readinessVerdict = 'Baseline Competency Established';
    if (latest.overallScore >= 85) {
      readinessLevel = 'Staff / Principal Engineer';
      readinessVerdict = 'Ready for Top-Tier Executive & Staff Loops';
    } else if (latest.overallScore >= 75) {
      readinessLevel = 'Senior Software Engineer';
      readinessVerdict = 'Ready for Senior High-Throughput & Lead Loops';
    }

    return {
      totalSessions: sessions.length,
      averageScore,
      firstSessionScore: first.overallScore,
      latestSessionScore: latest.overallScore,
      scoreDelta,
      readinessRating: {
        level: readinessLevel,
        percentage: latest.overallScore,
        verdict: readinessVerdict,
      },
      scoreTrajectory,
      competencyEvolution,
      recurringWeaknesses,
      recurringStrengths,
      recommendationBreakdown: recCounts,
    };
  },
};

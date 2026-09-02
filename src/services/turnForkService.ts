import { TranscriptMessage, SharedCandidateContext, Interviewer, AnalysisFlag } from '../types';

export interface TurnCheckpoint {
  turnIndex: number;
  turnMessageId: string;
  interviewerId: string;
  interviewerName: string;
  interviewerRole: string;
  questionText: string;
  originalAnswer: string;
  originalAnswerMessageId?: string;
  transcriptPrefix: TranscriptMessage[];
  sharedContextSnapshot: SharedCandidateContext;
  flagsRaised: AnalysisFlag[];
  timestamp: number;
}

export interface CoachBlueprint {
  recommendedStructure: string[];
  staffLevelKeyPoints: string[];
  commonPitfallsToAvoid: string[];
  idealSampleFraming: string;
  targetCompetency: string;
}

export interface BranchComparison {
  originalClarity: number;
  newClarity: number;
  originalImpact: number;
  newImpact: number;
  flagsResolved: string[];
  coachingSummary: string;
}

export const turnForkService = {
  /**
   * Creates a structured snapshot checkpoint from an existing transcript index
   */
  createCheckpoint(
    turnIndex: number,
    transcript: TranscriptMessage[],
    sharedContext: SharedCandidateContext,
    activePanel: Interviewer[]
  ): TurnCheckpoint | null {
    if (turnIndex < 0 || turnIndex >= transcript.length) return null;

    const targetMsg = transcript[turnIndex];
    let interviewerMsg: TranscriptMessage | undefined;
    let candidateMsg: TranscriptMessage | undefined;

    if (targetMsg.speakerRole === 'candidate') {
      candidateMsg = targetMsg;
      // Find the interviewer question immediately preceding it
      for (let i = turnIndex - 1; i >= 0; i--) {
        if (transcript[i].speakerRole !== 'candidate') {
          interviewerMsg = transcript[i];
          break;
        }
      }
    } else {
      interviewerMsg = targetMsg;
      // Find candidate answer immediately following if present
      if (turnIndex + 1 < transcript.length && transcript[turnIndex + 1].speakerRole === 'candidate') {
        candidateMsg = transcript[turnIndex + 1];
      }
    }

    if (!interviewerMsg) return null;

    const questionIndex = transcript.findIndex((m) => m.id === interviewerMsg?.id);
    const transcriptPrefix = transcript.slice(0, questionIndex + 1);

    // Deep clone context snapshot
    const clonedContext: SharedCandidateContext = JSON.parse(JSON.stringify(sharedContext));

    return {
      turnIndex: questionIndex,
      turnMessageId: interviewerMsg.id,
      interviewerId: interviewerMsg.speakerId,
      interviewerName: interviewerMsg.speakerName,
      interviewerRole: interviewerMsg.speakerRole,
      questionText: interviewerMsg.content,
      originalAnswer: candidateMsg ? candidateMsg.content : '',
      originalAnswerMessageId: candidateMsg?.id,
      transcriptPrefix,
      sharedContextSnapshot: clonedContext,
      flagsRaised: candidateMsg?.detectedFlags || [],
      timestamp: interviewerMsg.timestamp,
    };
  },

  /**
   * Generates instant Staff+ Coach Blueprints and STAR frameworks for any question
   */
  generateCoachBlueprint(question: string, interviewerRole: string): CoachBlueprint {
    const qLower = question.toLowerCase();

    if (qLower.includes('scale') || qLower.includes('architecture') || qLower.includes('sharding') || qLower.includes('system') || qLower.includes('database')) {
      return {
        targetCompetency: 'Technical Architecture & Distributed Systems',
        recommendedStructure: [
          '1. Clarify Scale & Constraints: Query per second (QPS), write-to-read ratio, latency SLAs (p99 < 50ms).',
          '2. High-Level Data Flow: CDN -> API Gateway -> Stateless Services -> Partitioned Storage.',
          '3. Deep Dive Bottlenecks: Partition keys, replication lag, idempotency, caching invalidation strategies.',
          '4. Failure Modes & Resilience: Circuit breakers, fallback queues, disaster recovery (RPO/RTO).',
        ],
        staffLevelKeyPoints: [
          'Lead with quantitative numbers (e.g. "Assuming 100M DAU with 5:1 read-to-write ratio...")',
          'Explicitly discuss trade-offs (e.g. Strong Consistency vs High Availability under CAP theorem)',
          'State exact technology choices with justification, not generic terms (e.g. PostgreSQL with Citus vs DynamoDB)',
        ],
        commonPitfallsToAvoid: [
          'Jumping straight into technologies without clarifying throughput or SLAs',
          'Hand-waving "we will just add a Redis cache" without cache eviction or stampede protection policies',
          'Ignoring data consistency or dual-write distributed transaction failures',
        ],
        idealSampleFraming:
          '"To address this architecture, I would first establish the traffic profile. For 50k peak writes/sec, a single SQL instance will bottleneck on write IOPS. I would partition the database using a consistent hashing ring on Tenant ID, placing an asynchronous write-behind Kafka buffer in front to absorb traffic bursts and protect our primary WAL."',
      };
    }

    if (qLower.includes('customer') || qLower.includes('product') || qLower.includes('business') || qLower.includes('impact') || qLower.includes('cost') || qLower.includes('revenue')) {
      return {
        targetCompetency: 'Business & Customer Impact',
        recommendedStructure: [
          '1. Customer Persona & Pain Point: Who is suffering and what business workflow is blocked.',
          '2. Root Cause Analysis: How engineering metrics directly tied to business churn or lost conversions.',
          '3. Solution & Trade-off: Pragmatic engineering compromise delivered iteratively.',
          '4. Measurable Business Outcome: Dollar savings, conversion % lift, or customer NPS improvements.',
        ],
        staffLevelKeyPoints: [
          'Tie engineering uptime/latency directly to business revenue metrics (e.g. "$250k quarterly revenue saved")',
          'Acknowledge resource and time constraints, showing executive alignment',
          'Demonstrate proactive stakeholder communication before incidents escalate',
        ],
        commonPitfallsToAvoid: [
          'Focusing exclusively on technical trivia while ignoring customer churn or business ROI',
          'Speaking passively ("a solution was found") rather than owning direct leadership and decisions',
          'Failing to mention concrete before/after measurement metrics',
        ],
        idealSampleFraming:
          '"When enterprise onboarding drop-off reached 18%, I traced the latency to synchronous third-party KYC checks. Rather than doing a multi-month rewrite, I decoupled the verification into an asynchronous background worker with optimistic UI. This reduced onboarding time from 4 minutes to 12 seconds, increasing completed sign-ups by 22% and retaining ~$400k in annual ARR."',
      };
    }

    // General Behavioral & Leadership
    return {
      targetCompetency: 'Leadership, Ownership & Communication',
      recommendedStructure: [
        '1. Context & Stakes: The high-stakes engineering challenge and team constraints.',
        '2. Conflict / Technical Disagreement: Differing viewpoints articulated with empathy.',
        '3. Data-Driven Consensus: How you established objective evaluation criteria (RFC, prototypes, benchmarks).',
        '4. Long-Term Organizational Impact: Mentorship, reusable patterns, and post-mortem learnings.',
      ],
      staffLevelKeyPoints: [
        'Use the STAR framework (Situation, Task, Action, Result) with 70% of time spent on Action & Result',
        'Demonstrate how you influenced without direct authority through RFC prototypes and evidence',
        'Highlight mentorship and lifting up junior/mid-level teammates',
      ],
      commonPitfallsToAvoid: [
        'Speaking about the team in the abstract without clarifying your distinct individual contribution',
        'Complaining about other departments or difficult stakeholders',
        'Leaving the story without a measurable conclusion or retrospective learning',
      ],
      idealSampleFraming:
        '"When our team had a strong ideological split between GraphQL and gRPC for microservice federation, I authored a 2-page RFC with deterministic latency benchmarks and prototype ergonomics. By facilitating a blameless technical review, we aligned on gRPC for internal mesh and GraphQL for mobile clients, reducing p99 service-to-service latency by 45%."',
    };
  },

  /**
   * Fast client-side analysis comparing original answer vs retried answer
   */
  evaluateRetryComparison(originalAnswer: string, newAnswer: string): BranchComparison {
    const origWords = originalAnswer.trim().split(/\s+/).length;
    const newWords = newAnswer.trim().split(/\s+/).length;

    // Detect technical concrete metrics in new answer
    const metricMatches = (newAnswer.match(/(\d+(?:\.\d+)?\s*(?:ms|s|%|k|m|gb|tb|qps|dau|arr|\$))/gi) || []).length;
    const structureMatches = (newAnswer.match(/(first|second|trade-off|bottleneck|because|resulted in|architecture|partition|latency|sla)/gi) || []).length;

    const originalClarity = Math.min(85, Math.max(40, Math.round(55 + origWords * 0.15)));
    const newClarity = Math.min(98, Math.max(65, Math.round(70 + metricMatches * 5 + structureMatches * 3)));

    const originalImpact = Math.min(80, Math.max(35, Math.round(50 + (originalAnswer.includes('$') || originalAnswer.includes('%') ? 20 : 0))));
    const newImpact = Math.min(99, Math.max(70, Math.round(75 + metricMatches * 6)));

    const flagsResolved: string[] = [];
    if (metricMatches > 0) flagsResolved.push('Concrete Metrics Provided');
    if (structureMatches >= 2) flagsResolved.push('Structured Trade-off Reasoning');
    if (newWords >= 30) flagsResolved.push('Sufficient Depth & Detail');

    return {
      originalClarity,
      newClarity,
      originalImpact,
      newImpact,
      flagsResolved,
      coachingSummary:
        newClarity > originalClarity
          ? `Substantial improvement (+${newClarity - originalClarity}% clarity). Answer is significantly more structured with quantitative justifications.`
          : 'Answer updated. Ready to branch conversation with the AI panel.',
    };
  },
};

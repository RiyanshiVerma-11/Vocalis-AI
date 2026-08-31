export type InterviewerRole = 'technical' | 'product' | 'hiring_manager' | 'customer' | 'behavioural';

export interface InterviewerSpeakingStyle {
  tone: string;
  signatureJargon: string[];
  questioningStrategy: string;
  typicalAreasOfQuestioning: string[];
  handoffStyle: string;
  samplePhrase: string;
}

export interface Interviewer {
  id: string;
  name: string;
  role: InterviewerRole;
  title: string;
  company: string;
  avatarColor: string;
  avatarIcon: string;
  voiceName: 'Fenrir' | 'Kore' | 'Zephyr' | 'Puck' | 'Aoede' | 'Charon';
  pitch: number;
  rate: number;
  focusArea: string;
  personalityTraits: string[];
  speakingStyle: InterviewerSpeakingStyle;
  systemPrompt: string;
  defaultBio: string;
}

export type DifficultyLevel = 'Foundational' | 'Intermediate' | 'Senior' | 'Staff/Principal';

export interface CandidateResume {
  id: string;
  fullName: string;
  headline: string;
  yearsOfExperience: number;
  location: string;
  summary: string;
  skills: {
    coreArchitecture: string[];
    languagesAndFrameworks: string[];
    cloudAndInfrastructure: string[];
    practicesAndMethodologies: string[];
  };
  workExperience: Array<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  notableProjects: Array<{
    name: string;
    description: string;
    metrics: string;
  }>;
  rawText?: string;
}

export type CandidateSentiment = 'Confident & Structured' | 'Hesitant / Uncertain' | 'Deflective / Evasive' | 'Analytical & Deep' | 'Enthusiastic & Collaborative';
export type AnswerDepth = 'Surface (Hand-waving)' | 'Intermediate (Practical)' | 'Deep (Architectural / Nuanced)' | 'Principal (Multi-Dimensional)';
export type AdaptiveStrategy = 'Deep Probe' | 'Challenge Assumption' | 'Explore Alternative' | 'Off-Script Pivot' | 'Cross-Role Handoff';

export interface QuestionHistoryItem {
  id: string;
  turnNumber: number;
  interviewerId: string;
  interviewerName: string;
  interviewerRole: InterviewerRole;
  questionText: string;
  topic: string;
  targetCompetency: string;
  adaptiveStrategyUsed: AdaptiveStrategy;
  difficultyLevel?: DifficultyLevel;
  resumeReferenceUsed?: string;
  candidateResponseSummary?: string;
  candidateDepth?: AnswerDepth;
  timestamp: number;
}

export interface TranscriptMessage {
  id: string;
  speakerId: string; // 'candidate' or interviewer id
  speakerName: string;
  speakerRole: 'candidate' | InterviewerRole;
  content: string;
  timestamp: number;
  audioDurationMs?: number;
  interrupted?: boolean;
  detectedFlags?: AnalysisFlag[];
  internalThought?: string;
  difficultyAtTurn?: DifficultyLevel;
  adaptiveStrategy?: AdaptiveStrategy;
  referencedResumePoint?: string;
  adaptiveAnalysis?: {
    sentiment: CandidateSentiment;
    depthLevel: AnswerDepth;
    detectedKeywords: string[];
    strategyApplied?: AdaptiveStrategy;
    resumePointReferenced?: string;
  };
}

export interface AnalysisFlag {
  id: string;
  type: 'contradiction' | 'vague' | 'missing_impact' | 'strong_insight' | 'technical_depth';
  quote: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
  suggestedProbe?: string;
}

export type PanelStrictness = 'Supportive' | 'Balanced' | 'Strict' | 'Relentless Bar Raiser';

export interface RubricWeights {
  technicalArchitecture: number; // e.g. 30 (percentage)
  businessAndCustomerImpact: number; // e.g. 25
  communicationAndClarity: number; // e.g. 15
  leadershipAndOwnership: number; // e.g. 15
  problemSolvingAndAgility: number; // e.g. 15
}

export interface JargonAuditResult {
  practicalDepthRatio: number; // 0 to 100%
  buzzwordDensity: 'Low' | 'Moderate' | 'High (Hand-Waving Risk)';
  verifiedConcreteMetricsCount: number;
  jargonTermsUsed: string[];
  auditSummary: string;
}

export interface SharedCandidateContext {
  candidateName: string;
  candidateResume: CandidateResume;
  targetRole: string;
  targetLevel: string;
  currentDifficulty: DifficultyLevel;
  difficultyScore: number; // 1 to 10
  panelStrictness?: PanelStrictness;
  rubricWeights?: RubricWeights;
  runningSummary: string;
  demonstratedStrengths: string[];
  identifiedWeaknesses: string[];
  unresolvedProbes: string[];
  activeTopic: string;
  questionHistory: QuestionHistoryItem[];
  latestAdaptiveAnalysis?: {
    sentiment: CandidateSentiment;
    depthLevel: AnswerDepth;
    detectedKeywords: string[];
    lastStrategy: AdaptiveStrategy;
    resumePointReferenced?: string;
  };
  competencyScores: {
    technicalArchitecture: number; // 0-100
    businessAndCustomerImpact: number; // 0-100
    communicationAndClarity: number; // 0-100
    leadershipAndOwnership: number; // 0-100
    problemSolvingAndAgility: number; // 0-100
  };
  backstagePanelNotes: Array<{
    authorRole: InterviewerRole;
    authorName: string;
    note: string;
    timestamp: number;
  }>;
  flaggedItems: AnalysisFlag[];
}

export interface InterviewScenario {
  id: string;
  title: string;
  category: 'System Design & Product Impact' | 'Incident Response & Stakeholder Management' | 'Behavioral & Leadership' | 'Full-Stack Architecture' | 'Custom Roleplay';
  description: string;
  context: string;
  targetRole: string;
  recommendedPanel: InterviewerRole[];
  starterPrompt: string;
  initialSpeakerRole: InterviewerRole;
  difficulty: DifficultyLevel;
  exampleDynamics: string;
  customConstraints?: string;
}

export interface StructuredAssessment {
  candidateName: string;
  targetRole: string;
  interviewDate: string;
  durationMinutes: number;
  overallScore: number; // 0-100
  panelStrictness?: PanelStrictness;
  rubricWeightsUsed?: RubricWeights;
  jargonAudit?: JargonAuditResult;
  hiringRecommendation: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Leaning No Hire' | 'Strong No Hire';
  executiveSummary: string;
  calibrationRationale: string;
  competencyBreakdown: {
    name: string;
    score: number;
    weight: string;
    verdict: string;
    evidenceQuotes: Array<{
      quote: string;
      context: string;
      timestampMs?: number;
    }>;
    strengths: string[];
    improvements: string[];
  }[];
  roleByRoleFeedback: Array<{
    interviewerRole: InterviewerRole;
    interviewerName: string;
    score: number;
    verdict: string;
    commentary: string;
    keyObservationQuote: string;
  }>;
  identifiedContradictionsAndGaps: Array<{
    topic: string;
    candidateClaim: string;
    actualContradictionOrGap: string;
    recommendation: string;
  }>;
  adaptiveTrajectory: {
    startLevel: DifficultyLevel;
    endLevel: DifficultyLevel;
    trajectoryDescription: string;
  };
  actionableDevelopmentPlan: string[];
}

export type AppView = 'landing' | 'login' | 'studio';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'interviewer' | 'recruiter' | 'admin';
  targetTitle?: string;
  avatarInitials: string;
  isLoggedIn: boolean;
  isDemo?: boolean;
}


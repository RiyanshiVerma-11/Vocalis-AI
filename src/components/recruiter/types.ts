import { Interviewer, InterviewScenario, CandidateResume, DifficultyLevel, CustomCompanyRubric, UserSession } from '../../types';

export interface RecruiterDashboardProps {
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
  activeTab?: 'analytics' | 'candidates' | 'requisitions';
  onTabChange?: (tab: 'analytics' | 'candidates' | 'requisitions') => void;
  currentUser?: UserSession | null;
  onOpenDemographicAudit?: () => void;
  onOpenParityShortlist?: () => void;
  isDemographicAuditOpen?: boolean;
  onCloseDemographicAudit?: () => void;
  isParityShortlistOpen?: boolean;
  onCloseParityShortlist?: () => void;
}

export interface EnrichedCandidate {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  city: string;
  state: string;
  country: string;
  role: string;
  targetRole?: string;
  date: string;
  timestamp?: number;
  overallScore: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Leaning No Hire' | 'Strong No Hire';
  panelUsed: Interviewer[];
  keyStrengths: string[];
  quoteEvidence: string;
  status: 'Evaluated' | 'Under Review' | 'Flagged';
  technicalScore: number;
  problemSolvingScore: number;
  leadershipScore: number;
  businessScore: number;
  communicationScore: number;
  standoutPraise?: string;
  jargonAudit?: {
    practicalDepthRatio: number;
    buzzwordDensity: string;
    verifiedConcreteMetricsCount: number;
    auditSummary: string;
    scrutinizedTerms?: string[];
  } | any;
  competencies?: Array<{
    name: string;
    score: number;
    weight: string;
    verdict: string;
    color?: string;
  }>;
  sampleQA?: Array<{
    interviewerIndex: number;
    interviewerName: string;
    interviewerTitle: string;
    roleBadge: string;
    score: number;
    verdict: string;
    question: string;
    answer: string;
    feedback: string;
  }>;
  yearsOfExperience?: number;
  experienceTier?: ExperienceTier;
  previousCompany?: string;
  workMode?: 'Remote' | 'Onsite' | 'Hybrid';
  barRaiserCheck?: {
    topic: string;
    candidateClaim: string;
    aiProbe: string;
    candidateAdjustment: string;
    verdict: string;
  };
  onboardingPlan?: string[];
}

export type ExperienceTier = 'fresher' | 'beginner' | 'mid' | 'senior' | 'expert';

export interface ExperienceTierInfo {
  tier: ExperienceTier;
  label: string;
  range: string;
  minYears: number;
  maxYears: number;
  badge: string;
  color: string;
  bg: string;
  border: string;
  description: string;
}

export interface ExperienceBreakdownItem extends ExperienceTierInfo {
  count: number;
  percentage: number;
  avgScore: number;
  passRate: number;
  topCandidateName?: string;
  topCandidateScore?: number;
}

export const EXPERIENCE_TIERS: Record<ExperienceTier, ExperienceTierInfo> = {
  fresher: {
    tier: 'fresher',
    label: 'Fresher',
    range: '0–1 Yrs',
    minYears: 0,
    maxYears: 1,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    color: '#10b981',
    bg: 'bg-emerald-500',
    border: 'border-emerald-300',
    description: 'Fresh campus graduates & entry-level trainees',
  },
  beginner: {
    tier: 'beginner',
    label: 'Beginner (1–3 Yrs)',
    range: '1–3 Yrs',
    minYears: 1,
    maxYears: 3,
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    color: '#3b82f6',
    bg: 'bg-blue-500',
    border: 'border-blue-300',
    description: 'Junior software engineers & early-career devs',
  },
  mid: {
    tier: 'mid',
    label: 'Mid-Level (4–8 Yrs)',
    range: '4–8 Yrs',
    minYears: 4,
    maxYears: 8,
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    color: '#6366f1',
    bg: 'bg-indigo-500',
    border: 'border-indigo-300',
    description: 'Software engineers & technical leads',
  },
  senior: {
    tier: 'senior',
    label: 'Senior (8–10 Yrs)',
    range: '8–10 Yrs',
    minYears: 8,
    maxYears: 10,
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    color: '#a855f7',
    bg: 'bg-purple-500',
    border: 'border-purple-300',
    description: 'Senior engineers & engineering managers',
  },
  expert: {
    tier: 'expert',
    label: 'Staff / Principal (10+ Yrs)',
    range: '10+ Yrs',
    minYears: 10,
    maxYears: 99,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    color: '#f59e0b',
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    description: 'Staff, Principal architects, and VP/Directors',
  },
};

export const getExperienceTier = (years: number = 0): ExperienceTier => {
  if (years <= 1) return 'fresher';
  if (years <= 3) return 'beginner';
  if (years <= 8) return 'mid';
  if (years <= 10) return 'senior';
  return 'expert';
};

export const STATE_COLOR_PALETTE: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  Telangana: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', hex: '#6366f1' },
  Karnataka: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', hex: '#8b5cf6' },
  Maharashtra: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', hex: '#0284c7' },
  'Delhi-NCR': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hex: '#10b981' },
  'West Bengal': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', hex: '#f59e0b' },
  'Tamil Nadu': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', hex: '#ec4899' },
  Rajasthan: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hex: '#f97316' },
  'Uttar Pradesh': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hex: '#3b82f6' },
  Gujarat: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', hex: '#14b8a6' },
};

export const FALLBACK_HEX_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#0284c7',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#f97316',
  '#3b82f6',
  '#14b8a6',
  '#94a3b8',
];

export const getStateColor = (state: string, idx: number = 0): string => {
  return STATE_COLOR_PALETTE[state]?.hex || FALLBACK_HEX_COLORS[idx % FALLBACK_HEX_COLORS.length];
};

export const getCandidateTimestamp = (cand: EnrichedCandidate): number => {
  if (typeof cand.timestamp === 'number' && !isNaN(cand.timestamp) && cand.timestamp > 0) {
    return cand.timestamp;
  }
  const dateStr = (cand.date || '').trim();
  const lower = dateStr.toLowerCase();
  const now = Date.now();

  if (lower.startsWith('today')) {
    const timeMatch = dateStr.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const todayDate = new Date();
      todayDate.setHours(hours, minutes, 0, 0);
      return todayDate.getTime();
    }
    return now - 2 * 3600 * 1000;
  }

  if (lower.startsWith('yesterday')) {
    const timeMatch = dateStr.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const yDate = new Date(now - 86400 * 1000);
      yDate.setHours(hours, minutes, 0, 0);
      return yDate.getTime();
    }
    return now - 24 * 3600 * 1000;
  }

  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return parsed;
  }
  return 0;
};

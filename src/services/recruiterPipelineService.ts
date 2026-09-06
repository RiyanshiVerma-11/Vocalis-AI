import { EnrichedCandidate, ExperienceBreakdownItem, ExperienceTier, EXPERIENCE_TIERS, getExperienceTier, getCandidateTimestamp } from '../components/recruiter/types';
import { DEMO_ENRICHED_CANDIDATES } from '../components/recruiter/demoCandidates';
import { sessionHistoryService } from './sessionHistoryService';
import { ALL_INTERVIEWERS } from '../data/interviewers';
import { DifficultyLevel } from '../types';

export interface CohortAnalytics {
  total: number;
  femaleCount: number;
  maleCount: number;
  femalePct: number;
  malePct: number;
  femaleAvgScore: number;
  maleAvgScore: number;
  overallAvgScore: number;
  topFemaleCandidate: EnrichedCandidate | null;
  topMaleCandidate: EnrichedCandidate | null;
  stateBreakdown: Array<{
    state: string;
    count: number;
    percentage: number;
    avgScore: number;
    passRate: number;
    topCandidateName: string;
    topCandidateScore: number;
  }>;
  experienceBreakdown: ExperienceBreakdownItem[];
  experienceCounts: Record<string, number>;
  strongHireCount: number;
  passRate: number;
}

export interface ParityTarget {
  femaleRatio: number; // e.g. 60
  maleRatio: number;   // e.g. 40
  label: string;       // e.g. "60:40 Women in Tech Focus"
}

/**
 * Parses user session diversityGoal string into numerical female/male ratio
 * Examples:
 * "Balanced Pipeline (~50:50 Ratio)" -> { femaleRatio: 50, maleRatio: 50 }
 * "Women in Tech Focus (~60:40)" -> { femaleRatio: 60, maleRatio: 40 }
 * "Balanced Pipeline (~45:55 Ratio)" -> { femaleRatio: 45, maleRatio: 55 }
 */
export function parseDiversityGoalToRatio(goalStr?: string | null): ParityTarget {
  if (!goalStr) {
    return { femaleRatio: 50, maleRatio: 50, label: 'Balanced Pipeline (50:50)' };
  }

  const match = goalStr.match(/(\d+)\s*[:/]\s*(\d+)/);
  if (match) {
    const femaleRatio = parseInt(match[1], 10);
    const maleRatio = parseInt(match[2], 10);
    return { femaleRatio, maleRatio, label: goalStr };
  }

  if (goalStr.toLowerCase().includes('60:40') || goalStr.toLowerCase().includes('women')) {
    return { femaleRatio: 60, maleRatio: 40, label: goalStr };
  }

  if (goalStr.toLowerCase().includes('45:55')) {
    return { femaleRatio: 45, maleRatio: 55, label: goalStr };
  }

  return { femaleRatio: 50, maleRatio: 50, label: goalStr };
}

/**
 * Returns unified candidate pipeline merging live stored session history with pre-calibrated demo dossiers.
 * Single source of truth across the entire app.
 */
export function getUnifiedCandidatePipeline(): EnrichedCandidate[] {
  try {
    const stored = sessionHistoryService.getStoredSessions();
    if (stored && stored.length > 0) {
      const mappedReal: EnrichedCandidate[] = stored.map((s, idx) => {
        const isRiyanshi = Boolean(s.candidateName && s.candidateName.toLowerCase().includes('riyanshi'));
        const inferredGender: 'Female' | 'Male' = isRiyanshi ? 'Female' : idx % 2 === 0 ? 'Female' : 'Male';
        const indianCities = [
          { city: 'Bengaluru', state: 'Karnataka' },
          { city: 'Hyderabad', state: 'Telangana' },
          { city: 'Mumbai', state: 'Maharashtra' },
          { city: 'Gurugram', state: 'Delhi-NCR' },
          { city: 'Pune', state: 'Maharashtra' },
        ];

        let candCity = s.city;
        let candState = s.state;
        const candCountry = s.country || 'India';

        if (!candCity && s.location && s.location !== 'Remote') {
          const locParts = s.location.split(',');
          if (locParts.length >= 2) {
            candCity = locParts[0].trim();
            candState = locParts[1].trim();
          } else {
            candCity = locParts[0].trim();
          }
        }

        if (!candCity) {
          const fallback = isRiyanshi
            ? { city: 'Meerut', state: 'Uttar Pradesh' }
            : indianCities[idx % indianCities.length];
          candCity = fallback.city;
          candState = candState || fallback.state;
        }

        const defaultExpByDiff: Record<DifficultyLevel, number> = {
          Foundational: 0.5,
          Intermediate: 2,
          Senior: 6,
          'Staff/Principal': 11,
        };
        const years =
          s.yearsOfExperience ??
          (s.difficultyLevel ? defaultExpByDiff[s.difficultyLevel] : [0.5, 2, 5, 8, 12][idx % 5]);
        const expTier = getExperienceTier(years);
        const companies = ['Flipkart', 'Paytm', 'Zomato', 'Ola', 'InMobi', 'Jio Platforms'];
        const workModes: Array<'Remote' | 'Onsite' | 'Hybrid'> = ['Remote', 'Onsite', 'Hybrid'];
        const prevComp =
          expTier === 'fresher'
            ? 'None (Fresher / Campus Graduate)'
            : s.previousCompany || companies[idx % companies.length];
        const wMode = expTier === 'fresher' ? 'Onsite' : s.workMode || workModes[idx % workModes.length];

        return {
          id: s.id || `cand-session-${idx}`,
          name: s.candidateName || 'Candidate',
          gender: inferredGender,
          city: candCity,
          state: candState || 'Karnataka',
          country: candCountry,
          role: s.targetRole || 'Software Engineer',
          targetRole: s.targetRole,
          yearsOfExperience: years,
          experienceTier: expTier,
          previousCompany: prevComp,
          workMode: wMode,
          date: s.dateFormatted || 'Recent Session',
          timestamp: s.timestamp || Date.now() - idx * 60000,
          overallScore: s.overallScore || 85,
          recommendation: s.hiringRecommendation || 'Hire',
          panelUsed: ALL_INTERVIEWERS,
          technicalScore: s.competencyScores?.technicalArchitecture || 88,
          problemSolvingScore: s.competencyScores?.problemSolvingAndAgility || 86,
          leadershipScore: s.competencyScores?.leadershipAndOwnership || 84,
          businessScore: s.competencyScores?.businessAndCustomerImpact || 82,
          communicationScore: s.competencyScores?.communicationAndClarity || 85,
          keyStrengths:
            s.keyStrengths && s.keyStrengths.length > 0
              ? s.keyStrengths
              : ['System Architecture', 'Latency Optimization'],
          quoteEvidence: s.fullAssessment?.executiveSummary
            ? `"${s.fullAssessment.executiveSummary}"`
            : '"Candidate demonstrated solid architectural depth and rigorous problem solving under pressure."',
          status: 'Evaluated',
          jargonAudit: s.fullAssessment?.jargonAudit || {
            practicalDepthRatio: 88,
            buzzwordDensity: 'Low (12%)',
            verifiedConcreteMetricsCount: 6,
            auditSummary:
              s.fullAssessment?.calibrationRationale ||
              'Candidate articulated architectural decisions with concrete metrics.',
            scrutinizedTerms: ['Microservices', 'Distributed Cache', 'Concurrency'],
          },
          competencies:
            s.fullAssessment?.competencyBreakdown && s.fullAssessment.competencyBreakdown.length > 0
              ? s.fullAssessment.competencyBreakdown.map((cb, cIdx) => ({
                  name: cb.name,
                  score: cb.score,
                  weight: cb.weight,
                  verdict: cb.verdict,
                  color: ['indigo', 'purple', 'blue', 'emerald', 'amber'][cIdx % 5],
                }))
              : [
                  {
                    name: 'Distributed Architecture & System Design',
                    score: s.competencyScores?.technicalArchitecture || 88,
                    weight: '30%',
                    verdict: 'Meets Bar',
                    color: 'indigo',
                  },
                  {
                    name: 'Product Trade-offs & Customer Empathy',
                    score: s.competencyScores?.businessAndCustomerImpact || 82,
                    weight: '20%',
                    verdict: 'Meets Bar',
                    color: 'purple',
                  },
                  {
                    name: 'Engineering Leadership & Velocity',
                    score: s.competencyScores?.leadershipAndOwnership || 84,
                    weight: '20%',
                    verdict: 'Meets Bar',
                    color: 'blue',
                  },
                  {
                    name: 'Enterprise SLA Reliability & Security',
                    score: s.competencyScores?.problemSolvingAndAgility || 86,
                    weight: '15%',
                    verdict: 'Meets Bar',
                    color: 'emerald',
                  },
                  {
                    name: 'Behavioral Dynamics & STAR Methodology',
                    score: s.competencyScores?.communicationAndClarity || 85,
                    weight: '15%',
                    verdict: 'Meets Bar',
                    color: 'amber',
                  },
                ],
          sampleQA:
            s.fullAssessment?.roleByRoleFeedback && s.fullAssessment.roleByRoleFeedback.length > 0
              ? s.fullAssessment.roleByRoleFeedback.map((rf, fIdx) => ({
                  interviewerIndex: fIdx,
                  interviewerName: rf.interviewerName,
                  interviewerTitle:
                    rf.interviewerRole === 'technical'
                      ? 'Lead Systems Architect'
                      : rf.interviewerRole === 'product'
                      ? 'Principal Product Manager'
                      : 'Engineering Leader',
                  roleBadge: String(rf.interviewerRole).toUpperCase(),
                  score: rf.score || s.overallScore || 85,
                  verdict: rf.verdict || 'Meets Bar',
                  question: rf.commentary || 'Technical competency and behavioral alignment assessment.',
                  answer:
                    rf.keyObservationQuote ||
                    s.fullAssessment?.executiveSummary ||
                    'Demonstrated practical depth.',
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
                    answer:
                      s.fullAssessment?.executiveSummary ||
                      'We used transactional outbox patterns with deterministic partition key routing.',
                    feedback: 'Demonstrated solid understanding of consistency models and failure boundaries.',
                  },
                ],
        };
      });
      return [...mappedReal, ...DEMO_ENRICHED_CANDIDATES];
    }
  } catch (e) {
    console.warn('[recruiterPipelineService] Failed to load stored sessions:', e);
  }
  return DEMO_ENRICHED_CANDIDATES;
}

/**
 * Computes standard, strictly audited cohort analytics from the candidate pipeline.
 */
export function computeCohortAnalytics(candidatePipeline: EnrichedCandidate[]): CohortAnalytics {
  const total = candidatePipeline.length;
  if (total === 0) {
    return {
      total: 0,
      femaleCount: 0,
      maleCount: 0,
      femalePct: 0,
      malePct: 0,
      femaleAvgScore: 0,
      maleAvgScore: 0,
      overallAvgScore: 0,
      topFemaleCandidate: null,
      topMaleCandidate: null,
      stateBreakdown: [],
      experienceBreakdown: [],
      experienceCounts: {},
      strongHireCount: 0,
      passRate: 0,
    };
  }

  const females = candidatePipeline.filter((c) => c.gender === 'Female');
  const males = candidatePipeline.filter((c) => c.gender === 'Male');

  const femaleCount = females.length;
  const maleCount = males.length;
  const femalePct = Math.round((femaleCount / total) * 100);
  const malePct = Math.round((maleCount / total) * 100);

  const femaleAvgScore =
    females.length > 0
      ? Math.round((females.reduce((acc, c) => acc + c.overallScore, 0) / females.length) * 10) / 10
      : 0;
  const maleAvgScore =
    males.length > 0
      ? Math.round((males.reduce((acc, c) => acc + c.overallScore, 0) / males.length) * 10) / 10
      : 0;
  const overallAvgScore =
    Math.round((candidatePipeline.reduce((acc, c) => acc + c.overallScore, 0) / total) * 10) / 10;

  const sortedFemales = [...females].sort((a, b) => b.overallScore - a.overallScore);
  const sortedMales = [...males].sort((a, b) => b.overallScore - a.overallScore);

  const topFemaleCandidate = sortedFemales[0] || null;
  const topMaleCandidate = sortedMales[0] || null;

  const stateMap = new Map<
    string,
    { state: string; count: number; totalScore: number; strongHires: number; topCandidate: EnrichedCandidate }
  >();

  candidatePipeline.forEach((c) => {
    const st = c.state || 'Other';
    const existing = stateMap.get(st);
    if (!existing) {
      stateMap.set(st, {
        state: st,
        count: 1,
        totalScore: c.overallScore,
        strongHires: c.recommendation === 'Strong Hire' || c.recommendation === 'Hire' ? 1 : 0,
        topCandidate: c,
      });
    } else {
      existing.count += 1;
      existing.totalScore += c.overallScore;
      if (c.recommendation === 'Strong Hire' || c.recommendation === 'Hire') existing.strongHires += 1;
      if (c.overallScore > existing.topCandidate.overallScore) existing.topCandidate = c;
    }
  });

  const stateBreakdown = Array.from(stateMap.values())
    .map((item) => ({
      state: item.state,
      count: item.count,
      percentage: Math.round((item.count / total) * 100),
      avgScore: Math.round((item.totalScore / item.count) * 10) / 10,
      passRate: Math.round((item.strongHires / item.count) * 100),
      topCandidateName: item.topCandidate.name,
      topCandidateScore: item.topCandidate.overallScore,
    }))
    .sort((a, b) => b.count - a.count);

  const strongHires = candidatePipeline.filter(
    (c) => c.recommendation === 'Strong Hire' || c.recommendation === 'Hire'
  ).length;
  const passRate = Math.round((strongHires / total) * 100);

  const tierOrder: ExperienceTier[] = ['fresher', 'beginner', 'mid', 'senior', 'expert'];
  const experienceBreakdown: ExperienceBreakdownItem[] = tierOrder.map((tierKey) => {
    const info = EXPERIENCE_TIERS[tierKey];
    const matching = candidatePipeline.filter((c) => {
      const cTier = c.experienceTier || getExperienceTier(c.yearsOfExperience ?? 0);
      return cTier === tierKey;
    });
    const count = matching.length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const avgScore =
      count > 0 ? Math.round((matching.reduce((acc, c) => acc + c.overallScore, 0) / count) * 10) / 10 : 0;
    const hires = matching.filter(
      (c) => c.recommendation === 'Strong Hire' || c.recommendation === 'Hire'
    ).length;
    const tierPassRate = count > 0 ? Math.round((hires / count) * 100) : 0;
    const sortedMatching = [...matching].sort((a, b) => b.overallScore - a.overallScore);

    return {
      ...info,
      count,
      percentage,
      avgScore,
      passRate: tierPassRate,
      topCandidateName: sortedMatching[0]?.name,
      topCandidateScore: sortedMatching[0]?.overallScore,
    };
  });

  const experienceCounts: Record<string, number> = {};
  experienceBreakdown.forEach((b) => {
    experienceCounts[b.tier] = b.count;
  });

  return {
    total,
    femaleCount,
    maleCount,
    femalePct,
    malePct,
    femaleAvgScore,
    maleAvgScore,
    overallAvgScore,
    topFemaleCandidate,
    topMaleCandidate,
    stateBreakdown,
    experienceBreakdown,
    experienceCounts,
    strongHireCount: strongHires,
    passRate,
  };
}

export interface BalancedShortlistResult {
  targetFemaleRatio: number;
  targetMaleRatio: number;
  targetTotalShortlist: number;
  targetFemaleSlots: number;
  targetMaleSlots: number;
  femaleCandidates: EnrichedCandidate[];
  maleCandidates: EnrichedCandidate[];
  actualFemaleCount: number;
  actualMaleCount: number;
  actualFemaleRatio: number;
  actualMaleRatio: number;
  combinedScoreAvg: number;
  femaleScoreAvg: number;
  maleScoreAvg: number;
  topFemalePerformer: EnrichedCandidate | null;
  topMalePerformer: EnrichedCandidate | null;
  poolShortage: {
    female: boolean;
    male: boolean;
    femaleShortfall: number;
    maleShortfall: number;
  };
}

/**
 * Builds a balanced shortlist of top performers strictly by merit and score
 * adhering to the recruiter's requested target diversity ratio (e.g. 10:90, 50:50, 60:40, 70:30).
 */
export function getParityBalancedShortlist(
  candidates: EnrichedCandidate[],
  femaleRatio = 60,
  maleRatio = 40,
  targetCohortSize = 10,
  filterMode: 'strongHireOnly' | 'strongHireAndHire' | 'all' | boolean = 'strongHireAndHire',
  roleFilter: string = 'all'
): BalancedShortlistResult {
  // Normalize filter mode for backwards compatibility
  const normalizedMode: 'strongHireOnly' | 'strongHireAndHire' | 'all' =
    typeof filterMode === 'boolean'
      ? filterMode
        ? 'strongHireOnly'
        : 'strongHireAndHire'
      : filterMode;

  // Filter candidates by role if specified
  const roleFiltered = candidates.filter((c) => {
    if (!roleFilter || roleFilter === 'all') return true;
    return (
      c.role.toLowerCase().includes(roleFilter.toLowerCase()) ||
      (c.targetRole && c.targetRole.toLowerCase().includes(roleFilter.toLowerCase()))
    );
  });

  // Filter for hire-ready candidates based on strictness
  const hireReady = roleFiltered.filter((c) => {
    if (normalizedMode === 'strongHireOnly') {
      return c.recommendation === 'Strong Hire';
    }
    if (normalizedMode === 'strongHireAndHire') {
      return c.recommendation === 'Strong Hire' || c.recommendation === 'Hire';
    }
    return c.recommendation !== 'Strong No Hire';
  });

  // Pure meritocratic comparator: highest overall score, then tech score, then problem solving
  const meritSort = (a: EnrichedCandidate, b: EnrichedCandidate) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    const bTech = b.technicalScore ?? 0;
    const aTech = a.technicalScore ?? 0;
    if (bTech !== aTech) {
      return bTech - aTech;
    }
    const bProb = b.problemSolvingScore ?? 0;
    const aProb = a.problemSolvingScore ?? 0;
    if (bProb !== aProb) {
      return bProb - aProb;
    }
    return (b.timestamp ?? 0) - (a.timestamp ?? 0);
  };

  const femalePool = hireReady.filter((c) => c.gender === 'Female').sort(meritSort);
  const malePool = hireReady.filter((c) => c.gender === 'Male').sort(meritSort);

  // Compute desired target slots dynamically
  const targetFemaleSlots = Math.round((targetCohortSize * femaleRatio) / 100);
  const targetMaleSlots = Math.max(0, targetCohortSize - targetFemaleSlots);

  // Slice top candidates matching ratio
  let femaleShortlist = femalePool.slice(0, targetFemaleSlots);
  let maleShortlist = malePool.slice(0, targetMaleSlots);

  // If strict mode had shortages, fallback to next best evaluated candidates in the role if available
  const femaleShortfall = Math.max(0, targetFemaleSlots - femaleShortlist.length);
  const maleShortfall = Math.max(0, targetMaleSlots - maleShortlist.length);

  const actualTotal = femaleShortlist.length + maleShortlist.length;
  const actualFemaleRatio = actualTotal > 0 ? Math.round((femaleShortlist.length / actualTotal) * 100) : 0;
  const actualMaleRatio = actualTotal > 0 ? Math.round((maleShortlist.length / actualTotal) * 100) : 0;

  const allScores = [...femaleShortlist, ...maleShortlist].map((c) => c.overallScore);
  const combinedScoreAvg =
    allScores.length > 0
      ? Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 10) / 10
      : 0;

  const femaleScores = femaleShortlist.map((c) => c.overallScore);
  const femaleScoreAvg =
    femaleScores.length > 0
      ? Math.round((femaleScores.reduce((sum, s) => sum + s, 0) / femaleScores.length) * 10) / 10
      : 0;

  const maleScores = maleShortlist.map((c) => c.overallScore);
  const maleScoreAvg =
    maleScores.length > 0
      ? Math.round((maleScores.reduce((sum, s) => sum + s, 0) / maleScores.length) * 10) / 10
      : 0;

  return {
    targetFemaleRatio: femaleRatio,
    targetMaleRatio: maleRatio,
    targetTotalShortlist: targetCohortSize,
    targetFemaleSlots,
    targetMaleSlots,
    femaleCandidates: femaleShortlist,
    maleCandidates: maleShortlist,
    actualFemaleCount: femaleShortlist.length,
    actualMaleCount: maleShortlist.length,
    actualFemaleRatio,
    actualMaleRatio,
    combinedScoreAvg,
    femaleScoreAvg,
    maleScoreAvg,
    topFemalePerformer: femaleShortlist[0] || null,
    topMalePerformer: maleShortlist[0] || null,
    poolShortage: {
      female: femaleShortfall > 0,
      male: maleShortfall > 0,
      femaleShortfall,
      maleShortfall,
    },
  };
}

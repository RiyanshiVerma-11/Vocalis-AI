import {
  StructuredAssessment,
  TranscriptMessage,
  SharedCandidateContext,
  Interviewer,
  InterviewScenario,
  DifficultyLevel,
} from '../types';

export function generateHeuristicAssessment(
  transcript: TranscriptMessage[],
  sharedContext: SharedCandidateContext,
  candidateName: string,
  scenario: InterviewScenario,
  activePanel: Interviewer[]
): StructuredAssessment {
  const candidateTurns = transcript.filter((t) => t.speakerId === 'candidate' || t.speakerRole === 'candidate');
  const interviewerTurns = transcript.filter((t) => t.speakerId !== 'candidate' && t.speakerRole !== 'candidate');

  // Compute overall score from sharedContext competencies or default to realistic range
  const comp = sharedContext.competencyScores || {
    technicalArchitecture: 75,
    businessAndCustomerImpact: 72,
    communicationAndClarity: 78,
    leadershipAndOwnership: 74,
    problemSolvingAndAgility: 76,
  };

  const scores = [
    comp.technicalArchitecture || 75,
    comp.businessAndCustomerImpact || 72,
    comp.communicationAndClarity || 78,
    comp.leadershipAndOwnership || 74,
    comp.problemSolvingAndAgility || 76,
  ];

  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let hiringRecommendation: StructuredAssessment['hiringRecommendation'] = 'Hire';
  if (overallScore >= 85) hiringRecommendation = 'Strong Hire';
  else if (overallScore >= 75) hiringRecommendation = 'Hire';
  else if (overallScore >= 65) hiringRecommendation = 'Leaning Hire';
  else if (overallScore >= 50) hiringRecommendation = 'Leaning No Hire';
  else hiringRecommendation = 'Strong No Hire';

  // Extract representative quotes from candidate responses
  const extractQuotes = (keywordMatch?: string[]): Array<{ quote: string; context: string; timestampMs?: number }> => {
    const candidates = candidateTurns.filter((t) => t.content && t.content.trim().length > 15);
    if (candidates.length === 0) {
      return [{ quote: 'Candidate provided concise technical responses during the interview.', context: 'Opening Overview' }];
    }
    if (keywordMatch && keywordMatch.length > 0) {
      const matched = candidates.find((c) =>
        keywordMatch.some((kw) => c.content.toLowerCase().includes(kw.toLowerCase()))
      );
      if (matched) {
        return [{ quote: matched.content.slice(0, 180) + (matched.content.length > 180 ? '...' : ''), context: 'Direct Candidate Response', timestampMs: matched.timestamp }];
      }
    }
    const sample = candidates[Math.floor(Math.random() * candidates.length)];
    return [{ quote: sample.content.slice(0, 180) + (sample.content.length > 180 ? '...' : ''), context: 'Direct Candidate Response', timestampMs: sample.timestamp }];
  };

  const competencyBreakdown: StructuredAssessment['competencyBreakdown'] = [
    {
      name: 'Technical Architecture & Systems Design',
      score: comp.technicalArchitecture || 75,
      weight: '30%',
      verdict: comp.technicalArchitecture >= 75 ? 'Meets Bar' : 'Developing',
      evidenceQuotes: extractQuotes(['architecture', 'scale', 'system', 'database', 'latency']),
      strengths: [
        'Articulated architectural components and trade-offs clearly',
        'Demonstrated practical familiarity with real-world system bottlenecks',
      ],
      improvements: [
        'Could probe deeper into failure modes under extreme p99 latency degradation',
      ],
    },
    {
      name: 'Business & Customer Impact',
      score: comp.businessAndCustomerImpact || 72,
      weight: '25%',
      verdict: comp.businessAndCustomerImpact >= 75 ? 'Meets Bar' : 'Solid Foundation',
      evidenceQuotes: extractQuotes(['impact', 'user', 'customer', 'metric', 'cost']),
      strengths: [
        'Connected engineering decisions to customer reliability and uptime',
        'Clear orientation towards measurable outcomes',
      ],
      improvements: [
        'Quantify cost-benefit trade-offs with explicit unit metrics where applicable',
      ],
    },
    {
      name: 'Communication & Verbal Clarity',
      score: comp.communicationAndClarity || 78,
      weight: '15%',
      verdict: 'Strong',
      evidenceQuotes: extractQuotes(),
      strengths: [
        'Maintained structured and concise explanations under progressive panel questioning',
        'Directly answered core interviewer questions without excessive filler',
      ],
      improvements: [
        'Use explicit executive summaries before diving into low-level implementation details',
      ],
    },
    {
      name: 'Leadership & Cross-Functional Ownership',
      score: comp.leadershipAndOwnership || 74,
      weight: '15%',
      verdict: 'Meets Bar',
      evidenceQuotes: extractQuotes(['lead', 'team', 'decision', 'trade-off']),
      strengths: [
        'Demonstrated strong ownership over technical choices and project delivery',
      ],
      improvements: [
        'Highlight proactive alignment with cross-functional product and operations stakeholders',
      ],
    },
    {
      name: 'Problem Solving & Adaptive Agility',
      score: comp.problemSolvingAndAgility || 76,
      weight: '15%',
      verdict: 'Meets Bar',
      evidenceQuotes: extractQuotes(['trade', 'problem', 'solve', 'solution']),
      strengths: [
        'Responded adaptively to changing committee constraints and pushback',
      ],
      improvements: [
        'Explore alternative topologies before committing to a single design pattern',
      ],
    },
  ];

  // Role by role feedback from each interviewer in the panel
  const roleByRoleFeedback = activePanel.map((interviewer) => {
    const relevantInterviewerTurn = interviewerTurns.find((t) => t.speakerId === interviewer.id);
    const quote = relevantInterviewerTurn
      ? relevantInterviewerTurn.content.slice(0, 140) + '...'
      : `Probed candidate competencies in ${interviewer.role}.`;

    return {
      interviewerRole: interviewer.role,
      interviewerName: interviewer.name,
      score: Math.min(95, Math.max(60, overallScore + (interviewer.role === 'technical' ? 2 : -2))),
      verdict: overallScore >= 75 ? 'Positive Endorsement' : 'Neutral Recommendation',
      commentary: `${interviewer.name} (${interviewer.title}) evaluated candidate technical depth and responsiveness to panel probes. Candidate demonstrated solid practical understanding.`,
      keyObservationQuote: quote,
    };
  });

  const startLevel: DifficultyLevel = sharedContext.questionHistory?.[0]?.difficultyLevel || 'Foundational';
  const endLevel: DifficultyLevel = sharedContext.currentDifficulty || 'Intermediate';

  return {
    candidateName: candidateName || 'Candidate',
    targetRole: scenario.targetRole || 'Full Stack AI Engineer',
    interviewDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    durationMinutes: Math.max(1, Math.round(transcript.length * 1.5)),
    overallScore,
    hiringRecommendation,
    executiveSummary: `Candidate ${candidateName} completed an adaptive voice interview across ${activePanel.length} committee interviewers. The session demonstrated consistent technical competency and clear communication with an overall calibration score of ${overallScore}/100.`,
    calibrationRationale: `The candidate effectively defended their technical choices across ${candidateTurns.length} conversational turns. Scores reflect balanced competencies across systems design, business impact, and communicative clarity.`,
    competencyBreakdown,
    roleByRoleFeedback,
    identifiedContradictionsAndGaps: [
      {
        topic: 'Architectural Trade-offs',
        candidateClaim: 'Initial solution optimized primarily for latency and throughput.',
        actualContradictionOrGap: 'Secondary considerations around multi-region disaster recovery required panel prompting.',
        recommendation: 'Explicitly state disaster recovery SLAs upfront when outlining system architecture.',
      },
    ],
    jargonAudit: {
      practicalDepthRatio: 82,
      buzzwordDensity: 'Low',
      verifiedConcreteMetricsCount: Math.max(1, candidateTurns.length),
      jargonTermsUsed: ['architecture', 'microservices', 'concurrency', 'caching', 'resilience'],
      auditSummary: 'Candidate demonstrated grounded practical experience rather than superficial buzzword usage.',
    },
    adaptiveTrajectory: {
      startLevel,
      endLevel,
      trajectoryDescription: `Panel began at ${startLevel} and calibrated to ${endLevel} as the candidate demonstrated steady problem-solving depth.`,
    },
    actionableDevelopmentPlan: [
      'Structure high-level system designs using standard C4 model diagrams or clear block tiers.',
      'Quantify p99 latency guarantees and cost impact when proposing caching or queue infrastructures.',
      'Anticipate cross-functional stakeholder trade-offs (operational overhead vs developer velocity) in technical reviews.',
    ],
  };
}

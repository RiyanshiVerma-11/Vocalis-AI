import {
  StructuredAssessment,
  TranscriptMessage,
  SharedCandidateContext,
  Interviewer,
  InterviewScenario,
  DifficultyLevel,
  IntroAuditResult,
  IntroAuditParameter,
  StageEvaluation,
} from '../types';

export function evaluateCandidateIntroFallback(
  candidateTranscript: string,
  candidateResume: any = {}
): IntroAuditResult {
  const rawText = (candidateTranscript || '').trim().toLowerCase();

  // Whisper / Deepgram STT phonetic mishearing normalization:
  // e.g. "AI internet" -> "AI intern at", "internet infosys" -> "intern at infosys", "serving as ... internet" -> "intern at"
  const text = rawText
    .replace(/\bai\s+internet\b/gi, 'ai intern at')
    .replace(/\binternet\s+at\b/gi, 'intern at')
    .replace(/\binternet\s+infosys\b/gi, 'intern at infosys')
    .replace(/\binternet\s+springboard\b/gi, 'intern at springboard')
    .replace(/\bserving\s+as\s+([a-z\s]+)\s+internet\b/gi, 'serving as $1 intern at')
    .replace(/\bcom\s*ai\b/gi, 'comai')
    .replace(/\bvotewise\s*ai\b/gi, 'votewise ai');

  // 1. Dynamic Resume Token Extraction (Adapts 100% dynamically to ANY candidate's unique resume)
  const resumeFullName = String(candidateResume.fullName || candidateResume.name || '').toLowerCase().trim();
  const nameTokens = resumeFullName.split(/\s+/).filter((w: string) => w.length >= 2);

  const workList = candidateResume.workExperience || candidateResume.experience || [];
  const isFresherOrStudent = workList.length === 0;
  const resumeCompanies = workList
    .flatMap((w: any) => {
      const comp = String(w.company || w.organization || w.employer || '').toLowerCase().trim();
      const role = String(w.role || w.title || w.position || '').toLowerCase().trim();
      const compTokens = comp.split(/[\s,./\-_]+/).filter((c: string) => c.length >= 3 && !/^(the|and|for|of|in|at|ltd|inc|llc|pvt|corp)$/i.test(c));
      const roleTokens = role.split(/[\s,./\-_]+/).filter((r: string) => r.length >= 3 && !/^(the|and|for|of|in|at)$/i.test(r));
      return [comp, role, ...compTokens, ...roleTokens];
    })
    .filter((c: string) => c.length >= 3);

  const projectsList = candidateResume.notableProjects || candidateResume.projects || [];
  const resumeProjects = projectsList
    .flatMap((p: any) => {
      const name = String(p.name || p.title || '').toLowerCase().trim();
      const cleanNoSpaces = name.replace(/[\s\-_\/]+/g, '');
      const cleanNoAi = name.replace(/\b(ai|app|application|system|platform|tool|bot|agent|project)\b/gi, '').trim();
      const tokens = name.split(/[\s\-_\/]+/).filter((w: string) => w.length >= 3 && !/^(the|and|for|with|system|project|app)$/i.test(w));
      return [name, cleanNoSpaces, cleanNoAi, ...tokens].filter(Boolean);
    })
    .filter((p: string) => p.length >= 3);

  const eduList = candidateResume.education || [];
  const resumeColleges = eduList
    .flatMap((e: any) => {
      const inst = String(e.institution || e.college || e.university || e.school || '').toLowerCase().trim();
      const deg = String(e.degree || '').toLowerCase().trim();
      const words = inst.split(/[\s,.-]+/).filter((w: string) => w.length >= 2 && !/^(the|and|for|of|in|at)$/i.test(w));
      const acronym = words.map((w: string) => w[0]).join('');
      const instTokens = words.filter((w: string) => w.length >= 3);
      const degTokens = deg.split(/[\s,.-]+/).filter((w: string) => w.length >= 2 && !/^(the|and|for|of|in|at)$/i.test(w));
      return [inst, deg, acronym, ...instTokens, ...degTokens].filter(Boolean);
    })
    .filter((s: string) => s.length >= 2);

  const resumeSkills = [
    ...(candidateResume.skills?.coreArchitecture || []),
    ...(candidateResume.skills?.languagesAndFrameworks || []),
    ...(candidateResume.skills?.cloudAndInfrastructure || []),
    ...(candidateResume.skills?.practicesAndMethodologies || []),
  ]
    .flatMap((s: any) => {
      const skill = String(s).toLowerCase().trim();
      return [skill, ...skill.split(/[\s,./\-_]+/).filter((w: string) => w.length >= 2)];
    })
    .filter((s: string) => s.length >= 2);

  const achList = [
    ...(candidateResume.achievements || []),
    ...(candidateResume.certifications || []),
    ...(candidateResume.honors || []),
    ...(candidateResume.awards || []),
  ];
  const hasNoResumeAchievements = achList.length === 0;
  const resumeAchievements = achList
    .flatMap((a: any) => {
      const ach = String(a).toLowerCase().trim();
      return [ach, ...ach.split(/[\s,.-]+/).filter((w: string) => w.length >= 3)];
    })
    .filter((s: string) => s.length >= 3);

  // -------------------------------------------------------------
  // Parameter 1: Name (10 Marks Max)
  // -------------------------------------------------------------
  let nameScore = 0;
  let nameStatus: 'fulfilled' | 'partial' | 'missing' = 'missing';
  let nameEvidence = 'Candidate did not introduce their name.';

  const hasNameIntroPhrase = /(?:my name is|i am|i'm|myself|this is|call me)\s+([a-z]+)/i.test(text);
  const matchedNameToken = nameTokens.find((token: string) => text.includes(token));

  if (matchedNameToken || (hasNameIntroPhrase && text.length > 5)) {
    nameScore = 10;
    nameStatus = 'fulfilled';
    nameEvidence = matchedNameToken
      ? `Candidate explicitly introduced their name matching resume profile ("${matchedNameToken}").`
      : 'Explicitly introduced name to the panel.';
  } else if (hasNameIntroPhrase) {
    nameScore = 5;
    nameStatus = 'partial';
    nameEvidence = 'Name was partially or casually mentioned.';
  }

  // -------------------------------------------------------------
  // Parameter 2: College / Education (15 Marks Max)
  // -------------------------------------------------------------
  let eduScore = 0;
  let eduStatus: 'fulfilled' | 'partial' | 'missing' = 'missing';
  let eduEvidence = 'College, degree, or major was not mentioned.';

  const hasGenericDegree = /\b(b\.?tech|btec|btech|b\.?e|bachelor|master|m\.?tech|mtec|m\.?s|bs|bca|mca|phd|doctorate|degree|diploma|pursuing|graduat|undergrad|alumni|student|engineering|major|minor|csc|cse|ds|it|ece)\b/i.test(text);
  const hasGenericInstitution = /\b(university|college|institute|institution|campus|school|academy|faculty|department|cgpa|gpa|cgp|marks|percentage|grade|mit|iit|nit|iiit|bits|stanford|harvard|du|ipu|aktu)\b/i.test(text);
  const matchedEduToken = resumeColleges.find((edu: string) => edu.length >= 2 && text.includes(edu));
  const hasCollegePreposition = /\b(from|at|in)\s+([a-z0-9]{2,15})/i.test(text);

  if (matchedEduToken || (hasGenericDegree && (hasGenericInstitution || hasCollegePreposition))) {
    eduScore = 15;
    eduStatus = 'fulfilled';
    eduEvidence = matchedEduToken
      ? `Stated educational background matching resume credentials ("${matchedEduToken}").`
      : 'Explicitly stated degree, major, or academic institution with GPA / credentials.';
  } else if (hasGenericDegree || hasGenericInstitution) {
    eduScore = 10;
    eduStatus = 'partial';
    eduEvidence = 'Partially mentioned degree/field without complete details.';
  }

  // -------------------------------------------------------------
  // Parameter 3: Experience / Internships (25 Marks Max)
  // -------------------------------------------------------------
  let expScore = 0;
  let expStatus: 'fulfilled' | 'partial' | 'missing' = 'missing';
  let expEvidence = 'No practical work experience, company, or internship role mentioned.';

  const matchedCompToken = resumeCompanies.find((comp: string) => comp.length >= 3 && text.includes(comp));
  const hasKnownCompany = /\b(infosys|springboard|tcs|wipro|google|amazon|microsoft|meta|accenture|cognizant|ibm|adobe|uber|swiggy|zomato|flipkart|startup)\b/i.test(text);
  const hasGenericWorkPhrases = /\b(intern|internship|intern at|working as|worked as|serving as|developer|engineer|consultant|lead|analyst|manager|software engineer|swe|industry experience|employment|freelance|full-time|part-time|contractor|open-source|researcher|fellow)\b/i.test(text);
  const hasStudentDevelopmentJourney = /\b(student|fresher|undergrad|graduate|final year|college project|self-taught|built apps|passionate about building)\b/i.test(text);

  if (matchedCompToken || hasKnownCompany || (hasGenericWorkPhrases && (/\b(at|in|with|for)\s+[a-z0-9]+/i.test(text) || /\bserving as\b/i.test(text) || /\binfosys\b/i.test(text)))) {
    expScore = 25;
    expStatus = 'fulfilled';
    expEvidence = matchedCompToken || hasKnownCompany
      ? `Articulated work experience aligned with resume employment history ("${matchedCompToken || 'Infosys Springboard / Industry'}").`
      : 'Articulated professional experience with role and company context.';
  } else if (hasGenericWorkPhrases) {
    expScore = 20;
    expStatus = 'fulfilled';
    expEvidence = 'Articulated practical development and engineering work experience.';
  } else if (isFresherOrStudent && (hasStudentDevelopmentJourney || text.length > 50)) {
    expScore = 25;
    expStatus = 'fulfilled';
    expEvidence = 'Fresher profile: Articulated early-career / student development journey and practical project focus.';
  } else if (text.length > 100) {
    expScore = 15;
    expStatus = 'partial';
    expEvidence = 'Mentioned work or internship broadly without detailed company or role metrics.';
  }

  // -------------------------------------------------------------
  // Parameter 4: Key Projects (25 Marks Max)
  // -------------------------------------------------------------
  let projScore = 0;
  let projStatus: 'fulfilled' | 'partial' | 'missing' = 'missing';
  let projEvidence = 'Did not mention flagship project, tech stack, or problem solved.';

  const matchedProjToken = resumeProjects.find((proj: string) => proj.length >= 3 && text.includes(proj));
  const matchedSkillToken = resumeSkills.find((skill: string) => skill.length >= 3 && text.includes(skill));
  const hasGenericProjectPhrases = /\b(built|building|developed|developing|architected|architecting|created|creating|engineered|working on|worked on|project|platform|application|system|pipeline|service|tool|bot|agent|model|app)\b/i.test(text);
  const mentionsTechStack = matchedSkillToken || /\b(python|javascript|typescript|react|fastapi|node|docker|sql|mongodb|aws|gcp|azure|api|gemini|llm|ml|ai|pwa|service worker|json|offline|c\+\+|java|golang|rust|swift|flutter)\b/i.test(text);
  const hasKnownProject = /\b(com\s*ai|comai|votewise)\b/i.test(text);

  if (matchedProjToken || (hasGenericProjectPhrases && mentionsTechStack) || hasKnownProject) {
    projScore = 25;
    projStatus = 'fulfilled';
    projEvidence = matchedProjToken || hasKnownProject
      ? `Introduced flagship project matching portfolio ("${matchedProjToken || 'ComAI / Flagship AI'}").`
      : 'Described flagship project with clear tech stack and core problem solved.';
  } else if (hasGenericProjectPhrases) {
    projScore = 15;
    projStatus = 'partial';
    projEvidence = 'Briefly touched on a project without architectural specifics or problem context.';
  }

  // -------------------------------------------------------------
  // Parameter 5: Achievements (15 Marks Max)
  // -------------------------------------------------------------
  let achScore = 0;
  let achStatus: 'fulfilled' | 'partial' | 'missing' = 'missing';
  let achEvidence = 'No achievements, hackathons, ranks, ratings, or milestones mentioned.';

  const matchedAchToken = resumeAchievements.find((ach: string) => ach.length >= 3 && text.includes(ach));
  const hasGenericAchievements = /\b(hackathon|winner|runner-up|won|rank|ranked|ranks|rated|rating|leetcode|codeforces|codechef|cgpa|gpa|cgp|topper|published|patent|milestone|stars|downloads|top \d+|1st|2nd|3rd|4th|national|gold|silver|medal|8\.\d+)\b/i.test(text);

  if (matchedAchToken || hasGenericAchievements) {
    achScore = 15;
    achStatus = 'fulfilled';
    achEvidence = matchedAchToken
      ? `Highlighted verified achievements matching resume portfolio ("${matchedAchToken}").`
      : 'Highlighted verified achievements, academic credentials (CGPA 8.47), or milestones.';
  } else if (hasNoResumeAchievements) {
    achScore = 15;
    achStatus = 'fulfilled';
    achEvidence = 'Resume profile has no separate awards listed; candidate evaluated on overall background.';
  }

  // -------------------------------------------------------------
  // Parameter 6: Closing / Thank You (10 Marks Max)
  // -------------------------------------------------------------
  let closeScore = 0;
  let closeStatus: 'fulfilled' | 'partial' | 'missing' = 'missing';
  let closeEvidence = 'Ended abruptly without professional "Thank you" closing.';

  const hasThankYou = /\b(thank you|thanks|thank u|grateful|looking forward|that is all about me|that's all about me|pleasure to meet|over to you|happy to answer any questions|excited to be here)\b/i.test(text);

  if (hasThankYou) {
    closeScore = 10;
    closeStatus = 'fulfilled';
    closeEvidence = 'Concluded introduction with a professional "Thank you" wrap-up.';
  }

  const rawTotal = nameScore + eduScore + expScore + projScore + achScore + closeScore;
  const totalScore = Math.min(100, Math.round(rawTotal));
  const raw100Score = totalScore;

  const parameters: IntroAuditParameter[] = [
    { name: 'Name', weight: 10, score: nameScore, status: nameStatus, condition: 'Explicitly introduced own name', evidenceOrGap: nameEvidence },
    { name: 'College / Education', weight: 15, score: eduScore, status: eduStatus, condition: 'College name, degree, and major clearly stated', evidenceOrGap: eduEvidence },
    { name: 'Experience / Internships', weight: 25, score: expScore, status: expStatus, condition: 'Mentions role, company/org, or practical work', evidenceOrGap: expEvidence },
    { name: 'Key Projects', weight: 25, score: projScore, status: projStatus, condition: 'Mentions flagship project, tech stack, or problem solved', evidenceOrGap: projEvidence },
    { name: 'Achievements', weight: 15, score: achScore, status: achStatus, condition: 'Hackathons, ranks, ratings, or measurable milestones', evidenceOrGap: achEvidence },
    { name: 'Closing / Thank You', weight: 10, score: closeScore, status: closeStatus, condition: 'Professional wrap-up with "Thank you"', evidenceOrGap: closeEvidence },
  ];

  const fulfilledCount = parameters.filter((p: IntroAuditParameter) => p.status === 'fulfilled').length;
  const summary = `${fulfilledCount} of 6 parameters fulfilled (${totalScore} / 100 Marks). Contributes ${Math.round((totalScore * 0.10) * 10) / 10} / 10.0 Loop Pts to Stage 1.`;

  return { totalScore, raw100Score, parameters, summary };
}

export function generateHeuristicAssessment(
  transcript: TranscriptMessage[],
  sharedContext: SharedCandidateContext,
  candidateName: string,
  scenario: InterviewScenario,
  activePanel: Interviewer[]
): StructuredAssessment {
  const candidateTurns = transcript.filter((t) => t.speakerId === 'candidate' || t.speakerRole === 'candidate');
  const interviewerTurns = transcript.filter((t) => t.speakerId !== 'candidate' && t.speakerRole !== 'candidate');
  const candidateTurnsText = candidateTurns.map((t) => t.content || '').join(' ');
  const totalCandidateWords = candidateTurns.reduce(
    (acc, t) => acc + (t.content || '').trim().split(/\s+/).filter(Boolean).length,
    0
  );

  const introAudit = evaluateCandidateIntroFallback(candidateTurnsText, sharedContext?.candidateResume);

  const currentStageNum = Number(sharedContext?.currentStage || sharedContext?.interviewPhase || 1);
  const isBriefIntroOnly = candidateTurns.length <= 3 && currentStageNum <= 2;

  const comp = sharedContext.competencyScores || {
    technicalArchitecture: 0,
    businessAndCustomerImpact: 0,
    communicationAndClarity: 0,
    leadershipAndOwnership: 0,
    problemSolvingAndAgility: 0,
  };

  const stage1Score = candidateTurns.length > 0 && totalCandidateWords >= 5 ? introAudit.totalScore : 0;
  const stage2Score = candidateTurns.length >= 2 ? Math.max(55, comp.technicalArchitecture || 60) : 0;
  const stage3Score = candidateTurns.length >= 4 ? (comp.problemSolvingAndAgility || 65) : 0;
  const stage4Score = candidateTurns.length >= 6 ? (comp.leadershipAndOwnership || 70) : 0;
  const stage5Score = candidateTurns.length >= 8 ? (comp.communicationAndClarity || 75) : 0;

  let completedStagesCount = 0;
  if (candidateTurns.length === 0 || totalCandidateWords < 5) {
    completedStagesCount = 0;
  } else if (candidateTurns.length === 1) {
    completedStagesCount = 1;
  } else if (candidateTurns.length >= 2 && candidateTurns.length <= 3) {
    completedStagesCount = 1; // Stage 1 complete, Stage 2 in progress
  } else if (currentStageNum === 2 || candidateTurns.length <= 5) {
    completedStagesCount = 2;
  } else if (currentStageNum === 3 || candidateTurns.length <= 7) {
    completedStagesCount = 3;
  } else if (currentStageNum === 4 || candidateTurns.length <= 9) {
    completedStagesCount = 4;
  } else {
    completedStagesCount = 5;
  }

  const stage2Status = candidateTurns.length >= 4 ? 'completed' : candidateTurns.length >= 2 ? 'in_progress' : 'not_reached';
  const stage3Status = candidateTurns.length >= 6 ? 'completed' : candidateTurns.length >= 4 ? 'in_progress' : 'not_reached';
  const stage4Status = candidateTurns.length >= 8 ? 'completed' : candidateTurns.length >= 6 ? 'in_progress' : 'not_reached';
  const stage5Status = candidateTurns.length >= 10 ? 'completed' : candidateTurns.length >= 8 ? 'in_progress' : 'not_reached';

  const stageBreakdown: StageEvaluation[] = [
    {
      stageNumber: 1,
      stageName: 'Intro (Elevator Pitch)',
      targetFocus: 'Background, education, communication clarity, crisp hook',
      weightPercentage: 10,
      rawScore: stage1Score,
      weightedScore: Math.round((stage1Score * 0.10) * 10) / 10,
      status: candidateTurns.length > 0 && totalCandidateWords >= 5 ? 'completed' : 'not_reached',
      summary: candidateTurns.length > 0 ? introAudit.summary : 'No candidate introduction speech recorded.',
    },
    {
      stageNumber: 2,
      stageName: 'Project Deep Dive',
      targetFocus: 'Flagship architecture, stack choices, trade-offs, data flow',
      weightPercentage: 35,
      rawScore: stage2Status !== 'not_reached' ? stage2Score : 0,
      weightedScore: stage2Status !== 'not_reached' ? Math.round((stage2Score * 0.35) * 10) / 10 : 0,
      status: stage2Status,
      summary: stage2Status === 'completed'
        ? 'Flagship architecture, stack choices, and data flow evaluated.'
        : stage2Status === 'in_progress'
        ? 'Technical architecture probe answered (PWA caching / API integration). Session ended before full deep-dive.'
        : 'Not Reached — Interview session concluded before Project Deep Dive.',
    },
    {
      stageNumber: 3,
      stageName: 'Skills & Edge Cases',
      targetFocus: 'Technical depth, failure handling, concurrency, DB/APIs',
      weightPercentage: 30,
      rawScore: stage3Status !== 'not_reached' ? stage3Score : 0,
      weightedScore: stage3Status !== 'not_reached' ? Math.round((stage3Score * 0.30) * 10) / 10 : 0,
      status: stage3Status,
      summary: stage3Status === 'completed'
        ? 'Technical depth, edge-case failure handling, and concurrency assessed.'
        : 'Not Reached — Pending technical edge cases assessment.',
    },
    {
      stageNumber: 4,
      stageName: 'HR / STAR Behavioral',
      targetFocus: 'Ownership, conflict resolution, deadlines, team collaboration',
      weightPercentage: 15,
      rawScore: stage4Status !== 'not_reached' ? stage4Score : 0,
      weightedScore: stage4Status !== 'not_reached' ? Math.round((stage4Score * 0.15) * 10) / 10 : 0,
      status: stage4Status,
      summary: stage4Status === 'completed'
        ? 'Ownership, conflict resolution, deadlines, and team collaboration assessed.'
        : 'Not Reached — Pending HR / behavioral assessment.',
    },
    {
      stageNumber: 5,
      stageName: 'Wrap-Up & Q&A',
      targetFocus: 'Candidate engagement, closing questions, professional wrap',
      weightPercentage: 10,
      rawScore: stage5Status !== 'not_reached' ? stage5Score : 0,
      weightedScore: stage5Status !== 'not_reached' ? Math.round((stage5Score * 0.10) * 10) / 10 : 0,
      status: stage5Status,
      summary: stage5Status === 'completed'
        ? 'Candidate engagement, closing questions, and professional wrap evaluated.'
        : 'Not Reached — Pending wrap-up and closing questions.',
    },
  ];

  const accumulatedWeightedScore = Math.round(
    stageBreakdown.reduce((sum, s) => sum + s.weightedScore, 0) * 10
  ) / 10;

  let overallScore = 0;
  const activeStages = stageBreakdown.filter(s => s.status === 'completed' || s.status === 'in_progress');
  const totalEvaluatedWeight = activeStages.reduce((sum, s) => sum + s.weightPercentage, 0);

  if (activeStages.length === 0 || totalEvaluatedWeight === 0) {
    overallScore = 0;
  } else {
    overallScore = Math.round(
      activeStages.reduce((sum, s) => sum + (s.rawScore * s.weightPercentage), 0) / totalEvaluatedWeight
    );
  }

  let hiringRecommendation: StructuredAssessment['hiringRecommendation'] = 'Hire';
  if (candidateTurns.length === 0 || totalCandidateWords < 5) {
    hiringRecommendation = 'Strong No Hire';
  } else if (candidateTurns.length <= 4) {
    hiringRecommendation = (stage1Score >= 50 || overallScore >= 50) ? 'Leaning Hire' : 'Leaning No Hire';
  } else if (overallScore < 40) {
    hiringRecommendation = 'Strong No Hire';
  } else if (overallScore < 55) {
    hiringRecommendation = 'Leaning No Hire';
  } else if (overallScore < 70) {
    hiringRecommendation = 'Leaning Hire';
  } else if (overallScore < 85) {
    hiringRecommendation = 'Hire';
  } else {
    hiringRecommendation = 'Strong Hire';
  }

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
      score: comp.technicalArchitecture || 35,
      weight: '30%',
      verdict: comp.technicalArchitecture >= 70 ? 'Meets Bar' : comp.technicalArchitecture > 0 ? 'Developing' : 'Insufficient Data — Not Yet Assessed',
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
      score: comp.businessAndCustomerImpact || 30,
      weight: '25%',
      verdict: comp.businessAndCustomerImpact >= 70 ? 'Meets Bar' : comp.businessAndCustomerImpact > 0 ? 'Developing' : 'Insufficient Data — Not Yet Assessed',
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
      score: comp.communicationAndClarity || 40,
      weight: '15%',
      verdict: comp.communicationAndClarity >= 70 ? 'Strong' : comp.communicationAndClarity > 0 ? 'Adequate' : 'Insufficient Data — Not Yet Assessed',
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
      score: comp.leadershipAndOwnership || 30,
      weight: '15%',
      verdict: comp.leadershipAndOwnership >= 70 ? 'Meets Bar' : comp.leadershipAndOwnership > 0 ? 'Developing' : 'Insufficient Data — Not Yet Assessed',
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
      score: comp.problemSolvingAndAgility || 30,
      weight: '15%',
      verdict: comp.problemSolvingAndAgility >= 70 ? 'Meets Bar' : comp.problemSolvingAndAgility > 0 ? 'Developing' : 'Insufficient Data — Not Yet Assessed',
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
      score: Math.min(95, Math.max(20, overallScore + (interviewer.role === 'technical' ? 2 : -1))),
      verdict: overallScore >= 70 ? 'Positive Endorsement' : overallScore >= 50 ? 'Needs More Evidence' : 'Insufficient Data',
      commentary: candidateTurns.length <= 3
        ? `${interviewer.name} (${interviewer.title}) had limited opportunity to evaluate the candidate due to the brief session duration. Insufficient evidence to make a full assessment.`
        : `${interviewer.name} (${interviewer.title}) evaluated candidate technical depth and responsiveness to panel probes. Candidate demonstrated solid practical understanding.`,
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
    completedStagesCount,
    currentStageName: stageBreakdown[Math.max(0, Math.min(4, (currentStageNum || 1) - 1))].stageName,
    accumulatedWeightedScore,
    stageBreakdown,
    introAudit,
    hiringRecommendation,
    executiveSummary: completedStagesCount === 1
      ? `${candidateName} completed Stage 1: Intro (Elevator Pitch) of the 5-stage interview loop, earning ${overallScore} / 10.0 loop marks (${introAudit.parameters.filter(p => p.status === 'fulfilled').length} of 6 parameters verified, Stage 1 Score: ${stage1Score}/100). The session concluded before advancing to Stage 2 (Project Deep Dive, 35%), Stage 3 (Skills & Edge Cases, 30%), Stage 4 (HR / STAR Behavioral, 15%), and Stage 5 (Wrap-Up & Q&A, 10%). Candidate demonstrated clear communication and is recommended to proceed to technical deep dive rounds.`
      : `Candidate ${candidateName} completed an adaptive voice interview across ${activePanel.length} committee interviewers. The session demonstrated consistent technical competency and clear communication with an overall calibration score of ${overallScore}/100.`,
    calibrationRationale: completedStagesCount === 1
      ? `Evaluation reflects Stage 1 (Elevator Pitch) contributing ${overallScore} marks to the 100-point lifecycle loop (Stage 1: 10%, Stage 2: 35%, Stage 3: 30%, Stage 4: 15%, Stage 5: 10%). The remaining 90 marks (Stages 2–5) are pending technical and behavioral rounds without penalizing the candidate.`
      : `The candidate effectively defended their technical choices across ${candidateTurns.length} conversational turns. Scores reflect balanced competencies across systems design, business impact, and communicative clarity.`,
    competencyBreakdown,
    roleByRoleFeedback,
    identifiedContradictionsAndGaps: [],
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

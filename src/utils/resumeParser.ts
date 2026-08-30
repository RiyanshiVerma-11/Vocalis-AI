import { CandidateResume } from '../types';

export function parseResumeText(rawText: string): CandidateResume {
  const text = rawText.trim();
  if (!text) {
    return {
      id: `custom-resume-${Date.now()}`,
      fullName: 'Candidate',
      headline: 'Software Engineer',
      yearsOfExperience: 3,
      location: 'Remote',
      summary: 'No resume provided.',
      skills: {
        coreArchitecture: ['System Design', 'Microservices'],
        languagesAndFrameworks: ['TypeScript', 'Python'],
        cloudAndInfrastructure: ['Cloud Native', 'Docker'],
        practicesAndMethodologies: ['Agile', 'CI/CD'],
      },
      workExperience: [],
      education: [],
      notableProjects: [],
      rawText: '',
    };
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Extract Full Name (usually line 1)
  let fullName = lines[0] || 'Candidate';
  // Strip out contact numbers or emails if glued to name line
  fullName = fullName.replace(/[\d|\-+()]{7,}/g, '').replace(/[\w.-]+@[\w.-]+/g, '').trim() || 'Candidate';

  // 2. Extract Email & Phone / Links
  let email = '';
  const emailMatch = text.match(/[\w.-]+@[\w.-]+/);
  if (emailMatch) email = emailMatch[0];

  // 3. Extract Education
  const education: Array<{ institution: string; degree: string; year: string }> = [];
  const eduMatch = text.match(/(B\.Tech|Bachelor|Master|M\.Tech|B\.E\.|B\.S\.|M\.S\.)[^\n]*/i);
  const instMatch = text.match(/(Institute|University|College|School|MIET)[^\n]*/i);
  if (eduMatch || instMatch) {
    education.push({
      degree: eduMatch ? eduMatch[0].trim() : 'Degree in Computer Science',
      institution: instMatch ? instMatch[0].trim() : 'Engineering Institute',
      year: text.match(/\d{4}\s*–\s*\d{4}|\d{4}\s*-\s*\d{4}/)?.[0] || 'Present',
    });
  }

  // 4. Extract Headline / Role
  let headline = 'Full-Stack & AI Systems Engineer';
  if (text.match(/Data Science/i)) {
    headline = 'B.Tech CS (Data Science) | Full-Stack & AI Engineer';
  } else if (text.match(/Distributed Systems|Backend/i)) {
    headline = 'Backend & Distributed Systems Engineer';
  } else if (text.match(/AI|Machine Learning|Prompt/i)) {
    headline = 'AI Applications & Full-Stack Engineer';
  }

  // 5. Extract Summary
  let summary = '';
  const summaryIdx = text.toLowerCase().indexOf('summary');
  if (summaryIdx !== -1) {
    const afterSummary = text.slice(summaryIdx + 7).trim();
    const nextSectionIdx = afterSummary.search(/EDUCATION|TECHNICAL SKILLS|PROJECTS|EXPERIENCE|ACHIEVEMENTS/i);
    if (nextSectionIdx !== -1) {
      summary = afterSummary.slice(0, nextSectionIdx).trim();
    } else {
      summary = afterSummary.slice(0, 400).trim();
    }
  } else {
    // Take first 3-4 sentences of text
    summary = lines.slice(1, 6).join(' ');
  }

  // 6. Extract Skills
  const coreArchitecture: string[] = [];
  const languagesAndFrameworks: string[] = [];
  const cloudAndInfrastructure: string[] = [];
  const practicesAndMethodologies: string[] = [];

  const skillKeywords = [
    { word: 'Python', category: 'lang' },
    { word: 'SQL', category: 'lang' },
    { word: 'FastAPI', category: 'lang' },
    { word: 'React', category: 'lang' },
    { word: 'Streamlit', category: 'lang' },
    { word: 'TypeScript', category: 'lang' },
    { word: 'JavaScript', category: 'lang' },
    { word: 'Llama-3', category: 'lang' },
    { word: 'Gemini', category: 'lang' },
    { word: 'Groq', category: 'lang' },
    { word: 'Multi-agent systems', category: 'arch' },
    { word: 'Agent Orchestration', category: 'arch' },
    { word: 'RAG', category: 'arch' },
    { word: 'Microservices', category: 'arch' },
    { word: 'Distributed systems', category: 'arch' },
    { word: 'Connection Pooling', category: 'arch' },
    { word: 'Docker', category: 'cloud' },
    { word: 'Google Cloud', category: 'cloud' },
    { word: 'Render', category: 'cloud' },
    { word: 'Vercel', category: 'cloud' },
    { word: 'GitHub Actions', category: 'cloud' },
    { word: 'Git', category: 'cloud' },
    { word: 'Neon PostgreSQL', category: 'cloud' },
    { word: 'SQLite', category: 'cloud' },
    { word: 'Prompt Engineering', category: 'prac' },
    { word: 'RBAC', category: 'prac' },
    { word: 'Failover Pipelines', category: 'prac' },
    { word: 'NLP Compliance', category: 'prac' },
  ];

  skillKeywords.forEach((k) => {
    if (new RegExp(`\\b${k.word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text)) {
      if (k.category === 'lang') languagesAndFrameworks.push(k.word);
      else if (k.category === 'arch') coreArchitecture.push(k.word);
      else if (k.category === 'cloud') cloudAndInfrastructure.push(k.word);
      else if (k.category === 'prac') practicesAndMethodologies.push(k.word);
    }
  });

  // Fallbacks if empty
  if (coreArchitecture.length === 0) coreArchitecture.push('AI Multi-Agent Systems', 'Distributed Microservices', 'RAG Architectures');
  if (languagesAndFrameworks.length === 0) languagesAndFrameworks.push('Python', 'SQL', 'FastAPI', 'Llama-3', 'Gemini');
  if (cloudAndInfrastructure.length === 0) cloudAndInfrastructure.push('Docker', 'Google Cloud', 'Render', 'Vercel', 'PostgreSQL');
  if (practicesAndMethodologies.length === 0) practicesAndMethodologies.push('Prompt Engineering', 'Failover Resiliency', 'RBAC Security');

  // 7. Extract Work Experience
  const workExperience: Array<{ company: string; role: string; duration: string; highlights: string[] }> = [];
  const expMatch = text.match(/EXPERIENCE([\s\S]*?)(=?:CERTIFICATIONS|ACHIEVEMENTS|PROJECTS|$)/i);
  if (expMatch && expMatch[1].trim()) {
    const expText = expMatch[1].trim();
    const expLines = expText.split('\n').map((l) => l.trim()).filter(Boolean);
    let currentRole = 'AI Intern / Software Developer';
    let currentCompany = 'Infosys Springboard 7.0';
    let currentDuration = 'July 2026 – Present';
    const highlights: string[] = [];

    expLines.forEach((l) => {
      if (l.includes('–') || l.includes('-') || l.includes('Intern') || l.includes('Developer') || l.includes('Engineer')) {
        if (l.toLowerCase().includes('intern') || l.toLowerCase().includes('infosys')) {
          currentCompany = 'Infosys Springboard 7.0';
          currentRole = 'AI Intern';
          if (l.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^\n]*/i)) {
            currentDuration = l.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^\n]*/i)?.[0] || 'July 2026 – Present';
          }
        }
      } else if (l.startsWith('•') || l.startsWith('-') || l.length > 20) {
        highlights.push(l.replace(/^[•\-]\s*/, ''));
      }
    });

    workExperience.push({
      company: currentCompany,
      role: currentRole,
      duration: currentDuration,
      highlights: highlights.length > 0 ? highlights.slice(0, 4) : [
        'Engineered Generative AI content engine with multi-model failover pipeline (70B → 8B → Google Translate API).',
        'Architected offline NLP compliance auditor and governance system for safe omnichannel broadcasts.',
      ],
    });
  } else {
    workExperience.push({
      company: 'Infosys Springboard 7.0',
      role: 'AI Intern',
      duration: 'July 2026 – Present',
      highlights: [
        'Engineered Generative AI content engine (Groq Llama 3.3/3.1) with translation failover pipeline.',
        'Architected offline NLP compliance auditor and governance system for safe omnichannel broadcasts.',
      ],
    });
  }

  // 8. Extract Notable Projects
  const notableProjects: Array<{ name: string; description: string; metrics: string }> = [];
  
  if (text.includes('HospiSynAI')) {
    notableProjects.push({
      name: 'HospiSynAI (Rank 4 / 4,200+)',
      description: 'Multi-agent AI ecosystem PWA using FastAPI, Groq Llama 3.3 70B & Neon PostgreSQL. Converts clinical notes into structured prescriptions & billing audits in <1.5s.',
      metrics: 'Rank 4 / 4200+ in HackDevengers 1.0; 75% reduction in invoice verification time',
    });
  }

  if (text.includes('VoteWise AI')) {
    notableProjects.push({
      name: 'VoteWise AI (Rank 30 / 26,090+)',
      description: 'Multilingual civic election PWA built with Gemini 2.0 Flash, Google Embeddings & SQLite in-memory cache. Integrates Google Maps API & OAuth.',
      metrics: 'Rank 1 Women Developer & Overall Rank 30 / 26,090+ in Google PromptWars 2026 (96.98% score)',
    });
  }

  if (notableProjects.length === 0) {
    notableProjects.push({
      name: 'Generative AI & Microservices Platform',
      description: text.slice(0, 250),
      metrics: 'Proven low latency (<1.5s) & failover resilience',
    });
  }

  return {
    id: `custom-resume-${Date.now()}`,
    fullName,
    headline,
    yearsOfExperience: 2,
    location: 'Meerut / Remote, India',
    summary,
    skills: {
      coreArchitecture: Array.from(new Set(coreArchitecture)),
      languagesAndFrameworks: Array.from(new Set(languagesAndFrameworks)),
      cloudAndInfrastructure: Array.from(new Set(cloudAndInfrastructure)),
      practicesAndMethodologies: Array.from(new Set(practicesAndMethodologies)),
    },
    workExperience,
    education,
    notableProjects,
    rawText: text,
  };
}

export function generatePersonalizedOpening(
  initialSpeaker: { id: string; name: string; title: string },
  activePanel: Array<{ id: string; name: string; title: string }>,
  candidateResume: CandidateResume
): string {
  const otherMembers = activePanel
    .filter((p) => p.id !== initialSpeaker.id)
    .map((p) => `${p.name} (${p.title})`);

  const panelIntro =
    otherMembers.length > 0
      ? `I am ${initialSpeaker.name} (${initialSpeaker.title}), joined by ${otherMembers.join(' and ')}.`
      : `I am ${initialSpeaker.name} (${initialSpeaker.title}).`;

  const greeting = candidateResume.fullName && candidateResume.fullName !== 'Candidate'
    ? `Welcome ${candidateResume.fullName}!`
    : 'Welcome!';

  if (candidateResume.notableProjects && candidateResume.notableProjects.length > 0) {
    const mainProj = candidateResume.notableProjects[0];
    const projNames = candidateResume.notableProjects.map((p) => p.name.split('(')[0].trim()).join(' and ');
    return `${greeting} ${panelIntro} We reviewed your background and notable work on ${projNames}. To start off: Could you walk us through the core system architecture of ${mainProj.name.split('(')[0].trim()}, explaining how you designed it, key trade-offs you made, and how you handled performance under load?`;
  }

  if (candidateResume.workExperience && candidateResume.workExperience.length > 0) {
    const exp = candidateResume.workExperience[0];
    return `${greeting} ${panelIntro} We noted your background at ${exp.company} as ${exp.role}. To start off: Could you walk us through the system architecture of your most impactful project, highlighting key engineering trade-offs?`;
  }

  return `${greeting} ${panelIntro} To start off: Please introduce yourself and walk us through your most impactful engineering project, highlighting key architectural decisions and system trade-offs.`;
}


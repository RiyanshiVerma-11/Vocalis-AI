import { CandidateResume } from '../types';

export function parseResumeText(rawText: string, fallbackName?: string): CandidateResume {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const defaultCandidateName = fallbackName?.trim() || 'Candidate';

  if (!text) {
    return {
      id: `custom-resume-${Date.now()}`,
      fullName: defaultCandidateName,
      headline: 'Software Engineer',
      yearsOfExperience: 2,
      location: 'Remote',
      summary: 'No resume provided.',
      skills: {
        coreArchitecture: ['System Architecture', 'REST APIs'],
        languagesAndFrameworks: ['Python', 'JavaScript'],
        cloudAndInfrastructure: ['Git', 'Cloud Services'],
        practicesAndMethodologies: ['Agile', 'Code Review'],
      },
      workExperience: [],
      education: [],
      notableProjects: [],
      rawText: '',
    };
  }

  // ── 1. FULL NAME EXTRACTION ────────────────────────────────────────────────
  // Only accept lines that look like "Firstname Lastname" — 2–4 TitleCase words, no numbers or bullets
  const sectionHeaderRx = /^(summary|professional summary|resume|cv|profile|objective|contact|work experience|experience|education|skills|projects|achievements|certifications|technical skills|internship|b\.tech|bachelor|master|cgpa)$/i;
  const suspiciousRx = /\d{4}|@|http|www\.|linkedin|github|leetcode|\bcgpa\b|\bgpa\b|[•\-\|]/i;

  let fullName = '';
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    // Strip trailing link annotations like [GitHub] | [Live Demo] and rank details in parens
    const stripped = line
      .replace(/\[.*?\]/g, '')
      .replace(/\|.*$/, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[—•,]/g, ' ')
      .trim();

    const nameMatch = stripped.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/);
    if (nameMatch && !sectionHeaderRx.test(stripped) && !suspiciousRx.test(stripped)) {
      fullName = nameMatch[1];
      break;
    }
  }

  // If no standalone name found, prettify dot/email-separated usernames like "riyanshi.verma.55"
  if (!fullName) {
    if (defaultCandidateName.includes('.') || defaultCandidateName.includes('@')) {
      const parts = defaultCandidateName
        .split(/[\.\@]/)
        .filter((p) => /^[a-zA-Z]+$/.test(p))
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
      fullName = parts.length >= 2 ? parts.slice(0, 2).join(' ') : (parts[0] || defaultCandidateName);
    } else {
      fullName = defaultCandidateName;
    }
  }

  // ── 2. LOCATION ───────────────────────────────────────────────────────────
  let location = 'Remote / Open to Relocation';
  const locMatch = text.match(/(Meerut|Delhi|Mumbai|Bangalore|Noida|Gurgaon|Hyderabad|San Francisco|New York|Seattle|London|Remote)(?:,\s*[A-Za-z\s]+)?/i);
  if (locMatch) location = locMatch[0].trim();

  // ── 3. HEADLINE ───────────────────────────────────────────────────────────
  let headline = 'Software Engineer';
  if (text.match(/multi.?agent|agent orchestration|RAG|Llama|Groq|Gemini|Prompt Engineering/i)) {
    headline = 'AI/ML & Distributed Systems Engineer';
  } else if (text.match(/Data Science|Machine Learning|AI\/ML/i)) {
    headline = 'Data Science & AI/ML Engineer';
  } else if (text.match(/Full Stack|MERN|Next\.js|Django/i)) {
    headline = 'Full Stack Software Engineer';
  } else if (text.match(/Microservices|Distributed Systems|Backend/i)) {
    headline = 'Backend & Distributed Systems Engineer';
  } else if (text.match(/Frontend|React|UI\/UX/i)) {
    headline = 'Frontend UI Engineer';
  }

  // ── 4. SUMMARY ────────────────────────────────────────────────────────────
  let summary = '';
  const summaryMatch = text.match(/(?:SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE)\s*([\s\S]*?)(?=\n\s*\n|\n(?:EDUCATION|TECHNICAL SKILLS|SKILLS|EXPERIENCE|INTERNSHIP|PROJECTS)\b)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim().replace(/\n/g, ' ').slice(0, 450);
  }
  if (!summary) {
    const firstFewLines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(1, 6);
    summary = firstFewLines.join(' ').slice(0, 350);
  }

  // ── 5. EDUCATION ──────────────────────────────────────────────────────────
  const education: Array<{ institution: string; degree: string; year: string }> = [];
  const eduMatch = text.match(/(?:EDUCATION)([\s\S]*?)(?=(?:TECHNICAL SKILLS|SKILLS|INTERNSHIP|EXPERIENCE|PROJECTS|ACHIEVEMENTS|$))/i);
  const eduText = eduMatch ? eduMatch[1] : text;
  const degMatch = eduText.match(/(B\.Tech|Bachelor|Master|M\.Tech|B\.E\.|B\.S\.|M\.S\.|Class XII|Class X)[^\n]*/gi);
  const instMatch = eduText.match(/(Institute|University|College|School|MIET|Academy|Vardhman|Presidency)[^\n]*/gi);
  const yearRangeMatch = eduText.match(/\b(20\d{2})\s*[–\-]\s*(20\d{2}|Present)\b/i);
  if (degMatch || instMatch) {
    education.push({
      degree: degMatch ? degMatch[0].trim() : 'B.Tech in Computer Science',
      institution: instMatch ? instMatch[0].trim() : 'Engineering Institute',
      year: yearRangeMatch ? yearRangeMatch[0] : (eduText.match(/\b20\d{2}\b/)?.[0] ?? '2026'),
    });
  }

  // ── 6. SKILLS ─────────────────────────────────────────────────────────────
  const coreArchitecture: string[] = [];
  const languagesAndFrameworks: string[] = [];
  const cloudAndInfrastructure: string[] = [];
  const practicesAndMethodologies: string[] = [];

  const skillKeywords: Array<{ word: string; cat: string }> = [
    { word: 'Python', cat: 'lang' }, { word: 'SQL', cat: 'lang' },
    { word: 'FastAPI', cat: 'lang' }, { word: 'React', cat: 'lang' },
    { word: 'Streamlit', cat: 'lang' }, { word: 'TypeScript', cat: 'lang' },
    { word: 'JavaScript', cat: 'lang' }, { word: 'Django', cat: 'lang' },
    { word: 'NumPy', cat: 'lang' }, { word: 'Pandas', cat: 'lang' },
    { word: 'Scikit-learn', cat: 'lang' }, { word: 'HTML', cat: 'lang' },
    { word: 'CSS', cat: 'lang' },
    { word: 'MongoDB', cat: 'cloud' }, { word: 'PostgreSQL', cat: 'cloud' },
    { word: 'Git', cat: 'cloud' }, { word: 'GitHub', cat: 'cloud' },
    { word: 'Docker', cat: 'cloud' }, { word: 'Vercel', cat: 'cloud' },
    { word: 'Render', cat: 'cloud' }, { word: 'Google Cloud', cat: 'cloud' },
    { word: 'SQLite', cat: 'cloud' }, { word: 'VS Code', cat: 'cloud' },
    { word: 'Machine Learning', cat: 'arch' }, { word: 'Microservices', cat: 'arch' },
    { word: 'RAG', cat: 'arch' }, { word: 'Multi-agent', cat: 'arch' },
    { word: 'REST API', cat: 'arch' }, { word: 'Prompt Engineering', cat: 'arch' },
    { word: 'Agent Orchestration', cat: 'arch' }, { word: 'Data Cleaning', cat: 'arch' },
    { word: 'GitHub Actions', cat: 'prac' }, { word: 'RBAC', cat: 'prac' },
    { word: 'Supervised Learning', cat: 'prac' }, { word: 'Model Evaluation', cat: 'prac' },
  ];

  skillKeywords.forEach(({ word, cat }) => {
    if (new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text)) {
      if (cat === 'lang') languagesAndFrameworks.push(word);
      else if (cat === 'arch') coreArchitecture.push(word);
      else if (cat === 'cloud') cloudAndInfrastructure.push(word);
      else if (cat === 'prac') practicesAndMethodologies.push(word);
    }
  });

  if (coreArchitecture.length === 0) coreArchitecture.push('System Architecture', 'REST APIs');
  if (languagesAndFrameworks.length === 0) languagesAndFrameworks.push('Python', 'SQL');
  if (cloudAndInfrastructure.length === 0) cloudAndInfrastructure.push('Git', 'GitHub');
  if (practicesAndMethodologies.length === 0) practicesAndMethodologies.push('Agile', 'Code Review');

  // ── 7. WORK EXPERIENCE ────────────────────────────────────────────────────
  const workExperience: Array<{ company: string; role: string; duration: string; highlights: string[] }> = [];
  const expSectionMatch = text.match(/(?:EXPERIENCE|INTERNSHIP|WORK EXPERIENCE|EMPLOYMENT)([\s\S]*?)(?=(?:CERTIFICATIONS|ACHIEVEMENTS|EDUCATION|PROJECTS|$))/i);

  if (expSectionMatch && expSectionMatch[1].trim()) {
    const expLines = expSectionMatch[1].split('\n').map((l) => l.trim()).filter(Boolean);
    let currentRole = '';
    let currentCompany = '';
    let currentDuration = '';
    const highlights: string[] = [];

    expLines.forEach((line) => {
      const roleCompanyM = line.match(/^([A-Za-z][A-Za-z \/&\.,0-9]*(?:Intern|Engineer|Developer|Manager|Lead|Analyst|Architect|Director|Consultant|Researcher|Founder)[A-Za-z ,&\.0-9]*)\s*[–\-]\s*(.+)$/i);
      if (roleCompanyM) {
        currentRole = roleCompanyM[1].trim();
        currentCompany = roleCompanyM[2].replace(/\[.*?\]/g, '').trim();
        return;
      }
      const dateLine = line.match(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|July|August|September|October|November|December)\s+\d{4}\s*[–\-]\s*(?:Present|\w+\s+\d{4})$/i);
      if (dateLine) { currentDuration = dateLine[0]; return; }
      const yearRange = line.match(/^(20\d{2})\s*[–\-]\s*(20\d{2}|Present)$/i);
      if (yearRange && !currentDuration) { currentDuration = yearRange[0]; return; }
      if (/^[•\-*]/.test(line) && currentRole) {
        const h = line.replace(/^[•\-*]\s*/, '').trim();
        if (h.length > 10) highlights.push(h);
      }
    });

    if (currentRole || currentCompany) {
      workExperience.push({
        company: currentCompany || 'Tech Organization',
        role: currentRole || 'Software Developer',
        duration: currentDuration || 'Recent',
        highlights: highlights.slice(0, 4),
      });
    }
  }

  // ── 8. PROJECTS ───────────────────────────────────────────────────────────
  // Project headers like "HospiSynAI (Rank 4 / 4200+)" or "VoteWise AI (Rank 30 / 26,090+)"
  // They start with a capital letter, are NOT bullet lines, and appear before bullet description lines.
  const notableProjects: Array<{ name: string; description: string; metrics: string }> = [];

  // Try to extract PROJECTS section — stop at EXPERIENCE/INTERNSHIP/ACHIEVEMENTS/CERTIFICATIONS/end
  const projSectionMatch = text.match(
    /(?:PROJECTS|NOTABLE PROJECTS|KEY PROJECTS)[^\n]*\n([\s\S]*?)(?=\n\s*(?:EXPERIENCE|INTERNSHIP|WORK EXPERIENCE|EMPLOYMENT|ACHIEVEMENTS|CERTIFICATIONS|$))/i
  );
  const rawProjBlock = projSectionMatch ? projSectionMatch[1] : '';

  if (rawProjBlock.trim()) {
    const projLines = rawProjBlock.split('\n').map((l) => l.trim()).filter(Boolean);
    let currentProjName = '';
    let currentProjDesc = '';
    let currentProjMetric = '';

    const getHeaderName = (line: string): string | null => {
      if (/^[•\-*]/.test(line)) return null;
      const stripped = line
        .replace(/\[.*?\]/g, '')          // remove [GitHub], [Live Demo]
        .replace(/\(Rank[^)]*\)/gi, '')   // remove (Rank 4 / 4200+)
        .replace(/\(\d[^)]*\)/g, '')       // remove other (numbers...)
        .replace(/\|.*$/, '')             // remove | and everything after
        .trim();
      if (stripped.length < 2) return null;
      if (/^\d{4}/.test(stripped)) return null;  // skip year lines
      if (/^(PROJECTS|ACHIEVEMENTS|CERTIFICATIONS|EXPERIENCE|EDUCATION|INTERNSHIP|SKILLS|TECHNICAL)/i.test(stripped)) return null;
      // Accept: starts with capital, has at least one letter, not purely numeric
      // Handles "HospiSynAI", "VoteWise AI", "CommAI", etc.
      if (/^[A-Z]/.test(stripped) && /[A-Za-z]{2,}/.test(stripped) && stripped.split(' ').length <= 6) {
        return stripped;
      }
      return null;
    };

    projLines.forEach((l) => {
      const headerName = getHeaderName(l);
      if (headerName) {
        if (currentProjName) {
          notableProjects.push({
            name: currentProjName,
            description: currentProjDesc || `Project: ${currentProjName}`,
            metrics: currentProjMetric || 'AI-powered end-to-end engineering',
          });
        }
        currentProjName = headerName;
        currentProjDesc = '';
        currentProjMetric = '';
      } else if (currentProjName) {
        const bullet = l.replace(/^[•\-*]\s*/, '').trim();
        if (!currentProjMetric) {
          const mMatch = bullet.match(/\b(\d+(?:\.\d+)?(?:\s*%|\s*x|[Kk]\+?|\+)?\s*(?:reduction|latency|ms|sec(?:ond)?s?|requests?|languages?|participants?|rank|performance|accuracy|mins?))\b/i);
          if (mMatch) currentProjMetric = mMatch[0].trim();
        }
        if (bullet.length > 10) currentProjDesc += (currentProjDesc ? ' ' : '') + bullet;
      }
    });

    if (currentProjName) {
      notableProjects.push({
        name: currentProjName,
        description: currentProjDesc || `Project: ${currentProjName}`,
        metrics: currentProjMetric || 'AI-powered end-to-end engineering',
      });
    }
  }

  if (notableProjects.length === 0) {
    notableProjects.push({
      name: `${languagesAndFrameworks[0] || 'AI'} Engineering Platform`,
      description: summary || text.slice(0, 200),
      metrics: 'End-to-end features & technical design',
    });
  }

  return {
    id: `custom-resume-${Date.now()}`,
    fullName,
    headline,
    yearsOfExperience: 2,
    location,
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

// ── AI LLM RESUME PARSER API CALLER ──────────────────────────────────────────
export async function parseResumeTextAsync(rawText: string, fallbackName?: string): Promise<CandidateResume> {
  const text = rawText.trim();
  if (!text) return parseResumeText(rawText, fallbackName);

  try {
    const res = await fetch('/api/resume/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: text, fallbackName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.resume) {
        return data.resume;
      }
    }
  } catch (err) {
    console.warn('AI Resume Parse API call offline, falling back to dynamic parser:', err);
  }

  return parseResumeText(rawText, fallbackName);
}

export function generatePersonalizedOpening(
  initialSpeaker: { id: string; name: string; title: string },
  activePanel: Array<{ id: string; name: string; title: string }>,
  candidateResume: CandidateResume,
  scenario?: { id: string; title: string; starterPrompt?: string; context?: string }
): string {
  const otherMembers = activePanel
    .filter((p) => p.id !== initialSpeaker.id)
    .map((p) => `${p.name} (${p.title})`);

  let otherMembersFormatted = '';
  if (otherMembers.length === 1) {
    otherMembersFormatted = otherMembers[0];
  } else if (otherMembers.length === 2) {
    otherMembersFormatted = `${otherMembers[0]} and ${otherMembers[1]}`;
  } else if (otherMembers.length > 2) {
    otherMembersFormatted = `${otherMembers.slice(0, -1).join(', ')}, and ${otherMembers[otherMembers.length - 1]}`;
  }

  const panelIntro = otherMembersFormatted
    ? `I am ${initialSpeaker.name} (${initialSpeaker.title}), joined by ${otherMembersFormatted}.`
    : `I am ${initialSpeaker.name} (${initialSpeaker.title}).`;

  const validName =
    candidateResume.fullName && candidateResume.fullName !== 'Candidate' && candidateResume.fullName !== 'SUMMARY'
      ? candidateResume.fullName
      : '';

  const greeting = validName ? `Welcome ${validName}!` : 'Welcome!';

  const projNames =
    candidateResume.notableProjects && candidateResume.notableProjects.length > 0
      ? candidateResume.notableProjects.map((p) => p.name.split('(')[0].trim()).slice(0, 2).join(' and ')
      : '';

  // If scenario is custom-freeform or personalized interview, ask directly about candidate's resume projects
  if (
    !scenario ||
    scenario.id === 'custom-freeform' ||
    scenario.id === 'candidate-personalized-interview'
  ) {
    if (candidateResume.notableProjects && candidateResume.notableProjects.length > 0) {
      const mainProj = candidateResume.notableProjects[0];
      return `${greeting} ${panelIntro} We reviewed your background and notable work on ${projNames}. To start off: Could you walk us through the core system architecture of ${mainProj.name.split('(')[0].trim()}, explaining how you designed it, key engineering trade-offs you made, and how you handled data processing and reliability?`;
    }

    if (candidateResume.workExperience && candidateResume.workExperience.length > 0) {
      const exp = candidateResume.workExperience[0];
      return `${greeting} ${panelIntro} We noted your background at ${exp.company} as ${exp.role}. To start off: Could you walk us through the system architecture of your most impactful project, highlighting key engineering trade-offs?`;
    }

    return `${greeting} ${panelIntro} To start off: Please introduce yourself and walk us through your most impactful engineering project, highlighting key architectural decisions and system trade-offs.`;
  }

  // For simulation scenarios (like PS11 cache invalidation or outage post-mortems), frame clearly as a technical case study
  const headlineRef = candidateResume.headline ? ` in ${candidateResume.headline}` : '';
  const cleanScenarioPrompt = scenario.starterPrompt
    ? scenario.starterPrompt.replace(/^Welcome![^:]*:\s*/i, '').replace(/^Hello,[^:]*:\s*/i, '')
    : scenario.context || '';

  return `${greeting} ${panelIntro} We reviewed your background${headlineRef}. For today's technical case study: ${cleanScenarioPrompt}`;
}


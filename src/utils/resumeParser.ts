import { CandidateResume } from '../types';

export function parseResumeText(rawText: string, fallbackName?: string): CandidateResume {
  const text = rawText.trim();
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

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Dynamic Full Name Extraction
  const invalidNameHeaders = /^(summary|professional summary|resume|cv|curriculum vitae|profile|objective|personal information|contact|work experience|experience|education|skills|projects|achievements)$/i;

  let fullName = defaultCandidateName;
  for (const line of lines) {
    let cleaned = line
      .replace(/[\w.-]+@[\w.-]+/g, '')
      .replace(/[\d|\-+()\s]{10,}/g, '')
      .replace(/(linkedin|github|leetcode|hackerrank|portfolio|website|certificate|summary|professional summary|resume|cv)/gi, '')
      .replace(/(meerut|delhi|mumbai|bangalore|noida|gurgaon|hyderabad|uttar pradesh|india|remote)[^]*$/gi, '')
      .replace(/[—|•\-,]/g, ' ')
      .trim();

    cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2').trim();

    if (
      cleaned &&
      !invalidNameHeaders.test(cleaned) &&
      cleaned.length >= 2 &&
      cleaned.length <= 40 &&
      !cleaned.toLowerCase().includes('http') &&
      !cleaned.toLowerCase().includes('gmail')
    ) {
      const nameWords = cleaned.split(/\s+/).slice(0, 3).join(' ');
      if (nameWords.length >= 2) {
        fullName = nameWords;
        break;
      }
    }
  }

  if (invalidNameHeaders.test(fullName) || fullName === 'SUMMARY') {
    fullName = defaultCandidateName;
  }

  // 2. Extract Location
  let location = 'Remote / Open to Relocation';
  const locMatch = text.match(/(Meerut|Delhi|Mumbai|Bangalore|Noida|Gurgaon|Hyderabad|San Francisco|New York|Seattle|London|Remote)(?:,\s*[A-Za-z\s]+)?/i);
  if (locMatch) {
    location = locMatch[0].trim();
  }

  // 3. Extract Headline / Role
  let headline = 'Software Engineer';
  if (text.match(/Data Science|Machine Learning|AI\/ML/i)) {
    headline = 'Data Science & AI/ML Engineer';
  } else if (text.match(/Full Stack|MERN|Next\.js|Django/i)) {
    headline = 'Full Stack Software Engineer';
  } else if (text.match(/Backend|Distributed Systems|Microservices/i)) {
    headline = 'Backend & Distributed Systems Engineer';
  } else if (text.match(/Frontend|React|UI/i)) {
    headline = 'Frontend UI Engineer';
  }

  // 4. Extract Summary
  let summary = '';
  const summaryIdx = text.search(/summary|profile|objective/i);
  if (summaryIdx !== -1) {
    const afterSummary = text.slice(summaryIdx).replace(/^(summary|professional summary|profile|objective)\s*/i, '').trim();
    const nextSecIdx = afterSummary.search(/education|skills|experience|internship|projects|achievements/i);
    summary = (nextSecIdx !== -1 ? afterSummary.slice(0, nextSecIdx) : afterSummary.slice(0, 350)).trim();
  }
  if (!summary) {
    summary = lines.slice(1, 5).join(' ').slice(0, 300);
  }

  // 5. Extract Education
  const education: Array<{ institution: string; degree: string; year: string }> = [];
  const eduSectionMatch = text.match(/(?:EDUCATION)([\s\S]*?)(?=(?:INTERNSHIP|EXPERIENCE|PROJECTS|SKILLS|ACHIEVEMENTS|$))/i);
  const eduTextToSearch = eduSectionMatch ? eduSectionMatch[1] : text;
  
  const degMatch = eduTextToSearch.match(/(B\.Tech|Bachelor|Master|M\.Tech|B\.E\.|B\.S\.|M\.S\.|Class XII|Class X)[^\n]*/gi);
  const instMatch = eduTextToSearch.match(/(Institute|University|College|School|MIET|Academy|Vardhman|Presidency)[^\n]*/gi);
  if (degMatch || instMatch) {
    education.push({
      degree: degMatch ? degMatch[0].trim() : 'B.Tech in Computer Science',
      institution: instMatch ? instMatch[0].trim() : 'Engineering Institute',
      year: eduTextToSearch.match(/\d{4}\s*[–\-]\s*\d{4}|\d{4}/)?.[0] || '2026',
    });
  }

  // 6. Dynamic Skills Extraction
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
    { word: 'Django', category: 'lang' },
    { word: 'HTML', category: 'lang' },
    { word: 'CSS', category: 'lang' },
    { word: 'NumPy', category: 'lang' },
    { word: 'Pandas', category: 'lang' },
    { word: 'Scikit-learn', category: 'lang' },
    { word: 'MongoDB', category: 'cloud' },
    { word: 'PostgreSQL', category: 'cloud' },
    { word: 'Git', category: 'cloud' },
    { word: 'GitHub', category: 'cloud' },
    { word: 'Docker', category: 'cloud' },
    { word: 'VS Code', category: 'cloud' },
    { word: 'Machine Learning', category: 'arch' },
    { word: 'Exploratory Data Analysis', category: 'arch' },
    { word: 'Data Cleaning', category: 'arch' },
    { word: 'REST API', category: 'arch' },
    { word: 'Microservices', category: 'arch' },
    { word: 'Supervised Learning', category: 'prac' },
    { word: 'Classification', category: 'prac' },
    { word: 'Regression', category: 'prac' },
    { word: 'Model Evaluation', category: 'prac' },
  ];

  skillKeywords.forEach((k) => {
    if (new RegExp(`\\b${k.word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text)) {
      if (k.category === 'lang') languagesAndFrameworks.push(k.word);
      else if (k.category === 'arch') coreArchitecture.push(k.word);
      else if (k.category === 'cloud') cloudAndInfrastructure.push(k.word);
      else if (k.category === 'prac') practicesAndMethodologies.push(k.word);
    }
  });

  if (coreArchitecture.length === 0) coreArchitecture.push('Machine Learning', 'Data Analysis', 'REST APIs');
  if (languagesAndFrameworks.length === 0) languagesAndFrameworks.push('Python', 'SQL', 'JavaScript');
  if (cloudAndInfrastructure.length === 0) cloudAndInfrastructure.push('Git', 'GitHub', 'PostgreSQL');
  if (practicesAndMethodologies.length === 0) practicesAndMethodologies.push('Data Preprocessing', 'Model Evaluation');

  // 7. Dynamic Work Experience Parser
  const workExperience: Array<{ company: string; role: string; duration: string; highlights: string[] }> = [];
  const expSectionMatch = text.match(/(?:INTERNSHIP|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT)([\s\S]*?)(?=(?:PROJECTS|ACHIEVEMENTS|CERTIFICATIONS|EDUCATION|$))/i);
  
  if (expSectionMatch && expSectionMatch[1].trim()) {
    const expBlock = expSectionMatch[1].trim();
    const blockLines = expBlock.split('\n').map((l) => l.trim()).filter(Boolean);
    
    let currentRole = 'Data Science Intern';
    let currentCompany = 'CodSoft';
    let currentDuration = 'Mar 2026 – Apr 2026';
    const highlights: string[] = [];

    blockLines.forEach((line) => {
      if (line.match(/intern|developer|engineer|analyst|manager|lead/i) || line.match(/[–\-]/) && line.match(/20\d\d/)) {
        if (line.includes('–') || line.includes('-')) {
          const parts = line.split(/[–\-]/);
          if (parts[0] && parts[0].length < 50) {
            if (line.toLowerCase().includes('intern')) currentRole = line.replace(/^•\s*/, '').trim();
            currentCompany = line.split(/[–\-]/)[0].trim().replace(/^•\s*/, '');
          }
          const dateMatch = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}[^\n]*/i);
          if (dateMatch) currentDuration = dateMatch[0];
        } else {
          currentRole = line.replace(/^•\s*/, '').slice(0, 45);
        }
      } else if (line.startsWith('•') || line.startsWith('-') || line.length > 15) {
        if (!line.match(/EXPERIENCE|PROJECTS|EDUCATION/i)) {
          highlights.push(line.replace(/^[•\-]\s*/, ''));
        }
      }
    });

    workExperience.push({
      company: currentCompany || 'Tech Organization',
      role: currentRole || 'Software Developer',
      duration: currentDuration || 'Recent',
      highlights: highlights.length > 0 ? highlights.slice(0, 4) : [
        'Developed data pipelines and machine learning models using Python.',
        'Performed exploratory data analysis and model evaluation.',
      ],
    });
  }

  // 8. Dynamic Projects Parser
  const notableProjects: Array<{ name: string; description: string; metrics: string }> = [];
  const projSectionMatch = text.match(/(?:PROJECTS|NOTABLE PROJECTS|KEY PROJECTS)([\s\S]*?)(?=(?:ACHIEVEMENTS|CERTIFICATIONS|SKILLS|EDUCATION|$))/i);

  if (projSectionMatch && projSectionMatch[1].trim()) {
    const projBlock = projSectionMatch[1].trim();
    const projLines = projBlock.split('\n').map((l) => l.trim()).filter(Boolean);

    let currentProjName = '';
    let currentProjDesc = '';

    projLines.forEach((l) => {
      if (!l.startsWith('•') && !l.startsWith('-') && l.length < 50 && !l.match(/http|github|linkedin|projects/i)) {
        if (currentProjName && currentProjDesc) {
          notableProjects.push({
            name: currentProjName,
            description: currentProjDesc,
            metrics: 'Interactive web & database implementation',
          });
          currentProjDesc = '';
        }
        currentProjName = l.replace(/^[•\-]\s*/, '').trim();
      } else {
        if (currentProjName) {
          currentProjDesc += (currentProjDesc ? ' ' : '') + l.replace(/^[•\-]\s*/, '').trim();
        }
      }
    });

    if (currentProjName && currentProjDesc) {
      notableProjects.push({
        name: currentProjName,
        description: currentProjDesc,
        metrics: 'Interactive web & database implementation',
      });
    }
  }

  if (notableProjects.length === 0) {
    notableProjects.push({
      name: 'Full-Stack & Data Applications',
      description: text.slice(0, 200),
      metrics: 'End-to-end user features & analytical models',
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

export function generatePersonalizedOpening(
  initialSpeaker: { id: string; name: string; title: string },
  activePanel: Array<{ id: string; name: string; title: string }>,
  candidateResume: CandidateResume,
  scenario?: { id: string; title: string; starterPrompt?: string; context?: string }
): string {
  const otherMembers = activePanel
    .filter((p) => p.id !== initialSpeaker.id)
    .map((p) => `${p.name} (${p.title})`);

  const panelIntro =
    otherMembers.length > 0
      ? `I am ${initialSpeaker.name} (${initialSpeaker.title}), joined by ${otherMembers.join(' and ')}.`
      : `I am ${initialSpeaker.name} (${initialSpeaker.title}).`;

  const validName =
    candidateResume.fullName && candidateResume.fullName !== 'Candidate' && candidateResume.fullName !== 'SUMMARY'
      ? candidateResume.fullName
      : '';

  const greeting = validName ? `Welcome ${validName}!` : 'Welcome!';

  // If scenario has a starter prompt and is not generic custom-freeform, personalize the scenario prompt
  if (scenario && scenario.id !== 'custom-freeform' && scenario.starterPrompt) {
    const projRef =
      candidateResume.notableProjects && candidateResume.notableProjects.length > 0
        ? ` We reviewed your background and notable work on ${candidateResume.notableProjects[0].name.split('(')[0].trim()}.`
        : '';

    const cleanScenarioPrompt = scenario.starterPrompt
      .replace(/^Welcome![^:]*:\s*/i, '')
      .replace(/^Hello,[^:]*:\s*/i, '');

    return `${greeting} ${panelIntro}${projRef} ${cleanScenarioPrompt}`;
  }

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


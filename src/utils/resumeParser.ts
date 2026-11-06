import { CandidateResume, DifficultyLevel } from '../types';
import { getAuthHeaders } from '../services/apiService';

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
      city: 'Remote',
      state: 'Distributed',
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
  // Inspect top lines for candidate name — 1 to 4 words, handles TitleCase & ALL-CAPS, skips docx canvas coordinates
  const sectionHeaderRx = /^(summary|professional summary|resume|cv|profile|objective|contact|work experience|experience|education|skills|projects|achievements|certifications|technical skills|internship|b\.tech|bachelor|master|cgpa|academic projects|university projects|personal strengths|extracurricular activities)$/i;
  const canvasJunkRx = /^(?:\d+[\s\d]*|left\s+\d+|right\s+\d+|center\s+\d+|page\s+\d+)$/i;
  const suspiciousRx = /\d{3,}|@|http|www\.|linkedin|github|leetcode|hackerrank|\bcgpa\b|\bgpa\b|[•\-\|]/i;

  let fullName = '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const rawLine = lines[i];
    if (canvasJunkRx.test(rawLine) || sectionHeaderRx.test(rawLine)) continue;

    // Normalize docx fragmented syllables: "Ri tika" -> "Ritika", "Si n ghal" -> "Singhal"
    let normalized = rawLine.replace(/\b([A-Z][a-z]?)\s+([a-z]{2,})\b/g, '$1$2').trim();

    // Clean trailing phone, email, contact prefix, or link URLs if on the same line
    normalized = normalized
      .replace(/\s*(?:\+?\d[\d\s\-]{7,}|\b(?:contact(?:\s+number)?|phone|mobile|tel|email|mail|linkedin|github|portfolio)\b.*$|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:https?:\/\/|www\.)\S+|github\.com\S+|linkedin\.com\S+).*$/i, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\|.*$/, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[—•,]/g, ' ')
      .trim();

    if (!normalized || canvasJunkRx.test(normalized) || suspiciousRx.test(normalized) || sectionHeaderRx.test(normalized)) {
      continue;
    }

    // Match 1 to 4 alphabetic words (TitleCase, lowercase, or ALL-CAPS)
    const match = normalized.match(/^([A-Za-z]+(?:\s+[A-Za-z]+){0,3})$/);
    if (match && !sectionHeaderRx.test(match[1])) {
      const parts = match[1].split(/\s+/).filter(Boolean);
      if (parts.length === 1 && i + 1 < lines.length) {
        // Peek at next line for surname (e.g. Riyanshi \n Verma)
        const nextClean = lines[i + 1]
          .replace(/\s*(?:\+?\d[\d\s\-]{7,}|\b(?:contact|phone|email)\b.*$|[a-zA-Z0-9._%+-]+@|\S+@\S+).*$/i, '')
          .replace(/[^A-Za-z\s]/g, '')
          .trim();
        const nextMatch = nextClean.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)?)$/);
        const isContactWord = /^(?:ph|phone|tel|email|mail|mobile|cell|contact|gender|address|linkedin|github|portfolio|link|website)\b/i.test(nextClean);
        if (nextMatch && !isContactWord && !sectionHeaderRx.test(nextClean) && !suspiciousRx.test(nextClean) && nextClean.length >= 2 && nextClean.length <= 25) {
          parts.push(...nextMatch[1].split(/\s+/));
        }
      }
      if (parts.length >= 1 && parts.length <= 4) {
        fullName = parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        break;
      }
    }
  }

  // If no standalone name found, prettify dot/email-separated usernames like "john.doe.42"
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
  const cityStateMap: Record<string, { city: string; state: string; country: string }> = {
    bengaluru: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    bangalore: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    hyderabad: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    mumbai: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    pune: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    delhi: { city: 'New Delhi', state: 'Delhi-NCR', country: 'India' },
    'new delhi': { city: 'New Delhi', state: 'Delhi-NCR', country: 'India' },
    noida: { city: 'Noida', state: 'Uttar Pradesh', country: 'India' },
    gurugram: { city: 'Gurugram', state: 'Haryana', country: 'India' },
    gurgaon: { city: 'Gurugram', state: 'Haryana', country: 'India' },
    chennai: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    kolkata: { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    meerut: { city: 'Meerut', state: 'Uttar Pradesh', country: 'India' },
    jaipur: { city: 'Jaipur', state: 'Rajasthan', country: 'India' },
    ahmedabad: { city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
    chandigarh: { city: 'Chandigarh', state: 'Punjab / Haryana', country: 'India' },
    kochi: { city: 'Kochi', state: 'Kerala', country: 'India' },
    indore: { city: 'Indore', state: 'Madhya Pradesh', country: 'India' },
    lucknow: { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
    kanpur: { city: 'Kanpur', state: 'Uttar Pradesh', country: 'India' },
    ghaziabad: { city: 'Ghaziabad', state: 'Uttar Pradesh', country: 'India' },
    nagpur: { city: 'Nagpur', state: 'Maharashtra', country: 'India' },
    patna: { city: 'Patna', state: 'Bihar', country: 'India' },
    bhopal: { city: 'Bhopal', state: 'Madhya Pradesh', country: 'India' },
    'san francisco': { city: 'San Francisco', state: 'CA', country: 'USA' },
    sf: { city: 'San Francisco', state: 'CA', country: 'USA' },
    'new york': { city: 'New York', state: 'NY', country: 'USA' },
    nyc: { city: 'New York', state: 'NY', country: 'USA' },
    seattle: { city: 'Seattle', state: 'WA', country: 'USA' },
    austin: { city: 'Austin', state: 'TX', country: 'USA' },
    boston: { city: 'Boston', state: 'MA', country: 'USA' },
    london: { city: 'London', state: 'England', country: 'UK' },
    toronto: { city: 'Toronto', state: 'ON', country: 'Canada' },
    singapore: { city: 'Singapore', state: 'Singapore', country: 'Singapore' },
    berlin: { city: 'Berlin', state: 'Berlin', country: 'Germany' },
  };

  let extractedCity = '';
  let extractedState = '';
  let extractedCountry = '';
  let location = 'Remote / Open to Relocation';

  // Check known cities in text
  const cityRegex = new RegExp(`\\b(${Object.keys(cityStateMap).join('|')})\\b`, 'i');
  const cityMatch = text.match(cityRegex);
  if (cityMatch) {
    const key = cityMatch[1].toLowerCase();
    const info = cityStateMap[key];
    if (info) {
      extractedCity = info.city;
      extractedState = info.state;
      extractedCountry = info.country;
      location = `${extractedCity}, ${extractedState}`;
    }
  } else {
    // Regex for "City, State" or "City, Country" pattern
    const explicitLocMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|[A-Z]{2})\b/);
    if (explicitLocMatch && !/university|institute|college|school|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(explicitLocMatch[0])) {
      extractedCity = explicitLocMatch[1];
      extractedState = explicitLocMatch[2];
      location = `${extractedCity}, ${extractedState}`;
    }
  }

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
  const degMatch = (eduText || text).match(/(B\.Tech|Bachelor|Master|M\.Tech|B\.E\.|B\.S\.|M\.S\.|Class XII|Class X)[^\n]*/gi);
  const instMatch = (eduText || text).match(/(Institute|University|College|School|MIET|Academy|Vardhman|Presidency)[^\n]*/gi);
  const yearRangeMatch = text.match(/\b(?:(?:Aug|Jan|Feb|Mar|Apr|May|Jun|Jul|Sep|Oct|Nov|Dec)[a-z]*\s+)?(20\d{2})\s*[–\-]\s*(?:(?:July|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(20\d{2}|Present)\b/i);
  const cgpaMatch = text.match(/\b(?:CGPA|GPA)[:\-\s]*([0-9]+(?:\.[0-9]+)?(?:\s*\/\s*10)?)/i);
  const yearStr = yearRangeMatch ? (cgpaMatch ? `${yearRangeMatch[0]} | CGPA: ${cgpaMatch[1]}` : yearRangeMatch[0]) : (eduText.match(/\b20\d{2}\b/)?.[0] ?? '2023 – 2027');

  if (degMatch || instMatch) {
    education.push({
      degree: degMatch ? degMatch[0].replace(/\|.*$/, '').trim() : 'B.Tech in Computer Science',
      institution: instMatch ? instMatch[0].replace(/\|.*$/, '').trim() : 'Engineering Institute',
      year: yearStr,
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
  const notableProjects: Array<{ name: string; description: string; metrics: string }> = [];

  // Match PROJECTS section (handling ACADEMIC PROJECTS, UNIVERSITY PROJECTS, etc.)
  const projSectionMatch = text.match(
    /(?:PROJECTS|NOTABLE PROJECTS|KEY PROJECTS|ACADEMIC PROJECTS|UNIVERSITY PROJECTS)[^\n]*\n([\s\S]*?)(?=\n\s*(?:EXPERIENCE|INTERNSHIP|INTE\s*N?\s*RSHIP|WORK EXPERIENCE|EMPLOYMENT|ACHIEVEMENTS|CERTIFICATIONS|PERSONAL STRENGTHS|ADDITIONAL|EXTRACURRICULAR|$))/i
  );
  const rawProjBlock = projSectionMatch ? projSectionMatch[1] : '';

  if (rawProjBlock.trim()) {
    // 1. Check for explicit "Project Title :" pattern (e.g. Academic Resumes)
    const titleMatches = [...rawProjBlock.matchAll(/Project Title\s*:\s*([^\n\r]+?)(?:\s+Description:|$|\n)/gi)];
    if (titleMatches.length > 0) {
      for (const tm of titleMatches) {
        const pName = tm[1].trim();
        if (pName && pName.length >= 2) {
          const escapedName = pName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const descRegex = new RegExp(`Project Title\\s*:\\s*${escapedName}[\\s\\S]*?Description:\\s*([\\s\\S]*?)(?=(?:Project Title|Technologies Used|\\n\\n|$))`, 'i');
          const dm = rawProjBlock.match(descRegex);
          notableProjects.push({
            name: pName,
            description: dm ? dm[1].replace(/\s+/g, ' ').trim() : `Engineered ${pName}`,
            metrics: 'Core Project',
          });
        }
      }
    }

    // 2. Standard project list extraction
    if (notableProjects.length === 0) {
      // Pre-process lines: merge orphan parenthetical tags (e.g. "(Web-Based Project) :") with preceding line
      const rawLines = rawProjBlock.split('\n').map((l) => l.trim()).filter(Boolean);
      const projLines: string[] = [];
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (i > 0 && /^\((?:web-based project|python|group project|solo|team)[^)]*\)\s*[:–\-]?/i.test(line)) {
          projLines[projLines.length - 1] += ' ' + line;
        } else {
          projLines.push(line);
        }
      }

      let currentProjName = '';
      let currentProjDesc = '';
      let currentProjMetric = '';

      const getHeaderName = (line: string): string | null => {
        if (/^[•\-*]/.test(line)) return null;
        let stripped = line
          .replace(/\[.*?\]/g, '')          // remove [GitHub], [Live Demo]
          .replace(/\((?:web-based project|python|group project|solo|team)[^)]*\)/gi, '')
          .replace(/\(Rank[^)]*\)/gi, '')   // remove (Rank 4 / 4200+)
          .replace(/\(\d[^)]*\)/g, '')
          .replace(/\|.*$/, '')
          .replace(/\b(?:github|live\s*demo|demo|source\s*code|code|repo|link|preview)\b/gi, '')
          .replace(/[:–\-—\s]+$/, '')
          .trim();

        if (stripped.length < 2) return null;

        // Filter out dates, date ranges, months, years
        if (/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(stripped)) return null;
        if (/\b(?:19|20)\d{2}\b/.test(stripped)) return null;
        if (/^(?:present|current|ongoing)\b/i.test(stripped)) return null;

        // Filter out grades/cgpa
        if (/\b(?:cgpa|gpa|percentage|marks|grade|\/10|\/4)\b/i.test(stripped)) return null;

        // Filter out degree / institute / school lines
        if (/\b(?:b\.?tech|bachelor|master|m\.?tech|degree|aktu|school|college|institute|cbse|icse)\b/i.test(stripped)) return null;

        // Filter out section headers and subheadings
        if (/^(PROJECTS|ACHIEVEMENTS|CERTIFICATIONS|EXPERIENCE|EDUCATION|INTERNSHIP|INTE\s*N?\s*RSHIP|SKILLS|TECHNICAL|ADDITIONAL|LANGUAGES|PERSONAL STRENGTHS)/i.test(stripped)) return null;

        // Filter out job simulations & certifications
        if (/\b(?:simulation|academy|cisco|deloitte|uipath|certification|googlecloud|aws|mongodb)\b/i.test(stripped)) return null;

        // Filter out descriptive bullet sentences that start with action verbs
        if (/^(?:built|developed|designed|implemented|featuring|an application|created|integrated|enabled|gained|analyzing|engineered|worked on|showcasing)\b/i.test(stripped)) return null;

        // Check word count
        const words = stripped.split(/\s+/).filter(Boolean);
        if (/^[A-Z]/.test(stripped) && /[A-Za-z]{2,}/.test(stripped) && words.length >= 1 && words.length <= 10) {
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
              description: currentProjDesc.trim() || `Project: ${currentProjName}`,
              metrics: currentProjMetric || 'Core Project',
            });
          }
          currentProjName = headerName;
          currentProjDesc = '';
          currentProjMetric = '';
        } else if (currentProjName) {
          const bullet = l.replace(/^[•\-*]\s*/, '').trim();
          if (!currentProjMetric) {
            const mMatch = bullet.match(/\b(\d+(?:\.\d+)?(?:\s*%|\s*x|[Kk]\+?|\+)?\s*(?:reduction|latency|ms|sec(?:ond)?s?|requests?|languages?|participants?|rank|performance|accuracy|mins?|\$?\d+(?:\.\d+)?[MBmb]\+?))\b/i);
            if (mMatch) currentProjMetric = mMatch[0].trim();
          }
          if (bullet.length > 5) currentProjDesc += (currentProjDesc ? ' ' : '') + bullet;
        }
      });

      if (currentProjName) {
        notableProjects.push({
          name: currentProjName,
          description: currentProjDesc.trim() || `Project: ${currentProjName}`,
          metrics: currentProjMetric || 'Core Project',
        });
      }
    }
  }

  // 3. Flagship Project Safeguard: check for prominent projects in entire resume text
  const flagshipProjects = ['VoteWise AI', 'AudiVisa', 'Stadium Sense', 'VoterDost', 'FarmOracle', 'Smart Library Management System', 'QR Code Generator', 'Dynamic Registration Page', 'My Career Kit', 'MCQ Generator'];
  flagshipProjects.forEach((proj) => {
    const rx = new RegExp(`\\b${proj.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (rx.test(text)) {
      if (!notableProjects.some((p) => p.name.toLowerCase().includes(proj.toLowerCase()) || proj.toLowerCase().includes(p.name.toLowerCase()))) {
        notableProjects.push({
          name: proj,
          description: `Key AI / Software Engineering Project: ${proj}`,
          metrics: 'Production project',
        });
      }
    }
  });

  // ── 7. ACHIEVEMENTS & AWARDS ─────────────────────────────────────────────
  const achievements: string[] = [];
  const achBlockMatch = text.match(/(?:ACHIEVEMENTS?|HONORS?|AWARDS?|ACCOMPLISHMENTS?|RECOGNITION)([\s\S]*?)(?:PROJECTS?|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS?|TECHNICAL|$)/i);
  if (achBlockMatch && achBlockMatch[1]) {
    const achLines = achBlockMatch[1]
      .split('\n')
      .map((l) => l.replace(/^[•\-*–—\d.)\s]+/, '').trim())
      .filter((l) => l.length >= 8 && !/^(ACHIEVEMENTS?|HONORS?|AWARDS?|ACCOMPLISHMENTS?|RECOGNITION)$/i.test(l));
    achievements.push(...achLines.slice(0, 6));

    // Extract any additional flagship project explicitly highlighted in achievements (e.g. VoteWise AI)
    const achProjMatches = achBlockMatch[1].match(/\b([A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+)?\s+(?:AI|Companion|Assistant|App|Platform|Dashboard|System))\b/g);
    if (achProjMatches) {
      achProjMatches.forEach((pName) => {
        const cleanPName = pName.trim();
        const exists = notableProjects.some((p) => p.name.toLowerCase().includes(cleanPName.toLowerCase()) || cleanPName.toLowerCase().includes(p.name.toLowerCase()));
        if (!exists && cleanPName.length > 3) {
          notableProjects.push({
            name: cleanPName,
            description: `Flagship project highlighted in achievements: ${cleanPName}`,
            metrics: 'AI-verified hackathon achievement',
          });
        }
      });
    }
  }

  // Also check inline mentions of rankings or hackathons if section was absent
  if (achievements.length === 0) {
    const inlineMatches = text.match(/(?:Rank\s*\d+|Winner|Finalist|\b1st\b|\b2nd\b|\b3rd\b|Top\s*\d+%?|Hackathon|Published|Certified|Scholarship)[^\n.]{10,80}/gi);
    if (inlineMatches) {
      achievements.push(...inlineMatches.slice(0, 4).map((s) => s.trim()));
    }
  }

  return {
    id: `custom-resume-${Date.now()}`,
    fullName,
    headline,
    yearsOfExperience: 2,
    location,
    city: extractedCity || undefined,
    state: extractedState || undefined,
    country: extractedCountry || undefined,
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
    achievements,
    rawText: text,
  };
}

// ── AI LLM RESUME PARSER API CALLER ──────────────────────────────────────────
export async function parseResumeTextAsync(
  rawText: string,
  fallbackName?: string,
  fileMeta?: { fileBase64?: string; fileName?: string }
): Promise<CandidateResume> {
  const text = rawText.trim();
  if (!text && !fileMeta?.fileBase64) return parseResumeText(rawText, fallbackName);

  try {
    const res = await fetch('/api/resume/parse', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        rawText: text,
        fallbackName,
        fileBase64: fileMeta?.fileBase64,
        fileName: fileMeta?.fileName,
      }),
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
  scenario?: { id: string; title: string; starterPrompt?: string; context?: string },
  difficulty: DifficultyLevel = 'Intermediate',
  strictness: string = 'Balanced'
): string {
  const validName =
    candidateResume.fullName && candidateResume.fullName !== 'Candidate' && candidateResume.fullName !== 'SUMMARY'
      ? candidateResume.fullName.split(' ')[0]
      : '';

  const greeting = validName ? `Welcome ${validName}!` : 'Welcome!';

  // Clean, fast, direct opening: warm welcome and immediate intro prompt (no wasting time listing the entire panel)
  return `${greeting} Great to have you with us today. To kick off our interview, please go ahead and introduce yourself—tell us a bit about your journey, your technical background, and what you've been working on recently.`;
}


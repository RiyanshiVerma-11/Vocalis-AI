export interface FAQItem {
  id: string;
  category: 'Platform & Voice' | 'Panel Intelligence' | 'Scoring & Calibration' | 'Security & Enterprise';
  question: string;
  answer: string;
  badge?: string;
}

export const FAQS_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Platform & Voice',
    question: 'How does real-time voice and live interruption work?',
    answer:
      'The platform uses high-speed streaming audio paired with speech-activity detection. When you begin speaking, the audio engine immediately interrupts active AI playback via an event signal and transfers the conversational floor to you without waiting for sentences to conclude.',
    badge: 'Real-Time Voice',
  },
  {
    id: 'faq-2',
    category: 'Panel Intelligence',
    question: 'How do the multiple AI interviewers coordinate and take turns?',
    answer:
      'Each interviewer runs as a distinct autonomous agent with its own persona, technical focus, and speech style. Agents share a centralized candidate memory (question history, resume points, detected competencies) and deliberatively negotiate turn-taking based on who is best suited to probe the previous answer.',
    badge: 'Turn-Taking',
  },
  {
    id: 'faq-3',
    category: 'Panel Intelligence',
    question: 'How does the platform adapt question difficulty during the interview?',
    answer:
      'The system evaluates candidate answers on depth, trade-off clarity, and implementation precision. If answers demonstrate senior or staff-level mastery, subsequent probes automatically escalate into distributed edge cases, failure domains, or cross-functional trade-offs.',
    badge: 'Dynamic Difficulty',
  },
  {
    id: 'faq-4',
    category: 'Platform & Voice',
    question: 'Can I upload my own custom resume or target job role?',
    answer:
      'Yes! You can load preset candidate profiles or edit your work experience, tech stack, and notable projects in the Shared Resume Drawer. The interviewers cite your specific achievements and interrogate past architectural claims.',
    badge: 'Resume Ingestion',
  },
  {
    id: 'faq-5',
    category: 'Scoring & Calibration',
    question: 'What is included in the post-interview final assessment?',
    answer:
      'The final evaluation generates an objective scorecard with competency ratings (Technical Architecture, Business Impact, Leadership, Problem Solving), timestamped quote evidence, identified contradictions or hand-wavy claims, and personalized development recommendations.',
    badge: 'Evidence Scorecard',
  },
  {
    id: 'faq-6',
    category: 'Security & Enterprise',
    question: 'How does the platform prevent bias and ensure fair evaluation?',
    answer:
      'Evaluations are grounded strictly in timestamped transcript citations against clear rubric criteria. Demographic identifiers are decoupled from scoring engines, ensuring decisions rest solely on technical merit, operational reasoning, and communicative precision.',
    badge: 'Fairness & Bias Mitigation',
  },
  {
    id: 'faq-7',
    category: 'Security & Enterprise',
    question: 'What hardware and browser setup is recommended?',
    answer:
      'The platform works natively in any modern Chromium or WebKit browser (Chrome, Edge, Safari, Firefox). For optimal voice fidelity, we recommend standard headphones with an integrated or USB microphone to avoid audio echo.',
    badge: 'Compatibility',
  },
  {
    id: 'faq-8',
    category: 'Scoring & Calibration',
    question: 'Can hiring teams calibrate custom role scenarios and interview panels?',
    answer:
      'Yes. Enterprise teams can configure specialized panels (e.g. distributed systems leads, product VPs, security architects), custom starter scenarios, and target level rubrics from Foundational to Staff/Principal tiers.',
    badge: 'Enterprise Customization',
  },
];

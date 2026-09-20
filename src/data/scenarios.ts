import { InterviewScenario } from '../types';

export const INTERVIEW_SCENARIOS: InterviewScenario[] = [
  {
    id: 'candidate-personalized-interview',
    title: 'Tailored Candidate Resume & AI Project Interview',
    category: 'Custom Roleplay',
    targetRole: 'Custom Role (100% Tailored to Resume)',
    recommendedPanel: ['technical', 'product', 'customer'],
    initialSpeakerRole: 'technical',
    difficulty: 'Intermediate',
    description:
      '100% personalized technical interview tailored directly to your uploaded resume, projects, and target role. The AI panel evaluates your actual projects and system design choices.',
    context:
      'Deep-dive technical evaluation tailored specifically to the candidate\'s resume, past projects, system architecture decisions, and target role competencies.',
    starterPrompt:
      'Welcome! Great to have you with us today. To start off: Could you please introduce yourself and walk us through the system architecture of your most impactful project, explaining key trade-offs and technical decisions?',
    exampleDynamics:
      'The panel asks probing questions grounded directly in your uploaded resume, past engineering positions, and project metric claims.'
  },
  // PS11 DEMO SCENARIO — The exact example from EchoSphere problem statement
  // Technical interviewer accepts implementation; PM challenges business impact
  {
    id: 'ps11-missing-business-impact',
    title: 'The Missing Business Impact [PS11 Demo]',
    category: 'System Design & Product Impact',
    targetRole: 'Senior / Staff Full-Stack Engineer',
    recommendedPanel: ['technical', 'product', 'customer'],
    initialSpeakerRole: 'technical',
    difficulty: 'Senior',
    description:
      'The exact PS11 scenario: Candidate gives a technically correct distributed cache solution. The technical interviewer accepts it — but the product manager and customer immediately challenge the business and user impact that was missing.',
    context:
      'Our e-commerce checkout pipeline handles 80,000 req/sec during flash sales. Cache invalidation failures cause stale pricing and lost revenue. You must propose a solution, defend the technical implementation, AND explain its business value and customer experience impact.',
    starterPrompt:
      'Welcome! Great to have you with us today. Let\'s dive straight in: Our cache invalidation system fails under flash-sale load, causing users to see stale prices. Please introduce yourself briefly and walk us through your proposed technical solution.',
    exampleDynamics:
      'After the candidate explains a Redis write-through cache with TTL: Rohan will nod and accept the implementation. Priya will immediately ask: "That solves the technical problem — but how does this impact checkout conversion and our Black Friday revenue? What\'s the business case?" Neha will follow: "What happens to the customer experience if the cache warms up incorrectly during a sale? Do they see wrong prices?"',
  },
  {
    id: 'tech-vs-product-tradeoff',
    title: 'System Architecture vs Customer & Business Impact',
    category: 'System Design & Product Impact',
    targetRole: 'Senior / Staff Full-Stack & System Architect',
    recommendedPanel: ['technical', 'product', 'customer'],
    initialSpeakerRole: 'technical',
    difficulty: 'Senior',
    description: 'The multi-role test scenario: The technical interviewer probes system internals and cache invalidation, while the product manager and customer challenge you on user-facing latency, downtime impact, and business value.',
    context: 'Our real-time notification & order processing pipeline handles 50,000 req/sec with sporadic latency spikes of 1.8s during flash sales, frustrating enterprise buyers. You must propose an architectural solution, address cache consistency, and defend the business ROI and customer experience.',
    starterPrompt: 'Welcome! Great to have you with us today. To start off: Our order processing pipeline suffers from latency spikes under peak load. Please introduce yourself briefly and explain how you would redesign this system to achieve sub-100ms p99 latency.',
    exampleDynamics: 'If you only talk about Redis/Kafka and partition keys, Rohan will nod, but Priya will immediately interrupt to ask how this affects checkout conversion and Neha will ask about data loss during bank webhooks.'
  },
  {
    id: 'production-outage-stakeholder',
    title: 'Critical Outage Post-Mortem & Stakeholder Crisis',
    category: 'Incident Response & Stakeholder Management',
    targetRole: 'Lead Engineer / Engineering Manager',
    recommendedPanel: ['technical', 'hiring_manager', 'customer'],
    initialSpeakerRole: 'hiring_manager',
    difficulty: 'Senior',
    description: 'Navigate a high-stakes post-mortem where an untested database index caused a 45-minute cascading outage during enterprise customer renewals.',
    context: 'A release yesterday caused database connection pool exhaustion, dropping 12% of payments. Engineering wants 3 weeks to refactor, while sales and enterprise customers demand immediate rollback guarantees.',
    starterPrompt: 'Welcome! Great to have you with us today. We had a severe 45-minute outage yesterday during quarterly billing. Please introduce yourself briefly and tell us how you would structure the post-mortem and determine root cause.',
    exampleDynamics: 'Neha will challenge on SLA credit commitments, Rohan will ask for deep connection pool telemetry and circuit breakers, and Vikram will evaluate your blameless culture.'
  },
  {
    id: 'staff-leadership-conflict',
    title: 'Cross-Functional Conflict & Architecture Roadmap',
    category: 'Behavioral & Leadership',
    targetRole: 'Staff Software Engineer / Technical Lead',
    recommendedPanel: ['hiring_manager', 'product', 'behavioural'],
    initialSpeakerRole: 'behavioural',
    difficulty: 'Staff/Principal',
    description: 'Evaluate influence without authority, resolving deadlocks between engineering refactoring desires and rapid product feature delivery.',
    context: 'The engineering team wants to pause new feature work for 2 quarters to rewrite a monolith into microservices. Product leadership argues this will cause market share loss to a fast-moving competitor.',
    starterPrompt: 'Welcome! Great to have you with us today. To kick things off, please introduce yourself and tell us about a time when you faced a fundamental disagreement with stakeholders over technical debt versus shipping features.',
    exampleDynamics: 'Dr. Meera looks for STAR self-awareness and emotional intelligence, Priya pushes on whether you measured business upside, and Vikram asks how you prevented team attrition.'
  },
  {
    id: 'custom-freeform',
    title: 'Custom Job Description & Interactive Interview',
    category: 'Custom Roleplay',
    targetRole: 'Custom Role (Candidate Configurable)',
    recommendedPanel: ['technical', 'product', 'hiring_manager', 'behavioural', 'customer'],
    initialSpeakerRole: 'hiring_manager',
    difficulty: 'Intermediate',
    description: 'Define your own target job title, industry, and requirements. The AI interview panel will calibrate dynamically to your specific domain.',
    context: 'Adaptive end-to-end interview tailored to your uploaded job description or target role.',
    starterPrompt: 'Hello and welcome to your interview today! Our panel is excited to speak with you. To get started, please introduce yourself and walk us through the most impactful project you led recently.',
    exampleDynamics: 'All active interviewers participate dynamically according to their domain priorities.'
  }
];


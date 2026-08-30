import { Interviewer, CandidateResume, InterviewScenario, InterviewerRole } from '../types';
import { ALL_INTERVIEWERS } from '../data/interviewers';

/**
 * Dynamically calibrates the AI Interview Panel based on:
 * 1. Target Role & Industry Domain (e.g., AI/ML, Full-Stack, Healthcare, FinTech, DevOps)
 * 2. Candidate's Resume (skills, top projects, experience level)
 * 3. Selected Interview Scenario & Selected Panel Roles
 */
export function generateDynamicPanel(
  targetRole: string,
  candidateResume: CandidateResume,
  scenario?: InterviewScenario,
  selectedRoleKeys?: InterviewerRole[]
): Interviewer[] {
  const rolesToInclude = selectedRoleKeys && selectedRoleKeys.length > 0
    ? selectedRoleKeys
    : (scenario?.recommendedPanel || ['technical', 'product', 'customer']);

  const roleLower = (targetRole || candidateResume.headline || '').toLowerCase();
  const rawText = (candidateResume.rawText || '').toLowerCase();
  const skillsList = [
    ...(candidateResume.skills?.coreArchitecture || []),
    ...(candidateResume.skills?.languagesAndFrameworks || []),
    ...(candidateResume.skills?.cloudAndInfrastructure || []),
  ];
  const skillsString = skillsList.join(', ');

  // Extract top candidate projects
  const mainProjects = (candidateResume.notableProjects || [])
    .map((p) => p.name)
    .join(', ');

  // Determine domain specialization
  const isAIOrML = roleLower.includes('ai') || roleLower.includes('data science') || roleLower.includes('machine learning') || rawText.includes('llama') || rawText.includes('rag') || rawText.includes('agent');
  const isHealthcare = roleLower.includes('health') || rawText.includes('hospisyn') || rawText.includes('patient') || rawText.includes('clinical');
  const isFrontend = roleLower.includes('frontend') || roleLower.includes('ui') || roleLower.includes('react');
  const isDevOps = roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('infrastructure') || roleLower.includes('sre');
  const isFinTech = roleLower.includes('fintech') || roleLower.includes('payment') || rawText.includes('ledger') || rawText.includes('stripe');

  const basePanel = ALL_INTERVIEWERS.filter((i) => rolesToInclude.includes(i.role));

  return basePanel.map((interviewer) => {
    let customTitle = interviewer.title;
    let customCompany = interviewer.company;
    let customFocus = interviewer.focusArea;
    let customJargon = [...(interviewer.speakingStyle.signatureJargon || [])];
    let customPrompt = interviewer.systemPrompt;
    let customBio = interviewer.defaultBio;

    if (interviewer.role === 'technical') {
      if (isAIOrML) {
        customTitle = 'Principal AI & Systems Architect';
        customCompany = isHealthcare ? 'HealthAI & Clinical Intelligence Labs' : 'NeuroScale AI Infrastructure';
        customFocus = `AI Multi-Agent Orchestration, RAG Latency, Vector DB Search, ${skillsString ? skillsString.slice(0, 60) : 'LLM Fine-tuning & Concurrency'}`;
        customJargon = [
          'vector embedding search p99',
          'RAG context window compression',
          'multi-agent state synchronization',
          'LLM inference latency & token budget',
          'idempotency & agent retry backoff',
          'model fallback routing (Llama vs Gemini)'
        ];
        customPrompt = `You are ${interviewer.name}, Principal AI & Systems Architect.
Target Candidate: ${candidateResume.fullName} (${targetRole}).
Key Skills/Projects: ${skillsString || 'AI Systems'}${mainProjects ? ` (Projects: ${mainProjects})` : ''}.
SPEAKING STYLE: Deeply analytical, precise, mathematically rigorous AI systems expert.
QUESTIONING STRATEGY:
- Probe the candidate's exact AI/ML & systems mechanics. If they mention RAG, vector DBs, or multi-agent workflows (e.g. HospiSynAI or VoteWise AI), demand exact state synchronization rules, context window limits, and fallback strategies.
- Cross-examine whether their stated experience matches real-world edge cases.`;
      } else if (isFrontend) {
        customTitle = 'Staff UI/UX Platform Architect';
        customCompany = 'Vivid UI Engine';
        customFocus = 'Client-side State Management, Web Audio API, Micro-Frontends, Render Performance';
        customJargon = ['virtual DOM reconciler', 'bundle size & tree-shaking', 'web worker offloading', 'FPS dropped frames'];
      } else if (isDevOps) {
        customTitle = 'Lead Site Reliability Architect';
        customCompany = 'CloudScale SRE Global';
        customFocus = 'K8s Mesh, Infrastructure as Code, Automated Failover, Disaster Recovery';
        customJargon = ['canary deployments', 'circuit breakers', 'zero-downtime rolling updates', 'RTO/RPO SLA'];
      } else {
        customFocus = `Distributed Systems, API Design, Concurrency (${skillsString ? skillsString.slice(0, 60) : 'Scalability & Failure Modes'})`;
      }
    } else if (interviewer.role === 'product') {
      if (isAIOrML || isHealthcare) {
        customTitle = 'Principal AI Product Manager';
        customCompany = isHealthcare ? 'OmniHealth AI Platform' : 'OmniProduct Intelligence';
        customFocus = 'AI User Empathy, Clinical/Business Impact, Hallucination Safety vs UX, Time-to-Value';
        customJargon = [
          'time-to-value (TTV)',
          'customer conversion funnel',
          'model accuracy vs user friction',
          'RICE prioritization',
          'graceful AI error fallback toasts',
          'North Star adoption metric'
        ];
        customPrompt = `You are ${interviewer.name}, Principal AI Product Manager.
Target Candidate: ${candidateResume.fullName} (${targetRole}).
SPEAKING STYLE: Energetic, outcome-driven, customer-centric.
QUESTIONING STRATEGY:
- Challenge technical over-complexity: "How does this AI/ML solution actually save time for clinicians or end users? What is the business ROI?"
- Probe how candidate handles false positives/hallucinations from a user experience standpoint.`;
      }
    } else if (interviewer.role === 'hiring_manager') {
      if (isAIOrML) {
        customTitle = 'VP of AI & Engineering';
        customCompany = 'Apex Engineering Group';
        customFocus = 'Engineering Velocity, Technical Debt, Cross-Functional Team Health, Talent Multipliers';
      }
    } else if (interviewer.role === 'customer') {
      if (isHealthcare) {
        customTitle = 'Director of Enterprise Clinical Operations';
        customCompany = 'Global Healthcare Systems';
        customFocus = 'HIPAA Privacy, Zero Patient Data Corruption, 99.99% Clinical Uptime, Audit Trails';
        customJargon = ['HIPAA compliance', 'patient data residency', 'zero-downtime EHR integrations', 'SLA downtime penalty'];
      } else if (isFinTech) {
        customTitle = 'Director of Enterprise FinTech Operations';
        customCompany = 'Global FinTech Partners';
        customFocus = 'SOC2 Compliance, Immutable Audit Logs, Contractual 99.99% SLA, Zero Data Loss';
      }
    }

    return {
      ...interviewer,
      title: customTitle,
      company: customCompany,
      focusArea: customFocus,
      defaultBio: customBio,
      speakingStyle: {
        ...interviewer.speakingStyle,
        signatureJargon: customJargon,
      },
      systemPrompt: customPrompt,
    };
  });
}

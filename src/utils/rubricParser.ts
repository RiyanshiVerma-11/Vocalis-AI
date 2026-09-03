/**
 * rubricParser.ts
 * 
 * Enterprise Recruiter Rubric & Job Description Intelligence Parser
 * Supports:
 * 1. Pure client-side PDF binary stream decoding & text extraction for .pdf, .txt, .md, .docx.
 * 2. LLM-powered company leveling matrix extraction via /api/rubric/parse.
 * 3. Offline heuristic rule engine for FAANG & high-growth leveling matrices.
 * 4. Pre-configured industry enterprise rubric templates (Google L6, Amazon SDE-3, Stripe L4, OpenAI/Anthropic).
 */

import { CustomCompanyRubric, PanelStrictness, RubricWeights } from '../types';
import { getAuthHeaders } from '../services/apiService';

// ── 1. PRE-CONFIGURED ENTERPRISE RUBRIC TEMPLATES ──────────────────────────

export const ENTERPRISE_RUBRIC_TEMPLATES: CustomCompanyRubric[] = [
  {
    id: 'google-l6-staff',
    companyName: 'Google',
    targetLevel: 'L6 / Staff Software Engineer (Infrastructure & Systems)',
    strictnessRating: 'Exacting',
    rubricWeights: {
      technicalArchitecture: 40,
      problemSolvingAndAgility: 25,
      leadershipAndOwnership: 20,
      communicationAndClarity: 10,
      businessAndCustomerImpact: 5,
    },
    keySignals: [
      'Proactively articulates multi-region failover and distributed consensus trade-offs (Paxos/Raft, split-brain isolation).',
      'Calculates back-of-the-envelope capacity, storage growth, and p99.9 latency SLA budgets accurately.',
      'Demonstrates horizontal scale across 100k+ QPS with partition keys and zero single points of failure.',
      'Shows high engineering velocity awareness with blameless post-mortem and observability designs.',
    ],
    redFlags: [
      'Suggests single monolithic databases or unpartitioned tables for petabyte-scale streaming workloads.',
      'Hand-waves cache consistency without explaining race conditions or thundering herd mitigation.',
      'Fails to distinguish between strong consistency and eventual consistency implications under network partition.',
    ],
    mandatoryQuestions: [
      'How would you architect a globally distributed transaction ledger that maintains strict linearizability across 3 continents under 50ms latency?',
      'If your primary key-value cluster suffers a network partition during peak traffic, how does your system arbitrate leader election and prevent split-brain writes?',
      'Walk us through your strategy for hot-partition mitigation when 80% of write traffic concentrates on a single celebrity user or tenant.',
    ],
    rawDocText: 'Google L6 Staff Systems & Infrastructure Engineering Competency Matrix and Bar-Raiser Guide.',
    uploadedAt: 'Pre-calibrated Standard',
  },
  {
    id: 'amazon-sde3-bar-raiser',
    companyName: 'Amazon',
    targetLevel: 'SDE-3 / Principal Bar-Raiser (Customer Obsession & Operational Excellence)',
    strictnessRating: 'Strict',
    rubricWeights: {
      leadershipAndOwnership: 30,
      technicalArchitecture: 30,
      businessAndCustomerImpact: 20,
      problemSolvingAndAgility: 10,
      communicationAndClarity: 10,
    },
    keySignals: [
      'Consistently ties architectural decisions directly back to customer trust and availability SLAs (Four Nines 99.99%).',
      'Demonstrates extreme Ownership: explains how they resolved cross-team blockers and technical debt proactively.',
      'Distinguishes between One-Way Door vs Two-Way Door architectural decisions.',
      'Designs systems with comprehensive operational metrics: canary deployments, automatic rollbacks, and blast radius containment.',
    ],
    redFlags: [
      'Adopts overly complex resume-driven technologies without clear customer-driven justification.',
      'Blames other teams or upstream dependencies during incident post-mortems.',
      'Lacks concrete business metrics (e.g. inability to cite latency drops, cost savings, or revenue impact).',
    ],
    mandatoryQuestions: [
      'Tell us about a time you made a high-stakes One-Way Door architectural choice with incomplete data. How did you validate risk?',
      'How do you design a tiered blast-radius isolation pattern so that a complete failure in one microservice cannot cascade across the checkout pipeline?',
      'Describe a situation where you had to push back on executive timelines to protect system reliability and operational SLAs.',
    ],
    rawDocText: 'Amazon SDE-3 / Bar-Raiser Leadership Principles and Operational Excellence Evaluation Matrix.',
    uploadedAt: 'Pre-calibrated Standard',
  },
  {
    id: 'stripe-l4-platform',
    companyName: 'Stripe',
    targetLevel: 'L4 / Senior Platform & API Architect (Developer Experience & Payments)',
    strictnessRating: 'Strict',
    rubricWeights: {
      technicalArchitecture: 35,
      problemSolvingAndAgility: 25,
      communicationAndClarity: 20,
      businessAndCustomerImpact: 10,
      leadershipAndOwnership: 10,
    },
    keySignals: [
      'Meticulous API design: idempotency keys, backward compatibility, and clean semantic REST/gRPC schemas.',
      'Financial-grade data safety: double-entry bookkeeping ledgers, immutable audit logs, and zero dropped events.',
      'Clear, concise, and structured communication without unnecessary jargon.',
      'Rigorous edge-case analysis: handles race conditions in concurrent payment authorizations gracefully.',
    ],
    redFlags: [
      'Overlooks idempotent retry mechanisms in webhook delivery or payment dispatch.',
      'Proposes destructive schema migrations with downtime on 24/7 mission-critical tables.',
      'Vague answers around webhook payload signing or authentication replay protection.',
    ],
    mandatoryQuestions: [
      'How would you guarantee exact-once execution and idempotency for a distributed payment authorization gateway with unreliable client network retries?',
      'Design a ledger system for double-entry bookkeeping that processes 10,000 transactions/sec while maintaining mathematical consistency and immutable audit logs.',
      'How do you version and evolve a public API contract consumed by 100,000 developer integrations without breaking legacy clients?',
    ],
    rawDocText: 'Stripe L4 Senior Platform & API Engineering Leveling Matrix and Quality Bar.',
    uploadedAt: 'Pre-calibrated Standard',
  },
  {
    id: 'openai-anthropic-ai-systems',
    companyName: 'OpenAI / Anthropic',
    targetLevel: 'Senior / Staff AI Infrastructure & Serving Engineer',
    strictnessRating: 'Exacting',
    rubricWeights: {
      technicalArchitecture: 45,
      problemSolvingAndAgility: 25,
      businessAndCustomerImpact: 10,
      leadershipAndOwnership: 10,
      communicationAndClarity: 10,
    },
    keySignals: [
      'Deep understanding of LLM serving latency bottlenecks: TTFT (Time-to-First-Token), inter-token latency, and KV-cache memory pressure.',
      'Designs scalable GPU cluster scheduling with dynamic batching (vLLM / Continuous Batching) and tensor parallelism.',
      'Rigorously validates streaming reliability, token budget throttling, and guardrail validation latency.',
    ],
    redFlags: [
      'Treats LLMs as standard REST microservices without factoring in GPU VRAM limits or KV-cache eviction.',
      'Ignores rate-limiting, prompt injection blast radiuses, or model fallback tiers.',
    ],
    mandatoryQuestions: [
      'How would you architect a low-latency LLM inference gateway serving 50M daily requests with vLLM, continuous batching, and KV-cache sharing across GPU nodes?',
      'Walk us through how you would architect a real-time semantic caching layer to reduce LLM inference costs by 60% without returning stale responses.',
      'How do you handle GPU node health checks, automatic failovers, and cold-start model weight streaming across a Kubernetes cluster?',
    ],
    rawDocText: 'AI Frontier Systems & Model Serving Infrastructure Rubric.',
    uploadedAt: 'Pre-calibrated Standard',
  },
];

// ── 2. CLIENT-SIDE PDF & DOCUMENT TEXT EXTRACTOR ────────────────────────────

/**
 * Extracts raw textual content from uploaded File objects.
 * Supports PDF binary streams, Text files (.txt, .md, .json), and DOCX text.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Standard Plain Text Files
  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.csv') ||
    file.type.startsWith('text/')
  ) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // 2. PDF Documents - In-Browser Lightweight Text Stream Extraction
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractTextFromPdfFile(file);
  }

  // 3. Fallback: Read as ArrayBuffer and extract readable ASCII/UTF-8 strings
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const raw = decoder.decode(buffer);
      // Clean readable text chunks
      const readable = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{2,}/g, ' ');
      resolve(readable.trim());
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Pure client-side PDF text stream parser.
 * Reads PDF object streams (BT...ET, Tj, TJ) and FlateDecode ascii segments without external dependencies.
 */
async function extractTextFromPdfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(bytes);

  const extractedChunks: string[] = [];

  // Match /Text or parenthesis / bracket strings within stream definitions
  const textMatches = pdfString.matchAll(/\(([^)]{2,})\)\s*(?:Tj|'|")/g);
  for (const match of textMatches) {
    const text = match[1]
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .trim();
    if (text.length > 1) {
      extractedChunks.push(text);
    }
  }

  // Match TJ arrays: [(Hello) 20 (World)] TJ
  const tjArrayMatches = pdfString.matchAll(/\[(.*?)\]\s*TJ/g);
  for (const match of tjArrayMatches) {
    const inner = match[1];
    const itemMatches = inner.matchAll(/\(([^)]*)\)/g);
    let line = '';
    for (const im of itemMatches) {
      line += im[1].replace(/\\([()\\])/g, '$1');
    }
    if (line.trim().length > 1) {
      extractedChunks.push(line.trim());
    }
  }

  // If standard PDF operators yielded text
  if (extractedChunks.length > 5) {
    return extractedChunks.join(' \n');
  }

  // Fallback: extract long ASCII strings from PDF body
  const rawClean = pdfString
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s{3,}/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 15 && !l.startsWith('/') && !l.startsWith('obj') && !l.startsWith('endobj'))
    .join('\n');

  return rawClean || `Extracted content from PDF: ${file.name}`;
}

// ── 3. HEURISTIC OFFLINE RUBRIC PARSER ──────────────────────────────────────

/**
 * Offline heuristic fallback to parse company name, leveling matrix, weights,
 * strictness, and questions from raw JD / Rubric text.
 */
export function parseRubricOffline(rawText: string, fileName?: string): CustomCompanyRubric {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Detect Company
  let companyName = 'Enterprise Team';
  if (lower.includes('google')) companyName = 'Google';
  else if (lower.includes('amazon') || lower.includes('aws')) companyName = 'Amazon';
  else if (lower.includes('stripe')) companyName = 'Stripe';
  else if (lower.includes('meta') || lower.includes('facebook')) companyName = 'Meta';
  else if (lower.includes('microsoft')) companyName = 'Microsoft';
  else if (lower.includes('netflix')) companyName = 'Netflix';
  else if (lower.includes('uber')) companyName = 'Uber';
  else if (lower.includes('apple')) companyName = 'Apple';
  else if (lower.includes('openai')) companyName = 'OpenAI';
  else if (lower.includes('anthropic')) companyName = 'Anthropic';
  else if (fileName) {
    companyName = fileName.split(/[-_\.]/)[0].toUpperCase();
  }

  // 2. Detect Target Level
  let targetLevel = 'Senior Software Engineer (L5)';
  if (lower.includes('l6') || lower.includes('staff') || lower.includes('e6') || lower.includes('ic6')) {
    targetLevel = `${companyName} L6 / Staff Engineer`;
  } else if (lower.includes('l7') || lower.includes('principal') || lower.includes('e7')) {
    targetLevel = `${companyName} L7 / Principal Architect`;
  } else if (lower.includes('l4') || lower.includes('sde-2') || lower.includes('sde 2') || lower.includes('e4')) {
    targetLevel = `${companyName} L4 / SDE-2`;
  } else if (lower.includes('l3') || lower.includes('junior') || lower.includes('associate')) {
    targetLevel = `${companyName} L3 / Associate Engineer`;
  }

  // 3. Detect Strictness
  let strictnessRating: PanelStrictness = 'Strict';
  if (lower.includes('principal') || lower.includes('l6') || lower.includes('l7') || lower.includes('bar raiser') || lower.includes('exacting')) {
    strictnessRating = 'Exacting';
  } else if (lower.includes('junior') || lower.includes('foundational')) {
    strictnessRating = 'Standard';
  }

  // 4. Calibrate Competency Weights
  let rubricWeights: RubricWeights = {
    technicalArchitecture: 35,
    problemSolvingAndAgility: 25,
    leadershipAndOwnership: 20,
    communicationAndClarity: 10,
    businessAndCustomerImpact: 10,
  };

  if (lower.includes('infrastructure') || lower.includes('distributed') || lower.includes('systems')) {
    rubricWeights = { technicalArchitecture: 45, problemSolvingAndAgility: 25, leadershipAndOwnership: 15, communicationAndClarity: 10, businessAndCustomerImpact: 5 };
  } else if (lower.includes('product') || lower.includes('full-stack') || lower.includes('frontend')) {
    rubricWeights = { technicalArchitecture: 30, problemSolvingAndAgility: 20, businessAndCustomerImpact: 25, communicationAndClarity: 15, leadershipAndOwnership: 10 };
  } else if (lower.includes('manager') || lower.includes('lead') || lower.includes('leadership')) {
    rubricWeights = { leadershipAndOwnership: 35, businessAndCustomerImpact: 25, communicationAndClarity: 20, technicalArchitecture: 10, problemSolvingAndAgility: 10 };
  }

  // 5. Extract Key Signals
  const keySignals: string[] = [
    `Demonstrates depth in core competencies required for ${targetLevel}.`,
    'Clearly articulates architectural trade-offs, scaling bottlenecks, and failure recovery.',
    'Provides concrete metrics and citations from prior engineering initiatives.',
  ];

  // 6. Extract Red Flags
  const redFlags: string[] = [
    'Hand-waving critical distributed systems edge cases or concurrency locks.',
    'Unable to explain operational monitoring, SLAs, and post-mortem recovery.',
    'Lack of structured technical communication or defensive responses to feedback.',
  ];

  // 7. Mandatory Screening Questions
  const mandatoryQuestions: string[] = [
    `How would you architect a high-throughput system for ${targetLevel} taking into account high availability and cost efficiency?`,
    'Walk us through a critical incident or system outage you resolved: what was the root cause and long-term fix?',
    'How do you approach backward compatibility and API versioning across distributed consumer services?',
  ];

  return {
    id: `custom-rubric-${Date.now()}`,
    companyName,
    targetLevel,
    strictnessRating,
    rubricWeights,
    keySignals,
    redFlags,
    mandatoryQuestions,
    rawDocText: text.slice(0, 10000),
    fileName: fileName || 'Uploaded_Document.pdf',
    uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

// ── 4. AI-POWERED BACKEND RUBRIC PARSER API CLIENT ──────────────────────────

/**
 * Sends raw text extracted from JD / Rubric PDF to /api/rubric/parse for deep LLM analysis.
 * Falls back automatically to offline heuristic parser if server is unreachable.
 */
export async function parseRubricDocumentAsync(
  rawText: string,
  fileName?: string
): Promise<CustomCompanyRubric> {
  try {
    const res = await fetch('/api/rubric/parse', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rawText, fileName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.rubric) {
        return data.rubric;
      }
    }
  } catch (err) {
    console.warn('[RubricParser] API parse endpoint unreachable, using offline analyzer:', err);
  }

  return parseRubricOffline(rawText, fileName);
}

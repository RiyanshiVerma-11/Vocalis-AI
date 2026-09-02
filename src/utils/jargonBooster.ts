/**
 * jargonBooster.ts
 * 
 * 1. Technical Jargon Vocabulary Booster: Real-time phonetic and domain-specific lexicon
 *    corrections for distributed systems, cloud architecture, AI/ML, and engineering management.
 * 2. Backchannel Classifier: Identifies non-interruptive conversational affirmations
 *    (e.g., "right", "uh-huh", "got it") to prevent premature AI speech cutoffs.
 * 3. Semantic Pause Analyzer: Detects incomplete thoughts and trailing conjunctions
 *    to dynamically grant extended thinking grace periods during voice interviews.
 */

// ── 1. PHONETIC & DOMAIN JARGON REPLACEMENTS ────────────────────────────────
interface JargonRule {
  regex: RegExp;
  replacement: string;
}

const JARGON_RULES: JargonRule[] = [
  // Distributed Systems & Databases
  { regex: /\b(wal|w\.a\.l\.|wall flush|right ahead log)\b/gi, replacement: 'WAL' },
  { regex: /\b(rafting|raft consensus|wrath consensus)\b/gi, replacement: 'Raft consensus' },
  { regex: /\b(paxos|packs us|pack sauce)\b/gi, replacement: 'Paxos' },
  { regex: /\b(p 99|p-99|p ninety nine|percentile 99)\b/gi, replacement: 'p99' },
  { regex: /\b(p 95|p-95|p ninety five)\b/gi, replacement: 'p95' },
  { regex: /\b(g rpc|g-rpc|grpc|g r p c)\b/gi, replacement: 'gRPC' },
  { regex: /\b(protobuf|proto buff|protocol buffer)\b/gi, replacement: 'Protobuf' },
  { regex: /\b(postgres|post gres|post grass|postgre sql)\b/gi, replacement: 'PostgreSQL' },
  { regex: /\b(dynamo db|dynamodb)\b/gi, replacement: 'DynamoDB' },
  { regex: /\b(redis|red is)\b/gi, replacement: 'Redis' },
  { regex: /\b(kafka|cafca|cough car)\b/gi, replacement: 'Kafka' },
  { regex: /\b(k8s|kates|k eight s|k-8-s|cooberneties|coobernetes)\b/gi, replacement: 'Kubernetes' },
  { regex: /\b(idempotent|idempotency|item potent|item potency)\b/gi, replacement: 'idempotency' },
  { regex: /\b(acid compliance|acid properties|a\.c\.i\.d\.)\b/gi, replacement: 'ACID' },
  { regex: /\b(cap theorem|c\.a\.p\. theorem)\b/gi, replacement: 'CAP theorem' },
  { regex: /\b(saga pattern|soccer pattern|saga orchestration)\b/gi, replacement: 'Saga pattern' },
  { regex: /\b(cqrs|c\.q\.r\.s\.|c q r s)\b/gi, replacement: 'CQRS' },
  { regex: /\b(eventual consistency|eventually consistent)\b/gi, replacement: 'eventual consistency' },
  { regex: /\b(two phase commit|2pc|2 phase commit)\b/gi, replacement: 'two-phase commit' },
  { regex: /\b(cache stampede|thundering herd)\b/gi, replacement: 'cache stampede' },
  { regex: /\b(write through|write-through)\b/gi, replacement: 'write-through' },
  { regex: /\b(write behind|write-behind)\b/gi, replacement: 'write-behind' },
  { regex: /\b(split brain|split-brain)\b/gi, replacement: 'split-brain' },
  { regex: /\b(circuit breaker|circuit breaking)\b/gi, replacement: 'circuit breaker' },
  { regex: /\b(backpressure|back pressure)\b/gi, replacement: 'backpressure' },
  { regex: /\b(rate limit|rate limiter|token bucket|leaky bucket)\b/gi, replacement: 'rate limiter' },
  { regex: /\b(sharding|database sharding)\b/gi, replacement: 'sharding' },
  { regex: /\b(linearizable|linearizability)\b/gi, replacement: 'linearizable' },

  // AI & Machine Learning
  { regex: /\b(rag pipeline|r\.a\.g\.|retrieval augmented generation)\b/gi, replacement: 'RAG' },
  { regex: /\b(vector db|vector database|vector embeddings)\b/gi, replacement: 'vector DB' },
  { regex: /\b(llm|l\.l\.m\.|large language model)\b/gi, replacement: 'LLM' },
  { regex: /\b(llama 3|llama3|llama-3)\b/gi, replacement: 'Llama 3' },
  { regex: /\b(fine tuning|finetuning|fine-tuning)\b/gi, replacement: 'fine-tuning' },
  { regex: /\b(token budget|prompt token limit)\b/gi, replacement: 'token budget' },

  // Product & Engineering Management
  { regex: /\b(rice score|r\.i\.c\.e\.|rice prioritization)\b/gi, replacement: 'RICE' },
  { regex: /\b(ttv|t\.t\.v\.|time to value)\b/gi, replacement: 'Time-to-Value (TTV)' },
  { regex: /\b(star method|star framework|s\.t\.a\.r\.)\b/gi, replacement: 'STAR framework' },
  { regex: /\b(sla|s\.l\.a\.|service level agreement)\b/gi, replacement: 'SLA' },
  { regex: /\b(rto|r\.t\.o\.|recovery time objective)\b/gi, replacement: 'RTO' },
  { regex: /\b(rpo|r\.p\.o\.|recovery point objective)\b/gi, replacement: 'RPO' },
  { regex: /\b(technical debt|tech debt)\b/gi, replacement: 'technical debt' },
  { regex: /\b(post mortem|postmortem|blameless postmortem)\b/gi, replacement: 'post-mortem' },
  { regex: /\b(blast radius)\b/gi, replacement: 'blast radius' },
  { regex: /\b(north star metric)\b/gi, replacement: 'North Star metric' },
  { regex: /\b(two way door|one way door)\b/gi, replacement: 'two-way door decision' },
];

/**
 * Applies technical domain phonetic boosts to real-time speech recognition transcripts.
 */
export function boostTechnicalJargon(transcript: string): string {
  if (!transcript) return '';
  let boosted = transcript;
  for (const rule of JARGON_RULES) {
    boosted = boosted.replace(rule.regex, rule.replacement);
  }
  return boosted;
}

// ── 2. SMART BACKCHANNEL CLASSIFIER ─────────────────────────────────────────

const BACKCHANNEL_WORDS = new Set([
  'yes',
  'yeah',
  'yep',
  'right',
  'got it',
  'okay',
  'ok',
  'sure',
  'mm-hmm',
  'mmhmm',
  'uh-huh',
  'uhhuh',
  'understood',
  'makes sense',
  'i see',
  'exactly',
  'cool',
  'alright',
  'gotcha',
  'yup',
  'noted',
]);

/**
 * Checks if candidate's utterance during active AI speech is a passive affirmation
 * rather than an intentional interruption.
 */
export function isBackchannelUtterance(rawText: string): boolean {
  const clean = rawText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim();

  if (!clean) return true; // empty sound

  // If exact match with backchannel phrases
  if (BACKCHANNEL_WORDS.has(clean)) return true;

  // If contains only 1 or 2 words and all are common affirmations
  const words = clean.split(/\s+/);
  if (words.length <= 2) {
    const isAllAffirmative = words.every((w) => BACKCHANNEL_WORDS.has(w) || w === 'i' || w === 'see' || w === 'it');
    if (isAllAffirmative) return true;
  }

  return false;
}

// ── 3. SEMANTIC PAUSE & INCOMPLETE THOUGHT ANALYZER ─────────────────────────

const TRAILING_CONJUNCTIONS = [
  'because',
  'and',
  'so',
  'where',
  'whereas',
  'while',
  'though',
  'although',
  'if',
  'or',
  'then',
  'such as',
  'in order to',
  'which means',
  'which is',
  'as well as',
  'specifically',
  'for example',
  'for instance',
  'with',
  'since',
  'meaning',
  'namely',
];

export interface SemanticPauseAnalysis {
  isIncompleteThought: boolean;
  reason?: string;
  recommendedGraceMs: number;
}

/**
 * Analyzes candidate's latest interim transcript to check whether they are
 * pausing mid-sentence to formulate a technical thought.
 */
export function analyzeSemanticPause(
  transcript: string,
  baseSilenceTimeoutMs: number
): SemanticPauseAnalysis {
  if (!transcript || transcript.trim().length === 0) {
    return { isIncompleteThought: false, recommendedGraceMs: 0 };
  }

  const trimmed = transcript.trim().toLowerCase();

  // 1. Check for trailing conjunction or preposition
  for (const conj of TRAILING_CONJUNCTIONS) {
    if (trimmed.endsWith(` ${conj}`) || trimmed === conj || trimmed.endsWith(` ${conj}...`)) {
      return {
        isIncompleteThought: true,
        reason: `Trailing conjunction ("${conj}") detected — extending thought window`,
        recommendedGraceMs: 3000, // +3 seconds extra thought grace
      };
    }
  }

  // 2. Check for comma or hyphen at end of thought
  if (trimmed.endsWith(',') || trimmed.endsWith(';') || trimmed.endsWith(' -') || trimmed.endsWith(' —')) {
    return {
      isIncompleteThought: true,
      reason: 'Mid-clause pause detected — holding floor',
      recommendedGraceMs: 2500,
    };
  }

  // 3. Short utterance ending without punctuation (e.g., "The reason we chose Redis")
  const wordCount = trimmed.split(/\s+/).length;
  const endsWithTerminalPunctuation = /[.!?]$/.test(transcript.trim());

  if (!endsWithTerminalPunctuation && wordCount >= 3 && wordCount <= 8) {
    return {
      isIncompleteThought: true,
      reason: 'Open technical clause without closing cadence',
      recommendedGraceMs: 1800,
    };
  }

  // 4. Complete sentence with falling terminal cadence
  return {
    isIncompleteThought: false,
    recommendedGraceMs: 0,
  };
}

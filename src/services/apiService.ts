import {
  Interviewer,
  TranscriptMessage,
  SharedCandidateContext,
  InterviewScenario,
  StructuredAssessment,
  AdaptiveStrategy,
  CandidateSentiment,
  AnswerDepth,
  DebateDialogueStep,
  AmbientPanelReaction,
  PanelistReactionType,
} from '../types';

export interface TurnResponseData {
  nextSpeakerId: string;
  nextSpeakerName: string;
  nextSpeakerRole: string;
  speech: string;
  internalThought: string;
  turnTakingReason: string;
  isDebateExchange?: boolean;
  debateDialogue?: DebateDialogueStep[];
  ambientReactions?: Record<string, { reactionType: PanelistReactionType; label: string }>;
  questionTopic?: string;
  targetCompetency?: string;
  adaptiveStrategyApplied?: AdaptiveStrategy;
  resumePointReferenced?: string;
  analysisOfCandidateAnswer?: {
    sentiment: CandidateSentiment;
    depthLevel: AnswerDepth;
    detectedKeywords: string[];
    candidateResponseSummary: string;
  };
  detectedFlags: Array<{
    type: 'contradiction' | 'vague' | 'missing_impact' | 'strong_insight' | 'technical_depth';
    quote: string;
    explanation: string;
    severity: 'low' | 'medium' | 'high';
    suggestedProbe?: string;
  }>;
  updatedDifficulty: 'Foundational' | 'Intermediate' | 'Senior' | 'Staff/Principal';
  difficultyAdjustmentReason?: string;
  updatedCompetencyScores: {
    technicalArchitecture: number;
    businessAndCustomerImpact: number;
    communicationAndClarity: number;
    leadershipAndOwnership: number;
    problemSolvingAndAgility: number;
  };
  newBackstageNote?: {
    authorRole: string;
    note: string;
  };
  updatedRunningSummary: string;
  unresolvedProbesToAdd?: string[];
  resolvedProbesToRemove?: string[];
}

export async function requestInterviewTurn(params: {
  transcript: TranscriptMessage[];
  sharedContext: SharedCandidateContext;
  activePanel: Interviewer[];
  lastCandidateSpeech: string;
  scenario: InterviewScenario;
  interrupted?: boolean;
  userAddressedInterviewerId?: string | null;
}): Promise<TurnResponseData> {
  const response = await fetch('/api/interview/turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid response from interview engine');
  }

  return result.data;
}

export async function generateFinalAssessment(params: {
  transcript: TranscriptMessage[];
  sharedContext: SharedCandidateContext;
  activePanel: Interviewer[];
  scenario: InterviewScenario;
  candidateName: string;
}): Promise<StructuredAssessment> {
  const response = await fetch('/api/interview/final-assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Assessment generation failed with status ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid assessment data returned');
  }

  return result.data;
}

export async function fetchTTSAudio(text: string, voiceName: string = 'Kore'): Promise<{ audioBase64: string; sampleRate: number } | null> {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });

    if (!response.ok) {
      console.warn('TTS API error, will fallback to browser speech synthesis:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.audioBase64) {
      return {
        audioBase64: data.audioBase64,
        sampleRate: data.sampleRate || 24000,
      };
    }
    return null;
  } catch (error) {
    console.warn('TTS fetch failed, falling back:', error);
    return null;
  }
}

// ─── Agora Voice Layer API Helpers ────────────────────────────────────────────

export async function fetchAgoraToken(
  channelName: string,
  uid: number = 0
): Promise<{ token: string; appId: string; channelName: string; uid: number } | null> {
  try {
    const response = await fetch(
      `/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`
    );
    if (!response.ok) {
      console.warn('[Agora] Token fetch failed:', response.status);
      return null;
    }
    const data = await response.json();
    return data.success ? data : null;
  } catch (err) {
    console.warn('[Agora] Token fetch error:', err);
    return null;
  }
}

export async function startAgoraAgent(params: {
  channelName: string;
  uid?: number;
  interviewerName?: string;
  systemPrompt?: string;
  voiceName?: string;
  heygenAvatarId?: string;
}): Promise<{ agentId?: string; token: string; mode: 'conversational-ai' | 'rtc-transport' } | null> {
  try {
    const response = await fetch('/api/agora/start-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      console.warn('[Agora] start-agent failed:', response.status);
      return null;
    }
    const data = await response.json();
    return data.success ? data : null;
  } catch (err) {
    console.warn('[Agora] start-agent error:', err);
    return null;
  }
}

export async function stopAgoraAgent(agentId: string): Promise<void> {
  try {
    await fetch('/api/agora/stop-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    });
  } catch (err) {
    console.warn('[Agora] stop-agent error:', err);
  }
}

export async function speakWithAgoraAgent(agentId: string, text: string): Promise<boolean> {
  try {
    const response = await fetch('/api/agora/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, text }),
    });
    return response.ok;
  } catch (err) {
    console.warn('[Agora] speak error:', err);
    return false;
  }
}


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Interviewer,
  TranscriptMessage,
  SharedCandidateContext,
  InterviewScenario,
  StructuredAssessment,
  DifficultyLevel,
  CandidateResume,
  AppView,
  UserSession,
} from './types';
import { ALL_INTERVIEWERS } from './data/interviewers';
import { INTERVIEW_SCENARIOS } from './data/scenarios';
import { DEFAULT_RESUME, createDefaultCandidateResume } from './data/resumes';
import { AIDisclosureBanner } from './components/AIDisclosureBanner';
import { InterviewerStage } from './components/InterviewerStage';
import { VoiceController } from './components/VoiceController';
import { TranscriptView } from './components/TranscriptView';
import { LivePanelContext } from './components/LivePanelContext';
import { ScenarioSelector } from './components/ScenarioSelector';
import { FinalAssessmentModal } from './components/FinalAssessmentModal';
import { ResumeDrawer } from './components/ResumeDrawer';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { StudioSidebar } from './components/StudioSidebar';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { requestInterviewTurn, generateFinalAssessment, fetchTTSAudio, fetchAgoraToken, startAgoraAgent, stopAgoraAgent } from './services/apiService';
import { agoraVoiceEngine } from './services/agoraVoiceEngine';
import { generatePersonalizedOpening } from './utils/resumeParser';
import { generateDynamicPanel } from './utils/dynamicPanelGenerator';
import { ArrowLeft, Sparkles, ShieldCheck, FileText, Home, User, LogOut, LogIn, PanelLeft, Building2, GraduationCap, Menu } from 'lucide-react';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

export default function App() {
  // Navigation View State ('landing' | 'login' | 'studio')
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('vocalis_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Workspace Mode ('candidate' | 'recruiter')
  const [workspaceMode, setWorkspaceMode] = useState<'candidate' | 'recruiter'>(() => {
    return currentUser?.role === 'recruiter' ? 'recruiter' : 'candidate';
  });

  // Session State
  const [inInterview, setInInterview] = useState(false);
  const [scenario, setScenario] = useState<InterviewScenario>(INTERVIEW_SCENARIOS[0]);
  const [activePanel, setActivePanel] = useState<Interviewer[]>(ALL_INTERVIEWERS.slice(0, 3));
  // Candidate & Resume State
  const [candidateResume, setCandidateResume] = useState<CandidateResume>(() => {
    try {
      const savedResume = localStorage.getItem('vocalis_candidate_resume');
      if (savedResume) return JSON.parse(savedResume);

      const savedSession = localStorage.getItem('vocalis_user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.name && parsed.role === 'candidate') {
          return createDefaultCandidateResume(parsed.name, parsed.targetTitle);
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_RESUME;
  });

  const [candidateName, setCandidateName] = useState<string>(() => candidateResume.fullName || DEFAULT_RESUME.fullName);
  const [targetRole, setTargetRole] = useState<string>(() => candidateResume.headline || 'Senior / Staff Software Engineer');
  const [isResumeDrawerOpen, setIsResumeDrawerOpen] = useState(false);

  // Runtime State
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [sharedContext, setSharedContext] = useState<SharedCandidateContext>({
    candidateName: candidateResume.fullName,
    targetRole: candidateResume.headline || 'Senior / Staff Software Engineer',
    targetLevel: 'Senior',
    currentDifficulty: 'Senior',
    difficultyScore: 7,
    runningSummary: 'Interview initiated. Panel ready.',
    demonstratedStrengths: [],
    identifiedWeaknesses: [],
    unresolvedProbes: [],
    activeTopic: 'System Architecture & Customer Impact',
    candidateResume: candidateResume,
    questionHistory: [],
    competencyScores: {
      technicalArchitecture: 50,
      businessAndCustomerImpact: 50,
      communicationAndClarity: 50,
      leadershipAndOwnership: 50,
      problemSolvingAndAgility: 50,
    },
    backstagePanelNotes: [],
    flaggedItems: [],
  });

  // Voice & Interaction State
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTargetInterviewerId, setSelectedTargetInterviewerId] = useState<string | null>(null);
  const [candidateVolume, setCandidateVolume] = useState(0);
  const [currentInterimTranscript, setCurrentInterimTranscript] = useState('');
  const [lastTurnTakingReason, setLastTurnTakingReason] = useState<string>('');
  const [lastInternalThought, setLastInternalThought] = useState<string>('');

  // Silence Tolerance & Floor Control (Fixes Accidental Cut-offs / VAD Sensitivity)
  const [silenceTimeoutMs, setSilenceTimeoutMs] = useState<number>(4000); // 4s relaxed default
  const [isFloorHeld, setIsFloorHeld] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const silenceTimeoutMsRef = useRef<number>(silenceTimeoutMs);
  silenceTimeoutMsRef.current = silenceTimeoutMs;
  const isFloorHeldRef = useRef<boolean>(isFloorHeld);
  isFloorHeldRef.current = isFloorHeld;

  // Assessment Modal
  const [assessment, setAssessment] = useState<StructuredAssessment | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Agora session tracking
  const [agoraChannelName, setAgoraChannelName] = useState<string | null>(null);
  const [agoraAgentId, setAgoraAgentId] = useState<string | null>(null);
  const [agoraMode, setAgoraMode] = useState<'conversational-ai' | 'rtc-transport' | 'offline'>('offline');

  // References & Interruption Tracking
  const transcriptRef = useRef<TranscriptMessage[]>(transcript);
  transcriptRef.current = transcript;
  const sharedContextRef = useRef<SharedCandidateContext>(sharedContext);
  sharedContextRef.current = sharedContext;
  const isProcessingRef = useRef<boolean>(isProcessing);
  isProcessingRef.current = isProcessing;
  const speechSilenceTimerRef = useRef<any>(null);
  const currentTurnIdRef = useRef<number>(0);

  // Immediate Interruption Handler (synchronously cancels AI audio & in-flight requests, turns ON mic)
  const handleInterrupt = useCallback(() => {
    // 1. Advance turn ID to invalidate any pending in-flight turn deliberation or TTS promises
    const turnId = ++currentTurnIdRef.current;

    // 2. Halt all audio sources synchronously
    agoraVoiceEngine.interrupt();
    import('./services/audioEngine').then(({ audioEngine }) => audioEngine.interrupt()).catch(() => {});
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAISpeaking(false);
    setIsProcessing(false);

    // 3. Automatically activate mic if not listening so candidate can speak immediately
    agoraVoiceEngine.clearSpeechBuffer();
    agoraVoiceEngine.startSpeechRecognition(
      (fullText) => {
        setCurrentInterimTranscript(fullText);
        if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
        
        // Auto-submit after silence ONLY if floor is not held and timeout > 0
        if (
          fullText.trim() &&
          !isProcessingRef.current &&
          !isFloorHeldRef.current &&
          silenceTimeoutMsRef.current > 0
        ) {
          speechSilenceTimerRef.current = setTimeout(() => {
            if (!isProcessingRef.current && !isFloorHeldRef.current) {
              handleCandidateResponse(fullText);
            }
          }, silenceTimeoutMsRef.current);
        }
      },
      () => {
        if (currentTurnIdRef.current === turnId) {
          agoraVoiceEngine.interrupt();
          setIsAISpeaking(false);
        }
      }
    ).then((started) => {
      if (started) {
        setIsListening(true);
        agoraVoiceEngine.initMicVisualizer((vol) => setCandidateVolume(vol));
      }
    }).catch(() => {});

    setErrorToast('⚡ Interrupted active speaker — Microphone Active! Speak now.');
    setTimeout(() => setErrorToast(null), 3000);
  }, []);

  // Speak interviewer message via Gemini TTS or ultra-fast browser fallback (<200ms start)
  const speakInterviewerMessage = useCallback(
    async (text: string, interviewer: Interviewer) => {
      if (agoraMode === 'conversational-ai') return;

      const turnId = ++currentTurnIdRef.current;
      setIsAISpeaking(true);
      setActiveSpeakerId(interviewer.id);

      try {
        // Race Gemini TTS with a 400ms timeout for instant speech start
        const ttsPromise = fetchTTSAudio(text, interviewer.voiceName);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 400));
        
        const fastResult = await Promise.race([ttsPromise, timeoutPromise]);

        if (currentTurnIdRef.current !== turnId) return; // Interrupted during fetch!

        if (fastResult && (fastResult as any).audioBase64) {
          const { audioEngine } = await import('./services/audioEngine');
          if (currentTurnIdRef.current !== turnId) return;
          await audioEngine.playGeminiTTS((fastResult as any).audioBase64, (fastResult as any).sampleRate);
        } else {
          // Instant browser SpeechSynthesis fallback (<50ms start time)
          if (currentTurnIdRef.current !== turnId) return;
          await agoraVoiceEngine.speakWithBrowserFallback(
            text,
            interviewer.voiceName,
            interviewer.pitch,
            interviewer.rate
          );
        }
      } catch (err) {
        if (currentTurnIdRef.current === turnId) {
          await agoraVoiceEngine.speakWithBrowserFallback(
            text,
            interviewer.voiceName,
            interviewer.pitch,
            interviewer.rate
          );
        }
      } finally {
        if (currentTurnIdRef.current === turnId) {
          setIsAISpeaking(false);
        }
      }
    },
    [agoraMode]
  );

  // Start an interview session (Instant Opening Speech <200ms)
  const handleStartInterview = async (config: {
    scenario: InterviewScenario;
    activePanel: Interviewer[];
    candidateName: string;
    targetRole: string;
    initialDifficulty: DifficultyLevel;
    candidateResume: CandidateResume;
    panelStrictness?: 'Supportive' | 'Balanced' | 'Strict' | 'Relentless Bar Raiser';
    rubricWeights?: {
      technicalArchitecture: number;
      businessAndCustomerImpact: number;
      communicationAndClarity: number;
      leadershipAndOwnership: number;
      problemSolvingAndAgility: number;
    };
  }) => {
    // Prime speech synthesis engine on user click gesture
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    setScenario(config.scenario);
    setActivePanel(config.activePanel);
    setCandidateName(config.candidateName);
    setTargetRole(config.targetRole);
    setCandidateResume(config.candidateResume);

    const initialSpeaker =
      config.activePanel.find((i) => i.role === config.scenario.initialSpeakerRole) ||
      config.activePanel[0];

    const openingPrompt = generatePersonalizedOpening(
      initialSpeaker,
      config.activePanel,
      config.candidateResume
    );

    const initialContext: SharedCandidateContext = {
      candidateName: config.candidateName,
      targetRole: config.targetRole,
      targetLevel: config.initialDifficulty,
      currentDifficulty: config.initialDifficulty,
      difficultyScore: config.initialDifficulty === 'Staff/Principal' ? 9 : config.initialDifficulty === 'Senior' ? 7 : 5,
      panelStrictness: config.panelStrictness || 'Balanced',
      rubricWeights: config.rubricWeights || {
        technicalArchitecture: 30,
        businessAndCustomerImpact: 25,
        communicationAndClarity: 15,
        leadershipAndOwnership: 15,
        problemSolvingAndAgility: 15,
      },
      runningSummary: `Scenario: ${config.scenario.title}. Candidate: ${config.candidateName}`,
      demonstratedStrengths: [],
      identifiedWeaknesses: [],
      unresolvedProbes: ['Awaiting candidate introduction & initial solution architecture'],
      activeTopic: config.scenario.title,
      candidateResume: config.candidateResume,
      questionHistory: [
        {
          id: `q-init-${Date.now()}`,
          turnNumber: 1,
          interviewerId: initialSpeaker.id,
          interviewerRole: initialSpeaker.role,
          interviewerName: initialSpeaker.name,
          questionText: openingPrompt,
          topic: config.scenario.title,
          targetCompetency: 'technicalArchitecture',
          adaptiveStrategyUsed: 'Deep Probe',
          difficultyLevel: config.initialDifficulty,
          timestamp: Date.now(),
        },
      ],
      competencyScores: {
        technicalArchitecture: 50,
        businessAndCustomerImpact: 50,
        communicationAndClarity: 50,
        leadershipAndOwnership: 50,
        problemSolvingAndAgility: 50,
      },
      backstagePanelNotes: [
        {
          authorRole: initialSpeaker.role,
          authorName: initialSpeaker.name,
          note: `Panel calibrated for ${config.initialDifficulty} tier. Candidate resume loaded: ${config.candidateResume.fullName} (${config.candidateResume.workExperience[0]?.company || 'Verified'}).`,
          timestamp: Date.now(),
        },
      ],
      flaggedItems: [],
    };

    setSharedContext(initialContext);

    const firstMessage: TranscriptMessage = {
      id: `turn-init-${Date.now()}`,
      speakerId: initialSpeaker.id,
      speakerName: initialSpeaker.name,
      speakerRole: initialSpeaker.role,
      content: openingPrompt,
      timestamp: Date.now(),
      difficultyAtTurn: config.initialDifficulty,
      internalThought: `Opening the interview tailored to ${config.candidateName}'s resume. Focus: ${initialSpeaker.focusArea}`,
    };

    setTranscript([firstMessage]);
    setLastTurnTakingReason(`Initial question opened by ${initialSpeaker.name} (${initialSpeaker.title})`);
    setLastInternalThought(`Opening scenario question calibrated for ${config.initialDifficulty} level.`);
    setActiveSpeakerId(initialSpeaker.id);
    setInInterview(true);
    setAssessment(null);

    // Speak initial prompt IMMEDIATELY (<200ms delay)
    speakInterviewerMessage(openingPrompt, initialSpeaker);

    // ── Join Agora RTC channel asynchronously in background (doesn't block opening speech) ──
    (async () => {
      try {
        const channelName = `vocalis-${Date.now()}`;
        const tokenData = await fetchAgoraToken(channelName, 0);
        if (tokenData) {
          const joined = await agoraVoiceEngine.joinChannel(tokenData.token, channelName, 0);
          if (joined) {
            setAgoraChannelName(channelName);
            const agentData = await startAgoraAgent({
              channelName,
              uid: 1,
              interviewerName: initialSpeaker.name,
              systemPrompt: initialSpeaker.systemPrompt,
            });
            if (agentData?.agentId) setAgoraAgentId(agentData.agentId);
            setAgoraMode(agentData?.mode === 'conversational-ai' ? 'conversational-ai' : 'rtc-transport');
          } else {
            setAgoraMode('offline');
          }
        } else {
          setAgoraMode('offline');
        }
      } catch (err) {
        setAgoraMode('offline');
      }
    })();
  };

  // Process Candidate Speech/Submission
  const handleCandidateResponse = async (speechText: string) => {
    if (!speechText.trim() || isProcessingRef.current) return;

    const thisTurnId = ++currentTurnIdRef.current;

    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
    }
    agoraVoiceEngine.clearSpeechBuffer();

    // Halt any active AI speech immediately when candidate responds
    agoraVoiceEngine.interrupt();
    import('./services/audioEngine').then(({ audioEngine }) => audioEngine.interrupt()).catch(() => {});
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAISpeaking(false);
    setIsProcessing(true);
    setCurrentInterimTranscript('');

    const candidateMsgId = `turn-cand-${Date.now()}`;
    const candidateMsg: TranscriptMessage = {
      id: candidateMsgId,
      speakerId: 'candidate',
      speakerName: candidateName || 'Candidate',
      speakerRole: 'candidate',
      content: speechText.trim(),
      timestamp: Date.now(),
      difficultyAtTurn: sharedContextRef.current.currentDifficulty,
    };

    const updatedTranscript = [...transcriptRef.current, candidateMsg];
    setTranscript(updatedTranscript);

    try {
      // Call Multi-Role Turn Deliberation Engine
      const turnResult = await requestInterviewTurn({
        transcript: updatedTranscript,
        sharedContext: sharedContextRef.current,
        activePanel,
        lastCandidateSpeech: speechText.trim(),
        scenario,
        interrupted: false,
        userAddressedInterviewerId: selectedTargetInterviewerId,
      });

      // Check if user interrupted while waiting for response
      if (currentTurnIdRef.current !== thisTurnId) return;

      // Update candidate message with detected flags & adaptive analysis
      setTranscript((prev) =>
        prev.map((msg) =>
          msg.id === candidateMsgId
            ? {
                ...msg,
                detectedFlags: (turnResult.detectedFlags || []) as any,
                adaptiveAnalysis: turnResult.analysisOfCandidateAnswer,
              }
            : msg
        )
      );

      // Find next interviewer
      const nextInterviewer =
        activePanel.find((i) => i.id === turnResult.nextSpeakerId) ||
        activePanel.find((i) => i.role === turnResult.nextSpeakerRole) ||
        activePanel[0];

      // Update Question History in Shared Context
      const newQuestionRecord = {
        id: `q-${Date.now()}`,
        turnNumber: (sharedContextRef.current.questionHistory?.length || 0) + 1,
        interviewerId: nextInterviewer.id,
        interviewerRole: nextInterviewer.role,
        interviewerName: nextInterviewer.name,
        questionText: turnResult.speech,
        topic: turnResult.questionTopic || scenario.title,
        targetCompetency: turnResult.targetCompetency || 'technicalArchitecture',
        difficultyLevel: turnResult.updatedDifficulty || sharedContextRef.current.currentDifficulty,
        adaptiveStrategyUsed: turnResult.adaptiveStrategyApplied || 'Deep Probe',
        resumeReferenceUsed: turnResult.resumePointReferenced,
        candidateResponseSummary: turnResult.analysisOfCandidateAnswer?.candidateResponseSummary,
        candidateDepth: turnResult.analysisOfCandidateAnswer?.depthLevel,
        timestamp: Date.now(),
      };

      const newQuestionHistory = [
        ...(sharedContextRef.current.questionHistory || []),
        newQuestionRecord,
      ];

      // Update Shared Context
      const newContext: SharedCandidateContext = {
        ...sharedContextRef.current,
        currentDifficulty: turnResult.updatedDifficulty || sharedContextRef.current.currentDifficulty,
        runningSummary: turnResult.updatedRunningSummary || sharedContextRef.current.runningSummary,
        competencyScores: turnResult.updatedCompetencyScores || sharedContextRef.current.competencyScores,
        questionHistory: newQuestionHistory,
        latestAdaptiveAnalysis: turnResult.analysisOfCandidateAnswer
          ? {
              ...turnResult.analysisOfCandidateAnswer,
              lastStrategy: turnResult.adaptiveStrategyApplied || 'Deep Probe',
              resumePointReferenced: turnResult.resumePointReferenced,
            }
          : sharedContextRef.current.latestAdaptiveAnalysis,
        backstagePanelNotes: turnResult.newBackstageNote
          ? [
              ...sharedContextRef.current.backstagePanelNotes,
              {
                authorRole: turnResult.newBackstageNote.authorRole as any,
                authorName: turnResult.nextSpeakerName,
                note: turnResult.newBackstageNote.note,
                timestamp: Date.now(),
              },
            ]
          : sharedContextRef.current.backstagePanelNotes,
      };

      setSharedContext(newContext);
      setLastTurnTakingReason(turnResult.turnTakingReason);
      setLastInternalThought(turnResult.internalThought);

      const interviewerMsg: TranscriptMessage = {
        id: `turn-ai-${Date.now()}`,
        speakerId: nextInterviewer.id,
        speakerName: nextInterviewer.name,
        speakerRole: nextInterviewer.role,
        content: turnResult.speech,
        timestamp: Date.now(),
        difficultyAtTurn: turnResult.updatedDifficulty,
        internalThought: turnResult.internalThought,
        adaptiveStrategy: turnResult.adaptiveStrategyApplied,
        referencedResumePoint: turnResult.resumePointReferenced,
      };

      setTranscript((prev) => [...prev, interviewerMsg]);
      setSelectedTargetInterviewerId(null);

      // Speak response if not interrupted
      if (currentTurnIdRef.current === thisTurnId) {
        await speakInterviewerMessage(turnResult.speech, nextInterviewer);
      }
    } catch (err: any) {
      if (currentTurnIdRef.current === thisTurnId) {
        console.error('Turn processing failed:', err);
        setErrorToast(err.message || 'Failed to get interviewer response. Please retry.');
        setTimeout(() => setErrorToast(null), 4000);
      }
    } finally {
      if (currentTurnIdRef.current === thisTurnId) {
        setIsProcessing(false);
      }
    }
  };

  // Update Resume Handler (from drawer) — Recalibrates dynamic panel!
  const handleUpdateResume = (updated: CandidateResume) => {
    setCandidateResume(updated);
    setCandidateName(updated.fullName);
    if (updated.headline) {
      setTargetRole(updated.headline);
    }

    // Recalibrate active panel dynamically to match updated resume & role
    const updatedPanel = generateDynamicPanel(
      updated.headline || targetRole,
      updated,
      scenario,
      activePanel.map((p) => p.role)
    );
    setActivePanel(updatedPanel);

    setSharedContext((prev) => ({
      ...prev,
      candidateName: updated.fullName,
      targetRole: updated.headline || prev.targetRole,
      candidateResume: updated,
    }));
    setErrorToast('✓ Candidate profile & interview panel dynamically recalibrated');
    setTimeout(() => setErrorToast(null), 2500);
  };

  // Toggle Microphone — routes through Agora RTC channel
  const handleToggleListening = async () => {
    if (isListening) {
      if (speechSilenceTimerRef.current) {
        clearTimeout(speechSilenceTimerRef.current);
      }
      agoraVoiceEngine.stopSpeechRecognition();
      setIsListening(false);
    } else {
      agoraVoiceEngine.clearSpeechBuffer();
      const started = await agoraVoiceEngine.startSpeechRecognition(
        (fullText, hasFinalChunk) => {
          setCurrentInterimTranscript(fullText);

          // Reset silence debounce timer on every new speech chunk
          if (speechSilenceTimerRef.current) {
            clearTimeout(speechSilenceTimerRef.current);
          }

          // Auto-submit after silence ONLY if floor is not held and timeout > 0
          if (
            fullText.trim() &&
            !isProcessingRef.current &&
            !isFloorHeldRef.current &&
            silenceTimeoutMsRef.current > 0
          ) {
            speechSilenceTimerRef.current = setTimeout(() => {
              if (!isProcessingRef.current && !isFloorHeldRef.current) {
                handleCandidateResponse(fullText);
              }
            }, silenceTimeoutMsRef.current);
          }
        },
        () => {
          if (isAISpeaking) {
            handleInterrupt();
          }
        }
      );

      if (started) {
        setIsListening(true);
        await agoraVoiceEngine.initMicVisualizer((vol) => {
          setCandidateVolume(vol);
        });
      } else {
        setErrorToast('Microphone access denied. Please allow microphone permissions.');
        setTimeout(() => setErrorToast(null), 4000);
      }
    }
  };

  // Generate Final Assessment
  const handleEndInterview = async () => {
    if (transcript.length < 2) {
      setErrorToast('Please exchange at least a couple of questions before generating an assessment.');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    handleInterrupt();
    setIsGeneratingAssessment(true);

    try {
      const finalReport = await generateFinalAssessment({
        transcript,
        sharedContext,
        activePanel,
        scenario,
        candidateName,
      });
      setAssessment(finalReport);
    } catch (err: any) {
      console.error('Assessment generation failed:', err);
      setErrorToast(err.message || 'Could not generate final evaluation.');
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  // Restart interview — leave Agora channel and clean up
  const handleRestart = () => {
    agoraVoiceEngine.cleanup();
    // Stop Agora agent if running
    if (agoraAgentId) {
      stopAgoraAgent(agoraAgentId).catch(() => {});
      setAgoraAgentId(null);
    }
    setAgoraChannelName(null);
    setAgoraMode('offline');
    setIsAISpeaking(false);
    setIsListening(false);
    setInInterview(false);
    setAssessment(null);
    setTranscript([]);
  };

  // Handle Login & Logout
  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('vocalis_user_session', JSON.stringify(user));
    } catch {
      // ignore
    }

    if (user.role === 'recruiter' || user.role === 'interviewer') {
      setWorkspaceMode('recruiter');
    } else {
      setWorkspaceMode('candidate');
    }

    if (user.role === 'candidate' && user.name) {
      setCandidateName(user.name);
      let userResume: CandidateResume;
      try {
        const savedResume = localStorage.getItem('vocalis_candidate_resume');
        if (savedResume) {
          const parsed = JSON.parse(savedResume);
          userResume = { ...parsed, fullName: user.name, headline: user.targetTitle || parsed.headline };
        } else {
          userResume = createDefaultCandidateResume(user.name, user.targetTitle);
        }
      } catch {
        userResume = createDefaultCandidateResume(user.name, user.targetTitle);
      }
      setCandidateResume(userResume);
      try {
        localStorage.setItem('vocalis_candidate_resume', JSON.stringify(userResume));
      } catch {
        // ignore
      }
      setSharedContext((prev) => ({
        ...prev,
        candidateName: user.name,
        targetRole: user.targetTitle || userResume.headline,
        candidateResume: userResume,
      }));
    }
    setErrorToast(`✓ Signed in as ${user.name} (${user.role === 'recruiter' ? 'Recruiter Mode' : 'Candidate Mode'})`);
    setTimeout(() => setErrorToast(null), 3000);
    setCurrentView('studio');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('vocalis_user_session');
      localStorage.removeItem('vocalis_jwt_token');
    } catch {
      // ignore
    }
    setErrorToast('✓ Signed out — Redirected to landing page');
    setTimeout(() => setErrorToast(null), 2500);
    setCurrentView('landing');
  };

  // Audio lifecycle cleanup — wire Agora engine callbacks
  useEffect(() => {
    agoraVoiceEngine.setCallbacks({
      onSpeakingStateChange: (speaking) => setIsAISpeaking(speaking),
      onInterrupted: () => setIsAISpeaking(false),
      onConnectionStateChange: (state) => {
        console.log('[Agora] Connection state:', state);
      },
    });

    return () => {
      agoraVoiceEngine.cleanup();
      if (agoraAgentId) {
        stopAgoraAgent(agoraAgentId).catch(() => {});
      }
    };
  }, []);

  // 1. Landing Page View
  if (currentView === 'landing') {
    return (
      <LandingPage
        onOpenStudio={() => setCurrentView('studio')}
        onOpenLogin={() => setCurrentView('login')}
        isLoggedIn={!!currentUser}
        userName={currentUser?.name}
        onLogout={handleLogout}
      />
    );
  }

  // 2. Login Page View
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setCurrentView('landing')}
        onDirectLaunchStudio={() => setCurrentView('studio')}
      />
    );
  }

  // 3. Interview Studio Workspace View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* PWA Install Banner & Offline Indicator */}
      <PWAInstallPrompt />

      {/* Mandatory AI Disclosure Banner */}
      <AIDisclosureBanner />

      {/* Main Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40 shadow-md">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* Left Brand Section */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              id="btn-toggle-mobile-menu"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center border border-slate-700"
              title={isSidebarOpen ? 'Close Control Panel' : 'Open Control Panel'}
              aria-label="Toggle menu navigation"
            >
              <Menu className="w-4 h-4 text-indigo-400" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('landing')}
              className="w-8 h-8 rounded-lg overflow-hidden shadow-sm hover:opacity-90 transition cursor-pointer shrink-0"
              title="Vocalis AI Landing Page"
            >
              <img src="/logo.jpg" alt="Vocalis AI Logo" className="w-full h-full object-cover" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentView('landing')}
                className="text-sm font-extrabold text-white hover:text-indigo-300 transition cursor-pointer text-left tracking-tight"
              >
                Vocalis AI Studio
              </button>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold uppercase tracking-wider hidden sm:inline-block">
                Multi-Role Panel
              </span>
            </div>
          </div>

          {/* Right Controls & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Switcher: Recruiter vs Candidate */}
            {!inInterview && (
              <div className="flex rounded-lg bg-slate-800/90 p-0.5 border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('candidate')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition flex items-center gap-1.5 cursor-pointer ${
                    workspaceMode === 'candidate'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Candidate Practice Studio View"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Candidate View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('recruiter')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition flex items-center gap-1.5 cursor-pointer ${
                    workspaceMode === 'recruiter'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Recruiter & Hiring Team Dashboard"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Recruiter View</span>
                </button>
              </div>
            )}

            {/* Shared Resume & Memory Drawer */}
            <button
              type="button"
              onClick={() => setIsResumeDrawerOpen(true)}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
              title="View Candidate Resume & Question Memory"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Resume & Memory</span>
              <span className="md:hidden">Resume</span>
            </button>

            {/* User Profile / Auth State Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
                <div
                  className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs cursor-default"
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  {currentUser.avatarInitials}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {inInterview ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {/* Focus Mode / Telemetry Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFocusMode((prev) => !prev);
                    setErrorToast(!isFocusMode ? '🧘 Focus Mode Active — Zero Distractions!' : '📊 Telemetry Mode Active — Full HUD Metrics');
                    setTimeout(() => setErrorToast(null), 2500);
                  }}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                    isFocusMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Toggle between Focus Mode (Clean View) and Telemetry Mode (Full HUD Metrics)"
                >
                  <span>{isFocusMode ? '🧘 Focus Mode' : '📊 Telemetry View'}</span>
                </button>

                <div
                  className="hidden xl:flex items-center gap-1.5 text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 font-medium max-w-[240px] truncate"
                  title={`Candidate: ${candidateName} | Scenario: ${scenario.title}`}
                >
                  <span className="truncate">Candidate: <strong className="text-white">{candidateName}</strong></span>
                </div>

                <button
                  id="btn-back-to-setup"
                  onClick={handleRestart}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset & End Interview Session"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex text-xs font-semibold text-slate-300 items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panel Ready</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Error/Alert Toast */}
      {errorToast && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Main Workspace Layout with Hideable Sidebar */}
      <div className="flex-1 flex w-full">
        {/* Hideable Studio Sidebar */}
        <StudioSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          candidateResume={candidateResume}
          activePanel={activePanel}
          selectedTargetInterviewerId={selectedTargetInterviewerId}
          onSelectTargetInterviewer={setSelectedTargetInterviewerId}
          sharedContext={sharedContext}
          onOpenResumeDrawer={() => setIsResumeDrawerOpen(true)}
          onEndInterview={handleEndInterview}
          isProcessing={isProcessing || isGeneratingAssessment}
          agoraMode={agoraMode}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
          silenceTimeoutMs={silenceTimeoutMs}
          onChangeSilenceTimeout={(ms) => {
            setSilenceTimeoutMs(ms);
            setErrorToast(`Pause tolerance set to ${ms > 0 ? `${ms / 1000}s` : 'Manual Send Only'}`);
            setTimeout(() => setErrorToast(null), 2500);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Main Center Content Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 space-y-6">
          {!inInterview ? (
            workspaceMode === 'recruiter' ? (
              <RecruiterDashboard
                onStartInterview={handleStartInterview}
                onOpenResumeDrawer={() => setIsResumeDrawerOpen(true)}
              />
            ) : (
              <ScenarioSelector
                onStartInterview={handleStartInterview}
                currentUser={currentUser}
                currentCandidateName={candidateName}
                currentCandidateResume={candidateResume}
              />
            )
          ) : (
            <div className="space-y-6">
              {/* Top Stage: Active Interviewers Display */}
              <InterviewerStage
                panel={activePanel}
                activeSpeakerId={activeSpeakerId}
                isAISpeaking={isAISpeaking}
                selectedTargetInterviewerId={selectedTargetInterviewerId}
                onSelectTargetInterviewer={setSelectedTargetInterviewerId}
                lastTurnTakingReason={lastTurnTakingReason}
                lastInternalThought={lastInternalThought}
              />

              {/* Middle Grid: Transcript & Shared Context Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Transcript & Response Controls */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  <TranscriptView
                    transcript={transcript}
                    isProcessing={isProcessing}
                    activeInterviewerName={activePanel.find((i) => i.id === activeSpeakerId)?.name}
                    isFocusMode={isFocusMode}
                  />

                  {/* Voice & Response Controller */}
                  <VoiceController
                    isListening={isListening}
                    isAISpeaking={isAISpeaking}
                    isProcessing={isProcessing}
                    onToggleListening={handleToggleListening}
                    onInterrupt={handleInterrupt}
                    onSubmitText={handleCandidateResponse}
                    candidateVolume={candidateVolume}
                    currentInterimTranscript={currentInterimTranscript}
                    onSelectQuickPrompt={handleCandidateResponse}
                    silenceTimeoutMs={silenceTimeoutMs}
                    onChangeSilenceTimeout={(ms) => {
                      setSilenceTimeoutMs(ms);
                      setErrorToast(`Pause tolerance set to ${ms > 0 ? `${ms / 1000}s` : 'Manual Send Only'}`);
                      setTimeout(() => setErrorToast(null), 2500);
                    }}
                    isFloorHeld={isFloorHeld}
                    onToggleHoldFloor={() => {
                      setIsFloorHeld((prev) => !prev);
                      if (!isFloorHeld) {
                        if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
                        setErrorToast('⏸️ Floor Held — AI will wait until you click Send or release floor.');
                      } else {
                        setErrorToast('▶️ Auto-Send Resumed');
                      }
                      setTimeout(() => setErrorToast(null), 2500);
                    }}
                  />
                </div>

                {/* Live Panel Shared Memory & Competency Monitor */}
                <div className="lg:col-span-5 xl:col-span-4">
                  <LivePanelContext
                    context={sharedContext}
                    onEndInterview={handleEndInterview}
                    isProcessing={isProcessing || isGeneratingAssessment}
                    agoraMode={agoraMode}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => setIsFocusMode(false)}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Generating Assessment Loading Overlay */}
      {isGeneratingAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Calibrating Final Assessment...
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Analyzing timestamped transcript, verifying competencies, identifying contradictions, and extracting exact quote citations across the panel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Resume & Shared Question History Drawer */}
      <ResumeDrawer
        isOpen={isResumeDrawerOpen}
        onClose={() => setIsResumeDrawerOpen(false)}
        currentResume={candidateResume}
        onUpdateResume={handleUpdateResume}
        questionHistory={sharedContext.questionHistory}
      />

      {/* Final Assessment Modal */}
      {assessment && (
        <FinalAssessmentModal
          assessment={assessment}
          onClose={() => setAssessment(null)}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}


import React from 'react';
import {
  Interviewer,
  SharedCandidateContext,
  CandidateResume,
  UserSession,
} from '../types';
import { CandidateSidebar } from './candidate/CandidateSidebar';
import { RecruiterSidebar } from './recruiter/RecruiterSidebar';

export interface StudioSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  candidateResume: CandidateResume;
  activePanel: Interviewer[];
  selectedTargetInterviewerId: string | null;
  onSelectTargetInterviewer: (id: string | null) => void;
  sharedContext: SharedCandidateContext;
  onOpenResumeDrawer: () => void;
  onEndInterview: () => void;
  isProcessing: boolean;
  agoraMode: 'conversational-ai' | 'rtc-transport' | 'offline';
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  silenceTimeoutMs: number;
  onChangeSilenceTimeout: (ms: number) => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
  onOpenProgressionHub?: () => void;
  workspaceMode?: 'candidate' | 'recruiter';
  activeRecruiterTab?: 'analytics' | 'candidates' | 'requisitions';
  onSelectRecruiterTab?: (tab: 'analytics' | 'candidates' | 'requisitions') => void;
  candidateCount?: number;
  femalePct?: number;
  malePct?: number;
  femaleCount?: number;
  maleCount?: number;
  onOpenDemographicAudit?: () => void;
  onOpenParityShortlist?: () => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  isOpen,
  onToggle,
  candidateResume,
  activePanel,
  selectedTargetInterviewerId,
  onSelectTargetInterviewer,
  sharedContext,
  onOpenResumeDrawer,
  onEndInterview,
  isProcessing,
  agoraMode,
  isFocusMode,
  onToggleFocusMode,
  silenceTimeoutMs,
  onChangeSilenceTimeout,
  currentUser,
  onLogout,
  onOpenProgressionHub,
  workspaceMode,
  activeRecruiterTab = 'candidates',
  onSelectRecruiterTab,
  candidateCount = 24,
  femalePct = 67,
  malePct = 33,
  femaleCount = 16,
  maleCount = 8,
  onOpenDemographicAudit,
  onOpenParityShortlist,
}) => {
  const isRecruiter =
    workspaceMode === 'recruiter' ||
    currentUser?.role === 'recruiter' ||
    currentUser?.role === 'interviewer';

  if (isRecruiter) {
    return (
      <RecruiterSidebar
        isOpen={isOpen}
        onToggle={onToggle}
        currentUser={currentUser}
        onLogout={onLogout}
        activeTab={activeRecruiterTab}
        onSelectTab={(tab) => onSelectRecruiterTab?.(tab)}
        candidateCount={candidateCount}
        femalePct={femalePct}
        malePct={malePct}
        femaleCount={femaleCount}
        maleCount={maleCount}
        onOpenResumeDrawer={onOpenResumeDrawer}
        onOpenDemographicAudit={onOpenDemographicAudit}
        onOpenParityShortlist={onOpenParityShortlist}
      />
    );
  }

  return (
    <CandidateSidebar
      isOpen={isOpen}
      onToggle={onToggle}
      candidateResume={candidateResume}
      activePanel={activePanel}
      selectedTargetInterviewerId={selectedTargetInterviewerId}
      onSelectTargetInterviewer={onSelectTargetInterviewer}
      sharedContext={sharedContext}
      onOpenResumeDrawer={onOpenResumeDrawer}
      onEndInterview={onEndInterview}
      isProcessing={isProcessing}
      agoraMode={agoraMode}
      isFocusMode={isFocusMode}
      onToggleFocusMode={onToggleFocusMode}
      silenceTimeoutMs={silenceTimeoutMs}
      onChangeSilenceTimeout={onChangeSilenceTimeout}
      currentUser={currentUser}
      onLogout={onLogout}
      onOpenProgressionHub={onOpenProgressionHub}
    />
  );
};

export { CandidateSidebar } from './candidate/CandidateSidebar';
export { RecruiterSidebar } from './recruiter/RecruiterSidebar';

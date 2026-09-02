import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Briefcase,
  Users,
  HeartPulse,
  Brain,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

export const renderAvatarIcon = (iconName?: string, iconClassName = 'w-4 h-4 text-white') => {
  switch (iconName) {
    case 'Cpu':
      return <Cpu className={iconClassName} />;
    case 'Layers':
      return <Layers className={iconClassName} />;
    case 'Briefcase':
      return <Briefcase className={iconClassName} />;
    case 'Building2':
      return <Building2 className={iconClassName} />;
    case 'Brain':
      return <Brain className={iconClassName} />;
    case 'ShieldCheck':
      return <ShieldCheck className={iconClassName} />;
    case 'HeartPulse':
      return <HeartPulse className={iconClassName} />;
    case 'Users':
      return <Users className={iconClassName} />;
    default:
      return <Sparkles className={iconClassName} />;
  }
};

export const getAvatarGradientClass = (avatarColor?: string) => {
  if (!avatarColor) return 'bg-gradient-to-br from-indigo-600 to-purple-700';
  if (avatarColor.startsWith('from-')) {
    return `bg-gradient-to-br ${avatarColor}`;
  }
  return 'bg-gradient-to-br from-indigo-600 to-purple-700';
};

import { TalkingFaceAvatar } from '../components/TalkingFaceAvatar';

export interface InterviewerAvatarProps {
  avatarUrl?: string;
  avatarIcon?: string;
  avatarColor?: string;
  name: string;
  className?: string;
  imgClassName?: string;
  isSpeaking?: boolean;
  volume?: number;
}

export const InterviewerAvatar: React.FC<InterviewerAvatarProps> = (props) => {
  return <TalkingFaceAvatar {...props} />;
};



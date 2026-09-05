import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  Brain,
  CheckCircle2,
  Play,
  Volume2,
  FileText,
  Target,
  ArrowRight,
  MessageSquare,
  BarChart3,
  Layers,
  Cpu,
  HeartHandshake,
  Check,
  Flame,
  Radio,
  Clock,
  ChevronRight,
  Globe,
  Award,
  Lock,
  Star,
  Building2,
  GraduationCap,
  MessageCircle,
  Briefcase,
  Menu,
  X,
} from 'lucide-react';
import { FAQSection } from './FAQSection';
import { ALL_INTERVIEWERS } from '../data/interviewers';
import { INTERVIEW_SCENARIOS } from '../data/scenarios';
import { renderAvatarIcon, getAvatarGradientClass, InterviewerAvatar } from '../utils/avatarUtils';

interface LandingPageProps {
  onOpenStudio: () => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  userName?: string;
  onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenStudio,
  onOpenLogin,
  isLoggedIn,
  userName,
  onLogout,
}) => {
  // Mobile Nav Drawer Toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ROI Calculator State
  const [candidatesPerYear, setCandidatesPerYear] = useState<number>(250);
  const [engineerHourlyRate, setEngineerHourlyRate] = useState<number>(120);

  // User Feedback & Reviews State
  const [reviews, setReviews] = useState<Array<{
    id: string;
    name: string;
    role: string;
    company: string;
    rating: number;
    badge: string;
    quote: string;
    date: string;
  }>>([
    {
      id: 'rev-1',
      name: 'Priya Sharma',
      role: 'VP of Engineering',
      company: 'FinTech Scale-Up',
      rating: 5,
      badge: 'Verified Hiring Manager',
      quote: "The multi-role committee handoff is unlike anything I've seen in hiring software. Having Rohan Sharma probe our distributed cache architecture while Priya Mehta challenges business SLAs feels exactly like a real Staff Engineer bar raiser panel!",
      date: 'Aug 2026',
    },
    {
      id: 'rev-2',
      name: 'Arjun Mehta',
      role: 'Staff AI & Systems Architect',
      company: 'Tech Scale-Up',
      rating: 5,
      badge: 'Verified Candidate',
      quote: "The sub-100ms real-time barge-in and sub-second Groq inference made the voice conversation feel completely natural. When I interrupted Rohan to clarify my Redis TTL invalidation strategy, the panel smoothly acknowledged my point and adapted!",
      date: 'Aug 2026',
    },
    {
      id: 'rev-3',
      name: 'Sarah Jenkins',
      role: 'Head of Global Talent Acquisition',
      company: 'HealthTech Labs',
      rating: 5,
      badge: 'Enterprise Recruiter',
      quote: "Vocalis AI cut our engineering team's interviewing workload by 75%. The evidence-grounded scorecards with verbatim candidate quote citations eliminated subjective bias completely in our committee calibration meetings.",
      date: 'Aug 2026',
    },
  ]);

  // Feedback Form State
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackRole, setFeedbackRole] = useState<'candidate' | 'recruiter' | 'hiring_manager'>('candidate');
  const [feedbackCompany, setFeedbackCompany] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState(false);

  // Calculated ROI Metrics
  const hoursSavedPerYear = Math.round(candidatesPerYear * 4.5);
  const dollarsSavedPerYear = Math.round(hoursSavedPerYear * engineerHourlyRate);

  // Interactive Live Boardroom Preview State
  const [activeSimTurn, setActiveSimTurn] = useState<number>(0);
  const simTurns = [
    {
      speaker: ALL_INTERVIEWERS[0], // Rohan Sharma (Lead Architect)
      speech: "Candidate mentioned using Redis with PostgreSQL for peak load. What exact cache invalidation strategy do you enforce when patient records are updated concurrently?",
      thought: "Candidate demonstrated surface understanding. Deep probing required on cache consistency & stale read semantics.",
      reason: "Rohan Sharma (Lead Architect) probed technical architecture depth.",
      strategy: "Deep Probe",
    },
    {
      speaker: ALL_INTERVIEWERS[1], // Priya Mehta (Product Manager)
      speech: "Building on Rohan's point on cache invalidation: how does temporary stale data impact clinical workflow SLAs and user trust? What is your customer fallback?",
      thought: "Rohan established technical stack. Switching perspective to product SLA and user empathy impact.",
      reason: "Priya Mehta (VP Product) executed cross-role handoff to probe business impact.",
      strategy: "Cross-Role Handoff",
    },
    {
      speaker: ALL_INTERVIEWERS[2], // Vikram Malhotra (VP Engineering)
      speech: "Appreciate that breakdown. Vikram here—from an operational standpoint, how do you manage developer velocity and technical debt when maintaining that dual-cache layer?",
      thought: "Technical and product depth verified. Probing team execution and engineering pragmatism.",
      reason: "Vikram Malhotra (VP Engineering) probed team velocity & technical debt.",
      strategy: "Challenge Assumption",
    },
  ];

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white flex flex-col font-sans relative w-full">
      {/* Top Navigation Bar (Sleek Dark Header) */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Vocalis AI Logo"
              className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-md"
            />
            <span className="font-extrabold text-white text-lg tracking-tight">
              Vocalis AI
            </span>
          </div>

          {/* Clean Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#agora-engine" className="text-indigo-400 hover:text-white transition flex items-center gap-1.5 font-bold bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/60">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Agora AI Engine</span>
            </a>
            <a href="#dual-workflows" className="hover:text-white transition">
              Workflows
            </a>
            <a href="#live-demo" className="hover:text-white transition">
              Simulation
            </a>
            <a href="#features" className="hover:text-white transition">
              Capabilities
            </a>
            <a href="#roi-calculator" className="hover:text-white transition">
              ROI Calculator
            </a>
            <a href="#panel-personas" className="hover:text-white transition">
              AI Committee
            </a>
            <a href="#feedback" className="hover:text-white transition">
              Feedback
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <a href="#faqs" className="hover:text-white transition">
              FAQs
            </a>
          </nav>

          {/* Right Action Buttons & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Welcome, <strong className="text-white">{userName || 'User'}</strong>
                </span>
                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition cursor-pointer hidden sm:block"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Enter Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3 animate-fadeIn">
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold text-slate-300">
              <button type="button" onClick={() => scrollToSection('agora-engine')} className="text-left text-indigo-400 font-bold py-1 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Agora AI Engine</span>
              </button>
              <button type="button" onClick={() => scrollToSection('dual-workflows')} className="text-left hover:text-white py-1">
                Workflows
              </button>
              <button type="button" onClick={() => scrollToSection('live-demo')} className="text-left hover:text-white py-1">
                Simulation
              </button>
              <button type="button" onClick={() => scrollToSection('features')} className="text-left hover:text-white py-1">
                Capabilities
              </button>
              <button type="button" onClick={() => scrollToSection('roi-calculator')} className="text-left hover:text-white py-1">
                ROI Calculator
              </button>
              <button type="button" onClick={() => scrollToSection('panel-personas')} className="text-left hover:text-white py-1">
                AI Committee
              </button>
              <button type="button" onClick={() => scrollToSection('feedback')} className="text-left hover:text-white py-1">
                Feedback
              </button>
              <button type="button" onClick={() => scrollToSection('pricing')} className="text-left hover:text-white py-1">
                Pricing
              </button>
              <button type="button" onClick={() => scrollToSection('faqs')} className="text-left hover:text-white py-1">
                FAQs
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section (2-Column Split: Left Text, Right Product Logo Showcase) */}
      <section className="relative overflow-hidden pt-3 sm:pt-4 lg:pt-5 pb-10 sm:pb-12 lg:pb-14 bg-white border-b border-slate-200">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Side: Badge, Headline, Subtitle, Actions & Stats */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Sub-badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900 shadow-xs">
                <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>Agora Conversational AI SDK (v2.7.0) • SDRTN™ Cloud</span>
              </div>

              {/* Colorful Gradient Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-[42px] xl:text-[48px] font-extrabold tracking-tight leading-[1.18]">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Autonomous Multi-Role AI Voice Interviews
                </span>{' '}
                <span className="text-slate-800">for</span>{' '}
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Hiring Teams &amp; Candidates
                </span>
              </h1>

              {/* High Contrast Subtitle featuring Agora Conversational AI SDK */}
              <p className="text-sm sm:text-base lg:text-[17px] text-slate-700 leading-relaxed max-w-3xl font-normal">
                Built with the <strong className="font-semibold text-indigo-950">Agora Conversational AI SDK</strong>, <strong className="font-semibold text-indigo-950">sub-100ms real-time audio</strong>, and an <strong className="font-semibold text-indigo-950">autonomous 5-persona committee</strong>—Vocalis AI deliberates backstage in real time, negotiates adaptive turn-taking, probes deep technical depth, and outputs quote-indexed scorecards.
              </p>

              {/* Action Buttons for Both Roles (Compact on Mobile) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Launch Hiring Team Mode</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl border border-slate-300 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer hover:border-slate-400 transform hover:-translate-y-0.5"
                >
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Start Candidate Practice</span>
                </button>
              </div>

              {/* Compact Stat Badges on Mobile */}
              <div className="pt-2 sm:pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-center sm:text-left shadow-xs">
                  <p className="text-xs sm:text-xl font-black text-indigo-600 font-mono">&lt; 100ms</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-semibold leading-tight">Audio Latency</p>
                </div>
                <div className="p-2 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-center sm:text-left shadow-xs">
                  <p className="text-xs sm:text-xl font-black text-purple-600 font-mono">~80% Saved</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-semibold leading-tight">Sprint Hours</p>
                </div>
                <div className="p-2 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-center sm:text-left shadow-xs">
                  <p className="text-xs sm:text-xl font-black text-emerald-600 font-mono">Quotes</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-semibold leading-tight">Evidence Grounded</p>
                </div>
                <div className="p-2 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-center sm:text-left shadow-xs">
                  <p className="text-xs sm:text-xl font-black text-amber-600 font-mono">Dynamic</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-semibold leading-tight">AI-Suggested Panel</p>
                </div>
              </div>
            </div>

            {/* Right Side: Product Logo Showcase Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end items-center">
              <div className="relative group w-full max-w-sm sm:max-w-md">
                {/* Dynamic Ambient Background Glow */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500"></div>

                {/* Main Logo Container Card */}
                <div className="relative bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
                  {/* Subtle Tech Pattern Background Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none"></div>

                  {/* Product Logo Frame */}
                  <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-2xl transition transform group-hover:scale-[1.02] duration-300 bg-slate-950 flex items-center justify-center">
                    <img
                      src="/logo.jpg"
                      alt="Vocalis AI Product Logo"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  {/* High Contrast Logo Tagline */}
                  <div className="mt-5 relative z-10 text-center space-y-1">
                    <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                      Agora Conversational AI
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Sub-100ms SDRTN Audio • Autonomous Committee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGORA CONVERSATIONAL AI ENGINE SHOWCASE SECTION */}
      <section id="agora-engine" className="py-12 border-b border-indigo-100 bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 relative overflow-hidden">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <div className="space-y-8">
            {/* Section Header */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-300 text-xs font-bold text-indigo-900 shadow-xs">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>OFFICIAL AGORA CONVERSATIONAL AI AGENT SDK (v2.7.0)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Agora Conversational AI SDK, Sub-100ms Real-Time Audio &amp; Autonomous 5-Persona Committee
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-slate-700 leading-relaxed">
                Vocalis AI orchestrates Agora's real-time media network to conduct high-stakes interviews with sub-100ms barge-in interruption, zero latency collisions, and multi-agent deliberation.
              </p>
            </div>

            {/* 3 Core Architecture Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1: Agora Conversational AI SDK */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-indigo-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
                    <Radio className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Cloud Engine Integration</span>
                  <h3 className="text-lg font-extrabold text-slate-900">Agora Conversational AI SDK</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Deploys autonomous voice agents directly onto the <strong>Agora Software-Defined Real-Time Network (SDRTN™)</strong> using official <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-700">agora-agents</code> v2.7.0. Dynamic token management guarantees enterprise-grade audio encryption and session isolation.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>SDRTN™ Ultra-Low Latency Media Mesh</span>
                </div>
              </div>

              {/* Feature 2: Sub-100ms Real-Time Audio & Barge-In */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-indigo-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-200">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Zero Collision Turn-Taking</span>
                  <h3 className="text-lg font-extrabold text-slate-900">Sub-100ms Real-Time Audio</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    True conversational flow requires natural interruption. With sub-100ms Voice Activity Detection (VAD), candidate barge-ins instantly mute active AI speech. No awkward robotic talking-over or laggy websocket queues.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Audio Track Muting &amp; Floor Transfer</span>
                </div>
              </div>

              {/* Feature 3: Autonomous 5-Persona Committee */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-indigo-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-200">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">Multi-Agent Deliberation</span>
                  <h3 className="text-lg font-extrabold text-slate-900">Autonomous 5-Persona Committee</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Instead of a flat single-prompt bot, 5 specialized personas—Lead Systems Architect, Principal PM, VP of Engineering, Enterprise Client Director, and Org Psychologist—deliberate backstage to challenge answers from every dimension.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-purple-700">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Cross-Functional Technical &amp; Cultural Calibration</span>
                </div>
              </div>
            </div>

            {/* Cloud Audio Pipeline Strip */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">End-to-End Agora Cloud Real-Time Pipeline</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Sub-100ms Turn Latency
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Input</p>
                  <p className="text-xs font-bold text-white mt-0.5">Candidate Mic (Opus)</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <p className="text-[10px] text-indigo-400 uppercase font-mono font-bold">Transport</p>
                  <p className="text-xs font-bold text-white mt-0.5">Agora SDRTN™ Cloud</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <p className="text-[10px] text-emerald-400 uppercase font-mono font-bold">ASR (STT)</p>
                  <p className="text-xs font-bold text-white mt-0.5">Deepgram Nova-3</p>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <p className="text-[10px] text-purple-400 uppercase font-mono font-bold">Inference</p>
                  <p className="text-xs font-bold text-white mt-0.5">Groq Qwen 3.8 / Compound</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                  <p className="text-[10px] text-pink-400 uppercase font-mono font-bold">Cloud Voice</p>
                  <p className="text-xs font-bold text-white mt-0.5">MiniMax / ElevenLabs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL WORKFLOWS SECTION (Wide Layout & High Contrast Text) */}
      <section id="dual-workflows" className="py-12 border-b border-slate-200 bg-slate-50">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Enterprise Product Workflows
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Engineered for Both Sides of the Hiring Bar
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto">
                Dedicated tools for recruiters scaling screens and candidates preparing for technical bar-raisers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Workflow 1: FOR HIRING TEAMS & RECRUITERS */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Enterprise Mode</span>
                      <h3 className="text-lg font-extrabold text-slate-900">For Hiring Teams & Recruiters</h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Automate initial technical screens without wasting senior engineering sprint hours. Get objective evidence scorecards with transcript quotes.
                  </p>

                  <ul className="space-y-2 text-xs sm:text-sm text-slate-800 pt-2 border-t border-slate-100">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>AI-Suggested Committee Panels</strong>: Upload candidate resumes to configure tailored 3 to 5-member specialist panels.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Quote-Backed Scorecards</strong>: Receive objective evaluations linked to exact timestamped transcript quotes.</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Launch Recruiter Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Workflow 2: FOR CANDIDATES & JOB SEEKERS */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Practice Mode</span>
                      <h3 className="text-lg font-extrabold text-slate-900">For Candidates & Engineers</h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Practice against specialized Staff Architect, Product Manager, and SRE personas in a realistic voice environment with zero pressure.
                  </p>

                  <ul className="space-y-2 text-xs sm:text-sm text-slate-800 pt-2 border-t border-slate-100">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span><strong>Realistic Voice Barge-In</strong>: Practice natural interruption and clarification using Agora low-latency WebRTC audio.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span><strong>Resume Project Probing</strong>: AI personas analyze your specific past architecture trade-offs and project choices.</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Start Candidate Voice Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Boardroom Preview Simulation Section */}
      <section id="live-demo" className="py-12 border-b border-slate-200 bg-white">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Boardroom Simulation
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                How the AI Committee Deliberates & Probes
              </h2>
              <p className="text-xs sm:text-sm text-slate-700">
                Click through the turns below to see live backstage deliberations and turn-taking handoffs.
              </p>
            </div>

            {/* Interactive Simulation Display Box */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-xs">
              {/* Speaker Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {simTurns.map((turn, idx) => {
                  const isActive = activeSimTurn === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSimTurn(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <InterviewerAvatar
                        avatarIcon={turn.speaker.avatarIcon}
                        avatarColor={turn.speaker.avatarColor}
                        name={turn.speaker.name}
                        className="w-5 h-5 rounded-md"
                      />
                      <span>{turn.speaker.name} ({turn.speaker.role})</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Speaker Dialogue Card */}
              {(() => {
                const current = simTurns[activeSimTurn];
                return (
                  <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <InterviewerAvatar
                          avatarIcon={current.speaker.avatarIcon}
                          avatarColor={current.speaker.avatarColor}
                          name={current.speaker.name}
                          className="w-10 h-10 rounded-xl border border-slate-200 shadow-xs"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>{current.speaker.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono font-bold">
                              {current.speaker.title}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-600">{current.speaker.company}</p>
                        </div>
                      </div>

                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold self-start sm:self-auto">
                        Strategy: {current.strategy}
                      </span>
                    </div>

                    {/* Backstage Internal Thought */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                        Backstage Thought
                      </span>
                      <p className="text-slate-800 italic text-[11px]">{current.thought}</p>
                    </div>

                    {/* Spoken Speech */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                        Spoken Persona Speech
                      </span>
                      <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                        "{current.speech}"
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Features & Capabilities Grid (Wide Layout) */}
      <section id="features" className="py-12 border-b border-slate-200 bg-slate-50">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Platform Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Engineered for High-Stakes Technical Hiring
              </h2>
              <p className="text-xs sm:text-sm text-slate-700">
                Everything required to conduct objective, quote-backed AI technical evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Role Committee Handoff</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Multiple AI personas negotiate turns mid-sentence based on their specific domain lens.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
                  <Brain className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Shared Candidate Memory</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Centralized context indexes candidate resume metrics, past answers, and unresolved probes.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Quote-Backed Scorecards</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Generates scorecards with verbatim candidate transcript quotes and objective evaluations.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Real-Time Barge-In VAD</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Built on Agora VAD so candidates can interrupt or clarify statements naturally.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Groq Sub-100ms Inference</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Leverages Groq Llama 3.3 70B with automatic multi-model and multi-key fallback resilience.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Agora SD-RTN™ Network</h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Intelligent edge routing with 99.99% uptime for international candidates worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi-calculator" className="py-12 border-b border-slate-200 bg-white">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Financial ROI Calculator
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Calculate Engineering Hours & Cost Saved
              </h2>
              <p className="text-xs sm:text-sm text-slate-700">
                Adjust candidate volume and engineering hourly rate to see your annual savings.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-800">Candidates Interviewed / Year</span>
                    <span className="text-indigo-600 font-mono text-sm">{candidatesPerYear} Candidates</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="1000"
                    step="25"
                    value={candidatesPerYear}
                    onChange={(e) => setCandidatesPerYear(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-800">Senior Engineer Hourly Cost</span>
                    <span className="text-emerald-600 font-mono text-sm">${engineerHourlyRate}/hr</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="250"
                    step="10"
                    value={engineerHourlyRate}
                    onChange={(e) => setEngineerHourlyRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-600 font-semibold">Engineering Hours Reclaimed</span>
                  <p className="text-2xl font-black text-indigo-600 font-mono">
                    {hoursSavedPerYear.toLocaleString()} Hours/Yr
                  </p>
                  <p className="text-[11px] text-slate-600">Reclaimed for Staff engineers to build features.</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-600 font-semibold">Annual Financial ROI</span>
                  <p className="text-2xl font-black text-emerald-600 font-mono">
                    ${dollarsSavedPerYear.toLocaleString()} / Year
                  </p>
                  <p className="text-[11px] text-slate-600">Direct savings in senior engineering opportunity cost.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Interviewer Roster Showcase (Wide Grid Layout) */}
      <section id="panel-personas" className="py-12 border-b border-slate-200 bg-slate-50">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Specialized AI Committee
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Meet Your AI Interview Panel
              </h2>
              <p className="text-xs sm:text-sm text-slate-700">
                Each persona brings distinct domain expertise and questioning strategies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ALL_INTERVIEWERS.map((interviewer) => (
                <div
                  key={interviewer.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <InterviewerAvatar
                      avatarIcon={interviewer.avatarIcon}
                      avatarColor={interviewer.avatarColor}
                      name={interviewer.name}
                      className="w-11 h-11 rounded-xl border border-slate-200 shadow-md"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{interviewer.name}</h3>
                      <p className="text-xs text-indigo-600 font-semibold">{interviewer.title}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                    {interviewer.defaultBio}
                  </p>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Focus Area</span>
                    <p className="text-xs text-slate-900 font-semibold">{interviewer.focusArea}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 border-b border-slate-200 bg-white">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Transparent Pricing
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Simple Plans for Teams & Candidates
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Starter Plan */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900">Free Practice Tier</h3>
                  <p className="text-xs text-slate-600">For candidate self-prep & evaluation.</p>
                  <p className="text-3xl font-black text-slate-900 font-mono">$0 <span className="text-xs text-slate-600 font-normal">/ month</span></p>

                  <ul className="space-y-2 text-xs text-slate-800 pt-3 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>3 Interview Scenarios</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>3 Active Personas</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
                >
                  Start Free Studio Demo
                </button>
              </div>

              {/* Growth Scale Plan */}
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-600 space-y-4 flex flex-col justify-between shadow-md relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Popular
                </span>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900">Pro Committee</h3>
                  <p className="text-xs text-slate-600">For growing engineering teams.</p>
                  <p className="text-3xl font-black text-indigo-600 font-mono">$199 <span className="text-xs text-slate-600 font-normal">/ month</span></p>

                  <ul className="space-y-2 text-xs text-slate-800 pt-3 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Unlimited Scenarios</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>All 5 AI Personas</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs"
                >
                  Get Started
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900">Enterprise Committee</h3>
                  <p className="text-xs text-slate-600">For high-volume hiring.</p>
                  <p className="text-3xl font-black text-slate-900 font-mono">Custom</p>

                  <ul className="space-y-2 text-xs text-slate-800 pt-3 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Dedicated Agora AI Agent</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>ATS Integration</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews & Interactive Feedback Section */}
      <section id="feedback" className="py-12 border-b border-slate-200 bg-slate-50">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Product Feedback & Reviews
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Share Your Feedback & Read Reviews
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
              {/* Left Column: Testimonial Cards */}
              <div className="lg:col-span-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-900">Recent Customer Testimonials</h3>
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-500" />
                          ))}
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                          {rev.badge}
                        </span>
                      </div>
                      <p className="text-slate-800 italic text-[11px]">"{rev.quote}"</p>
                      <p className="text-[10px] text-slate-600 font-bold">{rev.name} • {rev.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Feedback Submission Form */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900">Submit Product Review</h3>
                {feedbackSuccessToast && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    ✓ Feedback submitted & added to reviews!
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!feedbackName.trim() || !feedbackText.trim()) return;

                    const roleLabel =
                      feedbackRole === 'candidate'
                        ? 'Candidate'
                        : feedbackRole === 'recruiter'
                        ? 'Technical Recruiter'
                        : 'Hiring Manager';

                    const newRev = {
                      id: `rev-${Date.now()}`,
                      name: feedbackName.trim(),
                      role: roleLabel,
                      company: feedbackCompany.trim() || 'Verified Product User',
                      rating: feedbackRating,
                      badge: `Verified ${roleLabel}`,
                      quote: feedbackText.trim(),
                      date: 'Just now',
                    };

                    setReviews([newRev, ...reviews]);
                    setFeedbackName('');
                    setFeedbackCompany('');
                    setFeedbackText('');
                    setFeedbackSuccessToast(true);
                    setTimeout(() => setFeedbackSuccessToast(false), 4000);
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={feedbackName}
                      onChange={(e) => setFeedbackName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-600 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800">Your Review *</label>
                    <textarea
                      required
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your experience with Vocalis AI..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!feedbackName.trim() || !feedbackText.trim()}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-12 border-b border-slate-200 bg-white">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Got Questions?
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
            <FAQSection />
          </div>
        </div>
      </section>

      {/* Floating Feedback Quick-Trigger Button */}
      <button
        type="button"
        onClick={() => scrollToSection('feedback')}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-3 rounded-full shadow-xl flex items-center gap-2 transition transform hover:scale-105 cursor-pointer"
        title="Submit Platform Feedback"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Product Feedback</span>
      </button>

      {/* Footer */}
      <footer className="py-6 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Vocalis AI</span>
            <span>— Autonomous Multi-Role AI Committee Platform</span>
          </div>

          <div className="flex items-center gap-5">

            <a href="#dual-workflows" className="hover:text-white transition">
              Workflows
            </a>
            <button type="button" onClick={onOpenStudio} className="text-indigo-400 hover:text-indigo-300 font-bold">
              Launch Studio →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

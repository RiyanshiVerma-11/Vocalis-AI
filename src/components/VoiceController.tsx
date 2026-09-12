import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Hand, Sparkles, Volume2, AudioLines, Pause, Play, Clock, X, BrainCircuit, ShieldCheck, MessageSquareQuote } from 'lucide-react';
import { agoraVoiceEngine } from '../services/agoraVoiceEngine';

interface VoiceControllerProps {
  isListening: boolean;
  isAISpeaking: boolean;
  isProcessing: boolean;
  onToggleListening: () => void;
  onInterrupt: () => void;
  onSubmitText: (text: string) => void;
  candidateVolume: number;
  currentInterimTranscript: string;
  onSelectQuickPrompt: (promptText: string) => void;
  silenceTimeoutMs?: number;
  onChangeSilenceTimeout?: (ms: number) => void;
  isFloorHeld?: boolean;
  onToggleHoldFloor?: () => void;
  thoughtGraceActive?: boolean;
  thoughtGraceReason?: string;
  backchannelDetectedPhrase?: string | null;
  onClearTranscript?: () => void;
  candidateName?: string;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  isListening,
  isAISpeaking,
  isProcessing,
  onToggleListening,
  onInterrupt,
  onSubmitText,
  candidateVolume,
  currentInterimTranscript,
  onSelectQuickPrompt,
  silenceTimeoutMs = 4000,
  onChangeSilenceTimeout,
  isFloorHeld = false,
  onToggleHoldFloor,
  thoughtGraceActive = false,
  thoughtGraceReason = '',
  backchannelDetectedPhrase = null,
  onClearTranscript,
  candidateName = 'Candidate',
}) => {
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);

  // Sync current speech recognition text into input box if candidate is speaking
  useEffect(() => {
    // Only overwrite if user is not actively typing manually
    if (currentInterimTranscript && !isTyping) {
      setTextInput(currentInterimTranscript);
    } else if (!currentInterimTranscript && !isTyping) {
      setTextInput('');
    }
  }, [currentInterimTranscript, isTyping]);

  const handleClear = () => {
    setTextInput('');
    setIsTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (onClearTranscript) {
      onClearTranscript();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextInput(val);
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2500);

    // If candidate backspaced/cleared everything manually, also notify engine to cancel auto-send!
    if (!val.trim() && onClearTranscript) {
      onClearTranscript();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    setIsTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onSubmitText(textInput.trim());
    setTextInput('');
    if (onClearTranscript) {
      onClearTranscript();
    }
  };

  const quickPrompts = [
    {
      label: '⚡ Classic Technical vs Product Scenario',
      text: "I'll implement a Redis distributed cache with a 10-minute TTL in front of PostgreSQL to absorb the 50,000 req/sec peak read traffic and ensure sub-50ms latency.",
      desc: 'Tests Technical acceptance vs Product/Customer pushback on cache invalidation & downtime.',
    },
    {
      label: '🛡️ Resilient Failover & Client SLA',
      text: 'To handle database failovers with zero data loss, we can use multi-AZ synchronous replication with automatic DNS health check routing and graceful client retry backoff.',
      desc: 'Probes architecture resilience and customer SLA guarantees.',
    },
    {
      label: '👥 STAR Leadership & Conflict Resolution',
      text: 'When our product manager and lead engineer were deadlocked over a 3-month refactor versus shipping new enterprise invoicing, I organized a risk-matrix workshop and negotiated an incremental migration.',
      desc: 'Tests behavioural STAR leadership and cross-functional empathy.',
    },
  ];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSpeaking = isListening && candidateVolume > 12;

  // Live 60fps Canvas Audio Waveform (Real FFT Frequencies + Organic Harmonic Motion)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const numBars = 36;
    const currentHeights = new Float32Array(numBars).fill(6);
    let phase = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width || 320;
      const displayHeight = rect.height || 56;

      if (canvas.width !== Math.round(displayWidth * dpr) || canvas.height !== Math.round(displayHeight * dpr)) {
        canvas.width = Math.round(displayWidth * dpr);
        canvas.height = Math.round(displayHeight * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      phase += 0.06;
      const freqData = agoraVoiceEngine.getMicFrequencyData();
      const rawVol = candidateVolume;
      const isVoiceActive = isListening && (rawVol > 12 || (freqData ? freqData.some((v) => v > 20) : false));

      const totalGap = 3;
      const availableWidth = displayWidth - 16;
      const barWidth = Math.max(2, (availableWidth - (numBars - 1) * totalGap) / numBars);
      const startX = 8;
      const centerY = displayHeight / 2;

      for (let i = 0; i < numBars; i++) {
        let targetHeight = 6;

        if (isVoiceActive) {
          if (freqData && freqData.length > 0) {
            // Mirror frequency spectrum from center outwards (Voice Assistant aesthetic)
            const distFromCenter = Math.abs(i - (numBars / 2 - 0.5)) / (numBars / 2);
            const binIdx = Math.min(
              freqData.length - 1,
              Math.max(0, Math.floor((1 - distFromCenter * 0.8) * (freqData.length - 1)))
            );
            const freqVal = freqData[binIdx] / 255;
            const dynamicBounce = Math.sin(phase * 4 + i * 0.45) * 0.12;
            const volumeBoost = (rawVol / 100) * 0.4;
            const combined = Math.min(1, freqVal * 0.85 + volumeBoost + dynamicBounce);
            targetHeight = Math.max(8, combined * (displayHeight * 0.92));
          } else {
            // Dynamic synthetic harmonic waveform reacting to volume
            const bell = Math.sin((i / (numBars - 1)) * Math.PI);
            const ripple = Math.sin(phase * 4 + i * 0.4) * 0.3 + Math.cos(phase * 2.5 + i * 0.7) * 0.2;
            const normVol = Math.min(1, rawVol / 60);
            targetHeight = Math.max(8, Math.min(displayHeight * 0.9, normVol * (0.3 + 0.7 * bell + ripple) * displayHeight));
          }
        } else if (isListening) {
          // Ambient breathing wave
          const ambientWave = Math.sin(phase * 2 + i * 0.35) * 0.5 + 0.5;
          targetHeight = 6 + ambientWave * 8;
        } else {
          // Mic muted: resting flatline
          targetHeight = 4;
        }

        // Smooth physics (fast attack, natural decay)
        if (targetHeight > currentHeights[i]) {
          currentHeights[i] += (targetHeight - currentHeights[i]) * 0.45;
        } else {
          currentHeights[i] += (targetHeight - currentHeights[i]) * 0.18;
        }

        const h = Math.max(4, currentHeights[i]);
        const x = startX + i * (barWidth + totalGap);
        const y = centerY - h / 2;
        const radius = Math.min(barWidth / 2, 3);

        // Styling: glowing gradient when voice is active
        if (isVoiceActive) {
          const grad = ctx.createLinearGradient(0, y, 0, y + h);
          grad.addColorStop(0, '#38bdf8');   // Cyan top
          grad.addColorStop(0.5, '#34d399'); // Emerald middle
          grad.addColorStop(1, '#059669');   // Teal base
          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(52, 211, 153, 0.6)';
          ctx.shadowBlur = 6;
        } else if (isListening) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, y, barWidth, h, radius);
        } else {
          ctx.rect(x, y, barWidth, h);
        }
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isListening, candidateVolume]);

  return (
    <div id="voice-controller-panel" className="bg-[#0b101b] rounded-xl border border-slate-800/90 p-2 sm:p-2.5 shadow-xl flex flex-col justify-between h-full min-h-0 space-y-1.5">
      {/* Center Panel Header: Candidate Audio Feed & Live Status */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-[10px] font-extrabold text-slate-200 uppercase tracking-widest">
            Candidate Audio Feed
          </h2>
          <span className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">
            {candidateName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[8px] font-mono font-bold px-2 py-0.2 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
            isListening
              ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
              : 'text-slate-400 bg-slate-800/60 border-slate-700/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            {isListening ? 'Active Mic [Live]' : 'Mic Muted'}
          </span>
        </div>
      </div>

      {/* Prominent Live Sound Wave Equalizer Visualization (Hardware Accelerated Canvas) */}
      <div className="relative flex-1 min-h-[60px] max-h-[105px] bg-gradient-to-b from-slate-950/80 via-[#070b14] to-emerald-950/20 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center p-2 overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          className="w-full h-12 sm:h-14 block pointer-events-none"
        />

        {/* Live Speaking Status label */}
        <div className="flex items-center justify-between w-full px-2 pt-1">
          <span className="text-[9px] font-bold text-emerald-400 font-mono tracking-wider truncate">
            {isSpeaking
              ? `🎤 ${candidateName.toUpperCase()} - SPEAKING`
              : isListening
              ? `🎤 LISTENING • READY FOR SPEECH`
              : `🔇 MIC MUTED • CLICK ENABLE MIC`}
          </span>

          <span className="text-[9px] font-mono text-slate-400">
            Level: {isListening ? `${Math.round(Math.min(100, candidateVolume))}%` : '0%'}
          </span>
        </div>
      </div>

      {/* Held Floor Status Banner */}
      {isFloorHeld && (
        <div className="bg-purple-950/60 border border-purple-600/40 text-purple-200 text-[10px] px-2.5 py-1 rounded-lg flex items-center justify-between animate-fadeIn shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span><strong>Floor Held:</strong> Take all time to think. AI is waiting for your <strong>Send</strong>.</span>
          </div>
          <button
            type="button"
            onClick={onToggleHoldFloor}
            className="text-purple-300 underline font-bold hover:text-white text-[10px] cursor-pointer"
          >
            Release
          </button>
        </div>
      )}

      {/* Thought Grace Banner */}
      {thoughtGraceActive && !isFloorHeld && (
        <div className="bg-teal-950/60 border border-teal-600/40 text-teal-200 text-[10px] px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 animate-pulse shrink-0">
          <BrainCircuit className="w-3 h-3 text-teal-400 shrink-0" />
          <span className="font-semibold text-teal-300">Smart Thought Grace (+2.5s):</span>
          <span className="truncate">{thoughtGraceReason || 'Formulating points...'}</span>
        </div>
      )}

      {/* Docked Meeting Control Row */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Main Mic Button */}
          <button
            id="btn-toggle-mic"
            type="button"
            onClick={onToggleListening}
            className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all duration-200 cursor-pointer shadow-xs ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-500/40 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isListening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            <span>{isListening ? 'Mic Active' : 'Enable Mic'}</span>
          </button>

          {/* Interrupt Button */}
          <button
            id="btn-interrupt-ai"
            type="button"
            onClick={onInterrupt}
            className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer border ${
              isAISpeaking || isProcessing
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 animate-pulse shadow-xs font-black'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
            }`}
            title="Interrupt interviewer immediately"
          >
            <Hand className="w-3 h-3" />
            <span>Interrupt</span>
          </button>

          {/* Hold Floor Button */}
          {onToggleHoldFloor && (
            <button
              id="btn-hold-floor"
              type="button"
              onClick={onToggleHoldFloor}
              className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer border ${
                isFloorHeld
                  ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 ring-2 ring-purple-500/40 shadow-xs'
                  : 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-800/50'
              }`}
              title="Hold floor to formulate answer without timeout"
            >
              {isFloorHeld ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5" />}
              <span>{isFloorHeld ? 'Resume' : 'Hold Floor'}</span>
            </button>
          )}
        </div>

        {/* Silence Tolerance Selector */}
        {onChangeSilenceTimeout && (
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            <select
              id="select-pause-tolerance"
              value={silenceTimeoutMs}
              onChange={(e) => onChangeSilenceTimeout(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-300 outline-none cursor-pointer text-[10px]"
              title="Auto-send timeout"
            >
              <option value={-1} className="bg-slate-900">🛑 Manual Send</option>
              <option value={4000} className="bg-slate-900">⏱️ 4s Pause</option>
              <option value={6000} className="bg-slate-900">🧘 6s Generous</option>
              <option value={8000} className="bg-slate-900">☕ 8s Relaxed</option>
            </select>
          </div>
        )}
      </div>

      {/* Text Input Form (Dual Voice + Text Entry) */}
      <form onSubmit={handleSubmit} className="relative shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-xl border border-slate-700/80 p-1 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all">
          <input
            id="candidate-response-input"
            type="text"
            value={textInput}
            onChange={handleInputChange}
            placeholder={
              isFloorHeld
                ? 'Floor held — speak or type your answer...'
                : isListening
                ? 'Listening to speech (or type answer here)...'
                : 'Type response or click "Enable Mic"...'
            }
            disabled={isProcessing}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs px-2 py-1 outline-none"
          />

          {textInput.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Clear text"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            id="btn-submit-response"
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              textInput.trim() && !isProcessing
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{isProcessing ? 'Deliberating...' : 'Send'}</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Quick Test Prompt Shortcuts */}
      <div className="pt-1 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 shrink-0">
        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
          <span>Quick Scenarios:</span>
        </span>

        <div className="flex flex-wrap items-center gap-1">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTextInput(p.text);
                onSelectQuickPrompt(p.text);
              }}
              title={p.desc}
              className="text-[9px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-1.5 py-0.5 rounded border border-slate-800 transition cursor-pointer font-medium"
            >
              {p.label.split(' ')[0]} {p.label.split(' ').slice(1, 3).join(' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


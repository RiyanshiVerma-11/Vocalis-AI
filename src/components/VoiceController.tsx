import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Hand, Sparkles, Volume2, AudioLines, Pause, Play, Clock, X, BrainCircuit, ShieldCheck, MessageSquareQuote } from 'lucide-react';

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
}) => {
  const [textInput, setTextInput] = useState('');

  // Sync current speech recognition text into input box if candidate is speaking
  useEffect(() => {
    if (currentInterimTranscript) {
      setTextInput(currentInterimTranscript);
    }
  }, [currentInterimTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    onSubmitText(textInput.trim());
    setTextInput('');
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

  return (
    <div id="voice-controller-panel" className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-2.5 shadow-sm space-y-2">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {/* Main Mic Button */}
          <button
            id="btn-toggle-mic"
            type="button"
            onClick={onToggleListening}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer shadow-xs ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-red-100 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Mic Active' : 'Enable Mic'}</span>
          </button>

          {/* Interrupt Button (Always active & prominent when AI is speaking/deliberating) */}
          <button
            id="btn-interrupt-ai"
            type="button"
            onClick={onInterrupt}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 min-h-[32px] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              isAISpeaking || isProcessing
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-200 animate-pulse shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
            title="Interrupt the active interviewer immediately and take the floor"
          >
            <Hand className="w-3.5 h-3.5 text-amber-950" />
            <span>Interrupt</span>
          </button>

          {/* Hold Floor Button (Prevents accidental AI cut-offs while candidate thinks) */}
          {onToggleHoldFloor && (
            <button
              id="btn-hold-floor"
              type="button"
              onClick={onToggleHoldFloor}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-2.5 py-1.5 min-h-[32px] rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer border ${
                isFloorHeld
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 ring-2 ring-purple-100 shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
              }`}
              title="Hold the floor so you can pause and think deeply without VAD cutting you off"
            >
              {isFloorHeld ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
              <span>{isFloorHeld ? 'Resume Auto-Send' : '⏸️ Hold Floor'}</span>
            </button>
          )}
        </div>

        {/* Silence Delay & Audio Visualizer */}
        <div className="flex items-center gap-2">
          {/* Silence Tolerance Selector */}
          {onChangeSilenceTimeout && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-[11px]">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="font-medium text-slate-600 hidden sm:inline">Pause:</span>
              <select
                id="select-pause-tolerance"
                value={silenceTimeoutMs}
                onChange={(e) => onChangeSilenceTimeout(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer text-[11px]"
                title="Choose when your speech auto-submits. Select Manual Send Only to never get cut off."
              >
                <option value={-1}>🛑 Manual Send Only (No Cutoff)</option>
                <option value={4000}>⏱️ 4s Silence (Default)</option>
                <option value={6000}>🧘 6s Generous</option>
                <option value={8000}>☕ 8s Relaxed</option>
                <option value={10000}>🐢 10s Very Patient</option>
              </select>
            </div>
          )}

          {/* Live Audio Visualizer Bars */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <AudioLines className={`w-3.5 h-3.5 ${isListening ? 'text-red-500' : 'text-slate-400'}`} />
            <div className="flex items-end gap-1 h-4 w-16">
              {[20, 50, 90, 60, 30, 80].map((h, i) => {
                const activeHeight = isListening ? Math.max(15, (candidateVolume * (h / 100))) : 8;
                return (
                  <div
                    key={i}
                    style={{ height: `${activeHeight}%` }}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      isListening ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-medium">
              {isListening ? `${candidateVolume}%` : 'Muted'}
            </span>
          </div>
        </div>
      </div>

      {/* Held Floor Status Banner */}
      {isFloorHeld && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
            </span>
            <span><strong>Floor Held:</strong> Take all the time you need to think. The AI panel will wait until you click <strong>Send</strong> or un-pause.</span>
          </div>
          <button
            type="button"
            onClick={onToggleHoldFloor}
            className="text-purple-700 underline font-bold hover:text-purple-900 text-xs cursor-pointer"
          >
            Release Floor
          </button>
        </div>
      )}

      {/* Semantic Thought Grace Window Active Banner */}
      {thoughtGraceActive && !isFloorHeld && (
        <div className="bg-teal-50 border border-teal-200 text-teal-900 text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-2 animate-pulse">
          <BrainCircuit className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="font-semibold">🧠 Smart Thought Grace Active (+2.5s):</span>
          <span className="text-teal-700 truncate">{thoughtGraceReason || 'Holding floor while you formulate architectural points...'}</span>
        </div>
      )}

      {/* Backchannel Acknowledgment Pill */}
      {backchannelDetectedPhrase && isAISpeaking && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] px-3 py-1 rounded-xl flex items-center gap-1.5 animate-fadeIn">
          <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Candidate active listening acknowledged: <em>"{backchannelDetectedPhrase}"</em> (Interviewer continuing smoothly)</span>
        </div>
      )}

      {/* Text Input Form (Dual Voice + Text Entry) */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl border border-slate-200 p-1 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            id="candidate-response-input"
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              isFloorHeld
                ? 'Floor held — speak or type your complete thoughts...'
                : isListening
                ? 'Listening to your speech in real-time (or type response)...'
                : 'Type your answer or click "Enable Mic" to speak...'
            }
            disabled={isProcessing}
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-xs px-2.5 py-1.5 outline-none"
          />

          {textInput.trim() && (
            <button
              type="button"
              onClick={() => setTextInput('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              title="Clear input text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="btn-submit-response"
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              textInput.trim() && !isProcessing
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{isProcessing ? 'Deliberating...' : 'Send Answer'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Quick Test Prompt Shortcuts */}
      <div className="pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span className="font-bold text-slate-700">Quick Test Scenarios:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTextInput(p.text);
                onSelectQuickPrompt(p.text);
              }}
              title={p.desc}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-2 py-0.5 rounded-md border border-slate-200 transition cursor-pointer font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


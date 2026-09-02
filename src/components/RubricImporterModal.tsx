import React, { useState, useRef } from 'react';
import { CustomCompanyRubric, PanelStrictness } from '../types';
import {
  ENTERPRISE_RUBRIC_TEMPLATES,
  extractTextFromFile,
  parseRubricDocumentAsync,
  parseRubricOffline,
} from '../utils/rubricParser';
import {
  FileText,
  Upload,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Play,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Trash2,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface RubricImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRubric: (rubric: CustomCompanyRubric, launchImmediately?: boolean) => void;
  initialRubric?: CustomCompanyRubric | null;
}

export const RubricImporterModal: React.FC<RubricImporterModalProps> = ({
  isOpen,
  onClose,
  onApplyRubric,
  initialRubric,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'upload' | 'templates' | 'paste'>('upload');
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<string>('');
  const [rawTextPaste, setRawTextPaste] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Active working rubric state
  const [rubric, setRubric] = useState<CustomCompanyRubric>(
    initialRubric || ENTERPRISE_RUBRIC_TEMPLATES[0]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // New item input states
  const [newSignal, setNewSignal] = useState('');
  const [newRedFlag, setNewRedFlag] = useState('');
  const [newQuestion, setNewQuestion] = useState('');

  const handleProcessFile = async (file: File) => {
    setIsParsing(true);
    setParsingStatus(`Extracting text streams from ${file.name}...`);
    try {
      const extractedText = await extractTextFromFile(file);
      setParsingStatus(`Analyzing leveling criteria and calibrating weights with AI...`);
      const parsedRubric = await parseRubricDocumentAsync(extractedText, file.name);
      setRubric(parsedRubric);
      setParsingStatus('');
    } catch (err: any) {
      console.error('File parsing error:', err);
      // Fallback
      const fallback = parseRubricOffline(`Custom Rubric Document ${file.name}`, file.name);
      setRubric(fallback);
      setParsingStatus('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = async () => {
    if (!rawTextPaste.trim()) return;
    setIsParsing(true);
    setParsingStatus('Calibrating leveling matrix from pasted text...');
    try {
      const parsed = await parseRubricDocumentAsync(rawTextPaste, 'Pasted_Job_Description.txt');
      setRubric(parsed);
    } finally {
      setIsParsing(false);
      setParsingStatus('');
    }
  };

  const handleSelectTemplate = (template: CustomCompanyRubric) => {
    setRubric({ ...template, id: `custom-rubric-${Date.now()}` });
  };

  const updateWeight = (key: keyof CustomCompanyRubric['rubricWeights'], val: number) => {
    setRubric((prev) => ({
      ...prev,
      rubricWeights: {
        ...prev.rubricWeights,
        [key]: val,
      },
    }));
  };

  const totalWeight = Object.values(rubric.rubricWeights).reduce((a: number, b: number) => a + b, 0);

  const addKeySignal = () => {
    if (!newSignal.trim()) return;
    setRubric((prev) => ({ ...prev, keySignals: [...prev.keySignals, newSignal.trim()] }));
    setNewSignal('');
  };

  const removeKeySignal = (idx: number) => {
    setRubric((prev) => ({ ...prev, keySignals: prev.keySignals.filter((_, i) => i !== idx) }));
  };

  const addRedFlag = () => {
    if (!newRedFlag.trim()) return;
    setRubric((prev) => ({ ...prev, redFlags: [...prev.redFlags, newRedFlag.trim()] }));
    setNewRedFlag('');
  };

  const removeRedFlag = (idx: number) => {
    setRubric((prev) => ({ ...prev, redFlags: prev.redFlags.filter((_, i) => i !== idx) }));
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setRubric((prev) => ({ ...prev, mandatoryQuestions: [...prev.mandatoryQuestions, newQuestion.trim()] }));
    setNewQuestion('');
  };

  const removeQuestion = (idx: number) => {
    setRubric((prev) => ({ ...prev, mandatoryQuestions: prev.mandatoryQuestions.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Enterprise Talent Calibration
                </span>
                <span className="text-xs text-slate-400 font-mono">1-Click PDF / Rubric Importer</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Import Company Job Description & Leveling Matrix</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Tab Bar for Ingestion Method */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1-Click PDF / File Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'templates'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Enterprise Templates (Google / Amazon / Stripe)</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Job Description Text</span>
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Ingestion Tools (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* TAB 1: FILE DROPZONE */}
            {activeTab === 'upload' && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] ${
                  dragActive
                    ? 'border-indigo-400 bg-indigo-950/40'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx,.md,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-md">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white">
                  Drop Company JD / Rubric PDF here
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports PDF, DOCX, TXT, Markdown (Max 25MB)
                </p>
                <span className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-[11px] rounded-lg border border-slate-700 transition">
                  Browse Document
                </span>
              </div>
            )}

            {/* TAB 2: PRESET ENTERPRISE MATRICES */}
            {activeTab === 'templates' && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {ENTERPRISE_RUBRIC_TEMPLATES.map((tmpl) => {
                  const isSelected = rubric.companyName === tmpl.companyName;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{tmpl.companyName}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {tmpl.strictnessRating}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{tmpl.targetLevel}</p>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-bold shrink-0">Use Preset →</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 3: RAW TEXT PASTE */}
            {activeTab === 'paste' && (
              <div className="space-y-2">
                <textarea
                  rows={8}
                  value={rawTextPaste}
                  onChange={(e) => setRawTextPaste(e.target.value)}
                  placeholder="Paste raw Job Description, internal competencies, or leveling expectations here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={isParsing || !rawTextPaste.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse & Calibrate Rubric</span>
                </button>
              </div>
            )}

            {/* Parsing Progress Banner */}
            {isParsing && (
              <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl flex items-center gap-2.5 text-xs text-indigo-300 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                <span>{parsingStatus || 'Calibrating company rubric...'}</span>
              </div>
            )}

            {/* Active Document Info Badge */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Rubric Source
              </span>
              <p className="font-bold text-white truncate">{rubric.fileName || rubric.companyName}</p>
              <p className="text-[10px] text-slate-400">Calibrated: {rubric.uploadedAt || 'Current Session'}</p>
            </div>
          </div>

          {/* Right Column: Interactive Calibrated Rubric Tuner (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Rubric Header Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Company / Org:
                  </label>
                  <input
                    type="text"
                    value={rubric.companyName}
                    onChange={(e) => setRubric({ ...rubric, companyName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Target Level / Title:
                  </label>
                  <input
                    type="text"
                    value={rubric.targetLevel}
                    onChange={(e) => setRubric({ ...rubric, targetLevel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Strictness Level Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Hiring Bar Strictness Multiplier:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Standard', 'Strict', 'Exacting'] as PanelStrictness[]).map((level) => {
                    const isSel = rubric.strictnessRating === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setRubric({ ...rubric, strictnessRating: level })}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer text-center ${
                          isSel
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {level === 'Exacting' ? '🔥 Exacting (L6+)' : level === 'Strict' ? '⚡ Strict Bar-Raiser' : '⚖️ Standard Bar'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Competency Weight Sliders */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Calibrated Competency Weights</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  totalWeight === 100 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  Total: {totalWeight}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Technical Architecture & Scale</span>
                    <span className="font-mono text-indigo-400 font-bold">{rubric.rubricWeights.technicalArchitecture}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={rubric.rubricWeights.technicalArchitecture}
                    onChange={(e) => updateWeight('technicalArchitecture', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Problem Solving & Edge Cases</span>
                    <span className="font-mono text-indigo-400 font-bold">{rubric.rubricWeights.problemSolvingAndAgility}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={rubric.rubricWeights.problemSolvingAndAgility}
                    onChange={(e) => updateWeight('problemSolvingAndAgility', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Leadership & Extreme Ownership</span>
                    <span className="font-mono text-indigo-400 font-bold">{rubric.rubricWeights.leadershipAndOwnership}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={rubric.rubricWeights.leadershipAndOwnership}
                    onChange={(e) => updateWeight('leadershipAndOwnership', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Communication & Clarity</span>
                    <span className="font-mono text-indigo-400 font-bold">{rubric.rubricWeights.communicationAndClarity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={rubric.rubricWeights.communicationAndClarity}
                    onChange={(e) => updateWeight('communicationAndClarity', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Business & Customer Impact</span>
                    <span className="font-mono text-indigo-400 font-bold">{rubric.rubricWeights.businessAndCustomerImpact}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={rubric.rubricWeights.businessAndCustomerImpact}
                    onChange={(e) => updateWeight('businessAndCustomerImpact', parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Key Positive Signals vs Red Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Positive Signals */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Key Positive Signals ({rubric.keySignals.length})
                  </span>
                  <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                    {rubric.keySignals.map((sig, i) => (
                      <div key={i} className="p-1.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg flex items-start justify-between gap-1 text-[11px] text-emerald-200">
                        <span>• {sig}</span>
                        <button onClick={() => removeKeySignal(i)} className="text-slate-500 hover:text-rose-400 shrink-0 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={newSignal}
                    onChange={(e) => setNewSignal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeySignal()}
                    placeholder="Add positive signal..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white"
                  />
                  <button onClick={addKeySignal} className="p-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Red Flags */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Disqualifying Red Flags ({rubric.redFlags.length})
                  </span>
                  <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                    {rubric.redFlags.map((flag, i) => (
                      <div key={i} className="p-1.5 bg-rose-950/20 border border-rose-900/40 rounded-lg flex items-start justify-between gap-1 text-[11px] text-rose-200">
                        <span>• {flag}</span>
                        <button onClick={() => removeRedFlag(i)} className="text-slate-500 hover:text-rose-400 shrink-0 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={newRedFlag}
                    onChange={(e) => setNewRedFlag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRedFlag()}
                    placeholder="Add disqualifying flag..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white"
                  />
                  <button onClick={addRedFlag} className="p-1 bg-rose-700 hover:bg-rose-600 text-white rounded cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mandatory Company Screening Questions */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Curated Must-Ask Committee Questions ({rubric.mandatoryQuestions.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {rubric.mandatoryQuestions.map((q, i) => (
                  <div key={i} className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-start justify-between gap-2 text-[11px] text-slate-300">
                    <span><strong>Q{i + 1}:</strong> {q}</span>
                    <button onClick={() => removeQuestion(i)} className="text-slate-500 hover:text-rose-400 shrink-0 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
                  placeholder="Add custom question to committee bank..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <button onClick={addQuestion} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer flex items-center gap-1 text-[11px] font-bold">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer: Save vs Launch Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Calibrated against {rubric.companyName} {rubric.strictnessRating} Standard</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onApplyRubric(rubric, false);
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
            >
              Save to Requisition
            </button>

            <button
              type="button"
              onClick={() => {
                onApplyRubric(rubric, true);
                onClose();
              }}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch Calibrated Interview</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

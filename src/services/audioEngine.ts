// Audio Engine for Adaptive Voice Interview
// Supports Gemini 24kHz PCM TTS Audio Playback, Web Audio Analyser,
// Web Speech API fallback, and real-time Speech Recognition with Interruptibility.

export class AudioEngine {
  private outputAudioCtx: AudioContext | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private onTranscriptUpdateCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onSpeakingStateChangeCallback: ((speaking: boolean) => void) | null = null;
  private onInterruptedCallback: (() => void) | null = null;

  private accumulatedSpeechBuffer = '';

  constructor() {
    // Lazy initialize AudioContext on user interaction
  }

  public clearSpeechBuffer(): void {
    this.accumulatedSpeechBuffer = '';
  }

  private getOutputContext(): AudioContext {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume();
    }
    return this.outputAudioCtx;
  }

  // Convert Base64 raw PCM (16-bit signed integer little-endian) to AudioBuffer
  private pcmToAudioBuffer(base64Data: string, sampleRate = 24000): AudioBuffer {
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const ctx = this.getOutputContext();
    const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);
    return audioBuffer;
  }

  // Play PCM audio from Gemini TTS
  public async playGeminiTTS(base64Data: string, sampleRate = 24000): Promise<void> {
    this.interrupt(); // Halt any existing speech first

    const ctx = this.getOutputContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    return new Promise((resolve, reject) => {
      try {
        const buffer = this.pcmToAudioBuffer(base64Data, sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Connect through analyser for AI speaking animation
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        this.currentSourceNode = source;
        this.analyserNode = analyser;
        this.setSpeaking(true);

        source.onended = () => {
          this.setSpeaking(false);
          this.currentSourceNode = null;
          resolve();
        };

        source.start(0);
      } catch (err) {
        console.error('Error playing Gemini TTS PCM audio:', err);
        this.setSpeaking(false);
        reject(err);
      }
    });
  }

  // Fallback to Web Speech API synthesis
  public async speakWithBrowserFallback(
    text: string,
    voiceName: string = 'Kore',
    pitch = 1.0,
    rate = 1.0
  ): Promise<void> {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported by browser.');
      return Promise.resolve();
    }

    // Only cancel if actively speaking
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    // Chromium recovery: resume if stuck in paused state
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    return new Promise((resolve) => {
      // Clean up brackets, strategy badges, emojis or formatting before speaking
      const cleaned = text
        .replace(/^[💡⚡🛡️👥🎯🧠✨].*$/gm, '')
        .replace(/^Resume Highlight:.*$/gmi, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[*#_`~]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const voices = window.speechSynthesis.getVoices();

      // Try to find a fitting voice based on personality
      if (voices.length > 0) {
        if (voiceName === 'Kore' || voiceName === 'Aoede') {
          const femaleVoice = voices.find(
            (v) =>
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('google uk english female')
          );
          if (femaleVoice) utterance.voice = femaleVoice;
        } else {
          const maleVoice = voices.find(
            (v) =>
              v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('george') ||
              v.name.toLowerCase().includes('google uk english male')
          );
          if (maleVoice) utterance.voice = maleVoice;
        }
      }

      utterance.pitch = pitch;
      utterance.rate = rate;
      this.setSpeaking(true);

      const heartbeat = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(heartbeat);
        }
      }, 10000);

      const cleanup = () => {
        clearInterval(heartbeat);
        this.setSpeaking(false);
        resolve();
      };

      utterance.onend = cleanup;
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error or cancelled:', e);
        cleanup();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Immediate Interruption
  public interrupt(): void {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (e) {
        // Ignore already stopped
      }
      this.currentSourceNode = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.isSpeaking) {
      this.setSpeaking(false);
      if (this.onInterruptedCallback) {
        this.onInterruptedCallback();
      }
    }
  }

  private setSpeaking(val: boolean) {
    this.isSpeaking = val;
    if (this.onSpeakingStateChangeCallback) {
      this.onSpeakingStateChangeCallback(val);
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Set up Speech Recognition (Web Speech API)
  public startSpeechRecognition(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onSpeechDetected?: () => void
  ): boolean {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('Web Speech Recognition API is not supported in this browser.');
      return false;
    }

    this.onTranscriptUpdateCallback = onTranscript;

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalChunk = '';

        // Acoustic echo shield: ignore mic recognition while AI is speaking
        if (this.isSpeaking) {
          return;
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += (finalChunk ? ' ' : '') + transcriptChunk.trim();
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        if (finalChunk) {
          this.accumulatedSpeechBuffer = (this.accumulatedSpeechBuffer + ' ' + finalChunk).trim();
        }

        const combinedFullSpeech = (this.accumulatedSpeechBuffer + (interimTranscript ? ' ' + interimTranscript : '')).trim();

        if (combinedFullSpeech && this.onTranscriptUpdateCallback) {
          this.onTranscriptUpdateCallback(combinedFullSpeech, Boolean(finalChunk));
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if candidate is still actively in interview listening mode
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch (e) {
            // Already started or restarting
          }
        }
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      return false;
    }
  }

  public stopSpeechRecognition(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
      this.recognition = null;
    }
  }

  // Microphone Volume / Frequency Visualizer
  public async initMicVisualizer(onVolume: (vol: number) => void): Promise<() => void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtxClass();
      const source = this.inputAudioCtx.createMediaStreamSource(stream);
      const analyser = this.inputAudioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animationFrameId: number;

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        onVolume(normalized);
        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();

      return () => {
        cancelAnimationFrame(animationFrameId);
        stream.getTracks().forEach((track) => track.stop());
        if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
          this.inputAudioCtx.close();
        }
      };
    } catch (err) {
      console.warn('Could not initialize microphone visualizer:', err);
      return () => {};
    }
  }

  public setCallbacks(callbacks: {
    onSpeakingStateChange?: (speaking: boolean) => void;
    onInterrupted?: () => void;
  }) {
    if (callbacks.onSpeakingStateChange) {
      this.onSpeakingStateChangeCallback = callbacks.onSpeakingStateChange;
    }
    if (callbacks.onInterrupted) {
      this.onInterruptedCallback = callbacks.onInterrupted;
    }
  }

  public cleanup(): void {
    this.interrupt();
    this.stopSpeechRecognition();
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.outputAudioCtx.close();
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close();
    }
  }
}

export const audioEngine = new AudioEngine();

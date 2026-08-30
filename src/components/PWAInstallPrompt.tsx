import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X, Sparkles, Smartphone, Check } from 'lucide-react';
import { subscribePWAInstallPrompt, subscribeNetworkStatus, promptPWAInstall, BeforeInstallPromptEvent } from '../services/pwaService';

export const PWAInstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const unsubPrompt = subscribePWAInstallPrompt((e) => setInstallEvent(e));
    const unsubStatus = subscribeNetworkStatus((status) => setIsOnline(status));

    // Check standalone state
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      unsubPrompt();
      unsubStatus();
    };
  }, []);

  const handleInstallClick = async () => {
    const success = await promptPWAInstall();
    if (success) {
      setIsInstalled(true);
    }
  };

  return (
    <>
      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md z-50 sticky top-0 animate-fade-in">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are currently working offline. Audio & past transcripts remain cached locally.</span>
        </div>
      )}

      {/* PWA Install Banner Prompt */}
      {installEvent && !isInstalled && !isDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Install VoiceIntro AI</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded font-mono uppercase">
                    App
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Add to home screen for real-time voice interviews and offline access.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Not Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

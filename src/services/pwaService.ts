// PWA Service Worker Registration & Deferred Install Prompt Management

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners: Array<(event: BeforeInstallPromptEvent | null) => void> = [];
const statusListeners: Array<(isOnline: boolean) => void> = [];

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker registration failed:', err);
        });
    });

    // Listen for BeforeInstallPromptEvent
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      notifyPromptListeners();
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] VoiceIntro AI PWA was installed successfully');
      deferredInstallPrompt = null;
      notifyPromptListeners();
    });

    // Listen for Online/Offline state changes
    window.addEventListener('online', () => notifyStatusListeners(true));
    window.addEventListener('offline', () => notifyStatusListeners(false));
  }
}

export function subscribePWAInstallPrompt(callback: (event: BeforeInstallPromptEvent | null) => void) {
  promptListeners.push(callback);
  callback(deferredInstallPrompt);
  return () => {
    const idx = promptListeners.indexOf(callback);
    if (idx !== -1) promptListeners.splice(idx, 1);
  };
}

export function subscribeNetworkStatus(callback: (isOnline: boolean) => void) {
  statusListeners.push(callback);
  callback(typeof navigator !== 'undefined' ? navigator.onLine : true);
  return () => {
    const idx = statusListeners.indexOf(callback);
    if (idx !== -1) statusListeners.splice(idx, 1);
  };
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    await deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted PWA install prompt');
      deferredInstallPrompt = null;
      notifyPromptListeners();
      return true;
    }
  } catch (err) {
    console.error('[PWA] Error during install prompt:', err);
  }
  return false;
}

function notifyPromptListeners() {
  promptListeners.forEach((cb) => cb(deferredInstallPrompt));
}

function notifyStatusListeners(isOnline: boolean) {
  statusListeners.forEach((cb) => cb(isOnline));
}

import React from 'react';
import { CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-3 flex items-start gap-3 ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/40 text-white ring-1 ring-emerald-500/20'
                : isError
                ? 'bg-slate-900/95 border-rose-500/40 text-white ring-1 ring-rose-500/20'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/40 text-white ring-1 ring-amber-500/20'
                : 'bg-slate-900/95 border-indigo-500/40 text-white ring-1 ring-indigo-500/20'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isError
                  ? 'bg-rose-500/20 text-rose-400'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-5 h-5" />}
              {isError && <AlertCircle className="w-5 h-5" />}
              {isWarning && <AlertCircle className="w-5 h-5" />}
              {!isSuccess && !isError && !isWarning && <Zap className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-white tracking-wide">{toast.title}</h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  SYSTEM
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

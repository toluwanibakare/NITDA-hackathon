'use client';
import { useEffect, useState } from 'react';
import { Icon, paths } from './icons';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warn' | 'info' | 'alert';
  title: string;
  message: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export function showToast(title: string, message: string, type: ToastMessage['type'] = 'info') {
  if (toastListener) {
    toastListener({
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    });
  }
}

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = newToast => {
      setToasts(prev => [newToast, ...prev].slice(0, 4));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4500);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full select-none pointer-events-none">
      {toasts.map(t => {
        const borderCol =
          t.type === 'success'
            ? 'rgba(25,217,138,0.4)'
            : t.type === 'warn'
              ? 'rgba(255,196,46,0.4)'
              : t.type === 'alert'
                ? 'rgba(255,77,94,0.5)'
                : 'rgba(22,119,255,0.4)';
        const bgCol =
          t.type === 'success'
            ? 'rgba(7, 26, 20, 0.95)'
            : t.type === 'warn'
              ? 'rgba(28, 22, 7, 0.95)'
              : t.type === 'alert'
                ? 'rgba(28, 8, 11, 0.95)'
                : 'rgba(7, 20, 38, 0.95)';
        const iconCol =
          t.type === 'success'
            ? '#19D98A'
            : t.type === 'warn'
              ? '#FFC42E'
              : t.type === 'alert'
                ? '#FF4D5E'
                : '#5B9CFF';
        const iconName =
          t.type === 'success'
            ? paths.check
            : t.type === 'alert'
              ? paths.alert
              : t.type === 'warn'
                ? paths.pulse
                : paths.shield;

        return (
          <div
            key={t.id}
            className="pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-200 animate-rise"
            style={{ borderColor: borderCol, background: bgCol }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${iconCol}1E`, color: iconCol }}
              >
                <Icon d={iconName} size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-bold text-[#F5F9FF]">{t.title}</span>
                  <button
                    onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                    className="text-[11px] text-[#6E7E99] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#93A1B8]">{t.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

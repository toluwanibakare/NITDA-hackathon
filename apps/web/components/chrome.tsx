'use client';
import { useEffect, useState } from 'react';
import { Icon, paths } from './icons';

export function StatCard({ label, value, sub, tone = 'neutral', delta }: {
  label: string; value: string; sub: string; tone?: 'neutral' | 'good' | 'warn' | 'bad'; delta?: string;
}) {
  const accent = tone === 'good' ? '#19D98A' : tone === 'warn' ? '#FFC42E' : tone === 'bad' ? '#FF4D5E' : '#00C8D7';
  return (
    <div className="panel panel-hover relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
      <div className="eyebrow">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="mono-num text-[30px] font-semibold leading-none text-ink">{value}</div>
        {delta && (
          <span className="chip" style={{ color: accent, borderColor: `${accent}33` }}>{delta}</span>
        )}
      </div>
      <div className="body-muted mt-2 text-[12px]">{sub}</div>
    </div>
  );
}

export function LiveClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    f();
    const id = setInterval(f, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="mono-num hidden items-center gap-2 text-[12px] text-muted sm:inline-flex">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-trust animate-pulseDot" />
      {t} WAT
    </span>
  );
}

export function BootLoader({ done }: { done: boolean }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (done) {
      const id = setTimeout(() => setShow(false), 600);
      return () => clearTimeout(id);
    }
  }, [done]);
  if (!show) return null;
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-abyss ${done ? 'boot-fade' : ''}`}>
      <video src="/loading.webm" autoPlay muted loop playsInline className="h-40 w-40 object-contain opacity-90" />
      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-faint">Initialising trust layer</div>
      <div className="mt-3 h-px w-44 overflow-hidden bg-white/10">
        <div className="h-full w-1/2 bg-aqua/80" style={{ animation: 'ticker 1.1s linear infinite' }} />
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(-100%);} to { transform: translateX(300%);} }`}</style>
    </div>
  );
}

export function EmptyState({ title, body, icon = 'grid' }: { title: string; body: string; icon?: keyof typeof paths }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted">
        <Icon d={paths[icon]} size={18} />
      </span>
      <div className="h-section mt-3">{title}</div>
      <div className="body-muted mt-1 max-w-sm">{body}</div>
    </div>
  );
}

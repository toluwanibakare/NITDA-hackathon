import { riskColor } from '@/lib/api';

export function RiskBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const c = riskColor(score);
  const label = score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH' : score >= 31 ? 'WATCH' : 'TRUSTED';
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-wide ${pad}`}
      style={{ borderColor: `${c}44`, background: `${c}14`, color: c }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-pingRing" style={{ background: c }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      </span>
      <span className="tabular-nums">{score}</span>
      <span className="opacity-80">· {label}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const c = status === 'QUARANTINED' ? '#FF4D5E' : status === 'RATE_LIMITED' ? '#FF9F2E' : status === 'MONITORED' ? '#FFC42E' : '#19D98A';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute h-full w-full rounded-full animate-pingRing" style={{ background: c }} />
        <span className="relative h-2 w-2 rounded-full animate-pulseDot" style={{ background: c }} />
      </span>
      <span className="font-mono text-[11px] tracking-[0.12em]" style={{ color: c }}>{status}</span>
    </span>
  );
}

export function RiskRing({ score, size = 92 }: { score: number; size?: number }) {
  const c = riskColor(score);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(140,163,191,0.18)" strokeWidth={7} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          className="risk-fill"
          style={{ filter: `drop-shadow(0 0 8px ${c}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[22px] font-semibold tabular-nums leading-none" style={{ color: c }}>{score}</span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-faint mt-1">/ 100</span>
      </div>
    </div>
  );
}

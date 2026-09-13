import { riskColor } from '@/lib/api';

export function RiskBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const c = riskColor(score);
  const label = score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH' : score >= 31 ? 'WATCH' : 'TRUSTED';
  const pad = size === 'sm' ? 'px-2 py-[3px] text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold tracking-wide shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${pad}`}
      style={{ borderColor: `${c}3D`, background: `${c}0F`, color: c }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-pingRing" style={{ background: c }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      </span>
      <span className="tabular-nums">{score}</span>
      <span className="opacity-90">· {label}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const c = status === 'QUARANTINED' ? '#E5484D' : status === 'RATE_LIMITED' ? '#F59E0B' : status === 'MONITORED' ? '#D9930D' : '#0E9F6E';
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-[#F8FAFD] px-2.5 py-1">
      <span className="relative flex h-2 w-2">
        <span className="absolute h-full w-full rounded-full animate-pingRing" style={{ background: c }} />
        <span className="relative h-2 w-2 rounded-full animate-pulseDot" style={{ background: c }} />
      </span>
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.12em]" style={{ color: c }}>{status}</span>
    </span>
  );
}

export function RiskRing({ score, size = 96 }: { score: number; size?: number }) {
  const c = riskColor(score);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="relative shrink-0 rounded-3xl border border-line bg-[#F8FAFD] p-2" style={{ width: size + 16, height: size + 16 }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#E7EDF5" strokeWidth={7} fill="none" />
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
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[22px] font-bold tabular-nums leading-none" style={{ color: c }}>{score}</span>
          <span className="font-mono text-[9px] font-medium tracking-[0.2em] text-faint mt-1">/ 100</span>
        </div>
      </div>
    </div>
  );
}

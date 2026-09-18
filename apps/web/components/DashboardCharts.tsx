'use client';
import { getCurrentRate, getRiskScore, riskColor } from '@/lib/api';
import type { IntegrationRow } from '@/lib/api';

const PALETTE = ['#5B50E6', '#00CEC9', '#9B51E0', '#FF9F43', '#FF2A6D', '#19D98A'];

export function TrafficDonut({ items }: { items: IntegrationRow[] }) {
  const total = items.reduce((s, it) => s + Math.max(0, getCurrentRate(it)), 0) || 1;
  const r = 70;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const segments = items.slice(0, 6).map((it, i) => {
    const frac = Math.max(0, getCurrentRate(it)) / total;
    const len = frac * circ;
    const seg = { it, color: PALETTE[i % PALETTE.length], len, offset, frac };
    offset += len;
    return seg;
  });

  return (
    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
      <div className="space-y-3.5">
        {segments.map(({ it, color, frac }) => {
          const rate = getCurrentRate(it);
          const pct = `${Math.round(frac * 100)}%`;
          return (
            <div key={it.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex min-w-0 items-center gap-2 font-medium text-white">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="truncate">{it.name}</span>
                </span>
                <span className="mono-num font-semibold text-[#8E92A4]">
                  {pct} · {rate}/min
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="risk-fill h-full rounded-full"
                  style={{ width: pct, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative flex justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="24" />
          {segments.map(({ it, color, len, offset: off }) => (
            <circle
              key={it.id}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="24"
              strokeDasharray={`${Math.max(0, len - 2)} ${circ - Math.max(0, len - 2)}`}
              strokeDashoffset={-off}
              strokeLinecap="butt"
              className="risk-fill"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="mono-num text-[20px] font-bold text-white">
            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#8E92A4]">req/min verified</span>
        </div>
      </div>
    </div>
  );
}

export function RiskBars({ items }: { items: IntegrationRow[] }) {
  const sorted = [...items].sort((a, b) => getRiskScore(b) - getRiskScore(a)).slice(0, 7);
  const max = Math.max(100, ...sorted.map((it) => getRiskScore(it)));
  return (
    <div className="flex h-44 items-end justify-between gap-2 pt-6">
      {sorted.map((it) => {
        const score = getRiskScore(it);
        const c = riskColor(score);
        const h = Math.max(8, Math.round((score / max) * 100));
        const short = it.name.replace(' Provider', '').replace(' Payments', '').slice(0, 8);
        return (
          <div key={it.id} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="mono-num text-[10px] font-bold tabular-nums opacity-0 transition-opacity group-hover:opacity-100" style={{ color: c }}>
              {score}
            </span>
            <div
              className="risk-fill w-full rounded-t-lg transition-all duration-300"
              style={{ height: `${h}%`, background: c, opacity: 0.9 }}
              title={`${it.name}: risk ${score}`}
            />
            <span className="truncate font-mono text-[9px] text-[#8E92A4]" style={{ maxWidth: 56 }}>
              {short}
            </span>
          </div>
        );
      })}
      {!sorted.length && <div className="body-muted text-[12px]">No risk data yet.</div>}
    </div>
  );
}

export function TrustGauge({ items, quarantined }: { items: IntegrationRow[]; quarantined: number }) {
  const avg = items.length
    ? Math.round(items.reduce((s, it) => s + getRiskScore(it), 0) / items.length)
    : 0;
  const trust = Math.max(0, 100 - avg);
  const arc = 90 * Math.PI; // semicircle r=90
  const filled = (trust / 100) * arc;
  return (
    <div className="flex flex-col justify-between">
      <div className="my-2">
        <h3 className="mono-num text-[36px] font-extrabold tabular-nums text-white">{trust}%</h3>
        <p className="text-[12px] text-[#8E92A4]">
          avg risk {avg} · {quarantined} quarantined
        </p>
      </div>
      <div className="relative flex justify-center pt-2">
        <svg width="220" height="120" viewBox="0 0 220 120">
          <path d="M 20 100 A 90 90 0 0 1 200 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" strokeLinecap="round" />
          <path
            d="M 20 100 A 90 90 0 0 1 200 100"
            fill="none"
            stroke={trust >= 70 ? '#19D98A' : trust >= 40 ? '#FFC42E' : '#FF4D5E'}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${arc}`}
            className="risk-fill"
          />
        </svg>
        <div className="absolute bottom-1 text-center">
          <span className="text-[22px] font-extrabold text-white">{trust}%</span>
          <span className="block text-[11px] font-semibold text-[#8E92A4]">TRUST SCORE</span>
        </div>
      </div>
    </div>
  );
}

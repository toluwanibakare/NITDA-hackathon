'use client';
import { getCurrentRate, getRiskScore, riskColor } from '@/lib/api';
import type { IntegrationRow } from '@/lib/api';

const PALETTE = ['#5B50E6', '#9B51E0', '#FF2A6D', '#FF9F43', '#00CEC9', '#10B981'];

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
                <div className="risk-fill h-full rounded-full" style={{ width: pct, background: color }} />
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
          <span className="mono-num text-[22px] font-extrabold text-white">
            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8E92A4]">req/min verified</span>
        </div>
      </div>
    </div>
  );
}

export function RiskBars({ items }: { items: IntegrationRow[] }) {
  const sorted = [...items].sort((a, b) => getRiskScore(b) - getRiskScore(a)).slice(0, 7);
  const max = Math.max(100, ...sorted.map(it => getRiskScore(it)));
  return (
    <div className="flex h-48 items-end justify-between gap-3 pt-4">
      {sorted.map(it => {
        const score = getRiskScore(it);
        const c = riskColor(score);
        const h = Math.max(15, Math.round((score / max) * 100));
        const short = it.name.replace(' Provider', '').replace(' Payments', '').slice(0, 9);
        return (
          <div key={it.id} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span
              className="mono-num text-[11px] font-bold tabular-nums text-white opacity-90 transition-opacity"
              style={{ color: c }}
            >
              {score}
            </span>
            <div className="w-full bg-white/5 rounded-t-lg h-36 flex items-end overflow-hidden p-0.5">
              <div
                className="risk-fill w-full rounded-t-md transition-all duration-500"
                style={{ height: `${h}%`, background: c }}
                title={`${it.name}: risk score ${score}`}
              />
            </div>
            <span className="truncate font-mono text-[10px] text-[#8E92A4]" style={{ maxWidth: 64 }}>
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
  const avg = items.length ? Math.round(items.reduce((s, it) => s + getRiskScore(it), 0) / items.length) : 0;
  const trust = Math.max(0, 100 - avg);

  // SVG Semicircle Arc calculations
  // Radius r = 75, Center = (110, 100)
  // Arc length = PI * 75 = 235.61
  const r = 75;
  const arcLen = Math.PI * r;
  const strokeDash = (trust / 100) * arcLen;
  const strokeColor = trust >= 70 ? '#10B981' : trust >= 40 ? '#FF9F43' : '#FF2A6D';

  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-2">
      <div className="relative flex items-center justify-center">
        <svg width="220" height="120" viewBox="0 0 220 120">
          {/* Background arc */}
          <path
            d="M 35 100 A 75 75 0 0 1 185 100"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <path
            d="M 35 100 A 75 75 0 0 1 185 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${arcLen}`}
            className="transition-all duration-700"
          />
        </svg>

        {/* Center score overlay */}
        <div className="absolute bottom-1 text-center">
          <span className="text-[32px] font-extrabold text-white tracking-tight leading-none">{trust}%</span>
          <span className="block text-[10px] font-bold tracking-widest text-[#8E92A4] mt-1 uppercase">
            TRUST SCORE
          </span>
        </div>
      </div>

      <div className="text-center text-[12px] text-[#8E92A4]">
        <span>Avg Risk: <strong className="text-white font-mono">{avg}</strong></span>
        <span className="mx-2">•</span>
        <span>Quarantined: <strong className="text-[#FF2A6D] font-mono">{quarantined}</strong></span>
      </div>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { riskColor } from '@/lib/api';
import type { IntegrationRow } from '@/lib/api';

/**
 * Live topology: Application -> ThirdEye core -> 4 integration nodes.
 * Pure SVG so packets, risk rings and link flow feel physical, not decorative.
 */
export function IntegrationMap({ items, onSelect }: { items: IntegrationRow[]; onSelect?: (id: string) => void }) {
  const W = 860;
  const H = 340;
  const cx = W / 2;
  const coreY = 118;
  const nodeY = 258;
  const xs = [110, 320, 540, 750];

  return (
    <div className="panel relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div>
          <div className="eyebrow">Live integration map</div>
          <div className="h-section mt-0.5">Authorised traffic under continuous verification</div>
        </div>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-trust animate-pulseDot" />
          <span className="tabular-nums">{items.length} integrations · live</span>
        </span>
      </div>

      <div className="bg-grid relative">
        {/* scan sweep */}
        <div className="pointer-events-none absolute inset-x-6 top-0 bottom-0 overflow-hidden">
          <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-aqua/[0.07] to-transparent" style={{ animation: 'scanMove 7s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes scanMove { 0%,100% { top: -8%; } 50% { top: 88%; } }`}</style>

        <svg viewBox={`0 0 ${W} ${H}`} className="relative h-auto w-full">
          <defs>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* application */}
          <g>
            <rect x={cx - 110} y={18} width={220} height={44} rx={12} fill="rgba(22,119,255,0.10)" stroke="rgba(22,119,255,0.4)" />
            <text x={cx} y={37} textAnchor="middle" fill="#F5F9FF" fontSize={12} fontWeight={600} fontFamily="Inter, system-ui">STORE APPLICATION</text>
            <text x={cx} y={51} textAnchor="middle" fill="#8CA3BF" fontSize={10} fontFamily="monospace" letterSpacing={1.5}>checkout · payments · delivery</text>
          </g>

          {/* app -> core */}
          <line x1={cx} y1={62} x2={cx} y2={coreY - 26} stroke="rgba(0,200,215,0.5)" strokeWidth={1.5} className="flow-line" />
          <circle cx={cx} cy={88} r={3} fill="#00C8D7">
            <animate attributeName="cy" values="66;92;66" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {/* core */}
          <g>
            <rect x={cx - 130} y={coreY - 26} width={260} height={52} rx={14} fill="#0B1E35" stroke="rgba(0,200,215,0.35)" />
            <rect x={cx - 130} y={coreY - 26} width={260} height={1.5} rx={1} fill="rgba(0,200,215,0.5)" />
            <circle cx={cx - 96} cy={coreY} r={10} fill="none" stroke="#1677FF" strokeWidth={2} />
            <circle cx={cx - 96} cy={coreY} r={4} fill="#00C8D7" />
            <text x={cx - 78} y={coreY - 2} fill="#F5F9FF" fontSize={13} fontWeight={700} fontFamily="Inter, system-ui">THIRDEYE</text>
            <text x={cx - 78} y={coreY + 13} fill="#8CA3BF" fontSize={10} fontFamily="monospace" letterSpacing={1.2}>RISK ENGINE · LIVE</text>
            <circle cx={cx + 112} cy={coreY} r={4} fill="#19D98A" className="animate-pulseDot" />
          </g>

          {/* links + nodes */}
          {items.slice(0, 4).map((it, i) => {
            const x = xs[i] ?? 110;
            const c = riskColor(it.risk_score ?? 0);
            const bad = (it.risk_score ?? 0) >= 61;
            return (
              <g key={it.id}>
                <line
                  x1={cx + (x - cx) * 0.18}
                  y1={coreY + 26}
                  x2={x}
                  y2={nodeY - 30}
                  stroke={bad ? 'rgba(255,77,94,0.65)' : 'rgba(25,217,138,0.4)'}
                  strokeWidth={bad ? 2 : 1.5}
                  className="flow-line"
                />
                {/* packet */}
                <circle r={3.2} fill={c} filter="url(#nodeGlow)">
                  <animateMotion dur={bad ? '1.2s' : '2.6s'} repeatCount="indefinite" path={`M ${cx + (x - cx) * 0.18} ${coreY + 26} L ${x} ${nodeY - 30}`} />
                </circle>
                <g
                  onClick={() => onSelect?.(it.id)}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                >
                  <rect x={x - 92} y={nodeY - 30} width={184} height={64} rx={12} fill={bad ? 'rgba(255,77,94,0.08)' : 'rgba(11,30,53,0.9)'} stroke={bad ? 'rgba(255,77,94,0.5)' : 'rgba(140,163,191,0.22)'} />
                  {bad && (
                    <circle cx={x + 80} cy={nodeY - 20} r={5} fill="#FF4D5E" className="animate-pulseDot" />
                  )}
                  <text x={x} y={nodeY - 8} textAnchor="middle" fill="#F5F9FF" fontSize={11.5} fontWeight={600} fontFamily="Inter, system-ui">
                    {it.name.replace(' Provider', '').toUpperCase()}
                  </text>
                  <text x={x} y={nodeY + 7} textAnchor="middle" fill={c} fontSize={12} fontWeight={700} fontFamily="monospace">
                    {(it.risk_score ?? 0).toString().padStart(2, '0')} · {(it.risk_score ?? 0) >= 81 ? 'CRITICAL' : (it.risk_score ?? 0) >= 61 ? 'HIGH' : (it.risk_score ?? 0) >= 31 ? 'WATCH' : 'TRUSTED'}
                  </text>
                  <text x={x} y={nodeY + 21} textAnchor="middle" fill="#5B7191" fontSize={10} fontFamily="monospace">
                    {it.requestsPerMin ?? '—'}/min · {it.status}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-5 py-3">
          <span className="eyebrow mr-1">Legend</span>
          {[
            ['#19D98A', 'Trusted 0–30'],
            ['#FFC42E', 'Watch 31–60'],
            ['#FF9F2E', 'High 61–80'],
            ['#FF4D5E', 'Critical 81–100'],
          ].map(([c, t]) => (
            <span key={t} className="chip"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{t}</span>
          ))}
          <Link href="/integrations" className="ml-auto font-mono text-[11px] tracking-wide text-aqua hover:underline">Open registry →</Link>
        </div>
      </div>
    </div>
  );
}

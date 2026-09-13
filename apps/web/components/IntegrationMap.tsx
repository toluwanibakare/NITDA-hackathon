'use client';
import Link from 'next/link';
import { riskColor } from '@/lib/api';
import type { IntegrationRow } from '@/lib/api';

/**
 * Live topology: Application -> ThirdEye core -> 4 integration nodes.
 * Light-theme SVG so it sits perfectly inside the white card.
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/80 px-5 py-4 md:px-6">
        <div>
          <div className="eyebrow">Live integration map</div>
          <div className="h-section mt-1">Authorised traffic under continuous verification</div>
        </div>
        <span className="chip !border-trust/25 !bg-trust/[0.07] !text-[#0B7A55]">
          <span className="h-1.5 w-1.5 rounded-full bg-trust animate-pulseDot" />
          <span className="tabular-nums">{items.length} integrations · live</span>
        </span>
      </div>

      <div className="relative bg-[#FAFBFE]">
        <div className="bg-grid absolute inset-0 opacity-60" />
        {/* scan sweep */}
        <div className="pointer-events-none absolute inset-x-6 bottom-0 top-0 overflow-hidden">
          <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-brand/[0.06] to-transparent" style={{ animation: 'scanMove 7s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes scanMove { 0%,100% { top: -8%; } 50% { top: 88%; } }`}</style>

        <svg viewBox={`0 0 ${W} ${H}`} className="relative h-auto w-full">
          <defs>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* application */}
          <g>
            <rect x={cx - 110} y={18} width={220} height={44} rx={12} fill="#EFF4FF" stroke="#C4D7FF" />
            <text x={cx} y={37} textAnchor="middle" fill="#0A1830" fontSize={12} fontWeight={700} fontFamily="Inter, system-ui">STORE APPLICATION</text>
            <text x={cx} y={51} textAnchor="middle" fill="#8B9BB4" fontSize={10} fontFamily="monospace" letterSpacing={1.5}>checkout · payments · delivery</text>
          </g>

          {/* app -> core */}
          <line x1={cx} y1={62} x2={cx} y2={coreY - 26} stroke="#0A65FF" strokeOpacity={0.45} strokeWidth={1.5} className="flow-line" />
          <circle cx={cx} cy={88} r={3.5} fill="#0A65FF">
            <animate attributeName="cy" values="66;92;66" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {/* core */}
          <g>
            <rect x={cx - 130} y={coreY - 26} width={260} height={52} rx={14} fill="#0A1830" stroke="#0A1830" />
            <rect x={cx - 118} y={coreY - 26} width={236} height={2.5} rx={1.5} fill="#00C8D7" />
            <circle cx={cx - 96} cy={coreY + 2} r={10} fill="none" stroke="#5B8CFF" strokeWidth={2} />
            <circle cx={cx - 96} cy={coreY + 2} r={4} fill="#00C8D7" />
            <text x={cx - 78} y={coreY - 1} fill="#FFFFFF" fontSize={13} fontWeight={800} fontFamily="Inter, system-ui" letterSpacing={0.5}>THIRDEYE</text>
            <text x={cx - 78} y={coreY + 14} fill="#9DB1CC" fontSize={9.5} fontFamily="monospace" letterSpacing={1.2}>RISK ENGINE · LIVE</text>
            <circle cx={cx + 112} cy={coreY + 2} r={4} fill="#19D98A" className="animate-pulseDot" />
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
                  stroke={bad ? '#E5484D' : '#0E9F6E'}
                  strokeOpacity={bad ? 0.6 : 0.35}
                  strokeWidth={bad ? 2 : 1.5}
                  className="flow-line"
                />
                {/* packet */}
                <circle r={3.4} fill={c} filter="url(#nodeGlow)">
                  <animateMotion dur={bad ? '1.2s' : '2.6s'} repeatCount="indefinite" path={`M ${cx + (x - cx) * 0.18} ${coreY + 26} L ${x} ${nodeY - 30}`} />
                </circle>
                <g
                  onClick={() => onSelect?.(it.id)}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                >
                  <rect x={x - 92} y={nodeY - 30} width={184} height={64} rx={12} fill={bad ? '#FEF1F1' : '#FFFFFF'} stroke={bad ? '#F3B4B6' : '#E0E8F2'} strokeWidth={1.2} />
                  {bad && (
                    <circle cx={x + 80} cy={nodeY - 20} r={5} fill="#E5484D" className="animate-pulseDot" />
                  )}
                  <text x={x} y={nodeY - 8} textAnchor="middle" fill="#0A1830" fontSize={11.5} fontWeight={700} fontFamily="Inter, system-ui">
                    {it.name.replace(' Provider', '').toUpperCase()}
                  </text>
                  <text x={x} y={nodeY + 7} textAnchor="middle" fill={c} fontSize={12} fontWeight={800} fontFamily="monospace">
                    {(it.risk_score ?? 0).toString().padStart(2, '0')} · {(it.risk_score ?? 0) >= 81 ? 'CRITICAL' : (it.risk_score ?? 0) >= 61 ? 'HIGH' : (it.risk_score ?? 0) >= 31 ? 'WATCH' : 'TRUSTED'}
                  </text>
                  <text x={x} y={nodeY + 21} textAnchor="middle" fill="#8B9BB4" fontSize={10} fontFamily="monospace">
                    {it.requestsPerMin ?? '—'}/min · {it.status}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        <div className="relative flex flex-wrap items-center gap-2 border-t border-line/80 bg-white px-5 py-3 md:px-6">
          <span className="eyebrow mr-1">Legend</span>
          {[
            ['#0E9F6E', 'Trusted 0–30'],
            ['#D9930D', 'Watch 31–60'],
            ['#F59E0B', 'High 61–80'],
            ['#E5484D', 'Critical 81–100'],
          ].map(([c, t]) => (
            <span key={t} className="chip"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{t}</span>
          ))}
          <Link href="/integrations" className="ml-auto font-mono text-[11px] font-semibold tracking-wide text-brand hover:underline">Open registry →</Link>
        </div>
      </div>
    </div>
  );
}

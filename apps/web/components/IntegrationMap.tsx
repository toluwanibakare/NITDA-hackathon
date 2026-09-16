'use client';
import Link from 'next/link';
import { getRiskScore, riskColor } from '@/lib/api';
import type { IntegrationRow } from '@/lib/api';

/**
 * High-Tech Live Topology Map:
 * Store Application -> ThirdEye Risk Engine -> 4 Partner Integration Nodes
 * Features cubic Bezier flow paths, animated data packets, glowing status ports,
 * and high-contrast alert indicators for quarantined/critical nodes.
 */
export function IntegrationMap({ items, onSelect }: { items: IntegrationRow[]; onSelect?: (id: string) => void }) {
  const W = 860;
  const H = 360;
  const cx = W / 2; // 430

  // Coordinates
  const appY = 40;
  const coreY = 124;
  const nodeY = 270;

  // Ports along ThirdEye core bottom (width 260, x from 300 to 560)
  const corePortXs = [340, 400, 460, 520];
  // X positions of the 4 integration cards
  const xs = [115, 325, 535, 745];

  return (
    <div className="panel relative overflow-hidden bg-white shadow-sm border border-[#E2E8F0] rounded-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-4 md:px-6 bg-[#FAFCFF]">
        <div>
          <div className="eyebrow text-[#0A65FF] font-bold text-[11px] uppercase tracking-wider">Live Integration Topology</div>
          <div className="h-section mt-0.5 text-[15px] font-bold text-[#0A1830]">Authorised traffic under continuous verification</div>
        </div>
        <span className="chip !border-[#0E9F6E]/30 !bg-[#0E9F6E]/[0.08] !text-[#0B7A55] font-semibold text-[11.5px]">
          <span className="h-2 w-2 rounded-full bg-[#0E9F6E] animate-pulseDot" />
          <span className="tabular-nums">{items.length} integrations active · live monitoring</span>
        </span>
      </div>

      {/* Topology Canvas Area */}
      <div className="relative bg-gradient-to-b from-[#FAFBFD] via-[#F4F7FC] to-[#FFFFFF] py-2">
        {/* Subtle grid pattern background */}
        <div className="bg-grid absolute inset-0 opacity-40 pointer-events-none" />

        {/* Scan sweep line animation */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 overflow-hidden">
          <div
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-brand/[0.07] to-transparent"
            style={{ animation: 'scanSweep 6s ease-in-out infinite' }}
          />
        </div>
        <style>{`@keyframes scanSweep { 0%,100% { top: -12%; } 50% { top: 92%; } }`}</style>

        <svg viewBox={`0 0 ${W} ${H}`} className="relative h-auto w-full select-none">
          <defs>
            {/* Soft Glow filter */}
            <filter id="glowLight" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Critical Red Glow filter */}
            <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Core Box Gradient */}
            <linearGradient id="thirdEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B172A" />
              <stop offset="100%" stopColor="#112240" />
            </linearGradient>

            {/* App Box Gradient */}
            <linearGradient id="appGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F0F5FF" />
              <stop offset="100%" stopColor="#E5EFFF" />
            </linearGradient>
          </defs>

          {/* 1. STORE APPLICATION NODE */}
          <g transform={`translate(${cx - 115}, ${appY - 24})`}>
            <rect
              width={230}
              height={48}
              rx={12}
              fill="url(#appGrad)"
              stroke="#B2CDFF"
              strokeWidth={1.5}
              className="shadow-sm"
            />
            {/* App Icon Circle */}
            <circle cx={24} cy={24} r={12} fill="#0A65FF" opacity={0.12} />
            <path
              d="M19 24h10 M24 19v10"
              stroke="#0A65FF"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <text x={125} y={22} textAnchor="middle" fill="#0A1830" fontSize={12} fontWeight={800} fontFamily="Inter, system-ui">
              STORE APPLICATION
            </text>
            <text x={125} y={36} textAnchor="middle" fill="#5A6B82" fontSize={10} fontFamily="monospace" letterSpacing={1.2}>
              checkout · payments · delivery
            </text>
          </g>

          {/* Connection: App -> ThirdEye Core */}
          <line
            x1={cx}
            y1={appY + 24}
            x2={cx}
            y2={coreY - 28}
            stroke="#0A65FF"
            strokeWidth={2}
            strokeDasharray="4 3"
            strokeOpacity={0.6}
          />
          {/* Animated App-to-Core Flow Packet */}
          <circle cx={cx} cy={appY + 36} r={3.5} fill="#0A65FF" filter="url(#glowLight)">
            <animate attributeName="cy" values={`${appY + 24};${coreY - 28};${appY + 24}`} dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2.2s" repeatCount="indefinite" />
          </circle>

          {/* 2. THIRDEYE CORE RISK ENGINE NODE */}
          <g transform={`translate(${cx - 135}, ${coreY - 28})`}>
            {/* Background Container */}
            <rect
              width={270}
              height={56}
              rx={14}
              fill="url(#thirdEyeGrad)"
              stroke="#1E3A8A"
              strokeWidth={1.5}
              className="shadow-md"
            />
            {/* Top Cyan Accent Strip */}
            <rect x={16} y={0} width={238} height={3} rx={1.5} fill="#00C8D7" />

            {/* Emblem Circle */}
            <circle cx={28} cy={28} r={11} fill="none" stroke="#3B82F6" strokeWidth={2} />
            <circle cx={28} cy={28} r={4.5} fill="#00C8D7" filter="url(#glowLight)" />

            {/* Engine Text */}
            <text x={48} y={24} fill="#FFFFFF" fontSize={14} fontWeight={900} fontFamily="Inter, system-ui" letterSpacing={0.6}>
              THIRDEYE
            </text>
            <text x={48} y={40} fill="#94A3B8" fontSize={9.5} fontFamily="monospace" letterSpacing={1.4} fontWeight={600}>
              RISK ENGINE · LIVE MONITOR
            </text>

            {/* Live Indicator Pill */}
            <rect x={202} y={18} width={52} height={20} rx={10} fill="#0E9F6E" fillOpacity={0.2} stroke="#0E9F6E" strokeWidth={1} />
            <circle cx={212} cy={28} r={3} fill="#19D98A" className="animate-pulseDot" />
            <text x={232} y={31.5} textAnchor="middle" fill="#19D98A" fontSize={9} fontWeight={800} fontFamily="Inter, system-ui">
              LIVE
            </text>
          </g>

          {/* Ports on bottom of ThirdEye Engine Box */}
          {corePortXs.map((px) => (
            <circle key={px} cx={px} cy={coreY + 28} r={3.5} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
          ))}

          {/* 3. BRANCH LINKS + 4 INTEGRATION NODES */}
          {items.slice(0, 4).map((it, i) => {
            const destX = xs[i] ?? 115;
            const portX = corePortXs[i] ?? cx;

            const score = getRiskScore(it);
            const c = riskColor(score);
            const isCritical = score >= 81 || it.status === 'QUARANTINED';
            const isHigh = score >= 61 && score < 81;
            const isWatch = score >= 31 && score < 61;
            const bad = isCritical || isHigh;

            const linkColor = isCritical ? '#E5484D' : isHigh ? '#F59E0B' : isWatch ? '#D9930D' : '#0E9F6E';

            // Smooth cubic Bezier path from ThirdEye bottom port to Node top port
            const startY = coreY + 28;
            const endY = nodeY - 32;
            const controlY1 = startY + 45;
            const controlY2 = endY - 45;
            const pathD = `M ${portX} ${startY} C ${portX} ${controlY1}, ${destX} ${controlY2}, ${destX} ${endY}`;

            const nodeName = it.name.replace(' Provider', '').replace(' Sync', '').toUpperCase();
            const statusLabel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isWatch ? 'WATCH' : 'TRUSTED';
            const rateText = `${it.requestsPerMin ?? it.expected_request_rate ?? '90'}/min`;

            return (
              <g key={it.id}>
                {/* Connection Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={linkColor}
                  strokeOpacity={isCritical ? 0.85 : bad ? 0.7 : 0.45}
                  strokeWidth={isCritical ? 2.5 : bad ? 2 : 1.6}
                  strokeDasharray={isCritical ? '5 3' : 'none'}
                />

                {/* Animated Flow Packet along path */}
                <circle r={isCritical ? 4.5 : 3.5} fill={linkColor} filter={isCritical ? 'url(#glowRed)' : 'url(#glowLight)'}>
                  <animateMotion
                    dur={isCritical ? '1.1s' : isHigh ? '1.8s' : '2.6s'}
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>

                {/* Input port dot on top of node card */}
                <circle cx={destX} cy={endY} r={4} fill={linkColor} stroke="#FFFFFF" strokeWidth={1.5} />

                {/* INTEGRATION CARD NODE */}
                <g
                  transform={`translate(${destX - 90}, ${nodeY - 32})`}
                  onClick={() => onSelect?.(it.id)}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                  className="transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Card Shadow and Background */}
                  <rect
                    width={180}
                    height={64}
                    rx={14}
                    fill={isCritical ? '#FEF2F2' : isHigh ? '#FFFBEB' : '#FFFFFF'}
                    stroke={isCritical ? '#E5484D' : isHigh ? '#F59E0B' : '#E2E8F0'}
                    strokeWidth={isCritical ? 2 : 1.5}
                    className="shadow-sm"
                  />

                  {/* Red Alert Indicator Badge for Critical Nodes */}
                  {isCritical && (
                    <g transform="translate(156, -6)">
                      <circle cx={0} cy={0} r={10} fill="#E5484D" className="animate-pulseDot" />
                      <circle cx={0} cy={0} r={14} fill="none" stroke="#E5484D" strokeWidth={1.5} opacity={0.5} />
                      <path d="M-3 -3l6 6 M3 -3l-6 6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                    </g>
                  )}

                  {/* Integration Name */}
                  <text
                    x={90}
                    y={21}
                    textAnchor="middle"
                    fill="#0A1830"
                    fontSize={12}
                    fontWeight={800}
                    fontFamily="Inter, system-ui"
                    letterSpacing={0.4}
                  >
                    {nodeName}
                  </text>

                  {/* Risk Score & Tier Label */}
                  <text
                    x={90}
                    y={38}
                    textAnchor="middle"
                    fill={linkColor}
                    fontSize={12}
                    fontWeight={900}
                    fontFamily="monospace"
                  >
                    {score.toString().padStart(2, '0')} · {statusLabel}
                  </text>

                  {/* Traffic Rate & Status */}
                  <text
                    x={90}
                    y={52}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight={500}
                  >
                    {rateText} · {it.status}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Legend Bar */}
        <div className="relative flex flex-wrap items-center gap-2.5 border-t border-[#E2E8F0] bg-white px-5 py-3 md:px-6">
          <span className="eyebrow text-[#64748B] mr-1 text-[11px] font-bold uppercase tracking-wider">Legend</span>
          {[
            ['#0E9F6E', 'Trusted 0–30'],
            ['#D9930D', 'Watch 31–60'],
            ['#F59E0B', 'High 61–80'],
            ['#E5484D', 'Critical 81–100'],
          ].map(([c, t]) => (
            <span key={t} className="chip !bg-[#F8FAFC] !border-[#E2E8F0] !text-[#334155] font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full mr-1.5 inline-block" style={{ background: c }} />
              {t}
            </span>
          ))}
          <Link
            href="/integrations"
            className="ml-auto font-mono text-[11.5px] font-bold tracking-wide text-brand hover:underline inline-flex items-center gap-1"
          >
            Open registry →
          </Link>
        </div>
      </div>
    </div>
  );
}

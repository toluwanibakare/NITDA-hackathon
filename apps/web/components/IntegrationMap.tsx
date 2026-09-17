'use client';
import Link from 'next/link';
import { getRiskScore, riskColor } from '@/lib/api';
import type { IntegrationRow } from '@/lib/api';

/**
 * High-Tech Live Topology Map:
 * Store Application -> ThirdEye Risk Engine -> 4 Partner Integration Nodes
 * Pixel-perfect SVG layout with zero text/icon overlaps, smooth cubic Bezier paths,
 * animated packet flows, and high-contrast alert indicators.
 */
export function IntegrationMap({
  items,
  onSelect,
  variant = 'auto',
}: {
  items: IntegrationRow[];
  onSelect?: (id: string) => void;
  variant?: 'light' | 'dark' | 'auto';
}) {
  const W = 860;
  const H = 360;
  const cx = W / 2; // 430

  // Coordinates
  const appY = 40;
  const coreY = 126;
  const nodeY = 272;

  // Ports along ThirdEye core bottom (width 280, x from 290 to 570)
  const corePortXs = [335, 398, 462, 525];
  // X positions of the 4 integration cards
  const xs = [115, 325, 535, 745];

  return (
    <div className="panel relative overflow-hidden rounded-2xl shadow-sm border border-[#E2E8F0]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-3.5 md:px-6 bg-[#FAFCFF]">
        <div>
          <div className="eyebrow font-bold text-[11px] uppercase tracking-wider text-brand">Live Integration Topology</div>
          <div className="h-section mt-0.5 text-[15px] font-bold text-[#0A1830]">Authorised traffic under continuous verification</div>
        </div>
        <span className="chip !border-[#0E9F6E]/30 !bg-[#0E9F6E]/[0.08] !text-[#0B7A55] font-semibold text-[11.5px]">
          <span className="h-2 w-2 rounded-full bg-[#0E9F6E] animate-pulseDot" />
          <span className="tabular-nums">{items.length} integrations active · live monitoring</span>
        </span>
      </div>

      {/* Topology Canvas Area */}
      <div className="relative py-3 bg-[#0B132B]">
        {/* Grid pattern background */}
        <div className="bg-grid absolute inset-0 opacity-30 pointer-events-none" />

        {/* Scan sweep line animation */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 overflow-hidden">
          <div
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-brand/[0.08] to-transparent"
            style={{ animation: 'scanSweep 6s ease-in-out infinite' }}
          />
        </div>
        <style>{`@keyframes scanSweep { 0%,100% { top: -12%; } 50% { top: 92%; } }`}</style>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="relative h-auto w-full min-w-[680px] select-none">
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
                <stop offset="0%" stopColor="#12233F" />
                <stop offset="100%" stopColor="#0E1A33" />
              </linearGradient>
            </defs>

            {/* 1. STORE APPLICATION NODE (Width: 280, Height: 52) */}
            <g transform={`translate(${cx - 140}, ${appY - 26})`}>
              <rect
                width={280}
                height={52}
                rx={14}
                fill="url(#appGrad)"
                stroke="rgba(22,119,255,0.45)"
                strokeWidth={1.5}
                className="shadow-sm"
              />
              {/* App Icon Circle */}
              <circle cx={26} cy={26} r={13} fill="#1677FF" opacity={0.25} />
              <path
                d="M20 26h12 M26 20v12"
                stroke="#5B9CFF"
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Title & Subtitle - Start aligned with clean right margin */}
              <text x={52} y={23} fill="#F5F9FF" fontSize={13} fontWeight={800} fontFamily="Inter, system-ui">
                STORE APPLICATION
              </text>
              <text x={52} y={38} fill="#8B9BB4" fontSize={9.5} fontFamily="monospace" letterSpacing={0.5}>
                checkout · payments · delivery
              </text>
            </g>


            {/* Connection: App -> ThirdEye Core */}
            <line
              x1={cx}
              y1={appY + 25}
              x2={cx}
              y2={coreY - 28}
              stroke="#1677FF"
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeOpacity={0.7}
            />
            {/* Animated App-to-Core Flow Packet */}
            <circle cx={cx} cy={appY + 36} r={3.5} fill="#00C8D7" filter="url(#glowLight)">
              <animate attributeName="cy" values={`${appY + 25};${coreY - 28};${appY + 25}`} dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="2.2s" repeatCount="indefinite" />
            </circle>

            {/* 2. THIRDEYE CORE RISK ENGINE NODE (Width: 280, Height: 56) */}
            <g transform={`translate(${cx - 140}, ${coreY - 28})`}>
              {/* Background Container */}
              <rect
                width={280}
                height={56}
                rx={14}
                fill="url(#thirdEyeGrad)"
                stroke="#1E3A8A"
                strokeWidth={1.5}
                className="shadow-md"
              />
              {/* Top Cyan Accent Strip */}
              <rect x={16} y={0} width={248} height={3} rx={1.5} fill="#00C8D7" />

              {/* Emblem Circle */}
              <circle cx={26} cy={28} r={11} fill="none" stroke="#3B82F6" strokeWidth={2} />
              <circle cx={26} cy={28} r={4.5} fill="#00C8D7" filter="url(#glowLight)" />

              {/* Engine Text - Clean spacing */}
              <text x={48} y={23} fill="#FFFFFF" fontSize={13.5} fontWeight={900} fontFamily="Inter, system-ui" letterSpacing={0.6}>
                THIRDEYE
              </text>
              <text x={48} y={39} fill="#94A3B8" fontSize={9.5} fontFamily="monospace" letterSpacing={1.0} fontWeight={600}>
                RISK ENGINE · LIVE
              </text>

              {/* Live Indicator Pill - Positioned at x=212 to avoid subtitle text */}
              <g transform="translate(212, 18)">
                <rect width={54} height={20} rx={10} fill="#0E9F6E" fillOpacity={0.2} stroke="#0E9F6E" strokeWidth={1} />
                <circle cx={12} cy={10} r={3} fill="#19D98A" className="animate-pulseDot" />
                <text x={32} y={13.5} textAnchor="middle" fill="#19D98A" fontSize={9.5} fontWeight={800} fontFamily="Inter, system-ui">
                  LIVE
                </text>
              </g>
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

              const isCritical = score >= 81 || it.status === 'QUARANTINED';
              const isHigh = score >= 61 && score < 81;
              const isWatch = score >= 31 && score < 61;
              const bad = isCritical || isHigh;

              const linkColor = isCritical ? '#FF4D5E' : isHigh ? '#FF9F2E' : isWatch ? '#FFC42E' : '#19D98A';

              // Smooth cubic Bezier path from ThirdEye bottom port to Node top port
              const startY = coreY + 28;
              const endY = nodeY - 32;
              const controlY1 = startY + 45;
              const controlY2 = endY - 45;
              const pathD = `M ${portX} ${startY} C ${portX} ${controlY1}, ${destX} ${controlY2}, ${destX} ${endY}`;

              const nodeName = it.name.replace(' Provider', '').replace(' Sync', '').toUpperCase();
              const statusLabel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH_RISK' : isWatch ? 'SUSPICIOUS' : 'TRUSTED';
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
                    style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'filter 150ms ease-out' }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                  >
                    {/* Card Shadow and Background */}
                    <rect
                      width={180}
                      height={64}
                      rx={14}
                      fill={isCritical ? '#2A0E18' : isHigh ? '#2A1E0A' : '#0E1A33'}
                      stroke={isCritical ? '#FF4D5E' : isHigh ? '#FF9F2E' : 'rgba(245,249,255,0.14)'}
                      strokeWidth={isCritical ? 2 : 1.5}
                      className="shadow-sm"
                    />

                    {/* Red Alert Indicator Badge for Critical Nodes */}
                    {isCritical && (
                      <g transform="translate(156, -6)">
                        <circle cx={0} cy={0} r={10} fill="#FF4D5E" className="animate-pulseDot" />
                        <circle cx={0} cy={0} r={14} fill="none" stroke="#FF4D5E" strokeWidth={1.5} opacity={0.5} />
                        <path d="M-3 -3l6 6 M3 -3l-6 6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                      </g>
                    )}

                    {/* Integration Name */}
                    <text
                      x={90}
                      y={21}
                      textAnchor="middle"
                      fill="#F5F9FF"
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
                      fill="#8B9BB4"
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
        </div>

        {/* Legend Bar */}
        <div className="relative flex flex-wrap items-center gap-2.5 border-t border-white/10 bg-[#040B16]/80 px-5 py-3 md:px-6">
          <span className="eyebrow mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Legend</span>
          {[
            ['#19D98A', 'Trusted 0–30'],
            ['#FFC42E', 'Suspicious 31–60'],
            ['#FF9F2E', 'High 61–80'],
            ['#FF4D5E', 'Critical 81–100'],
          ].map(([c, t]) => (
            <span key={t} className="chip font-semibold text-[11px] !bg-white/5 !border-white/10 !text-slate-300">
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

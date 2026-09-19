'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useDevMode } from '@/app/shell';
import {
  actionLabel,
  getEventCreatedAt,
  getEventIntegrationId,
  getEventRiskScore,
  getEventType,
  riskColor,
  timeAgo,
} from '@/lib/api';
import type { SecEvent } from '@/lib/api';

export function EventTimeline({ events, compact = false }: { events: SecEvent[]; compact?: boolean }) {
  const devMode = useDevMode();
  const [selectedEvent, setSelectedEvent] = useState<SecEvent | null>(null);

  if (!events.length)
    return (
      <div className="body-muted px-5 py-8 text-center text-[13px]">
        No security events yet. Normal traffic is being verified quietly.
      </div>
    );
  return (
    <div className="relative">
      <div
        className="absolute bottom-4 left-[27px] top-4 w-px"
        style={{
          background: 'linear-gradient(180deg, rgba(22,119,255,0.35), rgba(245,249,255,0.08), transparent)',
        }}
      />
      <ul className="divide-y" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        {events.map(e => {
          const score = getEventRiskScore(e);
          const createdAt = getEventCreatedAt(e);
          const integrationId = getEventIntegrationId(e);
          const c = riskColor(score);
          const eventType = getEventType(e);
          const httpCode = score > 70 ? 'HTTP 403' : score > 40 ? 'HTTP 429' : 'HTTP 200';

          return (
            <li
              key={e.id}
              className="group flex gap-3.5 px-5 py-3.5 transition-colors hover:bg-[rgba(245,249,255,0.03)]"
            >
              <span className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                <span
                  className="absolute h-4 w-4 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: `${c}1E` }}
                />
                <span
                  className="h-2 w-2 rounded-full ring-4"
                  style={{ background: c, ['--tw-ring-color' as string]: `${c}22` }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="mono-num text-[11px]" style={{ color: '#64748B' }}>
                    {new Date(createdAt).toLocaleTimeString('en-GB', { hour12: false })}
                  </span>
                  <span className="text-[13px] font-semibold text-[#F5F9FF]">
                    {integrationId.replace('_001', '').replace('_', ' ')}
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: '#94A3B8' }}>
                    {e.endpoint}
                  </span>
                  {devMode && (
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        score > 70 ? 'bg-[#FF4D5E]/20 text-[#FF8090]' : 'bg-[#10B981]/20 text-[#10B981]'
                      }`}
                    >
                      {httpCode}
                    </span>
                  )}
                  {devMode && (
                    <span className="font-mono text-[10px] text-[#8E92A4]">
                      0.8ms
                    </span>
                  )}
                  <span className="ml-auto mono-num text-[12px] font-bold tabular-nums" style={{ color: c }}>
                    {score}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em]"
                    style={{ color: c, borderColor: `${c}33`, background: `${c}0C` }}
                  >
                    {eventType}
                  </span>
                  <span
                    className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em]"
                    style={{
                      borderColor: 'rgba(245,249,255,0.10)',
                      background: 'rgba(245,249,255,0.04)',
                      color: '#94A3B8',
                    }}
                  >
                    {actionLabel(e.action)}
                  </span>
                  <span className="font-mono text-[10.5px]" style={{ color: '#64748B' }}>
                    {timeAgo(createdAt)}
                  </span>
                  {devMode && (
                    <button
                      onClick={() => setSelectedEvent(e)}
                      className="ml-auto font-mono text-[10px] text-[#00CEC9] hover:underline"
                    >
                      [Inspect Payload JSON]
                    </button>
                  )}
                </div>
                <p className="body-muted mt-1 line-clamp-2 text-[12.5px]">{e.reason}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* DEV MODE JSON PAYLOAD INSPECTOR MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#00CEC9]/30 bg-[#12131C] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[12px] font-mono font-bold text-[#00CEC9] uppercase">⚡ DEV MODE PAYLOAD INSPECTOR</span>
              <button onClick={() => setSelectedEvent(null)} className="text-[#8E92A4] hover:text-white">✕</button>
            </div>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="text-[#8E92A4]">Endpoint: <span className="text-white">{selectedEvent.endpoint}</span></div>
              <div className="text-[#8E92A4]">Verdict: <span className="text-[#10B981]">{selectedEvent.action}</span></div>
              <div className="text-[#8E92A4]">Trace SHA-256: <span className="text-[#00CEC9]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span></div>
              <div className="text-[#8E92A4] mt-3">Raw Request JSON:</div>
              <pre className="rounded-xl border border-white/10 bg-[#0B0C14] p-3 text-[#5B9CFF] max-h-48 overflow-y-auto whitespace-pre-wrap">
{JSON.stringify({
  request_id: selectedEvent.id,
  timestamp: selectedEvent.createdAt,
  endpoint: selectedEvent.endpoint,
  headers: {
    'user-agent': 'ShopX-Gateway/2.1',
    'x-forwarded-for': '192.168.1.4',
    'authorization': 'Bearer te_live_***'
  },
  risk_factors: selectedEvent.reason
}, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedEvent(null)} className="rounded-xl bg-white/10 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-white/20">Close</button>
            </div>
          </div>
        </div>
      )}
      {compact && (
        <div
          className="border-t px-5 py-3"
          style={{ borderColor: 'rgba(245,249,255,0.08)', background: 'rgba(245,249,255,0.02)' }}
        >
          <Link
            href="/events"
            className="font-mono text-[11px] font-semibold tracking-wide text-[#5B9CFF] hover:underline"
          >
            View full timeline →
          </Link>
        </div>
      )}
    </div>
  );
}

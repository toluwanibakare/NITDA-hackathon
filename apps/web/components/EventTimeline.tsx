'use client';
import Link from 'next/link';
import { actionLabel, getEventCreatedAt, getEventIntegrationId, getEventRiskScore, getEventType, riskColor } from '@/lib/api';
import type { SecEvent } from '@/lib/api';
import { timeAgo } from '@/lib/mock';

export function EventTimeline({ events, compact = false }: { events: SecEvent[]; compact?: boolean }) {
  if (!events.length) return <div className="body-muted px-5 py-8 text-center text-[13px]">No security events yet. Normal traffic is being verified quietly.</div>;
  return (
    <div className="relative">
      <div className="absolute bottom-4 left-[27px] top-4 w-px" style={{ background: 'linear-gradient(180deg, rgba(22,119,255,0.35), rgba(245,249,255,0.08), transparent)' }} />
      <ul className="divide-y" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
        {events.map((e) => {
          const score = getEventRiskScore(e);
          const createdAt = getEventCreatedAt(e);
          const integrationId = getEventIntegrationId(e);
          const c = riskColor(score);
          const eventType = getEventType(e);

          return (
            <li key={e.id} className="group flex gap-3.5 px-5 py-3.5 transition-colors hover:bg-[rgba(245,249,255,0.03)]">
              <span className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                <span className="absolute h-4 w-4 rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `${c}1E` }} />
                <span className="h-2 w-2 rounded-full ring-4" style={{ background: c, ['--tw-ring-color' as string]: `${c}22` }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="mono-num text-[11px]" style={{ color: '#64748B' }}>{new Date(createdAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
                  <span className="text-[13px] font-semibold text-[#F5F9FF]">{integrationId.replace('_001', '').replace('_', ' ')}</span>
                  <span className="font-mono text-[11px]" style={{ color: '#94A3B8' }}>{e.endpoint}</span>
                  <span className="ml-auto mono-num text-[12px] font-bold tabular-nums" style={{ color: c }}>{score}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em]" style={{ color: c, borderColor: `${c}33`, background: `${c}0C` }}>{eventType}</span>
                  <span className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em]" style={{ borderColor: 'rgba(245,249,255,0.10)', background: 'rgba(245,249,255,0.04)', color: '#94A3B8' }}>{actionLabel(e.action)}</span>
                  <span className="font-mono text-[10.5px]" style={{ color: '#64748B' }}>{timeAgo(createdAt)}</span>
                </div>
                <p className="body-muted mt-1 line-clamp-2 text-[12.5px]">{e.reason}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {compact && (
        <div className="border-t px-5 py-3" style={{ borderColor: 'rgba(245,249,255,0.08)', background: 'rgba(245,249,255,0.02)' }}>
          <Link href="/events" className="font-mono text-[11px] font-semibold tracking-wide text-[#5B9CFF] hover:underline">View full timeline →</Link>
        </div>
      )}
    </div>
  );
}


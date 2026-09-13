'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { EventTimeline } from '@/components/EventTimeline';
import { IntegrationMap } from '@/components/IntegrationMap';
import { StatCard } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { RiskBadge, StatusDot } from '@/components/RiskBadge';
import { apiSafe, type DashboardStats, type IntegrationRow, type SecEvent } from '@/lib/api';
import { MOCK_EVENTS, MOCK_INTEGRATIONS, MOCK_STATS, timeAgo } from '@/lib/mock';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [items, setItems] = useState<IntegrationRow[]>(MOCK_INTEGRATIONS);
  const [events, setEvents] = useState<SecEvent[]>(MOCK_EVENTS);
  const [live, setLive] = useState(false);
  const [quarantining, setQuarantining] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, list, ev] = await Promise.all([
      apiSafe<DashboardStats>('/api/dashboard/stats', MOCK_STATS),
      apiSafe<IntegrationRow[]>('/api/integrations', MOCK_INTEGRATIONS),
      apiSafe<SecEvent[]>('/api/security-events?limit=8', MOCK_EVENTS),
    ]);
    setStats(s.data);
    setItems(list.data.length ? list.data.map(normalise) : MOCK_INTEGRATIONS);
    setEvents(ev.data.length ? ev.data : MOCK_EVENTS);
    setLive(s.live || list.live || ev.live);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    let chan: { unsubscribe: () => void } | null = null;
    try {
      const sb = supabaseBrowser();
      chan = sb
        .channel('te-events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, () => load())
        .subscribe() as unknown as { unsubscribe: () => void };
    } catch { /* realtime optional — polling covers judge wifi */ }
    return () => { clearInterval(id); chan?.unsubscribe(); };
  }, [load]);

  async function quarantine(id: string) {
    setQuarantining(id);
    try {
      await apiSafe(`/api/integrations/${id}/quarantine`, { status: 'QUARANTINED' }, {
        method: 'POST', body: JSON.stringify({ reason: 'Manual quarantine from dashboard' }),
      });
    } finally {
      setQuarantining(null);
      load();
    }
  }

  return (
    <div className="stagger space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="eyebrow">Track G · Commerce & consumer protection</div>
          <h1 className="h-display mt-1">Third parties, under continuous watch</h1>
          <p className="body-muted mt-1.5 max-w-2xl">
            Every authorised integration is verified against its declared purpose and approved scope.
            Risk is scored live and the response is graded — never just on or off.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="chip" style={{ color: live ? '#19D98A' : '#FFC42E', borderColor: live ? '#19D98A44' : '#FFC42E44' }}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-trust animate-pulseDot' : 'bg-watch animate-blink'}`} />
            {live ? 'LIVE · ENGINE CONNECTED' : 'DEMO DATA · ENGINE OFFLINE'}
          </span>
          <Link href="/simulator" className="btn-primary">
            <Icon d={paths.play} size={14} /> Run attack demo
          </Link>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Integrations" value={String(stats.integrations)} sub="Registered third parties" />
        <StatCard label="Active" value={String(stats.active)} sub="Within purpose" tone="good" />
        <StatCard label="Monitored requests" value={Number(stats.monitoredRequests).toLocaleString()} sub="Verified by middleware" />
        <StatCard label="Threats" value={String(stats.threats)} sub="Graded responses issued" tone={stats.threats > 0 ? 'warn' : 'neutral'} />
        <StatCard label="Quarantined" value={String(stats.quarantined)} sub="Blocked + isolated" tone={stats.quarantined > 0 ? 'bad' : 'neutral'} />
      </div>

      {/* map */}
      <IntegrationMap items={items} onSelect={(id) => router.push(`/integrations/${id}`)} />

      {/* table + feed */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <div>
              <div className="eyebrow">Integration registry</div>
              <div className="h-section mt-0.5">Declared purpose vs live behaviour</div>
            </div>
            <Link href="/integrations" className="font-mono text-[11px] tracking-wide text-aqua hover:underline">Registry →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="table-head border-b border-white/[0.06]">
                  <th className="px-5 py-2.5 font-medium">Integration</th>
                  <th className="px-3 py-2.5 font-medium">Req/min</th>
                  <th className="px-3 py-2.5 font-medium">Risk</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Activity</th>
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {items.map((it) => (
                  <tr key={it.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/integrations/${it.id}`} className="block">
                        <span className="block text-[13.5px] font-semibold text-ink group-hover:text-aqua">{it.name}</span>
                        <span className="block max-w-[260px] truncate text-[12px] text-muted">{it.purpose}</span>
                      </Link>
                    </td>
                    <td className="mono-num px-3 py-3 text-[13px] text-ink">{it.requestsPerMin ?? '—'}</td>
                    <td className="px-3 py-3"><RiskBadge score={it.risk_score ?? 0} size="sm" /></td>
                    <td className="px-3 py-3"><StatusDot status={it.status} /></td>
                    <td className="mono-num px-3 py-3 text-[11.5px] text-faint">{it.lastActivity ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {(it.risk_score ?? 0) >= 61 && it.status !== 'QUARANTINED' ? (
                        <button onClick={() => quarantine(it.id)} disabled={quarantining === it.id} className="btn-danger !px-3 !py-1.5 !text-[12px]">
                          {quarantining === it.id ? 'Working…' : 'Quarantine'}
                        </button>
                      ) : (
                        <Link href={`/integrations/${it.id}`} className="btn-ghost !px-3 !py-1.5 !text-[12px]">Inspect</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-3.5">
            <div className="eyebrow">Security timeline</div>
            <div className="h-section mt-0.5">Graded response as it happened</div>
          </div>
          <EventTimeline events={events.slice(0, 6)} compact />
        </div>
      </div>

      {/* graded response strip */}
      <div className="panel px-5 py-4">
        <div className="eyebrow">Graded response — why not just block</div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {[
            ['0–30 · Trusted', 'Allow', '#19D98A', 'Matches declared purpose and scope.'],
            ['31–60 · Watch', 'Allow + Monitor', '#FFC42E', 'Endpoint or purpose drift. Watched closely.'],
            ['61–80 · High risk', 'Rate limit + Monitor', '#FF9F2E', 'Forbidden data or volume anomaly. Throttled.'],
            ['81–100 · Critical', 'Block + Quarantine', '#FF4D5E', 'Sustained abuse. Isolated until reviewed.'],
          ].map(([t, a, c, d]) => (
            <div key={t} className="rounded-xl border border-white/[0.07] bg-abyss/60 p-3.5">
              <div className="font-mono text-[11px] tracking-wide" style={{ color: c }}>{t}</div>
              <div className="mt-1 text-[13.5px] font-semibold">{a}</div>
              <div className="body-muted mt-1 text-[12px]">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalise(r: IntegrationRow): IntegrationRow {
  return {
    ...r,
    requestsPerMin: r.requestsPerMin ?? r.expected_request_rate ?? 90,
    lastActivity: r.lastActivity ?? (r.updated_at ? timeAgo(r.updated_at) : 'just now'),
  };
}

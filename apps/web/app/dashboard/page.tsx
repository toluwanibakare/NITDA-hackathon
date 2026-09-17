'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { EventTimeline } from '@/components/EventTimeline';
import { IntegrationMap } from '@/components/IntegrationMap';
import { StatCard } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { RiskBadge, StatusDot } from '@/components/RiskBadge';
import {
  activityToEvent,
  apiSafe,
  getRiskScore,
  getStatsActive,
  getStatsIntegrations,
  getStatsQuarantined,
  getStatsRequests,
  getStatsThreats,
  normaliseEvent,
  normaliseIntegration,
  type ActivityItem,
  type DashboardStats,
  type IntegrationRow,
  type SecEvent,
} from '@/lib/api';
import { MOCK_EVENTS, MOCK_INTEGRATIONS, MOCK_STATS } from '@/lib/mock';
import { isSupabaseEnvConfigured, supabaseBrowser } from '@/lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [items, setItems] = useState<IntegrationRow[]>(MOCK_INTEGRATIONS);
  const [events, setEvents] = useState<SecEvent[]>(MOCK_EVENTS);
  const [live, setLive] = useState(false);
  const [quarantining, setQuarantining] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, list, act, ev] = await Promise.all([
      apiSafe<DashboardStats>('/api/dashboard/stats', MOCK_STATS),
      apiSafe<IntegrationRow[]>('/api/integrations', MOCK_INTEGRATIONS),
      apiSafe<ActivityItem[] | { activities: ActivityItem[] }>('/api/dashboard/activity?limit=20', []),
      apiSafe<SecEvent[]>('/api/security-events?limit=8', MOCK_EVENTS),
    ]);
    setStats(s.data);
    setItems(list.data.length ? list.data.map(normaliseIntegration) : MOCK_INTEGRATIONS);
    const rawAct: ActivityItem[] = Array.isArray(act.data)
      ? act.data
      : (act.data as { activities?: ActivityItem[] })?.activities ?? [];
    if (rawAct.length) setEvents(rawAct.map(activityToEvent));
    else if (ev.data.length) setEvents(ev.data.map(normaliseEvent));
    else setEvents(MOCK_EVENTS);
    setLive(s.live || list.live || act.live || ev.live);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    let chan: { unsubscribe: () => void } | null = null;
    try {
      if (isSupabaseEnvConfigured()) {
        const sb = supabaseBrowser();
        chan = sb.channel('te-events').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, () => load()).subscribe() as unknown as { unsubscribe: () => void };
      }
    } catch { /* polling fallback */ }
    return () => { clearInterval(id); chan?.unsubscribe(); };
  }, [load]);

  async function quarantine(id: string) {
    setQuarantining(id);
    try {
      await apiSafe(`/api/integrations/${id}/quarantine`, { status: 'QUARANTINED' }, { method: 'POST', body: JSON.stringify({ reason: 'Manual quarantine from overview' }) });
    } finally { setQuarantining(null); load(); }
  }

  const integrationsCount = getStatsIntegrations(stats);
  const activeCount = getStatsActive(stats);
  const reqCount = getStatsRequests(stats);
  const threatCount = getStatsThreats(stats);
  const quarantineCount = getStatsQuarantined(stats);

  return (
    <div className="stagger space-y-5">
      {/* Quiet header — wayfinding first, no gradient hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="section-label-soft">Overview · {live ? 'live' : 'demo data'}</p>
          <h1 className="section-heading mt-1.5">Third parties under watch</h1>
          <p className="section-sub mt-1.5">Purpose, scope and behaviour checked on every request. Graded response, never just on or off.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="chip" style={live ? { color: '#19D98A', borderColor: 'rgba(25,217,138,0.3)', background: 'rgba(25,217,138,0.07)' } : { color: '#FFC42E', borderColor: 'rgba(255,196,46,0.3)', background: 'rgba(255,196,46,0.07)' }}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#19D98A] animate-pulseDot' : 'bg-[#FFC42E] animate-blink'}`} />
            {live ? 'Live' : 'Offline'}
          </span>
          <Link href="/simulator" className="btn-accent !px-4 !py-2 !text-[13px]">
            <Icon d={paths.play} size={14} /> Attack demo
          </Link>
        </div>
      </div>

      {/* Four key numbers — active folds into integrations sub */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Integrations" value={String(integrationsCount)} sub={`${activeCount} within purpose`} />
        <StatCard label="Requests" value={Number(reqCount).toLocaleString()} sub="Verified by middleware" />
        <StatCard label="Threats" value={String(threatCount)} sub="Graded responses" tone={threatCount > 0 ? 'warn' : 'neutral'} />
        <StatCard label="Quarantined" value={String(quarantineCount)} sub="Blocked + isolated" tone={quarantineCount > 0 ? 'bad' : 'neutral'} />
      </div>

      {/* Main 12-col: map + registry left, live rail right — blends full width */}
      <div className="grid items-start gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <IntegrationMap items={items} onSelect={(id) => router.push(`/integrations/${id}`)} />

          <div className="section-card--numbered overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4 md:px-6" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
              <div>
                <p className="section-label-soft">Registry</p>
                <p className="h-section mt-0.5">Declared purpose vs live behaviour</p>
              </div>
              <Link href="/integrations" className="shrink-0 text-[12.5px] font-semibold text-[#5B9CFF]">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="data-table__head">
                    <th className="data-table__cell font-medium md:px-6">Integration</th>
                    <th className="data-table__cell font-medium">Req/min</th>
                    <th className="data-table__cell font-medium">Risk</th>
                    <th className="data-table__cell font-medium">Status</th>
                    <th className="data-table__cell font-medium">Activity</th>
                    <th className="data-table__cell text-right font-medium md:px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="data-table__divider">
                  {items.map((it) => {
                    const score = getRiskScore(it);
                    return (
                      <tr key={it.id} className="data-table__row">
                        <td className="data-table__cell">
                          <Link href={`/integrations/${it.id}`} className="block">
                            <span className="font-semibold text-[#F2F6FC]" style={{ letterSpacing: '-0.006em' }}>{it.name}</span>
                            <span className="block max-w-[240px] truncate text-[12px]" style={{ color: '#8494AD' }}>{it.purpose}</span>
                          </Link>
                        </td>
                        <td className="data-table__cell mono-num font-medium text-[#F2F6FC]">{it.requestsPerMin ?? '—'}</td>
                        <td className="data-table__cell"><RiskBadge score={score} size="sm" /></td>
                        <td className="data-table__cell"><StatusDot status={it.status} /></td>
                        <td className="data-table__cell mono-num text-[11px]" style={{ color: '#6E7E99' }}>{it.lastActivity ?? '—'}</td>
                        <td className="data-table__cell text-right md:px-6">
                          {score >= 61 && it.status !== 'QUARANTINED' ? (
                            <button onClick={() => quarantine(it.id)} disabled={quarantining === it.id} className="btn-danger !px-3 !py-1.5 !text-[12px]">
                              {quarantining === it.id ? '…' : 'Quarantine'}
                            </button>
                          ) : (
                            <Link href={`/integrations/${it.id}`} className="btn-ghost !px-3 !py-1.5 !text-[12px]">Inspect</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-5 xl:col-span-4">
          <div className="section-card--numbered overflow-hidden">
            <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
              <p className="section-label-soft">Live activity</p>
              <p className="h-section mt-0.5">Response as it happened</p>
            </div>
            <EventTimeline events={events.slice(0, 7)} compact />
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
              <p className="section-label-soft">Graded response</p>
            </div>
            {[
              ['0–30', 'Trusted · Allow', '#19D98A'],
              ['31–60', 'Suspicious · Monitor', '#FFC42E'],
              ['61–80', 'High risk · Rate limit', '#FF9F2E'],
              ['81–100', 'Critical · Quarantine', '#FF4D5E'],
            ].map(([range, label, color]) => (
              <div key={range} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: '1px solid rgba(245,249,255,0.05)' }}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="mono-num text-[11.5px]" style={{ color: '#6E7E99' }}>{range}</span>
                <span className="text-[13px] font-medium text-[#E6EDF7]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

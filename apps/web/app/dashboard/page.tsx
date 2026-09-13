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
      chan = sb.channel('te-events').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, () => load()).subscribe() as unknown as { unsubscribe: () => void };
    } catch { /* realtime optional */ }
    return () => { clearInterval(id); chan?.unsubscribe(); };
  }, [load]);

  async function quarantine(id: string) {
    setQuarantining(id);
    try {
      await apiSafe(`/api/integrations/${id}/quarantine`, { status: 'QUARANTINED' }, { method: 'POST', body: JSON.stringify({ reason: 'Manual quarantine from dashboard' }) });
    } finally { setQuarantining(null); load(); }
  }

  return (
    <div className="stagger space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[28px] border border-[#E4EAF3] bg-gradient-to-br from-[#FFFFFF] via-[#FAFBFC] to-[#F1F5F9] px-6 py-7 md:px-8 md:py-9">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-brand/[0.06] blur-3xl" />
        <div className="absolute bottom-0 left-20 h-40 w-40 rounded-full bg-[#08B1C8]/[0.05] blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="section-label">Track G · Commerce & consumer protection</div>
            <h1 className="section-heading mt-2.5 max-w-lg">Third parties, under continuous watch</h1>
            <p className="section-sub mt-3">Every authorised integration is verified against its declared purpose and approved scope. Risk is scored live and the response is graded — never just on or off.</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <span className="chip" style={{ color: live ? '#0B7A55' : '#92600A', borderColor: live ? '#0E9F6E44' : '#D9930D44', background: live ? '#0E9F6E0F' : '#D9930D0F' }}>
              <span className={`h-2 w-2 rounded-full ${live ? 'bg-[#0E9F6E] animate-pulseDot' : 'bg-[#D9930D] animate-blink'}`} />
              {live ? 'ENGINE NOMINAL' : 'DEMO DATA · OFFLINE'}
            </span>
            <Link href="/simulator" className="btn-accent">
              <Icon d={paths.play} size={15} /> Run attack demo
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <StatCard label="Integrations" value={String(stats.integrations)} sub="Registered third parties" />
        <StatCard label="Active" value={String(stats.active)} sub="Within purpose" tone="good" delta="up" />
        <StatCard label="Requests" value={Number(stats.monitoredRequests).toLocaleString()} sub="Verified by middleware" />
        <StatCard label="Threats" value={String(stats.threats)} sub="Graded responses issued" tone={stats.threats > 0 ? 'warn' : 'neutral'} />
        <StatCard label="Quarantined" value={String(stats.quarantined)} sub="Blocked + isolated" tone={stats.quarantined > 0 ? 'bad' : 'neutral'} />
      </div>

      {/* Map */}
      <IntegrationMap items={items} onSelect={(id) => router.push(`/integrations/${id}`)} />

      {/* Table + Timeline */}
      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <div className="section-card--numbered overflow-hidden">
          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-[#EAF0F5] px-5 py-4 md:px-6">
            <div>
              <div className="section-label-soft">Integration registry</div>
              <div className="h-section mt-0.5">Declared purpose vs live behaviour</div>
            </div>
            <Link href="/integrations" className="hidden shrink-0 font-mono text-[11px] font-semibold tracking-wide text-brand hover:underline md:block">View all →</Link>
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
                {items.map((it) => (
                  <tr key={it.id} className="data-table__row">
                    <td className="data-table__cell">
                      <Link href={`/integrations/${it.id}`} className="block">
                        <span className="font-semibold text-[#0A1830]">{it.name}</span>
                        <span className="block max-w-[220px] truncate text-[12px] text-[#64748B]">{it.purpose}</span>
                      </Link>
                    </td>
                    <td className="data-table__cell mono-num font-medium text-[#0A1830]">{it.requestsPerMin ?? '—'}</td>
                    <td className="data-table__cell"><RiskBadge score={it.risk_score ?? 0} size="sm" /></td>
                    <td className="data-table__cell"><StatusDot status={it.status} /></td>
                    <td className="data-table__cell mono-num text-[11px] text-[#8B9BB4]">{it.lastActivity ?? '—'}</td>
                    <td className="data-table__cell text-right md:px-6">
                      {(it.risk_score ?? 0) >= 61 && it.status !== 'QUARANTINED' ? (
                        <button onClick={() => quarantine(it.id)} disabled={quarantining === it.id} className="btn-danger !px-3 !py-1.5 !text-[12px]">
                          {quarantining === it.id ? '…' : 'Quarantine'}
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

        <div className="section-card--numbered overflow-hidden">
          <div className="relative z-10 border-b border-[#EAF0F5] px-5 py-4 md:px-6">
            <div className="section-label-soft">Security timeline</div>
            <div className="h-section mt-0.5">Graded response as it happened</div>
          </div>
          <EventTimeline events={events.slice(0, 6)} compact />
        </div>
      </div>

      {/* Graded Response */}
      <div className="section-card--numbered overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-[#EAF0F5] px-5 py-4 md:px-6">
          <div className="section-label-soft">Graded response — why not just block</div>
          <span className="font-mono text-[10.5px] tracking-[0.16em] text-[#8B9BB4]">ALLOW → MONITOR → THROTTLE → ISOLATE</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 px-5 pb-5 pt-4 md:px-6">
          {[
            ['0-30', 'TRUSTED', 'Allow', '#0E9F6E', 'Matches declared purpose and scope'],
            ['31-60', 'WATCH', 'Allow + Monitor', '#D9930D', 'Endpoint or purpose drift detected'],
            ['61-80', 'HIGH RISK', 'Rate limit + Monitor', '#F59E0B', 'Forbidden data or volume anomaly'],
            ['81-100', 'CRITICAL', 'Block + Quarantine', '#E5484D', 'Sustained abuse, isolated until review'],
          ].map(([range, tier, action, color, desc]) => (
            <div key={tier} className="rounded-xl border border-[#E4EAF3] bg-[#FAFBFC] p-4 transition-all hover:-translate-y-[2px] hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: color }}>{range}</span>
              </div>
              <div className="mt-1.5 font-bold text-[14px] text-[#0A1830]">{tier}</div>
              <div className="mt-0.5 text-[12px] font-semibold text-[#374151]">{action}</div>
              <div className="mt-2 text-[12px] leading-relaxed text-[#64748B]">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalise(r: IntegrationRow): IntegrationRow {
  return { ...r, requestsPerMin: r.requestsPerMin ?? r.expected_request_rate ?? 90, lastActivity: r.lastActivity ?? (r.updated_at ? timeAgo(r.updated_at) : 'just now') };
}

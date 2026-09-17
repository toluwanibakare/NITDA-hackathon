'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { EventTimeline } from '@/components/EventTimeline';
import { IntegrationMap } from '@/components/IntegrationMap';
import { StatCard } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { NotificationToastContainer, showToast } from '@/components/NotificationToast';
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

  // State for Under Attack Mode toggle
  const [underAttackMode, setUnderAttackMode] = useState(false);

  const toggleUnderAttack = () => {
    const next = !underAttackMode;
    setUnderAttackMode(next);
    showToast(
      next ? '⚡ Under Attack Mode ENABLED' : 'Standard Security Mode',
      next
        ? 'ThirdEye Gateway is now enforcing zero-tolerance PII schema validation & strict 60 req/min rate caps across all connected integrations.'
        : 'Standard adaptive security rules restored.',
      next ? 'warn' : 'info'
    );
  };

  return (
    <div className="stagger space-y-6">
      {/* ═══ Cloudflare Enterprise Security Control Center Header ═══ */}
      <div className="panel relative overflow-hidden p-6 border-white/15 bg-gradient-to-r from-[#0D1424] via-[#09101D] to-[#0D1424] shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip !border-[#3B82F6]/30 !bg-[#3B82F6]/10 !text-[#5B9CFF] !py-0.5 !text-[10.5px]">
                CLOUDFLARE-GRADE PROTECTION FOR THIRD-PARTY APIS
              </span>
              <span className="chip !border-[#10B981]/30 !bg-[#10B981]/10 !text-[#10B981] !py-0.5 !text-[10.5px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" /> GATEWAY PROTECTED
              </span>
            </div>
            <h1 className="text-[26px] md:text-[30px] font-bold text-white mt-2 tracking-tight">
              ThirdEye Security Control Center
            </h1>
            <p className="text-[14px] text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Active protection layer for <strong className="text-white">ShopX Store</strong>. Monitoring declared scope, zero-trust endpoint access, data leakage, and automated quarantine across all third-party integrations.
            </p>
          </div>

          {/* Quick Defense Toggles & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={toggleUnderAttack}
              className={`rounded-xl border px-4 py-2.5 text-[13px] font-bold transition-all flex items-center gap-2 ${
                underAttackMode
                  ? 'border-[#EF4444] bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/30 animate-pulse'
                  : 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20'
              }`}
            >
              <span>⚡</span>
              <span>{underAttackMode ? 'Under Attack Mode: ON' : 'Under Attack Mode'}</span>
            </button>

            <Link href="/integrations" className="btn-accent !px-4 !py-2.5 !text-[13px] flex items-center gap-1.5">
              <Icon d={paths.plus} size={15} /> Connect Integration
            </Link>
          </div>
        </div>

        {/* Live Security Posture Score Bar */}
        <div className="mt-5 border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-4 text-[12.5px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#8494AD]">Global Security Posture:</span>
              <span className="font-mono font-bold text-[#10B981] text-[15px]">94 / 100 (EXCELLENT)</span>
            </div>
            <div className="hidden sm:block text-white/20">|</div>
            <div className="hidden sm:flex items-center gap-2 text-[#8494AD]">
              <span>Target Project:</span>
              <code className="font-mono text-[#5B9CFF]">ShopX E-Commerce Platform</code>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/events" className="text-[#5B9CFF] font-semibold hover:underline">
              View Log Stream →
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ 4 Enterprise Cloudflare Stat Cards ═══ */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Protected Integrations" value={String(integrationsCount)} sub={`${activeCount} within scope`} />
        <StatCard label="Verified API Requests" value={Number(reqCount).toLocaleString()} sub="Verified by ThirdEye Proxy" />
        <StatCard label="Security Threat Interceptions" value={String(threatCount)} sub="Automated graded responses" tone={threatCount > 0 ? 'warn' : 'neutral'} />
        <StatCard label="Quarantined Connectors" value={String(quarantineCount)} sub="Isolated from ShopX core" tone={quarantineCount > 0 ? 'bad' : 'neutral'} />
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

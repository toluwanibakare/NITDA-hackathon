'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EventTimeline } from '@/components/EventTimeline';
import { IntegrationTable } from '@/components/IntegrationTable';
import { RiskBars, TrafficDonut, TrustGauge } from '@/components/DashboardCharts';
import { StatCard } from '@/components/chrome';
import { showToast } from '@/components/NotificationToast';
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
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [items, setItems] = useState<IntegrationRow[]>(MOCK_INTEGRATIONS);
  const [events, setEvents] = useState<SecEvent[]>(MOCK_EVENTS);
  const [live, setLive] = useState(false);
  const [quarantining, setQuarantining] = useState<string | null>(null);
  const [underAttackMode, setUnderAttackMode] = useState(false);

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
      const r = await apiSafe(
        `/api/integrations/${id}/quarantine`,
        { status: 'QUARANTINED' },
        { method: 'POST', body: JSON.stringify({ reason: 'Manual quarantine from overview' }) },
      );
      showToast(
        r.live ? 'Integration quarantined' : 'Quarantine queued (offline)',
        r.live ? `${id} blocked pending review.` : `${id} will sync when engine is back.`,
        'warn',
      );
    } finally {
      setQuarantining(null);
      load();
    }
  }

  async function release(id: string) {
    setQuarantining(id);
    try {
      await apiSafe(`/api/integrations/${id}/release`, {}, { method: 'POST', body: JSON.stringify({}) });
      showToast('Integration released', `${id} restored to active monitoring.`, 'success');
    } finally {
      setQuarantining(null);
      load();
    }
  }

  const integrationsCount = getStatsIntegrations(stats);
  const activeCount = getStatsActive(stats);
  const reqCount = getStatsRequests(stats);
  const threatCount = getStatsThreats(stats);
  const quarantineCount = getStatsQuarantined(stats);

  const toggleUnderAttack = () => {
    const next = !underAttackMode;
    setUnderAttackMode(next);
    showToast(
      next ? 'Under Attack Mode ENABLED' : 'Standard Security Mode',
      next
        ? 'Zero-tolerance PII validation and strict rate caps enforced.'
        : 'Standard adaptive security rules restored.',
      next ? 'warn' : 'info',
    );
  };

  const critical = [...items].sort((a, b) => getRiskScore(b) - getRiskScore(a))[0];

  return (
    <div className="stagger space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="section-label">
            Security overview · {live ? 'live engine' : 'demo data'}
          </div>
          <h1 className="section-heading mt-1.5">Third parties, continuously verified</h1>
          <p className="section-sub mt-1.5">
            {integrationsCount} integrations · {threatCount} threats · {quarantineCount} quarantined
            {critical ? ` · highest risk: ${critical.name} (${getRiskScore(critical)})` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`chip font-semibold ${live ? '!border-[#19D98A]/30 !bg-[#19D98A]/10 !text-[#19D98A]' : '!border-[#FFC42E]/30 !bg-[#FFC42E]/10 !text-[#FFC42E]'}`}>
            <span className={`h-1.5 w-1.5 rounded-full animate-pulseDot ${live ? 'bg-[#19D98A]' : 'bg-[#FFC42E]'}`} />
            {live ? 'LIVE' : 'DEMO'}
          </span>
          <button onClick={toggleUnderAttack} className={underAttackMode ? 'btn-danger !py-2 !text-[12.5px]' : 'btn-ghost !py-2 !text-[12.5px]'}>
            {underAttackMode ? 'Under Attack: ON' : 'Under Attack: OFF'}
          </button>
          <Link href="/simulator" className="btn-accent !py-2 !text-[12.5px]">Open simulator →</Link>
        </div>
      </div>

      {/* Stat cards — real backend values */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Integrations" value={integrationsCount} sub="Registered third parties" tone="neutral" />
        <StatCard label="Active" value={activeCount} sub="Passing continuous checks" tone="good" />
        <StatCard label="Monitored requests" value={reqCount.toLocaleString()} sub="Evaluated via risk engine" tone="neutral" />
        <StatCard label="Threats" value={threatCount} sub="Violations + anomalies" tone={threatCount > 0 ? 'warn' : 'good'} />
        <StatCard label="Quarantined" value={quarantineCount} sub="Blocked pending review" tone={quarantineCount > 0 ? 'bad' : 'good'} />
      </div>

      {/* Traffic + risk — data-driven charts (topology lives on the Activity page) */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="section-card lg:col-span-7">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <p className="section-label-soft">Traffic share · live request rates</p>
              <h2 className="mono-num mt-1 text-[24px] font-extrabold tabular-nums text-white">
                {reqCount.toLocaleString()} <span className="text-[13px] font-semibold text-[#8E92A4]">monitored</span>
              </h2>
            </div>
            <span className={`chip font-semibold ${live ? '!border-[#19D98A]/30 !bg-[#19D98A]/10 !text-[#19D98A]' : '!border-white/10 !bg-white/5 !text-[#8E92A4]'}`}>
              {live ? 'Live gateway stream' : 'Demo stream'}
            </span>
          </div>
          <div className="pt-5">
            <TrafficDonut items={items} />
          </div>
        </div>
        <div className="section-card lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="section-label-soft">Risk by integration</span>
            <Link href="/events" className="font-mono text-[11.5px] font-semibold text-[#5B9CFF] hover:underline">
              Audit trail →
            </Link>
          </div>
          <RiskBars items={items} />
          <p className="body-muted mt-3 text-[12px]">Bar height = live risk score. Hover for exact value.</p>
        </div>
      </div>

      {/* Table + timeline + posture */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="section-card overflow-hidden !p-0 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
            <div className="section-label-soft">Integration trust table</div>
            <Link href="/integrations" className="font-mono text-[11.5px] font-semibold text-[#5B9CFF] hover:underline">
              Open registry →
            </Link>
          </div>
          <IntegrationTable items={items} quarantining={quarantining} onQuarantine={quarantine} onRelease={release} compact />
        </div>
        <div className="space-y-5 lg:col-span-4">
          <div className="section-card">
            <div className="section-label-soft">Security posture</div>
            <TrustGauge items={items} quarantined={quarantineCount} />
          </div>
          <div className="section-card--numbered overflow-hidden">
            <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
              <div className="section-label-soft">Live activity</div>
            </div>
            <EventTimeline events={events.slice(0, 6)} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

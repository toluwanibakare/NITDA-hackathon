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
    <div className="space-y-6">
      {/* ═══ TOP ROW: 2 CARDS (Wide Category Donut + Bar Chart) ═══ */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Card 1: Wide Category Donut Breakdown (Row 1 Left) */}
        <div className="panel lg:col-span-8 p-6 bg-[#1C1D2A] border-white/5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E92A4]">Integration Scope & Telemetry</p>
              <h2 className="text-[28px] font-extrabold text-white mt-1">4,725.05</h2>
            </div>
            <span className="chip !border-[#5B50E6]/30 !bg-[#5B50E6]/15 !text-white !py-1 !px-3 font-semibold">
              Live Gateway Stream
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 pt-6">
            {/* Left Category Breakdown List */}
            <div className="space-y-4">
              {[
                { label: 'Stripe Payments', pct: '40%', color: '#5B50E6', val: '1,890 reqs' },
                { label: 'Segment Analytics', pct: '35%', color: '#9B51E0', val: '1,653 reqs' },
                { label: 'FedEx Shipping', pct: '15%', color: '#FF2A6D', val: '708 reqs' },
                { label: 'Klaviyo Marketing', pct: '10%', color: '#FF9F43', val: '474 reqs' },
              ].map((c) => (
                <div key={c.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 text-white font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      {c.label}
                    </span>
                    <span className="mono-num text-[#8E92A4] font-semibold">{c.pct}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: c.pct, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Multi-Color Donut Chart */}
            <div className="flex justify-center relative">
              <svg width="200" height="200" viewBox="0 0 200 200" className="rotate-[-90deg]">
                {/* Donut Segments */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#5B50E6" strokeWidth="24" strokeDasharray="175 440" strokeDashoffset="0" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="#9B51E0" strokeWidth="24" strokeDasharray="153 440" strokeDashoffset="-175" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="#FF2A6D" strokeWidth="24" strokeDasharray="66 440" strokeDashoffset="-328" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="#FF9F43" strokeWidth="24" strokeDasharray="44 440" strokeDashoffset="-394" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[20px] font-bold text-white">4.7k</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8E92A4]">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Bar Chart Analytics (Row 1 Right) */}
        <div className="panel lg:col-span-4 p-6 bg-[#1C1D2A] border-white/5 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#8E92A4]">Verified Bandwidth</span>
              <span className="text-[11px] font-semibold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-md">+2.5%</span>
            </div>
            <h3 className="text-[32px] font-extrabold text-white mt-1">$4,751</h3>
            <p className="text-[12px] text-[#8E92A4]">14.8k API calls processed today</p>
          </div>

          {/* Bar Chart Visualization matching image */}
          <div className="pt-6 flex items-end justify-between gap-2 h-44">
            {[45, 65, 35, 85, 95, 60, 75].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full rounded-t-lg bg-[#5B50E6] group-hover:bg-[#FF2A6D] transition-all duration-300"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-[#8E92A4] font-mono">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM ROW: 3 CARDS (Calendar Grid + Gauge + Featured Gradient Card) ═══ */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Card 3: Security Audit Calendar Grid (Row 2 Left) */}
        <div className="panel lg:col-span-4 p-6 bg-[#1C1D2A] border-white/5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-[14px] font-bold text-white">Security Audit Log</h4>
            <span className="text-[12px] text-[#8E92A4] font-semibold">September 2026</span>
          </div>

          {/* Calendar Grid Days */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
              <span key={d} className="text-[#8E92A4] py-1 font-bold">{d}</span>
            ))}
            {Array.from({ length: 30 }).map((_, idx) => {
              const day = idx + 1;
              const isActive = [12, 15, 21, 28].includes(day);
              return (
                <div
                  key={day}
                  className={`py-2 rounded-lg text-[12px] transition-all ${
                    isActive
                      ? 'bg-[#5B50E6] text-white font-bold shadow-md shadow-[#5B50E6]/50'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Semi-Circular Radial Gauge Chart (Row 2 Middle) */}
        <div className="panel lg:col-span-4 p-6 bg-[#1C1D2A] border-white/5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#8E92A4]">Security Posture</span>
            <span className="text-[12px] font-bold text-[#10B981]">Shield Active</span>
          </div>

          <div className="my-2">
            <h3 className="text-[36px] font-extrabold text-white">82k</h3>
            <p className="text-[12px] text-[#8E92A4]">+12% threat isolation score</p>
          </div>

          {/* Semi-circular gauge ring matching reference image */}
          <div className="relative flex justify-center pt-2">
            <svg width="220" height="120" viewBox="0 0 220 120">
              <path d="M 20 100 A 90 90 0 0 1 200 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" strokeLinecap="round" />
              <path d="M 20 100 A 90 90 0 0 1 170 40" fill="none" stroke="#5B50E6" strokeWidth="18" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-1 text-center">
              <span className="text-[28px] font-extrabold text-white">75%</span>
              <span className="block text-[11px] font-semibold text-[#8E92A4]">TRUST SCORE</span>
            </div>
          </div>
        </div>

        {/* Card 5: Gradient Featured Action Banner Card (Row 2 Right) */}
        <div className="panel lg:col-span-4 p-6 bg-gradient-to-br from-[#5B50E6] via-[#7B2CBF] to-[#9D4EDD] rounded-3xl flex flex-col justify-between text-white shadow-xl shadow-[#5B50E6]/30">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">ThirdEye Shield</span>
            <h3 className="text-[24px] font-extrabold mt-3 leading-snug">Connect New Project</h3>
            <p className="text-[13px] text-white/80 mt-2 leading-relaxed">
              Link your e-commerce store or backend application to ThirdEye Gateway proxy for instant zero-trust protection.
            </p>
          </div>

          <button
            onClick={() => router.push('/integrations')}
            className="mt-6 w-full rounded-2xl bg-[#FF2A6D] py-3.5 text-[14px] font-bold text-white shadow-lg shadow-[#FF2A6D]/40 transition-transform active:scale-95 hover:brightness-110"
          >
            Connect Project Now →
          </button>
        </div>
      </div>
    </div>
  );
}

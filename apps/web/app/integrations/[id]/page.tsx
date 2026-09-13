'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EventTimeline } from '@/components/EventTimeline';
import { Icon, paths } from '@/components/icons';
import { RiskBadge, RiskRing, StatusDot } from '@/components/RiskBadge';
import { apiSafe, riskColor, type IntegrationRow, type SecEvent } from '@/lib/api';
import { MOCK_EVENTS, MOCK_INTEGRATIONS } from '@/lib/mock';

export default function IntegrationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<IntegrationRow | null>(null);
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const [p, ev] = await Promise.all([
      apiSafe<{ profile: IntegrationRow; recentViolations: SecEvent[] } | IntegrationRow>(
        `/api/integrations/${id}`, { profile: MOCK_INTEGRATIONS.find((m) => m.id === id) ?? MOCK_INTEGRATIONS[2], recentViolations: MOCK_EVENTS },
      ),
      apiSafe<SecEvent[]>(`/api/security-events?integrationId=${id}&limit=10`, MOCK_EVENTS.filter((e) => e.integration_id === id)),
    ]);
    const prof = (p.data as { profile?: IntegrationRow }).profile ?? (p.data as IntegrationRow);
    setProfile(prof);
    setEvents(ev.data.length ? ev.data : ((p.data as { recentViolations?: SecEvent[] }).recentViolations ?? []));
    setLive(p.live || ev.live);
  }, [id]);

  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, [load]);

  async function act(kind: 'quarantine' | 'release') {
    setBusy(true);
    try {
      await apiSafe(`/api/integrations/${id}/${kind}`, {}, { method: 'POST', body: JSON.stringify(kind === 'quarantine' ? { reason: 'Manual quarantine from trust profile' } : {}) });
      await load();
    } finally { setBusy(false); }
  }

  if (!profile) return <div className="section-card flex items-center justify-center py-20 text-[14px] text-[#64748B]">Loading trust profile…</div>;
  const score = profile.risk_score ?? 0;
  const c = riskColor(score);
  const current = (profile.requestsPerMin ?? profile.expected_request_rate ?? 100) as number;
  const normal = profile.expected_request_rate ?? 100;
  const deviation = (current / Math.max(1, normal)).toFixed(1);

  const series = [
    { t: '-50m', v: normal * 0.94 }, { t: '-40m', v: normal * 1.04 }, { t: '-30m', v: normal * 0.9 },
    { t: '-20m', v: normal * 1.6 }, { t: '-10m', v: normal * 4.2 }, { t: 'now', v: current },
  ];

  return (
    <div className="stagger space-y-6">
      {/* Back button */}
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 font-mono text-[12.5px] font-medium text-[#8B9BB4] transition-colors hover:text-[#0A1830]">
        <span className="rotate-180"><Icon d={paths.arrow} size={14} /></span> Back to registry
      </button>

      {/* ═══ Hero ═══ */}
      <div className="relative overflow-hidden rounded-[24px] border border-[#E4EAF3] bg-[#FFFFFF] p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] md:p-8">
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[24px]" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <RiskRing score={score} />
          <div className="min-w-0 flex-1">
            <div className="section-label">{profile.id} · {live ? 'live' : 'demo data'}</div>
            <h1 className="section-heading mt-2">{profile.name}</h1>
            <p className="section-sub mt-2">{profile.purpose}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <StatusDot status={profile.status} />
              <RiskBadge score={score} />
            </div>
          </div>
          <div className="flex gap-3">
            {profile.status === 'QUARANTINED' ? (
              <button onClick={() => act('release')} disabled={busy} className="btn-primary">
                <Icon d={paths.check} size={15} /> {busy ? '…' : 'Release integration'}
              </button>
            ) : (
              <button onClick={() => act('quarantine')} disabled={busy} className="btn-danger">
                <Icon d={paths.lock} size={15} /> {busy ? '…' : 'Quarantine'}
              </button>
            )}
            <Link href="/simulator" className="btn-ghost"><Icon d={paths.play} size={15} /> Simulate</Link>
          </div>
        </div>
        {profile.status === 'QUARANTINED' && (
          <div className="mt-5 rounded-xl border border-[#F0B4BB] bg-[#FEF2F2] px-5 py-4">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[#E5484D]"><Icon d={paths.alert} size={16} /> Quarantined — all future requests blocked</div>
            <p className="section-sub-soft mt-1.5 text-[13.5px]">
              Attempted data access outside registered purpose{events[0]?.reason ? `: ${events[0].reason}` : '.'} Review the violations below, then release or keep isolated.
            </p>
          </div>
        )}
      </div>

      {/* ═══ Two columns ═══ */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Scope */}
        <div className="section-card">
          <div className="section-label-soft mb-5">Trust profile — declared scope</div>
          <div className="space-y-5">
            {(() => { const scopes = [{ title: 'Allowed endpoints', items: profile.allowed_endpoints ?? [], tone: 'good' as const }, { title: 'Allowed methods', items: profile.allowed_methods ?? [], tone: 'neutral' as const }, { title: 'Allowed data', items: profile.allowed_data ?? [], tone: 'good' as const }, { title: 'Forbidden data', items: profile.forbidden_data ?? [], tone: 'bad' as const }]; return scopes.map(({ title, items, tone }) => <ScopeList key={title} title={title} items={items} tone={tone} />); })() }
          </div>
        </div>

        {/* Chart + Timeline */}
        <div className="space-y-5">
          <div className="section-card">
            <div className="flex items-baseline justify-between">
              <div className="section-label-soft">Behaviour — normal vs current</div>
              <span className="mono-num text-[12px] font-bold" style={{ color: c }}>{deviation}x deviation</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              {[['Normal', `${normal}/min`, '#8B9BB4'], ['Current', `${current}/min`, c], ['Deviation', `${deviation}x`, c]].map(([l, v, col]) => (
                <div key={l} className="rounded-xl border border-[#E4EAF3] bg-[#FAFBFC] px-3 py-3">
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#8B9BB4]">{l}</div>
                  <div className="mono-num mt-1 text-[16px] font-bold" style={{ color: col }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -18 }}>
                  <XAxis dataKey="t" tick={{ fill: '#8B9BB4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B9BB4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E4EAF3', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 16px rgba(16,24,40,0.1)' }} />
                  <Area type="monotone" dataKey="v" stroke={c} strokeWidth={2} fill={`${c}1E`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="section-card--numbered overflow-hidden">
            <div className="relative z-10 border-b border-[#EAF0F5] px-5 py-4">
              <div className="section-label-soft">Recent violations</div>
            </div>
            <EventTimeline events={events.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScopeList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'bad' | 'neutral' }) {
  const col = tone === 'good' ? '#0E9F6E' : tone === 'bad' ? '#E5484D' : '#8B9BB4';
  const mark = tone === 'bad' ? paths.cross : paths.check;
  return (
    <div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B9BB4]">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-[12.5px] text-[#64748B]">—</span>}
        {items.map((x) => (
          <span key={x} className="inline-flex items-center gap-1.5 rounded-full border border-[#E4EAF3] bg-[#FAFBFC] px-2.5 py-1 font-mono text-[11px] text-[#5A6B82]">
            <span style={{ color: col }}><Icon d={mark} size={12} /></span>{x}
          </span>
        ))}
      </div>
    </div>
  );
}

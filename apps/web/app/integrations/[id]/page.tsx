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
      await apiSafe(`/api/integrations/${id}/${kind}`, {}, {
        method: 'POST', body: JSON.stringify(kind === 'quarantine' ? { reason: 'Manual quarantine from trust profile' } : {}),
      });
      await load();
    } finally { setBusy(false); }
  }

  if (!profile) return <div className="body-muted py-16 text-center">Loading trust profile…</div>;
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
    <div className="stagger space-y-5">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 font-mono text-[11.5px] text-muted hover:text-ink">
        <span className="rotate-180"><Icon d={paths.arrow} size={14} /></span> BACK
      </button>

      <div className="panel relative overflow-hidden p-6">
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
        <div className="flex flex-wrap items-start gap-6">
          <RiskRing score={score} />
          <div className="min-w-[240px] flex-1">
            <div className="eyebrow">{profile.id} · {live ? 'live' : 'demo data'}</div>
            <h1 className="h-display mt-1">{profile.name}</h1>
            <p className="body-muted mt-1">{profile.purpose}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusDot status={profile.status} />
              <RiskBadge score={score} size="sm" />
            </div>
          </div>
          <div className="flex gap-2">
            {profile.status === 'QUARANTINED' ? (
              <button onClick={() => act('release')} disabled={busy} className="btn-primary">
                <Icon d={paths.check} size={14} /> {busy ? 'Working…' : 'Release integration'}
              </button>
            ) : (
              <button onClick={() => act('quarantine')} disabled={busy} className="btn-danger">
                <Icon d={paths.lock} size={14} /> {busy ? 'Working…' : 'Quarantine'}
              </button>
            )}
            <Link href="/simulator" className="btn-ghost"><Icon d={paths.play} size={14} /> Simulate</Link>
          </div>
        </div>

        {profile.status === 'QUARANTINED' && (
          <div className="mt-5 rounded-xl border border-critical/30 bg-critical/[0.07] p-4">
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-critical"><Icon d={paths.alert} size={15} /> Quarantined — all future requests blocked</div>
            <p className="body-muted mt-1 text-[12.5px]">
              Attempted data access outside registered purpose{(events[0]?.reason ? `: ${events[0].reason}` : '.')} Review the violations below, then release or keep isolated.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="eyebrow">Trust profile — declared scope</div>
          <div className="mt-3 space-y-4">
            <ScopeList title="Allowed endpoints" items={profile.allowed_endpoints ?? []} tone="good" />
            <ScopeList title="Allowed methods" items={profile.allowed_methods ?? []} tone="neutral" />
            <ScopeList title="Allowed data" items={profile.allowed_data ?? []} tone="good" />
            <ScopeList title="Forbidden data" items={profile.forbidden_data ?? []} tone="bad" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-baseline justify-between">
              <div className="eyebrow">Behaviour — normal vs current</div>
              <span className="mono-num text-[12px] font-semibold" style={{ color: c }}>{deviation}x deviation</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[['Normal', `${normal}/min`, '#8CA3BF'], ['Current', `${current}/min`, c], ['Deviation', `${deviation}x`, c]].map(([l, v, col]) => (
                <div key={l} className="rounded-xl border border-white/[0.07] bg-abyss/60 px-2 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{l}</div>
                  <div className="mono-num mt-1 text-[16px] font-semibold" style={{ color: col as string }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -18 }}>
                  <XAxis dataKey="t" tick={{ fill: '#5B7191', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5B7191', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0B1E35', border: '1px solid rgba(0,200,215,0.2)', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke={c} strokeWidth={2} fill={`${c}26`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-3.5">
              <div className="eyebrow">Recent violations</div>
            </div>
            <EventTimeline events={events.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScopeList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'bad' | 'neutral' }) {
  const col = tone === 'good' ? '#19D98A' : tone === 'bad' ? '#FF4D5E' : '#8CA3BF';
  const mark = tone === 'bad' ? paths.cross : paths.check;
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">{title}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="body-muted text-[12px]">—</span>}
        {items.map((x) => (
          <span key={x} className="chip !text-[11px]">
            <span style={{ color: col }}><Icon d={mark} size={12} /></span>{x}
          </span>
        ))}
      </div>
    </div>
  );
}

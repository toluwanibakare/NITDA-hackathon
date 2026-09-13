'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { RiskBadge, StatusDot } from '@/components/RiskBadge';
import { apiSafe, type IntegrationRow } from '@/lib/api';
import { MOCK_INTEGRATIONS } from '@/lib/mock';

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationRow[]>(MOCK_INTEGRATIONS);
  const [q, setQ] = useState('');
  const [live, setLive] = useState(false);

  useEffect(() => {
    apiSafe<IntegrationRow[]>('/api/integrations', MOCK_INTEGRATIONS).then((r) => {
      setItems(r.data.length ? r.data : MOCK_INTEGRATIONS);
      setLive(r.live);
    });
    const id = setInterval(() => {
      apiSafe<IntegrationRow[]>('/api/integrations', MOCK_INTEGRATIONS).then((r) => {
        if (r.data.length) setItems(r.data);
        setLive(r.live);
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const filtered = items.filter((i) =>
    `${i.name} ${i.purpose} ${i.id}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="stagger space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="eyebrow">Registry · {items.length} authorised integrations</div>
          <h1 className="h-display mt-1">What each partner can reach</h1>
          <p className="body-muted mt-1.5 max-w-2xl">
            Declared purpose, approved scope and live risk — the exposure map the company could never produce before.
          </p>
        </div>
        <span className="chip ml-auto">{live ? 'LIVE' : 'DEMO DATA'} · {filtered.length} SHOWN</span>
      </div>

      <div className="panel flex items-center gap-3 px-4 py-3">
        <span className="text-faint"><Icon d={paths.grid} size={16} /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, purpose or id…" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint" />
        {q && <button onClick={() => setQ('')} className="font-mono text-[11px] text-muted hover:text-ink">CLEAR</button>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No integrations match" body="Try a different filter. The registry itself is healthy." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((it) => (
            <Link key={it.id} href={`/integrations/${it.id}`} className="panel panel-hover group p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold group-hover:text-aqua">{it.name}</div>
                  <div className="body-muted mt-0.5 text-[12.5px]">{it.purpose}</div>
                  <div className="mono-num mt-1.5 text-[11px] text-faint">{it.id} · {(it.allowed_endpoints ?? []).length} endpoints</div>
                </div>
                <RiskBadge score={it.risk_score ?? 0} size="sm" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(it.allowed_endpoints ?? []).slice(0, 4).map((e) => (
                  <span key={e} className="chip !text-[10.5px]">{e}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                <StatusDot status={it.status} />
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-aqua">
                  OPEN TRUST PROFILE <Icon d={paths.arrow} size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

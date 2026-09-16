'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { RiskBadge, StatusDot } from '@/components/RiskBadge';
import { apiSafe, getAllowedEndpoints, getExpectedRate, getRiskScore, type IntegrationRow } from '@/lib/api';
import { MOCK_INTEGRATIONS } from '@/lib/mock';

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationRow[]>(MOCK_INTEGRATIONS);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'risk' | 'rate' | 'name'>('risk');
  const [live, setLive] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams();
    if (statusFilter !== 'ALL') query.set('status', statusFilter);
    if (q) query.set('search', q);
    query.set('sort', sortKey);

    apiSafe<IntegrationRow[]>(`/api/integrations?${query.toString()}`, MOCK_INTEGRATIONS).then((r) => {
      setItems(r.data.length ? r.data : MOCK_INTEGRATIONS);
      setLive(r.live);
    });
  }, [q, statusFilter, sortKey]);

  useEffect(() => {
    const id = setInterval(() => {
      apiSafe<IntegrationRow[]>('/api/integrations', MOCK_INTEGRATIONS).then((r) => {
        if (r.data.length) setItems(r.data);
        setLive(r.live);
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const filtered = items
    .filter((i) => {
      const matchText = `${i.name} ${i.purpose} ${i.id}`.toLowerCase().includes(q.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
      return matchText && matchStatus;
    })
    .sort((a, b) => {
      if (sortKey === 'risk') return getRiskScore(b) - getRiskScore(a);
      if (sortKey === 'rate') return getExpectedRate(b) - getExpectedRate(a);
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="stagger space-y-6">
      {/* ═══ Header ═══ */}
      <div className="relative">
        <div className="page-header__bar" />
        <div className="page-header">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="section-label">Registry · {filtered.length} authorised integrations</div>
              <h1 className="section-heading mt-2">What each partner can reach</h1>
              <p className="section-sub mt-2">
                Declared purpose, approved scope and live risk — the exposure map the company could never produce before.
              </p>
            </div>
            <span className="chip shrink-0 border-[#D1DBE8] bg-[#FFFFFF]">
              {live ? 'ENGINE NOMINAL' : 'DEMO DATA'} · {filtered.length} SHOWN
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Filter & Sort ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="panel flex flex-1 items-center gap-3 px-4 py-3 min-w-[280px]">
          <span className="text-[#8B9BB4]">
            <Icon d={paths.grid} size={16} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, purpose or id…"
            className="w-full bg-transparent text-[13.5px] text-[#0A1830] outline-none placeholder:text-[#A0AEC0]"
          />
          {q && (
            <button onClick={() => setQ('')} className="font-mono text-[11px] text-[#8B9BB4] hover:text-[#0A1830]">
              CLEAR
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="pill-nav !p-1">
            {['ALL', 'ACTIVE', 'QUARANTINED', 'MONITORED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`pill-nav__item !px-3 !py-1 !text-[11px] ${
                  statusFilter === st ? 'pill-nav__item--active' : ''
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="rounded-xl border border-[#D1DBE8] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#0A1830] outline-none shadow-sm"
          >
            <option value="risk">Sort: Highest Risk</option>
            <option value="rate">Sort: Highest Rate</option>
            <option value="name">Sort: Alphabetical</option>
          </select>
        </div>
      </div>

      {/* ═══ Cards ═══ */}
      {filtered.length === 0 ? (
        <EmptyState title="No integrations match" body="Try a different search query or status filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((it) => {
            const score = getRiskScore(it);
            const endpoints = getAllowedEndpoints(it);
            return (
              <Link
                key={it.id}
                href={`/integrations/${it.id}`}
                className="group relative overflow-hidden rounded-2xl border border-[#E4EAF3] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_30px_-12px_rgba(10,101,255,0.18)]"
              >
                <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-bold text-[#0A1830] group-hover:text-brand">{it.name}</div>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[#5A6B82]">{it.purpose}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#8B9BB4]">{it.id}</span>
                      <span className="text-[#C4CDD9]">·</span>
                      <span className="font-mono text-[11px] text-[#8B9BB4]">{endpoints.length} endpoints</span>
                    </div>
                  </div>
                  <RiskBadge score={score} size="sm" />
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {endpoints.slice(0, 4).map((e) => (
                    <span
                      key={e}
                      className="rounded-full border border-[#E4EAF3] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[10.5px] text-[#64748B]"
                    >
                      {e}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#EAF0F5] pt-3.5">
                  <StatusDot status={it.status} />
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-brand group-hover:gap-2">
                    OPEN TRUST PROFILE <Icon d={paths.arrow} size={13} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


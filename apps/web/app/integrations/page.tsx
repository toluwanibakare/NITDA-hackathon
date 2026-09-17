'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { RiskBadge, StatusDot } from '@/components/RiskBadge';
import { apiSafe, getAllowedEndpoints, getExpectedRate, getRiskScore, normaliseIntegration, type IntegrationRow } from '@/lib/api';
import { MOCK_INTEGRATIONS } from '@/lib/mock';

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationRow[]>(MOCK_INTEGRATIONS);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'risk' | 'rate' | 'name'>('risk');
  const [live, setLive] = useState(false);

  // Backend: GET /api/integrations?status&search&sort → IntegrationRow[] dual-cased.
  // We still filter/sort client-side for instant UX while backend also filters.
  useEffect(() => {
    const query = new URLSearchParams();
    if (statusFilter !== 'ALL') query.set('status', statusFilter);
    if (q) query.set('search', q);
    query.set('sort', sortKey);

    apiSafe<IntegrationRow[]>(`/api/integrations?${query.toString()}`, MOCK_INTEGRATIONS).then((r) => {
      setItems((r.data.length ? r.data : MOCK_INTEGRATIONS).map(normaliseIntegration));
      setLive(r.live);
    });
  }, [q, statusFilter, sortKey]);

  useEffect(() => {
    const id = setInterval(() => {
      apiSafe<IntegrationRow[]>('/api/integrations', MOCK_INTEGRATIONS).then((r) => {
        if (r.data.length) setItems(r.data.map(normaliseIntegration));
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
            <span className="chip shrink-0">
              {live ? 'ENGINE NOMINAL' : 'DEMO DATA'} · {filtered.length} SHOWN
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Filter & Sort ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="panel flex items-center gap-3 px-4 py-3 w-full sm:flex-1 min-w-0">
          <span style={{ color: '#64748B' }}>
            <Icon d={paths.grid} size={16} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, purpose or id…"
            className="w-full bg-transparent text-[13.5px] text-[#F5F9FF] outline-none placeholder:text-[#5B6B85]"
          />
          {q && (
            <button onClick={() => setQ('')} className="font-mono text-[11px] hover:text-white" style={{ color: '#8B9BB4' }}>
              CLEAR
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Status Filter Buttons */}
          <div className="pill-nav !p-1 flex-nowrap overflow-x-auto max-w-full">
            {['ALL', 'ACTIVE', 'QUARANTINED', 'MONITORED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`pill-nav__item shrink-0 !px-3 !py-1 !text-[11px] ${
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
            onChange={(e) => setSortKey(e.target.value as 'risk' | 'rate' | 'name')}
            className="rounded-xl border px-3 py-2 text-[12.5px] font-semibold outline-none shadow-sm w-full sm:w-auto"
            style={{ borderColor: 'rgba(245,249,255,0.16)', background: '#0E1A33', color: '#F5F9FF' }}
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((it) => {
            const score = getRiskScore(it);
            const endpoints = getAllowedEndpoints(it);
            return (
              <Link
                key={it.id}
                href={`/integrations/${it.id}`}
                className="group relative overflow-hidden rounded-2xl border p-6 transition-[border-color,background] duration-150 active:scale-[0.99]"
                style={{ borderColor: 'rgba(245,249,255,0.10)', background: 'linear-gradient(180deg, rgba(245,249,255,0.03), rgba(245,249,255,0.01)), #0E1A33' }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-150 group-hover:opacity-100" style={{ background: 'rgba(22,119,255,0.55)' }} />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold text-[#F5F9FF] transition-colors duration-150 group-hover:text-[#5B9CFF]" style={{ letterSpacing: '-0.01em' }}>{it.name}</div>
                    <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: '#94A3B8' }}>{it.purpose}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="font-mono text-[11px]" style={{ color: '#64748B' }}>{it.id}</span>
                      <span style={{ color: '#334155' }}>·</span>
                      <span className="font-mono text-[11px]" style={{ color: '#64748B' }}>{endpoints.length} endpoints</span>
                    </div>
                  </div>
                  <RiskBadge score={score} size="sm" />
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {endpoints.slice(0, 4).map((e) => (
                    <span
                      key={e}
                      className="rounded-full border px-2 py-0.5 font-mono text-[10.5px]"
                      style={{ borderColor: 'rgba(245,249,255,0.10)', background: 'rgba(245,249,255,0.04)', color: '#94A3B8' }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3.5" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
                  <StatusDot status={it.status} />
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5B9CFF]">
                    OPEN TRUST PROFILE <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5"><Icon d={paths.arrow} size={13} /></span>
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

'use client';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { EmptyState } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import { IntegrationTable } from '@/components/IntegrationTable';
import { showToast } from '@/components/NotificationToast';
import { RiskBadge, StatusDot } from '@/components/RiskBadge';
import {
  api,
  apiSafe,
  getAllowedEndpoints,
  getExpectedRate,
  getRiskScore,
  normaliseIntegration,
  type IntegrationRow,
} from '@/lib/api';

const MARKETPLACE_CATALOG = [
  {
    id: 'stripe_pay',
    name: 'Stripe Payments',
    category: 'Payments',
    purpose: 'Process online checkout payments, card tokens and refunds for ShopX.',
    allowedEndpoints: ['/payments', '/refunds'],
    allowedMethods: ['POST'],
    allowedData: ['amount', 'currency', 'order_id'],
    forbiddenData: ['full_card_number', 'cvv', 'raw_password'],
    expectedRate: 150,
  },
  {
    id: 'segment_analytics',
    name: 'Segment Analytics',
    category: 'Analytics',
    purpose: 'Collect anonymous storefront clickstream metrics and user session events.',
    allowedEndpoints: ['/analytics/events', '/pageviews'],
    allowedMethods: ['POST'],
    allowedData: ['event_type', 'session_id', 'timestamp'],
    forbiddenData: ['payment_info', 'phone_number', 'customer_address'],
    expectedRate: 200,
  },
  {
    id: 'fedex_delivery',
    name: 'FedEx Shipping',
    category: 'Logistics & Delivery',
    purpose: 'Generate package tracking numbers, shipping rates and dispatch orders.',
    allowedEndpoints: ['/delivery/shipments', '/rates'],
    allowedMethods: ['GET', 'POST'],
    allowedData: ['order_id', 'shipping_address', 'weight_kg'],
    forbiddenData: ['payment_token', 'password_hash'],
    expectedRate: 80,
  },
  {
    id: 'klaviyo_marketing',
    name: 'Klaviyo Marketing',
    category: 'Marketing',
    purpose: 'Send automated order receipt emails and promo campaign notifications.',
    allowedEndpoints: ['/campaigns/send', '/subscribers'],
    allowedMethods: ['POST'],
    allowedData: ['email', 'first_name', 'campaign_id'],
    forbiddenData: ['credit_card', 'bank_account'],
    expectedRate: 60,
  },
  {
    id: 'zendesk_support',
    name: 'Zendesk Support',
    category: 'Customer Support',
    purpose: 'Manage ShopX customer inquiry tickets and return requests.',
    allowedEndpoints: ['/support/tickets', '/order-status'],
    allowedMethods: ['GET', 'POST'],
    allowedData: ['ticket_id', 'customer_email', 'issue_type'],
    forbiddenData: ['payment_credentials', 'raw_ssn'],
    expectedRate: 50,
  },
];

function IntegrationsInner() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<IntegrationRow[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'risk' | 'rate' | 'name'>('risk');
  const [live, setLive] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('table');
  const [activeTab, setActiveTab] = useState<'registry' | 'marketplace'>('registry');
  const [connectModal, setConnectModal] = useState<(typeof MARKETPLACE_CATALOG)[0] | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (typeof urlQ === 'string') setQ(urlQ);
  }, [searchParams]);

  useEffect(() => {
    const query = new URLSearchParams();
    if (statusFilter !== 'ALL') query.set('status', statusFilter);
    if (q) query.set('search', q);
    query.set('sort', sortKey);

    apiSafe<IntegrationRow[]>(`/api/integrations?${query.toString()}`, []).then(r => {
      setItems(r.data.map(normaliseIntegration));
      setLive(r.live);
    });
  }, [q, statusFilter, sortKey]);

  useEffect(() => {
    const id = setInterval(() => {
      apiSafe<IntegrationRow[]>('/api/integrations', []).then(r => {
        setItems(r.data.map(normaliseIntegration));
        setLive(r.live);
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const filtered = items
    .filter(i => {
      const matchText = `${i.name} ${i.purpose} ${i.id}`.toLowerCase().includes(q.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
      return matchText && matchStatus;
    })
    .sort((a, b) => {
      if (sortKey === 'risk') return getRiskScore(b) - getRiskScore(a);
      if (sortKey === 'rate') return getExpectedRate(b) - getExpectedRate(a);
      return a.name.localeCompare(b.name);
    });

  // State for Project Connection
  const [projectConnected, setProjectConnected] = useState(true);
  const [projectName, setProjectName] = useState('ShopX Store');
  const [projectId, setProjectId] = useState('te_proj_shopx_99a8b7c6');
  const [showConnectProjectModal, setShowConnectProjectModal] = useState(false);
  const [projectStep, setProjectStep] = useState<1 | 2 | 3>(1);

  async function completeConnection(cat: (typeof MARKETPLACE_CATALOG)[0]) {
    setConnecting(true);
    const payload = {
      id: `${cat.id}_001`,
      name: cat.name,
      purpose: cat.purpose,
      expectedRequestRate: cat.expectedRate,
      allowedEndpoints: cat.allowedEndpoints,
      allowedMethods: cat.allowedMethods,
      allowedData: cat.allowedData,
      forbiddenData: cat.forbiddenData,
    };
    let saved: IntegrationRow | null = null;
    let engineLive = false;
    try {
      saved = await api<IntegrationRow>('/api/integrations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      engineLive = true;
    } catch {
      saved = {
        ...payload,
        status: 'ACTIVE',
        riskScore: 8,
        requestsPerMin: 12,
        expected_request_rate: cat.expectedRate,
        allowed_endpoints: cat.allowedEndpoints,
        allowed_methods: cat.allowedMethods,
        allowed_data: cat.allowedData,
        forbidden_data: cat.forbiddenData,
        lastActivity: 'Just connected (offline)',
      } as IntegrationRow;
    } finally {
      setConnecting(false);
    }
    if (saved)
      setItems(prev => [
        normaliseIntegration(saved as IntegrationRow),
        ...prev.filter(p => p.id !== (saved as IntegrationRow).id),
      ]);
    setConnectModal(null);
    setActiveTab('registry');
    showToast(
      engineLive ? 'Integration Connected!' : 'Integration staged (offline)',
      engineLive
        ? `Connected ${cat.name} to ${projectName}. Gateway route: https://gateway.thirdeye.sec/api/v1/${cat.id}`
        : `Engine offline — ${cat.name} staged locally and will sync on reconnect.`,
      engineLive ? 'success' : 'warn'
    );
  }

  function handleConnectProject() {
    const newId = `te_proj_${projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.random().toString(36).substring(2, 8)}`;
    setProjectId(newId);
    setProjectConnected(true);
    setShowConnectProjectModal(false);
    setProjectStep(1);
    setActiveTab('marketplace');
    showToast(
      `Project Connected!`,
      `Successfully linked "${projectName}" (${newId}) to ThirdEye Platform. Now browse and connect partner integrations.`,
      'success'
    );
  }

  return (
    <div className="stagger space-y-6">
      {/* ═══ Header ═══ */}
      <div className="relative">
        <div className="page-header__bar" />
        <div className="page-header">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="section-label">
                ThirdEye Platform Hub · {items.length} active connectors ·{' '}
                <span className={live ? 'text-[#19D98A]' : 'text-[#FFC42E]'}>
                  {live ? 'live' : 'demo data'}
                </span>
              </div>
              <h1 className="section-heading mt-2">Integrations & Marketplace</h1>
              <p className="section-sub mt-2">
                Connect your merchant project (like ShopX) to ThirdEye, browse pre-verified partner
                integrations, generate gateway routing keys, and monitor compliance in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowConnectProjectModal(true)}
                className="btn-accent flex items-center gap-2 !px-4 !py-2 !text-[13px] shadow-lg shadow-[#1677FF]/20"
              >
                <Icon d={paths.plus} size={15} />
                Connect Project to Platform
              </button>
              <button
                onClick={() => setActiveTab('registry')}
                className={`rounded-xl border px-4 py-2 text-[13px] font-semibold transition-colors ${
                  activeTab === 'registry'
                    ? 'border-[#1677FF] bg-[#1677FF] text-white'
                    : 'border-white/10 bg-white/5 text-[#93A1B8]'
                }`}
              >
                Active Registry ({items.length})
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`rounded-xl border px-4 py-2 text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'marketplace'
                    ? 'border-[#1677FF] bg-[#1677FF] text-white'
                    : 'border-white/10 bg-white/5 text-[#93A1B8]'
                }`}
              >
                <Icon d={paths.grid} size={14} /> Marketplace (+5)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Connected Project Status Banner ═══ */}
      <div className="panel relative overflow-hidden p-5 border-white/15 bg-gradient-to-r from-[#0E1A33] via-[#0A1224] to-[#0E1A33]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#1677FF]/40 bg-[#1677FF]/15 text-[#5B9CFF]">
              <Icon d={paths.shield} size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B9CFF]">
                  CONNECTED MERCHANT PROJECT
                </span>
                <span className="chip !border-[#19D98A]/30 !bg-[#19D98A]/10 !text-[#19D98A] !py-0.5 !text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#19D98A] animate-pulse" /> LIVE SHIELD ACTIVE
                </span>
              </div>
              <h2 className="mt-0.5 text-[18px] font-bold text-white">{projectName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[#8494AD]">
                <span>
                  Project Key: <code className="mono-num text-[#00C8D7]">{projectId}</code>
                </span>
                <span>•</span>
                <span>
                  Gateway Domain:{' '}
                  <code className="mono-num text-[#5B9CFF]">https://gateway.thirdeye.sec</code>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowConnectProjectModal(true)}
              className="btn-ghost !px-3.5 !py-2 !text-[12.5px] border-white/15"
            >
              Configure Project / Switch
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className="btn-accent !px-4 !py-2 !text-[12.5px]"
            >
              Search Partner APIs →
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'marketplace' ? (
        /* ═══ Marketplace Tab ═══ */
        <div className="space-y-5">
          <div className="section-card !py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="section-label-soft">Marketplace Catalog</p>
                <p className="h-section mt-0.5">Pre-verified partner integrations for {projectName}</p>
              </div>
              <span className="chip !text-[11px]">5 CONNECTORS AVAILABLE</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MARKETPLACE_CATALOG.map(cat => {
              const connected = items.some(i => i.name === cat.name);
              return (
                <div
                  key={cat.id}
                  className="panel relative flex flex-col justify-between overflow-hidden p-6 transition-all duration-150 hover:border-white/20"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="chip !text-[10px] uppercase">{cat.category}</span>
                        <h3 className="mt-2 text-[17px] font-bold text-white">{cat.name}</h3>
                      </div>
                      {connected ? (
                        <span className="chip !border-[#19D98A]/30 !bg-[#19D98A]/10 !text-[#19D98A]">
                          CONNECTED
                        </span>
                      ) : (
                        <span className="chip !border-[#5B9CFF]/30 !bg-[#5B9CFF]/10 !text-[#5B9CFF]">
                          READY
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[#94A3B8]">{cat.purpose}</p>

                    <div className="mt-4 space-y-2 border-t pt-3 border-white/10">
                      <div>
                        <span className="mono-num text-[10px] uppercase text-[#64748B]">
                          Scope Endpoints:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {cat.allowedEndpoints.map(e => (
                            <span
                              key={e}
                              className="rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] border-white/10 bg-white/5 text-[#94A3B8]"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setConnectModal(cat)}
                    className="btn-accent mt-5 w-full justify-center !py-2.5 !text-[13px]"
                  >
                    {connected ? 'Re-configure Integration' : `Connect to ${projectName} →`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ═══ Active Registry Tab ═══ */
        <>
          {/* ═══ Filter & Sort ═══ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="panel flex items-center gap-3 px-4 py-3 w-full sm:flex-1 min-w-0">
              <span style={{ color: '#64748B' }}>
                <Icon d={paths.grid} size={16} />
              </span>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Filter by name, purpose or id…"
                className="w-full bg-transparent text-[13.5px] text-[#F5F9FF] outline-none placeholder:text-[#5B6B85]"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="font-mono text-[11px] hover:text-white"
                  style={{ color: '#8B9BB4' }}
                >
                  CLEAR
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="pill-nav !p-1 flex-nowrap overflow-x-auto max-w-full">
                {['ALL', 'ACTIVE', 'QUARANTINED', 'MONITORED'].map(st => (
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

              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as 'risk' | 'rate' | 'name')}
                className="rounded-xl border px-3 py-2 text-[12.5px] font-semibold outline-none shadow-sm w-full sm:w-auto"
                style={{ borderColor: 'rgba(245,249,255,0.16)', background: '#0E1A33', color: '#F5F9FF' }}
              >
                <option value="risk">Sort: Highest Risk</option>
                <option value="rate">Sort: Highest Rate</option>
                <option value="name">Sort: Alphabetical</option>
              </select>
              <div className="pill-nav !p-1">
                {(['table', 'cards'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`pill-nav__item !px-3 !py-1 !text-[11px] uppercase ${view === v ? 'pill-nav__item--active' : ''}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No integrations match" body="Try a different search query or status filter." />
          ) : view === 'table' ? (
            <div className="section-card overflow-hidden !p-0">
              <IntegrationTable items={filtered} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(it => {
                const score = getRiskScore(it);
                const endpoints = getAllowedEndpoints(it);
                return (
                  <Link
                    key={it.id}
                    href={`/integrations/${it.id}`}
                    className="group relative overflow-hidden rounded-2xl border p-6 transition-[border-color,background] duration-150 active:scale-[0.99]"
                    style={{
                      borderColor: 'rgba(245,249,255,0.10)',
                      background:
                        'linear-gradient(180deg, rgba(245,249,255,0.03), rgba(245,249,255,0.01)), #0E1A33',
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      style={{ background: 'rgba(22,119,255,0.55)' }}
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[16px] font-semibold text-[#F5F9FF] transition-colors duration-150 group-hover:text-[#5B9CFF]"
                          style={{ letterSpacing: '-0.01em' }}
                        >
                          {it.name}
                        </div>
                        <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: '#94A3B8' }}>
                          {it.purpose}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="font-mono text-[11px]" style={{ color: '#64748B' }}>
                            {it.id}
                          </span>
                          <span style={{ color: '#334155' }}>·</span>
                          <span className="font-mono text-[11px]" style={{ color: '#64748B' }}>
                            {endpoints.length} endpoints
                          </span>
                        </div>
                      </div>
                      <RiskBadge score={score} size="sm" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {endpoints.slice(0, 4).map(e => (
                        <span
                          key={e}
                          className="rounded-full border px-2 py-0.5 font-mono text-[10.5px]"
                          style={{
                            borderColor: 'rgba(245,249,255,0.10)',
                            background: 'rgba(245,249,255,0.04)',
                            color: '#94A3B8',
                          }}
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                    <div
                      className="mt-4 flex items-center justify-between border-t pt-3.5"
                      style={{ borderColor: 'rgba(245,249,255,0.08)' }}
                    >
                      <StatusDot status={it.status} />
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5B9CFF]">
                        OPEN TRUST PROFILE{' '}
                        <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">
                          <Icon d={paths.arrow} size={13} />
                        </span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ CONNECT PROJECT TO THIRD EYE MODAL ═══ */}
      {showConnectProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-rise">
          <div
            className="panel max-w-xl w-full p-6 space-y-5 border-white/20"
            style={{ background: '#0A1224' }}
          >
            <div className="flex items-start justify-between border-b pb-4 border-white/10">
              <div>
                <span className="chip !text-[10px] uppercase text-[#1677FF] border-[#1677FF]/30 bg-[#1677FF]/10">
                  STEP {projectStep} OF 3
                </span>
                <h3 className="mt-1 text-[20px] font-bold text-white">Connect Your Project to ThirdEye</h3>
                <p className="text-[13px] text-[#8494AD]">
                  Connect your store or web app to start protecting third-party API traffic.
                </p>
              </div>
              <button
                onClick={() => setShowConnectProjectModal(false)}
                className="text-[#8494AD] hover:text-white"
              >
                ✕
              </button>
            </div>

            {projectStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#94A3B8] mb-1">
                    Project / Store Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. ShopX Store, Acme Market"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-[14px] text-white outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#94A3B8] mb-1">Environment</label>
                  <select className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-[14px] text-white outline-none focus:border-[#1677FF]">
                    <option>Production (Live Store)</option>
                    <option>Staging</option>
                    <option>Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#94A3B8] mb-1">
                    Store / Web App Base URL
                  </label>
                  <input
                    type="text"
                    defaultValue="https://shopx.store"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-[14px] text-white outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setShowConnectProjectModal(false)}
                    className="btn-ghost !px-4 !py-2 !text-[13px]"
                  >
                    Cancel
                  </button>
                  <button onClick={() => setProjectStep(2)} className="btn-accent !px-5 !py-2 !text-[13px]">
                    Next: Generate Key →
                  </button>
                </div>
              </div>
            )}

            {projectStep === 2 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#1677FF]/30 bg-[#1677FF]/10 p-4">
                  <div className="text-[12px] font-semibold text-[#5B9CFF]">
                    PROJECT GATEWAY KEY GENERATED
                  </div>
                  <div className="mono-num mt-1 text-[16px] font-bold text-white">
                    te_proj_{projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}_99a8b7c6
                  </div>
                  <p className="mt-1 text-[12px] text-[#8494AD]">
                    Use this project token in header{' '}
                    <code className="text-[#00C8D7]">X-ThirdEye-Project-Key</code>
                  </p>
                </div>

                <div>
                  <label className="section-label-soft">Gateway Middleware Snippet</label>
                  <pre className="mono-num mt-1 overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-3 text-[11.5px] text-[#19D98A]">
                    {`import { ThirdEyeGateway } from '@the-third-eye/sdk';

export const gateway = new ThirdEyeGateway({
  projectKey: 'te_proj_${projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}_99a8b7c6',
  gatewayUrl: 'https://gateway.thirdeye.sec',
  enforceRules: true
});`}
                  </pre>
                </div>

                <div className="pt-3 flex justify-between">
                  <button onClick={() => setProjectStep(1)} className="btn-ghost !px-4 !py-2 !text-[13px]">
                    ← Back
                  </button>
                  <button onClick={() => setProjectStep(3)} className="btn-accent !px-5 !py-2 !text-[13px]">
                    Test Connection →
                  </button>
                </div>
              </div>
            )}

            {projectStep === 3 && (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#19D98A]/40 bg-[#19D98A]/15 text-[#19D98A]">
                  <Icon d={paths.check} size={32} />
                </div>
                <h4 className="text-[20px] font-bold text-white">Connected & Protected!</h4>
                <p className="text-[13.5px] text-[#94A3B8] max-w-md mx-auto">
                  Project <span className="text-white font-semibold">{projectName}</span> is now linked to
                  ThirdEye Gateway. You can now search and connect partner APIs from the Marketplace catalog!
                </p>
                <div className="pt-4 flex justify-center">
                  <button onClick={handleConnectProject} className="btn-accent !px-6 !py-2.5 !text-[13.5px]">
                    Go to Marketplace & Connect APIs →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Connect Integration Modal ═══ */}
      {connectModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-rise">
          <div
            className="panel max-w-xl w-full p-6 space-y-5 border-white/20"
            style={{ background: '#0E1A33' }}
          >
            <div className="flex items-start justify-between border-b pb-4 border-white/10">
              <div>
                <span className="chip !text-[10px] uppercase">{connectModal.category}</span>
                <h3 className="mt-1 text-[20px] font-bold text-white">Connect {connectModal.name}</h3>
                <p className="text-[13px] text-[#8494AD]">{connectModal.purpose}</p>
              </div>
              <button onClick={() => setConnectModal(null)} className="text-[#8494AD] hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="section-label-soft">Generated Production API Key</label>
                <div className="mono-num mt-1 flex items-center justify-between rounded-xl border p-3 border-white/10 bg-black/40 text-[#00C8D7]">
                  <span>te_live_{connectModal.id}_98a7b6c5</span>
                  <span className="chip !text-[10px]" style={{ color: '#19D98A' }}>
                    ACTIVE
                  </span>
                </div>
              </div>

              <div>
                <label className="section-label-soft">ThirdEye Gateway Endpoint Route</label>
                <div className="mono-num mt-1 rounded-xl border p-3 border-white/10 bg-black/40 text-[#5B9CFF]">
                  https://gateway.thirdeye.sec/api/v1/{connectModal.id}
                </div>
              </div>

              <div>
                <label className="section-label-soft">{projectName} @the-third-eye/sdk Code Snippet</label>
                <pre className="mono-num mt-1 overflow-x-auto rounded-xl border p-3 text-[11.5px] leading-relaxed border-white/10 bg-black/60 text-[#19D98A]">
                  {`import { ThirdEye } from '@the-third-eye/sdk';

const thirdeye = new ThirdEye({
  projectKey: '${projectId}',
  apiKey: 'te_live_${connectModal.id}_98a7b6c5',
  integrationId: '${connectModal.id}_001'
});`}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4 border-white/10">
              <button onClick={() => setConnectModal(null)} className="btn-ghost !px-4 !py-2 !text-[13px]">
                Cancel
              </button>
              <button
                onClick={() => completeConnection(connectModal)}
                disabled={connecting}
                className="btn-accent !px-5 !py-2 !text-[13px] disabled:opacity-50"
              >
                {connecting ? 'Connecting…' : `Complete Connection & Connect to ${projectName} →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="section-card py-10 text-center text-[13px] text-[#8B9BB4]">Loading registry…</div>
      }
    >
      <IntegrationsInner />
    </Suspense>
  );
}

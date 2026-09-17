'use client';
import { useEffect, useMemo, useState } from 'react';
import { EventTimeline } from '@/components/EventTimeline';
import { EmptyState } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import {
  apiSafe,
  downloadAuditExport,
  getEventIntegrationId,
  normaliseEvent,
  type AuditVerifyResult,
  type SecEvent,
} from '@/lib/api';
import { MOCK_EVENTS } from '@/lib/mock';
import { isSupabaseEnvConfigured, supabaseBrowser } from '@/lib/supabaseClient';

export default function EventsPage() {
  const [events, setEvents] = useState<SecEvent[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState('all');
  const [live, setLive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    // Backend: GET /api/security-events?limit=50 → SecEvent[] dual-cased + SHA-256 hash chain
    apiSafe<SecEvent[]>('/api/security-events?limit=50', MOCK_EVENTS).then((r) => {
      setEvents((r.data.length ? r.data : MOCK_EVENTS).map(normaliseEvent));
      setLive(r.live);
    });
    const poll = setInterval(() => {
      apiSafe<SecEvent[]>('/api/security-events?limit=50', MOCK_EVENTS).then((r) => {
        if (r.data.length) setEvents(r.data.map(normaliseEvent));
      });
    }, 5000);
    let chan: { unsubscribe: () => void } | null = null;
    try {
      if (isSupabaseEnvConfigured()) {
        const sb = supabaseBrowser();
        chan = sb.channel('te-events-page')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, (payload) => {
            setEvents((prev) => [normaliseEvent(payload.new as SecEvent), ...prev].slice(0, 60));
          })
          .subscribe() as unknown as { unsubscribe: () => void };
      }
    } catch {
      /* polling fallback */
    }
    return () => {
      clearInterval(poll);
      chan?.unsubscribe();
    };
  }, []);

  async function verifyChain() {
    setVerifying(true);
    try {
      // Backend: GET /api/security-events/verify → {verified, integrity, chainLength, genesisHash, latestHash}
      const res = await apiSafe<AuditVerifyResult>('/api/security-events/verify', {
        verified: false,
        integrity: 'UNVERIFIED_OFFLINE',
        chainLength: events.length,
        genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
        latestHash: events[0]?.hash ?? 'offline',
        verifiedRecordsCount: 0,
        timestamp: new Date().toISOString(),
      });
      setVerifyResult(res.data);
    } finally {
      setVerifying(false);
    }
  }

  async function doExport(format: 'csv' | 'json') {
    setExporting(format);
    setExportError(null);
    try {
      await downloadAuditExport(format);
    } catch {
      setExportError('Export needs the backend online (GET /api/security-events/export). Reconnect and retry.');
    } finally {
      setExporting(null);
    }
  }

  const ids = useMemo(
    () => ['all', ...Array.from(new Set(events.map((e) => getEventIntegrationId(e))))],
    [events],
  );

  const shown = filter === 'all' ? events : events.filter((e) => getEventIntegrationId(e) === filter);
  const verified = verifyResult?.verified === true;

  return (
    <div className="stagger space-y-6">
      {/* ═══ Header ═══ */}
      <div className="relative">
        <div className="page-header__bar" />
        <div className="page-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="section-label">Audit trail · tamper-evident log {live ? '· live' : '· demo data'}</div>
              <h1 className="section-heading mt-2">Every violation, with its reason</h1>
              <p className="section-sub mt-2">
                Tamper-evident SHA-256 chain log detailing what happened, to which data, and why the engine responded that way.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <button
                onClick={verifyChain}
                disabled={verifying}
                className="btn-ghost !px-3.5 !py-2 !text-[12.5px] font-semibold"
              >
                <Icon d={paths.check} size={15} />
                {verifying ? 'Verifying SHA-256…' : 'Verify SHA-256 chain'}
              </button>
              <button
                onClick={() => doExport('csv')}
                disabled={exporting !== null}
                className="btn-accent !px-3.5 !py-2 !text-[12.5px] font-semibold disabled:opacity-60"
              >
                <Icon d={paths.arrow} size={14} className="rotate-90" />
                {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
              </button>
              <button
                onClick={() => doExport('json')}
                disabled={exporting !== null}
                className="btn-primary !px-3.5 !py-2 !text-[12.5px] font-semibold disabled:opacity-60"
              >
                {exporting === 'json' ? 'Exporting…' : 'Export JSON'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {exportError && (
        <div className="rounded-2xl border px-5 py-3.5 text-[13px]" style={{ borderColor: 'rgba(255,196,46,0.35)', background: 'rgba(255,196,46,0.07)', color: '#FFC42E' }}>
          {exportError}
        </div>
      )}

      {/* Verification Card */}
      {verifyResult && (
        <div className="rounded-2xl border p-5 transition-[border-color,background] duration-150 animate-rise" style={verified ? { borderColor: 'rgba(25,217,138,0.3)', background: 'rgba(25,217,138,0.06)' } : { borderColor: 'rgba(255,196,46,0.35)', background: 'rgba(255,196,46,0.06)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: verified ? '#19D98A' : '#FFC42E' }}>
                <Icon d={verified ? paths.check : paths.alert} size={16} />
              </span>
              <div>
                <div className="text-[14px] font-bold text-[#F5F9FF]">
                  Cryptographic Audit Chain: {verifyResult.integrity}
                </div>
                <div className="text-[12px]" style={{ color: '#8B9BB4' }}>
                  {verified ? `Verified ${verifyResult.verifiedRecordsCount} records · SHA-256 hash sequence unbroken.` : 'Offline — showing last known state. Reconnect to verify live chain.'}
                </div>
              </div>
            </div>
            <span className="font-mono text-[11px]" style={{ color: verified ? '#19D98A' : '#FFC42E' }}>
              Latest Hash: {verifyResult.latestHash.slice(0, 12)}…
            </span>
          </div>
        </div>
      )}

      {/* ═══ Filters ═══ */}
      <div className="pill-nav">
        {ids.map((id) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`pill-nav__item ${filter === id ? 'pill-nav__item--active' : ''}`}
          >
            {id === 'all' ? 'ALL INTEGRATIONS' : id.toUpperCase().replace('_001', '')}
          </button>
        ))}
      </div>

      {/* ═══ Timeline ═══ */}
      <div className="section-card--numbered overflow-hidden">
        <div className="relative z-10">
          {shown.length === 0 ? (
            <EmptyState title="No events for this filter" body="Traffic here is clean. Try another integration." />
          ) : (
            <EventTimeline events={shown} />
          )}
        </div>
      </div>
    </div>
  );
}

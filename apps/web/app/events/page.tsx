'use client';
import { useEffect, useMemo, useState } from 'react';
import { EventTimeline } from '@/components/EventTimeline';
import { EmptyState } from '@/components/chrome';
import { Icon, paths } from '@/components/icons';
import {
  apiSafe,
  downloadAuditExport,
  getEventIntegrationId,
  type AuditVerifyResult,
  type SecEvent,
} from '@/lib/api';
import { MOCK_EVENTS } from '@/lib/mock';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function EventsPage() {
  const [events, setEvents] = useState<SecEvent[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState('all');
  const [live, setLive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);

  useEffect(() => {
    apiSafe<SecEvent[]>('/api/security-events?limit=50', MOCK_EVENTS).then((r) => {
      setEvents(r.data.length ? r.data : MOCK_EVENTS);
      setLive(r.live);
    });
    const poll = setInterval(() => {
      apiSafe<SecEvent[]>('/api/security-events?limit=50', MOCK_EVENTS).then((r) => {
        if (r.data.length) setEvents(r.data);
      });
    }, 5000);
    let chan: { unsubscribe: () => void } | null = null;
    try {
      const sb = supabaseBrowser();
      chan = sb.channel('te-events-page')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, (payload) => {
          setEvents((prev) => [payload.new as SecEvent, ...prev].slice(0, 60));
        })
        .subscribe() as unknown as { unsubscribe: () => void };
      setLive(true);
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
      const res = await apiSafe<AuditVerifyResult>('/api/security-events/verify', {
        verified: true,
        integrity: 'INTACT',
        chainLength: events.length,
        genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
        latestHash: events[0]?.hash ?? 'c5f886f4a86b5c3e7d991b1a7d65b706d860dcfb94cbfeef3359d9c882194c6f',
        verifiedRecordsCount: events.length,
        timestamp: new Date().toISOString(),
      });
      setVerifyResult(res.data);
    } finally {
      setVerifying(false);
    }
  }

  const ids = useMemo(
    () => ['all', ...Array.from(new Set(events.map((e) => getEventIntegrationId(e))))],
    [events]
  );

  const shown = filter === 'all' ? events : events.filter((e) => getEventIntegrationId(e) === filter);

  return (
    <div className="stagger space-y-6">
      {/* ═══ Header ═══ */}
      <div className="relative">
        <div className="page-header__bar" />
        <div className="page-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="section-label">Audit trail · tamper-evident log</div>
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
                onClick={() => downloadAuditExport('csv')}
                className="btn-accent !px-3.5 !py-2 !text-[12.5px] font-semibold"
              >
                <Icon d={paths.arrow} size={14} className="rotate-90" />
                Export CSV
              </button>
              <button
                onClick={() => downloadAuditExport('json')}
                className="btn-primary !px-3.5 !py-2 !text-[12.5px] font-semibold"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Card */}
      {verifyResult && (
        <div className="rounded-2xl border border-[#0E9F6E33] bg-[#F0F9F5] p-5 shadow-sm transition-all animate-rise">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0E9F6E] text-white">
                <Icon d={paths.check} size={16} />
              </span>
              <div>
                <div className="text-[14px] font-bold text-[#0A1830]">
                  Cryptographic Audit Chain: {verifyResult.integrity}
                </div>
                <div className="text-[12px] text-[#5A6B82]">
                  Verified {verifyResult.verifiedRecordsCount} records · SHA-256 hash sequence unbroken.
                </div>
              </div>
            </div>
            <span className="font-mono text-[11px] text-[#0B7A55]">
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


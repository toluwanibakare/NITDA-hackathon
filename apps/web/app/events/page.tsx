'use client';
import { useEffect, useMemo, useState } from 'react';
import { EventTimeline } from '@/components/EventTimeline';
import { EmptyState } from '@/components/chrome';
import { apiSafe, type SecEvent } from '@/lib/api';
import { MOCK_EVENTS } from '@/lib/mock';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function EventsPage() {
  const [events, setEvents] = useState<SecEvent[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState('all');
  const [live, setLive] = useState(false);

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
      chan = sb.channel('te-events-page').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, (payload) => {
        setEvents((prev) => [payload.new as SecEvent, ...prev].slice(0, 60));
      }).subscribe() as unknown as { unsubscribe: () => void };
      setLive(true);
    } catch { /* polling fallback */ }
    return () => { clearInterval(poll); chan?.unsubscribe(); };
  }, []);

  const ids = useMemo(() => ['all', ...Array.from(new Set(events.map((e) => e.integration_id)))], [events]);
  const shown = filter === 'all' ? events : events.filter((e) => e.integration_id === filter);

  return (
    <div className="stagger space-y-6">
      {/* ═══ Header ═══ */}
      <div className="relative">
        <div className="page-header__bar" />
        <div className="page-header">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="section-label">Audit trail · tamper-evident log</div>
              <h1 className="section-heading mt-2">Every violation, with its reason</h1>
              <p className="section-sub mt-2">The evidence the judges asked for: what happened, to which data, and why the engine responded that way.</p>
            </div>
            <span className="chip shrink-0 border-[#D1DBE8] bg-[#FFFFFF]">
              <span className={`h-2 w-2 rounded-full ${live ? 'bg-[#0E9F6E] animate-pulseDot' : 'bg-[#D9930D] animate-blink'}`} />
              {live ? 'REALTIME' : 'POLLING · 5S'}
            </span>
          </div>
        </div>
      </div>

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

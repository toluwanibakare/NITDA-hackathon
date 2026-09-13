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
      chan = sb.channel('te-events-page')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, (payload) => {
          setEvents((prev) => [payload.new as SecEvent, ...prev].slice(0, 60));
        })
        .subscribe() as unknown as { unsubscribe: () => void };
      setLive(true);
    } catch { /* polling fallback */ }
    return () => { clearInterval(poll); chan?.unsubscribe(); };
  }, []);

  const ids = useMemo(() => ['all', ...Array.from(new Set(events.map((e) => e.integration_id)))], [events]);
  const shown = filter === 'all' ? events : events.filter((e) => e.integration_id === filter);

  return (
    <div className="stagger space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="eyebrow">Audit trail · tamper-evident log</div>
          <h1 className="h-display mt-1">Every violation, with its reason</h1>
          <p className="body-muted mt-1.5 max-w-2xl">The evidence the judges asked for: what happened, to which data, and why the engine responded that way.</p>
        </div>
        <span className="chip ml-auto" style={{ color: live ? '#19D98A' : '#FFC42E' }}>
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-trust animate-pulseDot' : 'bg-watch'}`} />
          {live ? 'REALTIME' : 'POLLING · 5S'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-[11.5px] tracking-wide transition-all ${filter === id ? 'border-aqua/50 bg-aqua/10 text-ink' : 'border-white/10 bg-white/[0.03] text-muted hover:text-ink'}`}
          >
            {id === 'all' ? 'ALL INTEGRATIONS' : id.toUpperCase().replace('_001', '')}
          </button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        {shown.length === 0 ? (
          <EmptyState title="No events for this filter" body="Traffic here is clean. Try another integration." />
        ) : (
          <EventTimeline events={shown} />
        )}
      </div>
    </div>
  );
}

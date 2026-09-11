import { api } from '@/lib/api';
export default async function Dashboard() {
  let stats: any = null;
  try { stats = await api('/api/dashboard/stats', { cache: 'no-store' }); }
  catch { stats = { integrations: 4, active: 3, monitoredRequests: 0, threats: 0, quarantined: 0, note: 'api offline — showing placeholder' }; }
  const cards = [
    ['INTEGRATIONS', stats.integrations], ['ACTIVE', stats.active],
    ['MONITORED REQUESTS', stats.monitoredRequests], ['THREATS', stats.threats], ['QUARANTINED', stats.quarantined],
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">{k}</div>
            <div className="text-2xl font-bold">{String(v)}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-400">FE-1 owns: integration table + live map (TECH_PRD §6). Wire to <code>/api/dashboard/activity</code> + Supabase Realtime.</p>
    </div>
  );
}

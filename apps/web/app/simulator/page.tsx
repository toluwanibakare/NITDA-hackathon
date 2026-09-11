'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
const PHASES = [
  { label: 'Phase 1 normal', endpoint: '/analytics/events', dataRequested: ['event'], requestCount: 95 },
  { label: 'Phase 2 suspicious', endpoint: '/customers/profile', dataRequested: ['event'], requestCount: 300 },
  { label: 'Phase 3 attack', endpoint: '/customers/payment-details', dataRequested: ['payment', 'phone', 'address'], requestCount: 800 },
  { label: 'Phase 4 critical', endpoint: '/customers/payment-details', dataRequested: ['payment', 'phone', 'address'], requestCount: 1780 },
];
export default function Simulator() {
  const [log, setLog] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  async function start() {
    setRunning(true); setLog([]);
    for (const p of PHASES) {
      try {
        const r = await api('/api/check-request', { method: 'POST', body: JSON.stringify({ integrationId: 'analytics_001', method: 'GET', ...p }) });
        setLog((l) => [...l, { phase: p.label, ...r }]);
      } catch (e: any) { setLog((l) => [...l, { phase: p.label, error: e.message }]); }
      await new Promise((r) => setTimeout(r, 800));
    }
    setRunning(false);
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Attack Simulator</h1>
      <button disabled={running} onClick={start} className="rounded bg-red-600 px-4 py-2 font-bold disabled:opacity-50">{running ? 'ATTACKING…' : 'START ATTACK (Credential Compromise)'}</button>
      <div className="space-y-2">{log.map((e, i) => (
        <pre key={i} className="rounded border border-white/10 bg-black/50 p-3 text-xs overflow-auto">{JSON.stringify(e, null, 2)}</pre>
      ))}</div>
    </div>
  );
}

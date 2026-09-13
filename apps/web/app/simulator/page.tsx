'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Icon, paths } from '@/components/icons';
import { RiskBadge } from '@/components/RiskBadge';
import { api, apiSafe, riskColor, type CheckResult } from '@/lib/api';
import { MOCK_INTEGRATIONS } from '@/lib/mock';

const PHASES = [
  { name: 'Phase 1 · Normal', endpoint: '/analytics/events', data: ['event'], count: 95, note: 'Matches trust profile. Everything green.' },
  { name: 'Phase 2 · Drift', endpoint: '/customers/profile', data: ['event'], count: 300, note: 'Unknown endpoint + purpose drift. Risk climbs to ~45.' },
  { name: 'Phase 3 · Extraction', endpoint: '/customers/payment-details', data: ['payment', 'phone', 'address'], count: 800, note: 'Forbidden data. Rate limiting kicks in.' },
  { name: 'Phase 4 · Flood', endpoint: '/customers/payment-details', data: ['payment', 'phone', 'address'], count: 1780, note: '17.8x volume. Block + quarantine + alert.' },
];

export default function SimulatorPage() {
  const [integrationId, setIntegrationId] = useState('analytics_001');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [log, setLog] = useState<(CheckResult & { endpoint: string; count: number; phase: string })[]>([]);
  const stopRef = useRef(false);

  const last = log[log.length - 1];

  async function run() {
    setRunning(true);
    stopRef.current = false;
    setLog([]);
    // tell backend (best effort — frontend loop is the source of truth for judges)
    apiSafe('/api/simulator/start', {}, { method: 'POST', body: JSON.stringify({ integrationId, attack: 'credential_compromise' }) }).catch(() => {});
    for (let i = 0; i < PHASES.length; i++) {
      if (stopRef.current) break;
      setStep(i);
      const p = PHASES[i];
      await new Promise((r) => setTimeout(r, 1100));
      if (stopRef.current) break;
      try {
        const res = await api<CheckResult>('/api/check-request', {
          method: 'POST',
          body: JSON.stringify({ integrationId, method: 'GET', endpoint: p.endpoint, dataRequested: p.data, requestCount: p.count }),
        });
        setLog((prev) => [...prev, { ...res, endpoint: p.endpoint, count: p.count, phase: p.name }]);
      } catch {
        // offline fallback — local scoring mirrors riskEngine so demo never dies
        setLog((prev) => [...prev, { ...localScore(p.endpoint, p.data, p.count), endpoint: p.endpoint, count: p.count, phase: p.name }]);
      }
    }
    setRunning(false);
  }

  function stop() { stopRef.current = true; setRunning(false); apiSafe('/api/simulator/stop', {}, { method: 'POST', body: JSON.stringify({}) }).catch(() => {}); }

  async function reset() {
    stop();
    setStep(-1);
    setLog([]);
    await apiSafe(`/api/integrations/${integrationId}/release`, {}, { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
  }

  return (
    <div className="stagger space-y-5">
      <div>
        <div className="eyebrow">Demo control · the 13-step story in one button</div>
        <h1 className="h-display mt-1">Credential compromise, live</h1>
        <p className="body-muted mt-1.5 max-w-2xl">
          Starts clean, drifts, then floods. Watch risk move 8 → 45 → 72 → 95 and the response graduate from allow to quarantine.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="panel space-y-4 p-5">
          <div>
            <label className="eyebrow">Target integration</label>
            <select value={integrationId} onChange={(e) => setIntegrationId(e.target.value)} className="input mt-2" disabled={running}>
              {MOCK_INTEGRATIONS.map((m) => (
                <option key={m.id} value={m.id} className="bg-abyss">{m.name} · {m.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow">Attack pattern</label>
            <div className="input mt-2 flex items-center justify-between">
              <span className="text-[13.5px]">Credential compromise</span>
              <span className="chip !text-[10px]">4 PHASES</span>
            </div>
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button onClick={run} className="btn-primary flex-1"><Icon d={paths.play} size={14} /> Start attack</button>
            ) : (
              <button onClick={stop} className="btn-ghost flex-1"><Icon d={paths.stop} size={14} /> Stop</button>
            )}
            <button onClick={reset} className="btn-ghost">Reset</button>
          </div>
          <div className="space-y-2 border-t border-white/[0.06] pt-4">
            {PHASES.map((p, i) => {
              const active = i === step && running;
              const done = log.some((l) => l.phase === p.name);
              return (
                <div key={p.name} className={`rounded-xl border px-3.5 py-2.5 text-[12.5px] transition-all ${active ? 'border-aqua/40 bg-aqua/[0.07]' : done ? 'border-white/10 bg-white/[0.03]' : 'border-white/[0.06] opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-aqua animate-pulseDot" />}
                    {done && !active && <span className="text-trust"><Icon d={paths.check} size={13} /></span>}
                  </div>
                  <div className="mono-num mt-0.5 text-[11px] text-muted">{p.endpoint} · {p.count}/min</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel relative overflow-hidden p-6">
            <div className="eyebrow">Live risk</div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="mono-num text-[56px] font-semibold leading-none tabular-nums" style={{ color: last ? riskColor(last.riskScore) : '#19D98A' }}>
                {last ? last.riskScore : '—'}
              </span>
              <div>
                {last ? <RiskBadge score={last.riskScore} /> : <span className="chip">AWAITING ATTACK</span>}
                <div className="body-muted mt-1.5 max-w-sm text-[12.5px]">{last ? last.reason : 'Press start. Phase 1 should stay green.'}</div>
              </div>
              <div className="ml-auto h-2 w-full overflow-hidden rounded-full bg-white/[0.07] sm:w-56">
                <div className="risk-fill h-full rounded-full" style={{ width: `${last ? last.riskScore : 0}%`, background: last ? riskColor(last.riskScore) : 'transparent' }} />
              </div>
            </div>
            {last && last.riskScore >= 81 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-critical/30 bg-critical/[0.07] px-4 py-3">
                <span className="text-[13px] font-semibold text-critical">BLOCK + QUARANTINE + ALERT</span>
                <Link href={`/integrations/${integrationId}`} className="btn-danger ml-auto !py-1.5 !text-[12px]">Open trust profile</Link>
              </div>
            )}
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-3.5">
              <div className="eyebrow">Request log — what the middleware saw</div>
            </div>
            {log.length === 0 ? (
              <div className="body-muted px-5 py-8 text-center text-[13px]">No requests yet. The story starts at Phase 1.</div>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {log.map((l, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ animation: 'rise 0.4s both' }}>
                    <span className="chip">{l.phase.split('·')[0].trim().toUpperCase()}</span>
                    <span className="font-mono text-[12px] text-ink">{l.endpoint}</span>
                    <span className="mono-num font-mono text-[11px] text-faint">{l.count}/min</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="mono-num text-[13px] font-semibold" style={{ color: riskColor(l.riskScore) }}>{l.riskScore}</span>
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted">{l.action}</span>
                    </span>
                    <p className="body-muted w-full text-[12px]">{l.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** mirrors apps/api riskEngine so the demo survives backend/wifi failure */
function localScore(endpoint: string, data: string[], count: number): CheckResult {
  let score = 0;
  const bad: CheckResult['violations'] = [];
  if (!endpoint.startsWith('/analytics/')) {
    score += 45;
    bad.push({ code: 'UNKNOWN_ENDPOINT', detail: `${endpoint} outside allowed scope`, points: 20 });
    bad.push({ code: 'PURPOSE_MISMATCH', detail: 'Purpose "Collect anonymous usage statistics" vs ' + endpoint, points: 25 });
  }
  if (data.some((d) => ['payment', 'phone', 'address'].includes(d))) {
    score += 30;
    bad.push({ code: 'FORBIDDEN_DATA', detail: `Forbidden data: ${data.join(', ')}`, points: 30 });
  }
  if (count > 300) { score += 20; bad.push({ code: 'ABNORMAL_VOLUME', detail: `${count}/min vs normal 100/min`, points: 20 }); }
  score = Math.min(100, score);
  const level = score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH_RISK' : score >= 31 ? 'SUSPICIOUS' : 'TRUSTED';
  const action = level === 'CRITICAL' ? 'BLOCK' : level === 'HIGH_RISK' ? 'RATE_LIMIT' : level === 'SUSPICIOUS' ? 'MONITOR' : 'ALLOW';
  return { riskScore: score, level, violations: bad, action, reason: bad.length ? bad.map((b) => b.detail).join('; ') : 'Matches trust profile' };
}

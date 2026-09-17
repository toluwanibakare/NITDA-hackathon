'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Icon, paths } from '@/components/icons';
import { RiskBadge } from '@/components/RiskBadge';
import { api, apiSafe, getSimulatorTarget, riskColor, type CheckResult, type SimulatorPhase, type SimulatorStartResponse } from '@/lib/api';
import { MOCK_INTEGRATIONS } from '@/lib/mock';

const FALLBACK_PHASES: SimulatorPhase[] = [
  { phase: 1, name: 'Normal Operation', endpoint: '/analytics/events', method: 'GET', dataRequested: ['event'], requestCount: 95, expectedRisk: 5, expectedAction: 'ALLOW' },
  { phase: 2, name: 'Endpoint Probe (Reconnaissance)', endpoint: '/customers/profile', method: 'GET', dataRequested: ['event'], requestCount: 300, expectedRisk: 45, expectedAction: 'MONITOR' },
  { phase: 3, name: 'Sensitive Data Exfiltration Surge', endpoint: '/customers/payment-details', method: 'GET', dataRequested: ['payment', 'phone'], requestCount: 800, expectedRisk: 75, expectedAction: 'RATE_LIMIT' },
  { phase: 4, name: 'Full Breach Spike & Auto-Quarantine', endpoint: '/customers/payment-details', method: 'GET', dataRequested: ['payment', 'phone', 'address'], requestCount: 1780, expectedRisk: 95, expectedAction: 'BLOCK' },
];

export default function SimulatorPage() {
  const [integrationId, setIntegrationId] = useState('analytics_001');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [phases, setPhases] = useState<SimulatorPhase[]>(FALLBACK_PHASES);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [liveEngine, setLiveEngine] = useState(true);
  const [log, setLog] = useState<(CheckResult & { endpoint: string; count: number; phase: string })[]>([]);
  const stopRef = useRef(false);
  const last = log[log.length - 1];
  const progress = log.length / Math.max(1, phases.length);

  async function run() {
    setRunning(true);
    stopRef.current = false;
    setLog([]);
    setStep(-1);
    // Backend: POST /api/simulator/start {integrationId, attack} → {sessionId, integrationId, status, phases}
    try {
      const started = await api<SimulatorStartResponse>('/api/simulator/start', { method: 'POST', body: JSON.stringify({ integrationId, attack: 'credential_compromise' }) });
      if (started.phases?.length) setPhases(started.phases);
      setSessionId(started.sessionId ?? null);
      setLiveEngine(true);
      void getSimulatorTarget(started, integrationId);
    } catch {
      setPhases(FALLBACK_PHASES);
      setSessionId(null);
      setLiveEngine(false);
    }
    const activePhases = phases.length ? phases : FALLBACK_PHASES;
    for (let i = 0; i < activePhases.length; i++) {
      if (stopRef.current) break;
      setStep(i);
      const p = activePhases[i];
      await new Promise((r) => setTimeout(r, 1100));
      if (stopRef.current) break;
      try {
        // Backend: POST /api/check-request {integrationId, method, endpoint, dataRequested, requestCount} → {riskScore, level, violations, action, reason}
        const res = await api<CheckResult>('/api/check-request', { method: 'POST', body: JSON.stringify({ integrationId, method: p.method ?? 'GET', endpoint: p.endpoint, dataRequested: p.dataRequested, requestCount: p.requestCount }) });
        setLog((prev) => [...prev, { ...res, endpoint: p.endpoint, count: p.requestCount, phase: `Phase ${p.phase} · ${p.name}` }]);
      } catch {
        setLiveEngine(false);
        const fb = FALLBACK_PHASES[i] ?? p;
        setLog((prev) => [...prev, { ...localScore(fb.endpoint, fb.dataRequested, fb.requestCount), endpoint: fb.endpoint, count: fb.requestCount, phase: `Phase ${fb.phase} · ${fb.name}` }]);
      }
    }
    setRunning(false);
  }

  function stop() {
    stopRef.current = true;
    setRunning(false);
    apiSafe('/api/simulator/stop', {}, { method: 'POST', body: JSON.stringify(sessionId ? { sessionId } : {}) }).catch(() => {});
  }

  async function reset() {
    stop();
    setStep(-1);
    setLog([]);
    setSessionId(null);
    // Backend supports both POST /api/simulator/reset and POST /api/integrations/:id/release — try reset first.
    const r = await apiSafe('/api/simulator/reset', null, { method: 'POST', body: JSON.stringify({ integrationId }) });
    if (!r.live) {
      await apiSafe(`/api/integrations/${integrationId}/release`, {}, { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    }
  }

  return (
    <div className="stagger space-y-6">
      {/* ═══ Header ═══ */}
      <div className="relative">
        <div className="page-header__bar" />
        <div className="page-header">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="section-label">Demo control · the 13-step story in one button {liveEngine ? '' : '· offline sim'}</div>
              <h1 className="section-heading mt-2">Credential compromise, live</h1>
              <p className="section-sub mt-2">Starts clean, drifts, then floods. Watch risk move 8 → 45 → 75 → 95 and the response graduate from allow to quarantine.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {!running ? (
                <button onClick={run} className="btn-accent"><Icon d={paths.play} size={15} /> Start attack</button>
              ) : (
                <button onClick={stop} className="btn-ghost"><Icon d={paths.stop} size={15} /> Stop</button>
              )}
              <button onClick={reset} className="btn-ghost">Reset</button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="section-card !py-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-mono uppercase tracking-[0.16em]" style={{ color: '#7D8DA8' }}>Attack progress</span>
          <span className="mono-num font-bold" style={{ color: last ? riskColor(last.riskScore) : '#7D8DA8' }}>{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full" style={{ background: 'rgba(245,249,255,0.08)' }}>
          <div className="risk-fill h-full rounded-full" style={{ width: `${progress * 100}%`, background: last ? riskColor(last.riskScore) : '#1677FF' }} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* ═══ Controls ═══ */}
        <div className="space-y-4">
          <div className="section-card">
            <div className="space-y-4">
              <div>
                <label className="section-label-soft">Target integration</label>
                <select value={integrationId} onChange={(e) => setIntegrationId(e.target.value)} className="input mt-2" disabled={running}>
                  {MOCK_INTEGRATIONS.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: '#0E1A33' }}>{m.name} · {m.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="section-label-soft">Attack pattern</label>
                <div className="input mt-2 flex items-center justify-between">
                  <span className="text-[13.5px] text-[#F5F9FF]">Credential compromise</span>
                  <span className="chip !text-[10.5px]">4 PHASES</span>
                </div>
              </div>
              <div className="space-y-2 border-t pt-4" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
                {phases.map((p, i) => {
                  const label = `Phase ${p.phase} · ${p.name}`;
                  const active = i === step && running;
                  const done = log.some((l) => l.phase === label);
                  return (
                    <div key={label} className="rounded-xl border px-4 py-2.5 text-[12.5px] transition-[border-color,background,opacity] duration-150" style={active ? { borderColor: 'rgba(22,119,255,0.45)', background: 'rgba(22,119,255,0.10)' } : done ? { borderColor: 'rgba(245,249,255,0.14)', background: 'rgba(245,249,255,0.03)' } : { borderColor: 'rgba(245,249,255,0.08)', opacity: 0.55 }}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#F5F9FF]">{label}</span>
                        {active && <span className="h-2 w-2 rounded-full bg-[#1677FF] animate-pulseDot" />}
                        {done && !active && <span style={{ color: '#19D98A' }}><Icon d={paths.check} size={13} /></span>}
                      </div>
                      <div className="mono-num mt-0.5 text-[11px]" style={{ color: '#7D8DA8' }}>{p.endpoint} · {p.requestCount}/min · → {p.expectedRisk}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Results ═══ */}
        <div className="space-y-5">
          <div className="section-card relative overflow-hidden">
            <div className="section-label-soft">Live risk {liveEngine ? '' : '(offline estimate)'}</div>
            <div className="mt-2 flex flex-wrap items-center gap-5">
              <span className="mono-num text-[48px] font-bold tabular-nums leading-none md:text-[52px]" style={{ color: last ? riskColor(last.riskScore) : '#3A4A63' }}>
                {last ? last.riskScore : '—'}
              </span>
              <div className="flex-1">
                {last ? <RiskBadge score={last.riskScore} /> : <span className="chip">AWAITING ATTACK</span>}
                <div className="section-sub-soft mt-1.5 max-w-sm">{last ? last.reason : 'Press start. Phase 1 should stay green.'}</div>
                {last && (
                  <div className="mono-num mt-1 text-[11px]" style={{ color: '#64748B' }}>level {last.level} · action {last.action}{last.violations?.length ? ` · ${last.violations.length} violations` : ''}</div>
                )}
              </div>
              <div className="ml-auto h-2 w-full max-w-[200px] overflow-hidden rounded-full sm:max-w-[280px]" style={{ background: 'rgba(245,249,255,0.08)' }}>
                <div className="risk-fill h-full rounded-full" style={{ width: `${last ? last.riskScore : 0}%`, background: last ? riskColor(last.riskScore) : 'transparent' }} />
              </div>
            </div>
            {last && last.riskScore >= 81 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: 'rgba(255,77,94,0.4)', background: 'rgba(255,77,94,0.08)' }}>
                <span className="text-[13px] font-bold" style={{ color: '#FF8090' }}>BLOCK + QUARANTINE + ALERT</span>
                <Link href={`/integrations/${integrationId}`} className="btn-danger ml-auto !py-1.5 !text-[12px]">Open trust profile</Link>
              </div>
            )}
          </div>

          <div className="section-card--numbered overflow-hidden">
            <div className="relative z-10 border-b px-5 py-4" style={{ borderColor: 'rgba(245,249,255,0.08)' }}>
              <div className="section-label-soft">Request log — what the middleware saw</div>
            </div>
            {log.length === 0 ? (
              <div className="section-sub-soft px-5 py-8 text-center text-[13px]">No requests yet. The story starts at Phase 1.</div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'rgba(245,249,255,0.07)' }}>
                {log.map((l, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ animation: 'rise 0.18s cubic-bezier(0.23,1,0.32,1) both' }}>
                    <span className="chip">{l.phase.split('·')[0].trim().toUpperCase()}</span>
                    <span className="font-mono text-[12px] text-[#F5F9FF]">{l.endpoint}</span>
                    <span className="mono-num text-[11px]" style={{ color: '#7D8DA8' }}>{l.count}/min</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="mono-num text-[13px] font-bold" style={{ color: riskColor(l.riskScore) }}>{l.riskScore}</span>
                      <span className="rounded-md border px-1.5 py-0.5 font-mono text-[10px]" style={{ borderColor: 'rgba(245,249,255,0.12)', background: 'rgba(245,249,255,0.04)', color: '#94A3B8' }}>{l.action}</span>
                    </span>
                    <p className="section-sub-soft w-full">{l.reason}</p>
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

function localScore(endpoint: string, data: string[], count: number): CheckResult {
  let score = 0;
  const bad: CheckResult['violations'] = [];
  if (!endpoint.startsWith('/analytics/')) { score += 45; bad.push({ code: 'UNKNOWN_ENDPOINT', detail: `${endpoint} outside allowed scope`, points: 20 }); bad.push({ code: 'PURPOSE_MISMATCH', detail: 'Purpose vs ' + endpoint, points: 25 }); }
  if (data.some((d) => ['payment', 'phone', 'address'].includes(d))) { score += 30; bad.push({ code: 'FORBIDDEN_DATA', detail: `Forbidden data: ${data.join(', ')}`, points: 30 }); }
  if (count > 300) { score += 20; bad.push({ code: 'ABNORMAL_VOLUME', detail: `${count}/min vs normal 100/min`, points: 20 }); }
  score = Math.min(100, score);
  const level = score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH_RISK' : score >= 31 ? 'SUSPICIOUS' : 'TRUSTED';
  const action = level === 'CRITICAL' ? 'BLOCK' : level === 'HIGH_RISK' ? 'RATE_LIMIT' : level === 'SUSPICIOUS' ? 'MONITOR' : 'ALLOW';
  return { riskScore: score, level, violations: bad, action, reason: bad.length ? bad.map((b) => b.detail).join('; ') : 'Matches trust profile' };
}

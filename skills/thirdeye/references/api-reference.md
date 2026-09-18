# ThirdEye API reference (condensed)

Base: `THIRDEYE_API_URL` (default `http://localhost:4000`). Full suite:
`apps/api/thirdeye_postman_collection.json`. Discovery: `GET /api`.

## POST /api/check-request (core guard)

Request (`CheckRequest`):

```json
{
  "integrationId": "analytics_001",
  "method": "GET",
  "endpoint": "/customers/payment-details",
  "dataRequested": ["payment", "phone"],
  "requestCount": 1780,
  "timestamp": "2026-09-11T14:30:00Z",
  "contextEvent": "none"
}
```

`contextEvent`: `none | black_friday | campaign_launch | known_spike` (−20, floor 0).

Response (`CheckResult`):

```json
{
  "riskScore": 95,
  "level": "CRITICAL",
  "violations": [{ "code": "FORBIDDEN_DATA", "detail": "...", "points": 30 }],
  "action": "ALLOW | MONITOR | RATE_LIMIT | BLOCK",
  "reason": "..."
}
```

Scoring: unknown integration +50 (BLOCK) · unknown endpoint +20 ·
purpose mismatch +25 · forbidden data +30 · new method +10 ·
abnormal volume (>3x rate) +20 · unusual time (0-5h) +5 · cap 100.
Levels: 0-30 TRUSTED→ALLOW, 31-60 SUSPICIOUS→MONITOR,
61-80 HIGH_RISK→RATE_LIMIT, 81-100 CRITICAL→BLOCK+QUARANTINE.
Quarantined integrations BLOCK all future calls until released.
Unknown `integrationId` returns 200+BLOCK (not 404). Missing
`integrationId/endpoint/method` returns 400 `INVALID_REQUEST`.

## Integrations

- `POST /api/integrations` → 201. Body: `{id,name,purpose,allowedEndpoints[],allowedMethods[],allowedData[],forbiddenData[],expectedRequestRate}`. Id lowercased, endpoints normalized to leading `/`.
- `GET /api/integrations[?status&search&sort]` → list.
- `GET /api/integrations/:id` → `{profile, behaviour{normalRate,currentRate,deviationMultiple}, recentViolations[5]}`. 404 `NOT_FOUND`.
- `GET /api/integrations/:id/history` → 6 trend points `{t,v,volume,risk,normalRate}`.
- `PATCH /api/integrations/:id` → `{purpose?, expectedRequestRate?, status?}`.
- `POST /api/integrations/:id/quarantine {reason}` → `{status:QUARANTINED, riskScore:95}`.
- `POST /api/integrations/:id/release` → `{status:ACTIVE, riskScore:8}`.

## Events / dashboard / simulator

- `GET /api/security-events?integrationId=&limit=50` → events (with `hash/prevHash` SHA-256 chain).
- `GET /api/security-events/:id`, `GET /api/security-events/verify` → `{verified, integrity:INTACT}`,
  `GET /api/security-events/export?format=csv|json`, `GET /api/security-events/stats`.
- `GET /api/dashboard/stats` → `{integrations, active, monitoredRequests, threats, quarantined}` (+ aliases).
- `GET /api/dashboard/activity?limit=20` → merged feed.
- `POST /api/simulator/start {integrationId, attack, speed}` → `{sessionId, phases[4]}`;
  `POST /api/simulator/stop {sessionId}`; `POST /api/simulator/reset {integrationId}`.
- `GET /healthz` → `{ok:true, service:thirdeye-api}`.

Errors: `{error, code}` with 400 validation / 404 `NOT_FOUND` / 500.

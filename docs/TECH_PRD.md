# ThirdEye — Technical PRD (Build Spec)

**Product:** ThirdEye (ex-TrustGuard) — ICSC 2nd Edition, Team G1
**Idea in one line:** ThirdEye watches your third parties — continuously verifies authorized integrations stay within intended purpose + approved scope, then progressively restricts them when behaviour turns risky.
**Timeline:** 8 days | **Team:** 4 devs (2 BE, 2 FE) | **Demo:** live deploy
**Product PRD:** `./prd.md` (product truth) — this file is the **engineering truth**.

---

## 1. Locked stack

| Layer         | Choice                                                    | Why                                                      |
| ------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| Frontend      | Next.js 14 App Router + TypeScript + Tailwind + Recharts  | Fast, Vercel-native, PRD §22 compliant                   |
| Backend       | Node.js + Express + TypeScript                            | Team strength, faster than Next API routes for this team |
| DB + Realtime | Supabase Postgres + Supabase Realtime + supabase-js       | No Prisma, no Socket.io server to maintain               |
| Deploy        | Vercel (web) + Render/Railway (api) + Supabase (db)       | Live demo requirement                                    |
| Monorepo      | npm workspaces: `apps/web`, `apps/api`, `packages/shared` | One clone, shared types, independent deploys             |

> Rule: frontend **never** talks to Supabase directly for writes. All writes go through Express. Frontend may subscribe to Supabase Realtime for reads only (events/requests) to keep dashboard live with zero socket code.

---

## 2. Repo layout (target)

```
thirdeye/
  package.json (workspaces)
  .env.example
  prd.md (product) — both specs live in `docs/`
  TECH_PRD.md (this file)
  packages/shared/src/index.ts (TrustProfile, CheckRequest, CheckResult, SecurityEvent, Action, RiskLevel)
  apps/api/ (Express)
    src/index.ts (boot, cors, routes)
    src/supabase.ts (service-role client)
    src/lib/riskEngine.ts (pure checkRequest)
    src/routes/{integrations,check,events,dashboard,simulator}.ts
    src/simulator.ts (attack phase generator)
  apps/web/ (Next.js)
    app/{dashboard,integrations/[id],events,simulator,settings,page.tsx}
    components/{RiskBadge,StatCard,IntegrationMap,EventTimeline,TrustProfileCard}.tsx
    lib/{api.ts,supabaseClient.ts,types.ts (re-export shared)}
  supabase/
    migrations.sql (tables + RLS + realtime publication)
    seed.sql (4 integrations + permissions)
```

---

## 3. Data model (Supabase Postgres)

Keep to **4 tables** for speed. Skip `behaviour_profiles` table — fold `expected_request_rate` into `integrations`.

```sql
-- integrations
id text primary key, -- e.g. 'analytics_001'
name text not null,
purpose text not null,
status text not null default 'ACTIVE', -- ACTIVE | MONITORED | RATE_LIMITED | QUARANTINED
risk_score int not null default 0,
expected_request_rate int not null default 100,
created_at timestamptz default now(), updated_at timestamptz default now()

-- permissions (1 row per allowed endpoint+method+data)
id uuid primary key default gen_random_uuid(),
integration_id text references integrations(id) on delete cascade,
endpoint text not null, method text not null, -- GET|POST|PUT|DELETE
data_category text not null, access_level text not null default 'allow' -- allow|deny

-- requests (every check-request log)
id uuid primary key default gen_random_uuid(),
integration_id text references integrations(id),
endpoint text not null, method text not null,
data_requested text[] default '{}',
risk_score int not null, action text not null,
reason text, created_at timestamptz default now()

-- security_events (only violations / state changes)
id uuid primary key default gen_random_uuid(),
integration_id text references integrations(id),
event_type text not null, -- PURPOSE_VIOLATION | FORBIDDEN_DATA | UNKNOWN_ENDPOINT | ABNORMAL_VOLUME | QUARANTINED | RELEASED | UNKNOWN_INTEGRATION
endpoint text, risk_score int not null, action text not null,
reason text not null, created_at timestamptz default now()
```

RLS: enable, allow `service_role` full access; `anon` read-only on `integrations, security_events` for Realtime dashboard. Publish `security_events, requests, integrations` to `supabase_realtime`.

Seed (PRD §3-4): `payment_001` (/payments, /payments/status), `delivery_001` (/orders, /delivery, /delivery/status), `analytics_001` (/analytics/events, /analytics/metrics, 100/min), `marketing_001` (/campaigns, /campaigns/events). Include allowed/forbidden data exactly per PRD.

---

## 4. Core logic — `checkRequest()` (BE-2 owns, pure function, must be unit-testable)

Input (`POST /api/check-request`):

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

Scoring (PRD §7, max 100, cumulative):

| Check    | Condition                                                                                             | +Risk                                           |
| -------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Identity | integrationId unknown                                                                                 | +50 → immediate BLOCK candidate                 |
| Endpoint | endpoint not in allowedEndpoints                                                                      | +20                                             |
| Method   | method not in allowedMethods                                                                          | +10                                             |
| Purpose  | endpoint/data outside purpose keywords (simple denylist + endpoint mismatch counts as purpose signal) | +25                                             |
| Data     | any dataRequested in forbiddenData (case-insensitive substring)                                       | +30                                             |
| Volume   | requestCount > 3× expected_request_rate                                                               | +20                                             |
| Time     | hour 0-5 local                                                                                        | +5                                              |
| Context  | contextEvent in ['black_friday','campaign_launch','known_spike']                                      | −20 (floor 0), never auto-block on volume alone |

Levels (§8): 0-30 TRUSTED, 31-60 SUSPICIOUS, 61-80 HIGH_RISK, 81-100 CRITICAL.
Actions (§9): TRUSTED→ALLOW, SUSPICIOUS→ALLOW+MONITOR, HIGH_RISK→RATE_LIMIT+MONITOR, CRITICAL→BLOCK+QUARANTINE+ALERT.
Quarantine: on CRITICAL set `integrations.status='QUARANTINED'`, emit `QUARANTINED` event, all future requests from that id → BLOCK (until `POST /api/integrations/:id/release`).

Must produce: `{ riskScore, level, violations: [{code, detail, points}], action, reason }` + insert into `requests` + (if violations) `security_events` + update `integrations.risk_score/status`.

Golden tests (PRD §10, must pass):

- `GET /analytics/events` normal → ~5, ALLOW
- `GET /customers/profile` (unknown endpoint + purpose) → 45, ALLOW+MONITOR
- `GET /customers/payment-details` + payment/phone/address + 1780/min → 95, BLOCK+QUARANTINE+ALERT

---

## 5. API contracts (Express, base `/api`)

```
POST   /api/integrations            {name,purpose,allowedEndpoints[],allowedMethods[],allowedData[],forbiddenData[],expectedRequestRate} → 201 integration
GET    /api/integrations            → [{id,name,purpose,status,risk_score,requestsPerMin,lastActivity}]
GET    /api/integrations/:id        → {profile, permissions, recentViolations[5], behaviour{normal,current,deviation}}
PATCH  /api/integrations/:id        {purpose?, expectedRequestRate?, status?}
POST   /api/check-request           CheckRequest → CheckResult (see §4)
GET    /api/security-events?integrationId=&limit=50 → [SecurityEvent]
GET    /api/security-events/:id     → SecurityEvent
GET    /api/dashboard/stats         → {integrations:4, active:3, monitoredRequests:12480, threats:7, quarantined:1}
GET    /api/dashboard/activity      ?limit=20 → recent requests+events merged, desc
POST   /api/simulator/start         {integrationId, attack:'credential_compromise', speed:'demo'} → {sessionId}
POST   /api/simulator/stop          {sessionId} → {stopped:true}
POST   /api/integrations/:id/quarantine {reason} → {status:'QUARANTINED'}
POST   /api/integrations/:id/release    → {status:'ACTIVE', risk_score:8}
GET    /healthz                     → {ok:true}
```

Errors: `{ error: string, code: string }` with 400 validation, 404 unknown id (check-request returns 200 with BLOCK action for unknown id instead of 404 — demo must show BLOCK, not crash).

CORS: allow `WEB_URL` (Vercel) only. JSON limit 100kb. Log `integrationId endpoint riskScore action` per check.

---

## 6. Frontend spec (FE-1 + FE-2)

Routes (PRD §20): `/dashboard`, `/integrations`, `/integrations/:id`, `/events`, `/simulator`, `/settings`. Root `/` redirects to `/dashboard`.

- **Dashboard:** StatCards (INTEGRATIONS/ACTIVE/MONITORED/THREATS/QUARANTINED), IntegrationTable (Integration|Purpose|Req/min|Risk|Status|Last Activity|Action), IntegrationMap (App → ThirdEye → 4 nodes, green/red, click → detail). Poll `dashboard/stats+activity` every 5s + Supabase Realtime sub on `security_events` for instant flash.
- **Detail `[id]`:** STATUS, RISK 95/100 bar, PURPOSE, ALLOWED ENDPOINTS ✓, RECENT VIOLATIONS ✕, BEHAVIOUR (Normal 100 vs Current 1780, 17.8×), [Release][Keep Quarantined].
- **Events:** live timeline rows `time | integration | endpoint | violation | risk | action`, filter by integration.
- **Simulator (demo-critical):** selects Integration + Attack [Credential Compromise], [START ATTACK] → Phase1 normal (/analytics/events green) → Phase2 suspicious (/customers/profile) → Phase3 spike (100→300→800→1780) → Phase4 BLOCK+QUARANTINE+ALERT, dashboard updates live. [STOP] + [RESET DEMO] (reseed risk to baseline).
- **Settings:** risk thresholds (default 30/60/80, editable, stored localStorage v1), context event toggle (none/black_friday) that calls check-request with contextEvent.
- UI: dark command-center, cards/tables/timeline, RiskBadge colors (green/yellow/orange/red), no overcrowding. Shared `lib/api.ts` with `API_URL` env.

---

## 7. Realtime (no Socket.io)

- Backend writes to Supabase; frontend subscribes: `supabase.channel('events').on('postgres_changes',{event:'INSERT',table:'security_events'},...)`.
- Fallback: 5s polling if Realtime fails (judge wifi). Simulator drives volume client-side loop calling `POST /api/check-request` with increasing `requestCount`.

---

## 8. Deploy + env

- `apps/web` → Vercel, env `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `apps/api` → Render, env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEB_URL`, `PORT`.
- Supabase: run `migrations.sql`, then `seed.sql`. Enable Realtime on 3 tables.
- Health: `GET /healthz` + Vercel preview per PR. Freeze features Day 7 noon.

---

## 9. Ownership + 8-day milestones

- **BE-1:** schema+seed+CRUD+stats/activity. Done Day 3: `GET /api/integrations` returns 4.
- **BE-2:** riskEngine + check-request + quarantine + simulator engine. Done Day 3: 3 golden tests pass.
- **FE-1:** dashboard+map+list/detail + UI kit. Done Day 3: dashboard renders on mocks.
- **FE-2:** events+simulator+settings+release buttons. Done Day 3: simulator phases mocked.
- Day 4-5 wire+realtime, Day 6 full 13-step demo (§24 prd.md), Day 7 harden+deploy, Day 8 rehearse + backup video.
- Critical path = BE-2; if blocked BE-1 swarms.

---

## 10. Definition of done (maps to prd.md §27)

All 16 checkboxes must demo end-to-end live: 4 integrations, trust profiles, middleware scoring, purpose/forbidden/volume detection, context reduction, dynamic risk, graded actions, quarantine+release, event log, live dashboard+map, simulator. Cut order if late: settings persistence → context → behaviour table → auth. Never cut simulator/quarantine/WHY explanation.

## 11. Risks

Supabase Realtime blocked → polling fallback. Render cold start → warm `/healthz` before demo + backup video. Scope creep (enterprise gateway) → reject, PRD §2 says 7 modules only.

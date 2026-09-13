# ThirdEye — G1 / ICSC 2nd Edition

> ThirdEye watches your third parties — a continuous trust layer for third-party integrations.

Product spec: `./prd.md` | Engineering spec: `./TECH_PRD.md`

## Quickstart
1. `cp .env.example apps/api/.env` + `cp .env.example apps/web/.env.local` and fill Supabase keys
2. In Supabase SQL editor run `supabase/migrations.sql` then `supabase/seed.sql`, enable Realtime on `integrations, requests, security_events`
3. `npm install` then:
   - `npm run dev` (Next.js web — port 3000, falls forward if busy → `/dashboard`)
   - `npm run dev:api` (Express :4000, `GET /healthz`)
   - `npm run dev:all` (both together)
4. Demo: `/simulator` → Credential Compromise on `analytics_001` → watch 8 → 45 → 72 → 95 → BLOCK+QUARANTINE

## Workspaces
- `apps/web` — Next.js dashboard/map/detail/events/simulator/settings
- `apps/api` — Express risk engine + CRUD + simulator
- `packages/shared` — shared TS types (single source of truth)
- `supabase/` — migrations + seed (4 integrations)

## Team (2 BE + 2 FE)
BE-1 schema/seed/CRUD, BE-2 riskEngine/check-request/simulator, FE-1 dashboard/map/detail, FE-2 events/simulator/settings.

# Platform setup (ThirdEye API + Supabase + Web)

Source of truth: repo root `README.md`, `docs/TECH_PRD.md` §8, `supabase/*.sql`.

## 1. Env

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Fill (see `assets/dotenv-template`):

| Var                             | Where                 | Value                          |
| ------------------------------- | --------------------- | ------------------------------ |
| `SUPABASE_URL`                  | `apps/api/.env`       | Supabase project URL           |
| `SUPABASE_SERVICE_ROLE_KEY`     | `apps/api/.env`       | service_role key (server only) |
| `NEXT_PUBLIC_SUPABASE_URL`      | `apps/web/.env.local` | same project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `apps/web/.env.local` | anon key (reads only)          |
| `NEXT_PUBLIC_API_URL`           | `apps/web/.env.local` | e.g. `http://localhost:4000`   |
| `WEB_URL`                       | `apps/api/.env`       | e.g. `http://localhost:3000`   |
| `PORT`                          | `apps/api/.env`       | `4000`                         |

## 2. Database

In Supabase SQL editor, in order:

1. Run `supabase/migrations.sql` (tables `integrations, permissions, requests, security_events` + anon-read RLS).
2. Run `supabase/seed.sql` (4 integrations: `payment_001, delivery_001, analytics_001, marketing_001`).
3. Enable Realtime on `integrations, requests, security_events`
   (Database → Replication, or the `alter publication supabase_realtime add table` lines).

Without Supabase keys the API still runs in fallback in-memory mode
(`isSupabaseConfigured=false`, seeded from `apps/api/src/integrations/registry.ts`) —
fine for SDK dev, not for persistence.

## 3. Run

```bash
npm install
npm run dev:api   # Express :4000, GET /healthz -> { ok:true }
npm run dev:web   # Next.js :3000 -> /dashboard (falls forward if busy)
# or both: npm run dev:all
```

## 4. Verify

```bash
curl http://localhost:4000/healthz
curl http://localhost:4000/api
curl http://localhost:4000/api/integrations
python3 skills/thirdeye/scripts/check_setup.py --base-url http://localhost:4000
```

Demo path: `/simulator` → Credential Compromise on `analytics_001`
→ risk 8 → 45 → 72 → 95 → BLOCK+QUARANTINE.

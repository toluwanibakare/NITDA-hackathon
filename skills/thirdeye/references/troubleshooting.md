# Troubleshooting

## API won't start / port busy

- `PORT=4001 npm run dev:api` or kill `:4000`. Check `GET /healthz`.

## `check_setup.py` fails to connect

- API not running or wrong `--base-url`. Verify `curl $BASE/healthz`.
- CORS: `WEB_URL` in `apps/api/.env` must include the web origin (comma-separated).
  API returns `CORS request blocked by security policy` otherwise.

## Supabase writes silently missing

- `isSupabaseConfigured` false → API uses in-memory `integrationRegistry`
  (`apps/api/src/integrations/registry.ts`) + `demoEvents`. Fine for demo;
  set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (no `placeholder`) for persistence.

## Dashboard shows no live updates

- Realtime not enabled: run the `alter publication supabase_realtime add table`
  lines in `supabase/migrations.sql` for `integrations, requests, security_events`.
- Fallback is 5s polling (`dashboard/stats+activity`); judge wifi often needs it.

## False BLOCKs / MONITORs

- Trust Profile too narrow: add the legitimate endpoint/method to allowlists.
- `expectedRequestRate` too low: set to real p95 req/min.
- Sales spike: pass `contextEvent: black_friday|campaign_launch|known_spike` (−20).

## Quarantined integration blocks everything

- Expected: CRITICAL sets `status=QUARANTINED`. Release:
  `POST /api/integrations/:id/release` or dashboard [Release Integration].

## Render cold start (deployed demo)

- Warm `GET /healthz` before demo; keep backup video per `docs/TECH_PRD.md` §11.

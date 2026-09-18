---
name: thirdeye
description: >-
  Audit, guard, and verify third-party integrations and AI agent tool calls with the ThirdEye continuous trust layer.
  Use when asked to: audit outbound HTTP/API calls, protect or guard third-party integrations, draft and register
  Trust Profiles, integrate @the-third-eye/sdk (TypeScript) or thirdeye-sdk (Python), guard AI agent tool execution,
  setup ThirdEye platform (Express API, Supabase, dashboard), verify check-request (ALLOW/MONITOR/RATE_LIMIT/BLOCK),
  or quarantine compromised integrations.
---

# ThirdEye Agent Skill

ThirdEye continuously monitors third-party integrations and agent tool calls. Every outbound call is scored 0–100:

- **TRUSTED (0–30)**: `ALLOW`
- **SUSPICIOUS (31–60)**: `MONITOR` (audit log recorded)
- **HIGH_RISK (61–80)**: `RATE_LIMIT` (backoff required)
- **CRITICAL (81–100)**: `BLOCK` + `QUARANTINE` (immediate rejection)

Scoring is enforced via `POST /api/check-request` or offline local evaluation fallback.

---

## Autonomous Agent Workflow

Follow the appropriate workflow based on the user's objective:

| Objective                                      | Recommended Workflow                                                              | Key Tools / Scripts                       |
| :--------------------------------------------- | :-------------------------------------------------------------------------------- | :---------------------------------------- |
| **Audit existing project for 3rd-party risk**  | [Workflow 1: Codebase Audit](#workflow-1--codebase-audit)                         | `python3 scripts/audit_codebase.py`       |
| **Create security policy for integrations**    | [Workflow 2: Trust Profile Registration](#workflow-2--trust-profile-registration) | `python3 scripts/register_integration.py` |
| **Wire SDK guards into TS/Python/Agent tools** | [Workflow 3: SDK Guard Wiring](#workflow-3--sdk-guard-wiring)                     | `references/coding-agent-recipes.md`      |
| **Verify trust scoring & block behavior**      | [Workflow 4: Golden Verification](#workflow-4--golden-verification)               | `python3 scripts/test_guard_probe.py`     |
| **Deploy or boot ThirdEye API + Supabase**     | [Workflow 5: Platform Setup](#workflow-5--platform-setup)                         | `python3 scripts/check_setup.py`          |

---

## Workflow 1 — Codebase Audit

1. Run the audit script to scan outbound network calls and sensitive parameters:
   ```bash
   python3 scripts/audit_codebase.py --path . --format json > thirdeye-audit.json
   ```
2. Inspect discovered endpoints, methods, and sensitive fields (`payment`, `phone`, `password`, `ssn`).
3. Note any unauthorized endpoints or unexpected sensitive data leaking to external vendors.

---

## Workflow 2 — Trust Profile Registration

1. Draft a Trust Profile using `assets/trust-profile-template.json` following [trust-profile-guide.md](references/trust-profile-guide.md):
   - `id`: Lowercase identifier (e.g. `stripe_001`, `analytics_001`).
   - `allowedEndpoints`: Strict list of approved paths (e.g. `["/analytics/events"]`).
   - `allowedMethods`: Allowed HTTP verbs (e.g. `["GET", "POST"]`).
   - `allowedData`: Explicit payload keys allowed.
   - `forbiddenData`: PII/secrets vendor must never receive (`["payment", "phone", "password", "ssn"]`).
   - `expectedRequestRate`: P95 requests/minute baseline (trigger fires at >3x).
2. Register the profile against the API:
   ```bash
   python3 scripts/register_integration.py --file profile.json --base-url http://localhost:4000
   ```
   Or via SDK: `te.registerIntegration(profile)` (TS) / `te.register_integration(profile)` (Python).

---

## Workflow 3 — SDK Guard Wiring

Detect target project environment:

- **TypeScript / JavaScript**: `npm install @the-third-eye/sdk` (Set `THIRDEYE_API_URL=http://localhost:4000`).
- **Python**: `pip install thirdeye-sdk` (Set `THIRDEYE_API_URL=http://localhost:4000`).

Read [coding-agent-recipes.md](references/coding-agent-recipes.md) for exact drop-in patterns:

1. **Next.js & Server Actions**: Use `te.checkOrBlock(...)` before outbound calls.
2. **Fetch / Axios**: Use `wrapOutbound(te, { integrationId, endpoint }, fetch)`.
3. **Express**: Apply `guardMiddleware(te, resolveReq)`.
4. **Python**: Apply `@guard("integration_id", "/endpoint", client=te)` decorator or inline `check_or_block`.
5. **AI Agent Tool Execution (LangChain, OpenAI tools, MCP)**: Guard the tool execution dispatcher with `check_or_block` using tool parameters as `dataRequested`.

---

## Workflow 4 — Golden Verification

Always verify newly guarded integrations with the 3 golden probe cases:

```bash
# Verify against live API
python3 scripts/test_guard_probe.py --base-url http://localhost:4000

# Or verify offline scoring logic
python3 scripts/test_guard_probe.py --offline
```

Expected behavior:

1. **Normal Call** (`/analytics/events`, safe data) → `ALLOW` (Risk ≤ 30).
2. **Drifted Endpoint** (`/customers/profile`) → `MONITOR` (Risk 45).
3. **Sensitive Exfiltration** (`/customers/payment-details` + forbidden data + volume spike) → `BLOCK` (Risk 95) + throws `ThirdEyeBlockedError`.

---

## Workflow 5 — Platform Setup

If the ThirdEye platform backend is not yet running:

1. Follow [platform-setup.md](references/platform-setup.md) to apply Supabase migrations, seed data, and start the API (`:4000`) and web dashboard (`:3000`).
2. Run healthcheck:
   ```bash
   python3 scripts/check_setup.py --base-url http://localhost:4000
   ```
3. If issues arise, consult [troubleshooting.md](references/troubleshooting.md).

---

## Strict Rules

1. **Never swallow BLOCK as ALLOW**: A `BLOCK` or `ThirdEyeBlockedError` must stop the outbound request immediately.
2. **Handle RATE_LIMIT gracefully**: When action is `RATE_LIMIT`, apply exponential backoff.
3. **No direct DB writes**: Frontend and application code never write directly to Supabase; all writes pass through Express API.
4. **Authoritative remote check**: `POST /api/check-request` is authoritative; offline `evaluateLocal` is fallback only when network fails.

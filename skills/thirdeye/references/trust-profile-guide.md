# Trust Profile guide

A Trust Profile declares intended purpose + approved scope. The risk engine
compares every call against it (`apps/api/src/lib/riskEngine.ts`).

## Fields

| Field                 | Example (`analytics_001`)                     | How to infer                                                              |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `id`                  | `analytics_001`                               | lowercase, stable, e.g. `stripe_001`                                      |
| `name`                | `Analytics Provider`                          | vendor + function                                                         |
| `purpose`             | `Collect anonymous usage statistics`          | one sentence from docs/PRD                                                |
| `allowedEndpoints`    | `[/analytics/events, /analytics/metrics]`     | grep outbound URLs in user code; each path allowlisted                    |
| `allowedMethods`      | `[GET, POST]`                                 | grep HTTP verbs used                                                      |
| `allowedData`         | `[anonymous_user_id, page, event, timestamp]` | request payload keys actually needed                                      |
| `forbiddenData`       | `[payment, phone, address, password]`         | PII/secrets the vendor must never see (substring match, case-insensitive) |
| `expectedRequestRate` | `100`                                         | baseline req/min (volume check fires at >3x)                              |

Template: `assets/trust-profile-template.json`.

## Rules

1. Start narrow: only endpoints/methods observed in code. Unknown endpoint costs +20 and +25 purpose mismatch.
2. Forbidden data is substring-matched (`payment` catches `payment_details`). Keep it lowercase, generic.
3. `expectedRequestRate` should be real p95 traffic; too low causes false ABNORMAL_VOLUME.
4. Register via SDK (`registerIntegration` / `register_integration`) or
   `python3 scripts/register_integration.py --file profile.json`.
5. Re-check: normal call must score ≤30 ALLOW; drifted endpoint must hit 45 MONITOR.

## Example (new Stripe integration)

```json
{
  "id": "stripe_001",
  "name": "Stripe Payments",
  "purpose": "Process checkout payments",
  "allowedEndpoints": ["/payments", "/payments/status"],
  "allowedMethods": ["POST", "GET"],
  "allowedData": ["order_id", "amount", "currency"],
  "forbiddenData": ["password", "ssn", "marketing_data"],
  "expectedRequestRate": 120
}
```

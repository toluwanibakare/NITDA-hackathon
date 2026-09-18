# ThirdEye Python SDK (`thirdeye-sdk`)

Guard outbound third-party calls with continuous trust scoring. Stdlib-only, no required deps.

## Install

```bash
pip install thirdeye-sdk
# local dev:
pip install -e packages/sdk-python
```

Requires a running ThirdEye API (`THIRDEYE_API_URL`, default `http://localhost:4000`).

## Quickstart

```python
from thirdeye import ThirdEyeClient, guard

te = ThirdEyeClient()  # reads THIRDEYE_API_URL

# 1. Register once
te.register_integration({
    "id": "stripe_001",
    "name": "Stripe Payments",
    "purpose": "Process checkout payments",
    "allowedEndpoints": ["/payments", "/payments/status"],
    "allowedMethods": ["GET", "POST"],
    "allowedData": ["order_id", "amount"],
    "forbiddenData": ["password", "ssn"],
    "expectedRequestRate": 120,
})

# 2. Guard every outbound call
@guard("stripe_001", "/payments", client=te)
def charge_stripe(order_id, amount):
    return {"ok": True, "order_id": order_id}

out = charge_stripe("ord_1", 5000, thirdeye_data=["order_id", "amount"])
print(out["result"]["action"])  # ALLOW | MONITOR | RATE_LIMIT (raises on BLOCK)
```

## API

- `check_request(req)` — remote `POST /api/check-request`, local fallback if `offline_profile` set.
- `check_or_block(req)` — raises `ThirdEyeBlockedError` on `BLOCK`.
- `register_integration / list_integrations / get_integration / quarantine / release`
- `security_events / dashboard_stats / dashboard_activity`
- `evaluate_local(req, profile)` — offline port of `riskEngine.checkRequestPure`.

# ThirdEye TypeScript SDK (`@the-third-eye/sdk`)

Guard outbound third-party calls with continuous trust scoring.

## Install

```bash
npm install @the-third-eye/sdk
```

Requires a running ThirdEye API (`THIRDEYE_API_URL`, default `http://localhost:4000`).
See `skills/thirdeye/references/platform-setup.md` for platform setup.

## Quickstart

```ts
import { ThirdEyeClient } from '@the-third-eye/sdk';

const te = new ThirdEyeClient({ baseUrl: process.env.THIRDEYE_API_URL });

// 1. Register your integration once
await te.registerIntegration({
  id: 'stripe_001',
  name: 'Stripe Payments',
  purpose: 'Process checkout payments',
  allowedEndpoints: ['/payments', '/payments/status'],
  allowedMethods: ['GET', 'POST'],
  allowedData: ['order_id', 'amount'],
  forbiddenData: ['password', 'ssn'],
  expectedRequestRate: 120,
});

// 2. Guard every outbound call
import { wrapOutbound } from '@the-third-eye/sdk';
const safeFetch = wrapOutbound(te, { integrationId: 'stripe_001', endpoint: '/payments' }, fetch);
const { result, data } = await safeFetch('https://api.stripe.com/payments', { method: 'POST' });
// result.action: ALLOW | MONITOR | RATE_LIMIT | BLOCK (throws on BLOCK)
```

## API

- `checkRequest(req)` — remote `POST /api/check-request`, falls back to local scoring if `offlineProfile` set.
- `checkOrBlock(req)` — throws `ThirdEyeBlockedError` on `BLOCK`.
- `registerIntegration / listIntegrations / getIntegration / quarantine / release`
- `securityEvents / dashboardStats / dashboardActivity`
- `guardMiddleware(client, resolveReq)` — Express middleware returning 403 on BLOCK.
- `evaluateLocal(req, profile)` — offline port of `riskEngine.checkRequestPure`.

## Env

| Var                | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `THIRDEYE_API_URL` | API base (fallback `NEXT_PUBLIC_API_URL`, then localhost:4000) |
| `THIRDEYE_API_KEY` | Bearer token if gateway auth is enabled                        |

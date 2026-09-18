# ThirdEye Coding Agent Recipes

Drop-in implementation patterns and recipes for autonomous coding agents wiring ThirdEye into codebases.

---

## 1. Autonomous Integration Audit

Before writing code, run the audit scanner from the skill scripts directory:

```bash
python3 scripts/audit_codebase.py --path . --format json > /tmp/thirdeye-audit.json
```

Use the output to:

1. Extract all external outbound target domains and paths.
2. Note required payload parameters and observed sensitive fields (`password`, `ssn`, `payment`, `token`).
3. Draft the Trust Profile for each vendor.

---

## 2. TypeScript / Node.js / Next.js Recipes

Install:

```bash
npm install @the-third-eye/sdk
```

Environment:

```env
THIRDEYE_API_URL=http://localhost:4000
```

### Pattern A: Next.js App Router / Server Action Guard

```ts
import { ThirdEyeClient, ThirdEyeBlockedError } from '@the-third-eye/sdk';

const te = new ThirdEyeClient({ baseUrl: process.env.THIRDEYE_API_URL });

export async function processStripePayment(orderId: string, amount: number) {
  // 1. Check trust scoring before outbound call
  try {
    await te.checkOrBlock({
      integrationId: 'stripe_001',
      method: 'POST',
      endpoint: '/payments',
      dataRequested: ['order_id', 'amount'],
      requestCount: 1,
    });
  } catch (err) {
    if (err instanceof ThirdEyeBlockedError) {
      console.error(`[ThirdEye BLOCK] ${err.message} (Score: ${err.result.riskScore})`);
      throw new Error('Payment rejected by ThirdEye trust security policy');
    }
    throw err;
  }

  // 2. Outbound call proceeds only if allowed
  const res = await fetch('https://api.stripe.com/v1/payments', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount }),
  });
  return res.json();
}
```

### Pattern B: Wrapper Pattern (`wrapOutbound`)

```ts
import { ThirdEyeClient, wrapOutbound } from '@the-third-eye/sdk';

const te = new ThirdEyeClient();

// Wrap native fetch
const safeFetch = wrapOutbound(te, { integrationId: 'analytics_001', endpoint: '/analytics/events' }, fetch);

// safeFetch evaluates risk, records request, and automatically throws on BLOCK
const { result, data } = await safeFetch('https://api.mixpanel.com/track', {
  method: 'POST',
  body: JSON.stringify({ event: 'page_view', timestamp: Date.now() }),
});
```

### Pattern C: Express Middleware

```ts
import express from 'express';
import { ThirdEyeClient, guardMiddleware } from '@the-third-eye/sdk';

const app = express();
const te = new ThirdEyeClient();

// Guard inbound webhook or outbound gateway proxy
app.post(
  '/api/proxy/analytics',
  guardMiddleware(te, req => ({
    integrationId: 'analytics_001',
    endpoint: '/analytics/events',
    method: req.method,
    dataRequested: Object.keys(req.body || {}),
  })),
  (req, res) => {
    res.json({ ok: true });
  }
);
```

---

## 3. Python / FastAPI / Flask Recipes

Install:

```bash
pip install thirdeye-sdk
# Or local workspace dev:
pip install -e packages/sdk-python
```

### Pattern A: Decorator Pattern (`@guard`)

```python
from thirdeye import ThirdEyeClient, guard, ThirdEyeBlockedError

te = ThirdEyeClient()

@guard("stripe_001", "/payments", client=te)
def charge_customer(order_id: str, amount: float):
    # This code only executes if ThirdEye permits the call
    import requests
    return requests.post(
        "https://api.stripe.com/payments",
        json={"order_id": order_id, "amount": amount},
        timeout=10
    ).json()

# Invocation: pass thirdeye_data to specify payload keys to check
try:
    res = charge_customer("ord_99", 120.00, thirdeye_data=["order_id", "amount"])
except ThirdEyeBlockedError as e:
    print(f"Call blocked by ThirdEye: {e} (Risk: {e.result.get('riskScore')})")
```

### Pattern B: Inline `check_or_block` in FastAPI Route

```python
from fastapi import FastAPI, HTTPException
from thirdeye import ThirdEyeClient, ThirdEyeBlockedError

app = FastAPI()
te = ThirdEyeClient()

@app.post("/checkout")
def checkout(payload: dict):
    try:
        te.check_or_block({
            "integrationId": "stripe_001",
            "method": "POST",
            "endpoint": "/payments",
            "dataRequested": list(payload.keys()),
            "requestCount": 1,
        })
    except ThirdEyeBlockedError as exc:
        raise HTTPException(
            status_code=403,
            detail=f"ThirdEye blocked request: {exc.result.get('reason')}"
        )

    # Proceed with payment logic...
    return {"status": "success"}
```

---

## 4. AI Agent Tool Guarding Recipes (Agentic Security)

When building or configuring AI coding agents and autonomous LLM agents (LangChain, LlamaIndex, OpenAI tool calling, Model Context Protocol MCP), ThirdEye provides a vital security perimeter against:

- Prompt injection instructing the agent to exfiltrate private credentials.
- Hallucinated or unauthorized tool parameters.
- Runaway recursive agent calling loops.

### OpenAI Function / Tool Calling Guard

```python
from thirdeye import ThirdEyeClient, ThirdEyeBlockedError

te = ThirdEyeClient()

def execute_agent_tool(tool_name: str, arguments: dict):
    """Safely execute an LLM agent tool call through ThirdEye."""
    # Map tool name to registered integration
    tool_integration_map = {
        "send_customer_email": ("marketing_001", "/campaigns/send"),
        "fetch_order_status": ("delivery_001", "/delivery/status"),
        "refund_payment": ("payment_001", "/payments/refund"),
    }

    if tool_name in tool_integration_map:
        integration_id, endpoint = tool_integration_map[tool_name]
        try:
            te.check_or_block({
                "integrationId": integration_id,
                "method": "POST",
                "endpoint": endpoint,
                "dataRequested": list(arguments.keys()),
                "requestCount": 1,
            })
        except ThirdEyeBlockedError as e:
            return {
                "error": f"Agent tool execution BLOCKED by ThirdEye policy: {e}",
                "riskScore": e.result.get("riskScore"),
            }

    # Dispatch tool
    return run_tool(tool_name, arguments)
```

### LangChain / MCP Tool Guard Wrapper (TypeScript)

```ts
import { ThirdEyeClient } from '@the-third-eye/sdk';

const te = new ThirdEyeClient();

export function guardMcpTool<TArgs, TResult>(
  integrationId: string,
  endpoint: string,
  handler: (args: TArgs) => Promise<TResult>
) {
  return async (args: TArgs): Promise<TResult> => {
    const keys = args && typeof args === 'object' ? Object.keys(args) : [];

    // Validate tool parameters with ThirdEye before executing
    await te.checkOrBlock({
      integrationId,
      endpoint,
      method: 'POST',
      dataRequested: keys,
      requestCount: 1,
    });

    return handler(args);
  };
}
```

---

## 5. Offline Fallback Configuration

If the ThirdEye API is unreachable or runs in air-gapped test environments, both SDKs support offline pure scoring:

### TypeScript Offline Fallback

```ts
import { ThirdEyeClient, evaluateLocal } from '@the-third-eye/sdk';

const te = new ThirdEyeClient({
  baseUrl: process.env.THIRDEYE_API_URL,
  offlineProfile: myCachedProfile, // Used if network call fails
});
```

### Python Offline Fallback

```python
from thirdeye import ThirdEyeClient, evaluate_local

te = ThirdEyeClient(offline_profile=my_cached_profile)
```

import type { CheckRequest, CheckResult } from './types.js';
import { ThirdEyeBlockedError, ThirdEyeClient } from './client.js';

/** Express-style guard middleware: evaluates outbound third-party calls via ThirdEye. */
export function guardMiddleware(client: ThirdEyeClient, resolveReq: (req: any) => CheckRequest) {
  return async (req: any, _res: any, next: any) => {
    try {
      const check = resolveReq(req);
      const result: CheckResult = await client.checkRequest(check);
      (req as any).thirdeye = result;
      if (result.action === 'BLOCK') {
        return _res.status(403).json({ error: 'Blocked by ThirdEye', code: 'THIRDEYE_BLOCK', result });
      }
      next();
    } catch (err) {
      if (err instanceof ThirdEyeBlockedError) {
        return _res.status(403).json({ error: err.message, code: 'THIRDEYE_BLOCK', result: err.result });
      }
      next(err);
    }
  };
}

/**
 * Wrap any async outbound call (e.g. fetch to Stripe) with a pre-flight trust check.
 * Usage: const safeFetch = wrapOutbound(client, { integrationId: 'payment_001' }, fetch);
 */
export function wrapOutbound<TArgs extends any[], TReturn>(
  client: ThirdEyeClient,
  base: Omit<CheckRequest, 'endpoint' | 'method'> & { endpoint: string; method?: string },
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<{ result: CheckResult; data: TReturn }> {
  return async (...args: TArgs) => {
    const result = await client.checkOrBlock({
      method: base.method || 'POST',
      dataRequested: [],
      ...base,
    } as CheckRequest);
    const data = await fn(...args);
    return { result, data };
  };
}

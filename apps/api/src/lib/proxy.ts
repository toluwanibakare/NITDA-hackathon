import type { NextFunction, Request, Response } from 'express';
import { checkRequestPure } from './riskEngine.js';
import { normalizeTrustProfile, type CheckRequest, type CheckResult, type TrustProfile } from '@thirdeye/shared';

export interface IntegrationProxyOptions {
  profileResolver: (integrationId: string) => Promise<TrustProfile | null> | TrustProfile | null;
  onDecision?: (integrationId: string, result: CheckResult, req: Request) => Promise<void> | void;
  headerName?: string;
}

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => String(item).trim())
    .filter(Boolean);
}

export function createIntegrationProxy({
  profileResolver,
  onDecision,
  headerName = 'x-integration-id',
}: IntegrationProxyOptions) {
  return async function integrationProxy(req: Request, res: Response, next: NextFunction) {
    const integrationId =
      String(
        (req.headers[headerName] as string | undefined) ||
          (req.headers['x-third-eye-integration-id'] as string | undefined) ||
          (req.body?.integrationId as string | undefined) ||
          (req.body?.integration_id as string | undefined) ||
          ''
      ).trim();

    if (!integrationId) {
      return next();
    }

    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const requestBody = body as Record<string, unknown>;
    const request: CheckRequest = {
      integrationId,
      method: String(requestBody.method || req.method || 'GET'),
      endpoint: String(requestBody.endpoint || req.originalUrl || '/'),
      dataRequested: asArray(requestBody.dataRequested ?? requestBody.data_requested),
      requestCount: Number(requestBody.requestCount ?? requestBody.request_count ?? 0),
      timestamp: String(requestBody.timestamp || new Date().toISOString()),
      contextEvent: (requestBody.contextEvent as any) || 'none',
      headers: (req.headers as Record<string, string>) || {},
      sourceIp: req.socket?.remoteAddress || undefined,
    };

    const profile = await profileResolver(integrationId);
    if (!profile) {
      return next();
    }

    const normalized = normalizeTrustProfile(profile);
    const result = checkRequestPure(request, normalized);

    if (onDecision) {
      await onDecision(integrationId, result, req);
    }

    res.setHeader('X-ThirdEye-Decision', result.action);
    res.setHeader('X-ThirdEye-Risk-Score', String(result.riskScore));

    if (result.action === 'BLOCK') {
      return res.status(403).json({
        ok: false,
        decision: result.action,
        riskScore: result.riskScore,
        reason: result.reason,
      });
    }

    if (result.action === 'RATE_LIMIT') {
      return res.status(429).json({
        ok: false,
        decision: result.action,
        riskScore: result.riskScore,
        reason: result.reason,
      });
    }

    if (result.action === 'MONITOR') {
      res.setHeader('X-ThirdEye-Monitor', 'true');
      return next();
    }

    return next();
  };
}

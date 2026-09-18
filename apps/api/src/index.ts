import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import 'dotenv/config';

import { integrationsRouter } from './routes/integrations.js';
import { dashboardRouter } from './routes/dashboard.js';
import { eventsRouter } from './routes/events.js';
import { checkRouter } from './routes/check.js';
import { simulatorRouter } from './routes/simulator.js';
import { shopxRouter } from './shopx/router.js';

const app = express();
const serverStartTime = Date.now();

const allowedOrigins = process.env.WEB_URL
  ? process.env.WEB_URL.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS request blocked by security policy'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));

// Observability: Request tracing and latency profiling
app.use((req, res, next) => {
  const start = process.hrtime();
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);

  const originalEnd = res.end;
  res.end = function (...args: any[]): any {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[api] ${res.statusCode} ${req.method} ${req.originalUrl} - ${durationMs}ms (req_${requestId.slice(0, 8)})`
      );
    }
    return originalEnd.apply(this, args as any);
  };

  next();
});

// Health check endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, service: 'thirdeye-api' });
});

// Self-documenting API discovery manifest
app.get('/api', (_req, res) => {
  res.status(200).json({
    service: 'ThirdEye Security Engine API',
    version: '1.0.0',
    status: 'operational',
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      health: 'GET /healthz',
      serviceIndex: 'GET /api',
      integrations: 'GET /api/integrations',
      integrationDetail: 'GET /api/integrations/:id',
      checkRequest: 'POST /api/check-request',
      securityEvents: 'GET /api/security-events',
      verifyAuditTrail: 'GET /api/security-events/verify',
      dashboardStats: 'GET /api/dashboard/stats',
      dashboardActivity: 'GET /api/dashboard/activity',
      simulatorStart: 'POST /api/simulator/start',
    },
  });
});

// Route registration
app.use('/api/integrations', integrationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/security-events', eventsRouter);
app.use('/api/check-request', checkRouter);
app.use('/api/simulator', simulatorRouter);
app.use('/api/shopx', shopxRouter);

const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  Boolean(process.env.NODE_TEST_CONTEXT) ||
  process.argv.some(arg => arg.includes('test'));

const port = Number(process.env.PORT || 4000);
if (!isTestEnv) {
  app.listen(port, () => {
    console.log(`[thirdeye-api] server running on port ${port}`);
  });
}

export default app;

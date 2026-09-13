import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { integrationsRouter } from './routes/integrations.js';
import { dashboardRouter } from './routes/dashboard.js';
import { eventsRouter } from './routes/events.js';
import { checkRouter } from './routes/check.js';
import { simulatorRouter } from './routes/simulator.js';

const app = express();

const allowedOrigins = process.env.WEB_URL
  ? process.env.WEB_URL.split(',').map((origin) => origin.trim())
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

// Health check endpoint
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, service: 'thirdeye-api' });
});

// Route registration
app.use('/api/integrations', integrationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/security-events', eventsRouter);
app.use('/api/check-request', checkRouter);
app.use('/api/simulator', simulatorRouter);

const port = Number(process.env.PORT || 4000);
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[thirdeye-api] server running on port ${port}`);
  });
}

export default app;

export interface SimulatorSession {
  sessionId: string;
  integrationId: string;
  attackType: string;
  status: 'running' | 'completed' | 'stopped';
  currentPhase: number;
  startTime: number;
}

export const activeSessions = new Map<string, SimulatorSession>();

export const DEMO_PHASES = [
  {
    phase: 1,
    name: 'Normal Operation',
    endpoint: '/analytics/events',
    method: 'GET',
    dataRequested: ['event', 'timestamp'],
    requestCount: 95,
    expectedRisk: 5,
    expectedAction: 'ALLOW',
  },
  {
    phase: 2,
    name: 'Endpoint Probe (Reconnaissance)',
    endpoint: '/customers/profile',
    method: 'GET',
    dataRequested: ['anonymous_user_id'],
    requestCount: 300,
    expectedRisk: 45,
    expectedAction: 'MONITOR',
  },
  {
    phase: 3,
    name: 'Sensitive Data Exfiltration Surge',
    endpoint: '/customers/payment-details',
    method: 'GET',
    dataRequested: ['payment', 'phone'],
    requestCount: 800,
    expectedRisk: 75,
    expectedAction: 'RATE_LIMIT',
  },
  {
    phase: 4,
    name: 'Full Breach Spike & Auto-Quarantine',
    endpoint: '/customers/payment-details',
    method: 'GET',
    dataRequested: ['payment', 'phone', 'address'],
    requestCount: 1780,
    expectedRisk: 95,
    expectedAction: 'BLOCK',
  },
];

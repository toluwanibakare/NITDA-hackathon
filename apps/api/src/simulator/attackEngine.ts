// Phased attack runner with timers and reset logic
// Manages timed phases: Phase 1 (Normal) -> Phase 2 (Probe) -> Phase 3 (Sensitive) -> Phase 4 (Spike & Quarantine)

export interface SimulatorSession {
  sessionId: string;
  integrationId: string;
  attackType: string;
  status: 'running' | 'completed' | 'stopped';
  currentPhase: number;
}

// TODO: Implement phased attack runner and database reset function

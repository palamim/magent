import type { Execution } from '@/agents/executor';

export interface ExecAttempt {
  execution: Execution;
  errors: string;
}

export interface VerifiedExecution {
  status: 'committed' | 'no-net-changes' | 'gave-up';
  originals: Map<string, string | null>;
  execAttempts: ExecAttempt[];
  branch: string;
}

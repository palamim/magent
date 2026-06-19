import type { Execution } from '@/agents/executor';

export interface ExecAttempt {
  execution: Execution;
  errors: string;
}

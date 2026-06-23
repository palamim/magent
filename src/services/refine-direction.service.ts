import { Agent, Decision } from '@/agents/types/common.types';
import { saveFeedback } from '@/project/feedback';

export const refineDirection = (dir: string, rationale: string, comment: string): { recorded: boolean } => {
  saveFeedback(dir, Agent.DIRECTOR, {
    timestamp: new Date().toISOString(),
    proposal: rationale,
    refinements: [],
    decision: Decision.REFINED,
    comment,
  });
  return { recorded: true };
};

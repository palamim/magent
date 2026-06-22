import { saveFeedback } from '@/project/feedback';
import { Agent, Decision } from '@/agents/types/common.types';

export const discardDirection = (
  dir: string,
  rationale: string,
  refinements: string[],
  comment: string,
): { discarded: boolean } => {
  saveFeedback(dir, Agent.DIRECTOR, {
    timestamp: new Date().toISOString(),
    proposal: rationale,
    refinements,
    decision: Decision.DISCARDED,
    comment,
  });
  return { discarded: true };
};

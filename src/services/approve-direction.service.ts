import { writeDirection } from '@/project/direction';
import { writeConventions } from '@/project/conventions';
import { saveFeedback } from '@/project/feedback';
import { Agent, Decision } from '@/agents/types/common.types';

export const approveDirection = (
  dir: string,
  rationale: string,
  direction: string,
  conventions: string,
  refinements: string[],
  comment: string,
): { written: boolean } => {
  saveFeedback(dir, Agent.DIRECTOR, {
    timestamp: new Date().toISOString(),
    proposal: rationale,
    refinements,
    decision: Decision.APPROVED,
    comment,
  });

  writeDirection(dir, direction);
  writeConventions(dir, conventions);

  return { written: true };
};

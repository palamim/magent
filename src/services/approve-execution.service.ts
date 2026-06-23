import { mergeExecution, run } from '@/lib/git';
import { Agent, Decision, type Plan } from '@/agents/types/common.types';
import { saveFeedback } from '@/project/feedback';

export const approveExecution = (
  dir: string,
  branch: string,
  plan: Plan,
  push: boolean,
  refinements: string[],
  comment: string,
): { merged: boolean; pushed: boolean } => {
  saveFeedback(dir, Agent.EXECUTOR, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.description}`,
    refinements,
    decision: Decision.APPROVED,
    comment,
  });
  return mergeExecution(dir, branch, push);
};

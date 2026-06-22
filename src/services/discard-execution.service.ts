import { discardBranch, run } from '@/lib/git';
import { Agent, Decision, type Plan } from '@/agents/types/common.types';
import { saveFeedback } from '@/project/feedback';

export const discardExecution = (
  dir: string,
  branch: string,
  plan: Plan,
  refinements: string[],
  comment: string,
): { discarded: boolean } => {
  saveFeedback(dir, Agent.EXECUTOR, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.description}`,
    refinements,
    decision: Decision.DISCARDED,
    comment,
  });
  discardBranch(dir, branch);
  return { discarded: true };
};

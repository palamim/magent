import { Agent, Decision } from '@/agents/types/common.types';
import { discardBranch, deriveBranchName } from '@/lib/git';
import { saveFeedback } from '@/project/feedback';
import { loadPlan, archivePlan } from '@/project/plan';

export const abandonPlan = (dir: string, comment: string): { abandoned: boolean } => {
  const plan = loadPlan(dir);
  if (!plan) throw new Error('No active plan to abandon.');
  const branch = deriveBranchName(plan.type, plan.slug);
  discardBranch(dir, branch);
  saveFeedback(dir, Agent.PLANNER, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.goal}`,
    refinements: [],
    decision: Decision.DISCARDED,
    comment,
  });
  archivePlan(dir, plan);
  return { abandoned: true };
};

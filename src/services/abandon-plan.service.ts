import { Agent, Decision } from '@/agents/types/common.types';
import { discardBranch, deriveBranchName } from '@/lib/git';
import { loadConfig } from '@/project/config';
import { saveFeedback } from '@/project/feedback';
import { loadPlan, archivePlan } from '@/project/plan';

export const abandonPlan = (dir: string, comment: string): { abandoned: boolean } => {
  const plan = loadPlan(dir);
  if (!plan) return { abandoned: false };
  const { baseBranch } = loadConfig(dir);
  const branch = deriveBranchName(plan.type, plan.slug);
  discardBranch(dir, branch, baseBranch);
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

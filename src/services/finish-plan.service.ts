import { mergePlan } from '@/lib/git';
import { loadPlan, archivePlan } from '@/project/plan';
import { deriveBranchName } from '@/lib/git';
import { saveFeedback } from '@/project/feedback';
import { Agent, Decision } from '@/agents/types/common.types';

export const finishPlan = (dir: string, push: boolean, comment: string): { merged: boolean; pushed: boolean } => {
  const plan = loadPlan(dir);
  if (!plan) throw new Error('No active plan to finish.');
  const branch = deriveBranchName(plan.type, plan.slug);
  const result = mergePlan(dir, branch, push);
  saveFeedback(dir, Agent.PLANNER, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.goal}`,
    refinements: [],
    decision: Decision.APPROVED,
    comment,
  });
  archivePlan(dir, plan);
  return result;
};

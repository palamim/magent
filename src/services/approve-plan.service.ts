import { saveFeedback } from '@/project/feedback';
import { Agent, Decision, type Plan } from '@/agents/types/common.types';

export const approvePlan = (dir: string, plan: Plan, refinements: string[], comment: string): { recorded: boolean } => {
  saveFeedback(dir, Agent.PLANNER, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.description}`,
    refinements,
    decision: Decision.APPROVED,
    comment,
  });
  return { recorded: true };
};

import { Agent, Decision, type Plan } from '@/agents/types/common.types';
import { saveFeedback } from '@/project/feedback';

export const refinePlan = (dir: string, plan: Plan, comment: string): { recorded: boolean } => {
  saveFeedback(dir, Agent.PLANNER, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.description}`,
    refinements: [],
    decision: Decision.REFINED,
    comment,
  });
  return { recorded: true };
};

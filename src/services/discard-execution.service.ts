import { run } from '@/lib/git';
import { saveAftermath } from '@/project/history';
import type { Plan } from '@/agents/types/common.types';
import { UserDecision } from '@/agents/planner/planner.types';

export const discardExecution = (
  dir: string,
  branch: string,
  plan: Plan,
  feedback: string[],
  note: string,
): { discarded: boolean } => {
  saveAftermath(dir, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.description}`,
    userDecision: UserDecision.DISCARD,
    feedback,
    note,
  });
  run(`git checkout main`, dir);
  run(`git branch -D ${branch}`, dir); // -D force, since discarding unmerged work
  return { discarded: true };
};

import { run } from '@/lib/git';
import { saveAftermath } from '@/project/history';
import type { Plan } from '@/agents/types/common.types';
import { UserDecision } from '@/agents/planner/planner.types';

export const approveExecution = (
  dir: string,
  branch: string,
  plan: Plan,
  feedback: string[],
  note: string,
): { merged: boolean; pushed: boolean } => {
  // record the decision FIRST (before mutating git state) so history is
  // captured even if a later git step fails
  saveAftermath(dir, {
    timestamp: new Date().toISOString(),
    proposal: `${plan.slug}: ${plan.description}`,
    userDecision: UserDecision.APPROVE,
    feedback,
    note,
  });

  run(`git checkout main`, dir);
  run(`git merge ${branch}`, dir);
  run(`git branch -d ${branch}`, dir);

  let pushed = false;
  try {
    run(`git push`, dir);
    pushed = true;
  } catch {
    /* report, don't fail */
  }
  return { merged: true, pushed };
};

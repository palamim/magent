import type { Task } from '@/agents/types/common.types';
import { run } from '@/lib/git';

export const commitExecution = (dir: string, refinements: string[], task: Task): boolean => {
  run(`git add -A`, dir);
  const staged = run(`git diff --cached --name-only`, dir).trim();
  if (!staged) return false;

  const subject = `${task.type}: ${task.description}`;
  const commitFlag = refinements.length === 0 ? '' : '--amend';

  run(
    `git commit ${commitFlag} -m ${JSON.stringify(subject)} ` +
      `--trailer ${JSON.stringify(`Magent-Task-Id: ${task.id}`)} ` +
      `--trailer ${JSON.stringify(`Co-Authored-By: Magent <magent@noreply.local>`)}`,
    dir,
  );
  return true;
};

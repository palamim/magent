import type { Task } from '@/agents/types/common.types';
import { run } from '@/lib/git';

export const commitExecution = (dir: string, refinements: string[], task: Task): boolean => {
  run(`git add -A`, dir);
  const staged = run(`git diff --cached --name-only`, dir).trim();
  if (!staged) return false;
  const subject = `${task.type}: ${task.description}`;
  const trailer = `Co-Authored-By: Magent <magent@noreply.local>`;
  const commitFlag = refinements.length === 0 ? '' : '--amend';
  run(`git commit ${commitFlag} -m ${JSON.stringify(subject)} -m ${JSON.stringify(trailer)}`, dir);
  return true;
};

import type { Plan } from '@/agents/types/common.types';
import { run } from '@/lib/git';

export const commitExecution = (dir: string, feedback: string[], plan: Plan): boolean => {
  run(`git add -A`, dir);
  const staged = run(`git diff --cached --name-only`, dir).trim();
  if (!staged) return false;

  const subject = `${plan.type}: ${plan.description}`;
  const trailer = `Co-Authored-By: Magent <magent@noreply.local>`;
  const commitFlag = feedback.length === 0 ? '' : '--amend';
  run(`git commit ${commitFlag} -m ${JSON.stringify(subject)} -m ${JSON.stringify(trailer)}`, dir);
  return true;
};

import type Anthropic from '@anthropic-ai/sdk';
import { run, computeBranchDiff, branchExists } from '@/lib/git';
import type { Task } from '@/agents/types/common.types';
import { runVerifiedExecution } from '@/services/run-verified-execution';
import { installDependencies } from '@/lib/deps';

export const executeTask = async (
  task: Task,
  client: Anthropic,
  dir: string,
  refinements: string[],
  fileList: string,
  dependencies: string[],
  branch: string,
  base: string,
): Promise<{ branch: string; status: string; diff: string }> => {
  const exists = branchExists(dir, branch);

  if (exists) {
    run(`git checkout ${branch}`, dir);
  } else {
    run(`git checkout ${base}`, dir);
    run(`git checkout -b ${branch} ${base}`, dir);
    installDependencies(dir, dependencies);
  }

  try {
    const originals = new Map<string, string | null>();
    const result = await runVerifiedExecution(task, client, dir, branch, refinements, fileList, originals);
    const diff = computeBranchDiff(dir, branch, base);
    return { branch, status: result.status, diff };
  } catch (error) {
    if (!exists) {
      run(`git checkout ${base}`, dir);
      try {
        run(`git branch -D ${branch}`, dir);
      } catch {}
    } else {
      try {
        run(`git checkout .`, dir);
      } catch {}
    }
    throw error;
  }
};

import type Anthropic from '@anthropic-ai/sdk';
import { run, computeBranchDiff } from '@/lib/git';
import { deriveBranchName } from '@/lib/git';
import type { Plan } from '@/agents/types/common.types';
import { runVerifiedExecution } from '@/services/run-verified-execution';
import { installDependencies } from '@/lib/deps';

const branchExists = (dir: string, branch: string): boolean => {
  try {
    run(`git rev-parse --verify ${branch}`, dir);
    return true;
  } catch {
    return false;
  }
};

export const executePlan = async (
  plan: Plan,
  client: Anthropic,
  dir: string,
  refinements: string[],
  fileList: string,
  dependencies: string[],
): Promise<{ branch: string; status: string; diff: string }> => {
  const branch = deriveBranchName(plan.type, plan.slug);
  const isRefine = refinements.length > 0;
  const exists = branchExists(dir, branch);

  if (isRefine) {
    // refine: the branch MUST already exist (we're iterating on it)
    if (!exists) throw new Error(`Cannot refine: branch ${branch} does not exist.`);
    run(`git checkout ${branch}`, dir);
  } else {
    // fresh execute: the branch must NOT already exist
    if (exists) {
      throw new Error(
        `Branch ${branch} already exists — a previous run may not have been cleaned up. Discard or delete it before re-running this plan.`,
      );
    }
    run(`git checkout -b ${branch}`, dir);
    installDependencies(dir, dependencies);
  }

  try {
    const originals = new Map<string, string | null>();
    const result = await runVerifiedExecution(plan, client, dir, branch, refinements, fileList, originals);
    const diff = computeBranchDiff(dir, branch);
    run(`git checkout main`, dir);
    return { branch, status: result.status, diff };
  } catch (error) {
    // crash cleanup: return to main, and if this was a FRESH branch we just
    // created (not a refine on an existing one), delete the orphan
    run(`git checkout main`, dir);
    if (!isRefine) {
      try {
        run(`git branch -D ${branch}`, dir);
      } catch {}
    }
    throw error; // re-throw so the controller returns the error to the UI
  }
};

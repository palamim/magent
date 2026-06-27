import type Anthropic from '@anthropic-ai/sdk';

import { cleanup, run } from '@/lib/git';
import { typecheck } from '@/lib/verification';
import type { Task } from '@/agents/types/common.types';
import { runExecutor } from '@/agents/executor';
import type { ExecAttempt, VerifiedExecution } from '@/services/types/common.types';
import { buildPrompt } from '@/services/run-verified-execution/build-prompt';
import { resolveAndCheckPaths } from '@/services/run-verified-execution/resolve-check-paths';
import { applyExecution } from '@/services/run-verified-execution/apply-execution';
import { commitExecution } from '@/services/run-verified-execution/commit-execution';

const MAX_EXEC_ATTEMPTS = 3;

export const runVerifiedExecution = async (
  task: Task,
  client: Anthropic,
  dir: string,
  branch: string,
  refinements: string[] = [],
  fileList: string,
  originals: Map<string, string | null>,
): Promise<VerifiedExecution> => {
  let execAttempts: ExecAttempt[] = [];

  let steps = 0;
  while (steps < MAX_EXEC_ATTEMPTS) {
    steps++;

    const prompt = buildPrompt(task, refinements, execAttempts, dir, fileList);
    const execution = await runExecutor(client, prompt, dir);

    const unresolved = resolveAndCheckPaths(execution, dir);
    if (unresolved.length) {
      cleanup(dir, branch);
      throw new Error('Executor aborted. Could not resolve paths.');
    }

    const { applyErrors } = applyExecution(execution, dir, originals);
    if (applyErrors.length) {
      run(`git checkout .`, dir);
      execAttempts.push({ execution, errors: applyErrors.join('\n\n') });
      continue;
    }

    const { ok, errors } = typecheck(dir);
    if (!ok) {
      execAttempts.push({ execution, errors });
      continue;
    }

    const isCommitted = commitExecution(dir, refinements, task);
    if (!isCommitted) {
      if (refinements.length === 0) {
        execAttempts.push({ execution, errors: 'You submitted no changes.' });
        continue;
      }
      return { status: 'no-net-changes', originals, execAttempts, branch };
    }
    return { status: 'committed', originals, execAttempts, branch };
  }
  cleanup(dir, branch);
  throw new Error(`Gave up after ${MAX_EXEC_ATTEMPTS} attempts.`);
};

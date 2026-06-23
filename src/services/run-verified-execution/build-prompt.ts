import { buildImplementPrompt, buildRefinePrompt } from '@/agents/executor';
import { Agent, type Plan } from '@/agents/types/common.types';

import type { ExecAttempt } from '@/services/types/common.types';
import { formatExecAttempts } from '@/services/run-verified-execution/format-attempts';
import { loadConventions } from '@/project/conventions';
import { readAndFormatFiles } from '@/services/run-verified-execution/read-format-files';
import { loadFeedback } from '@/project/feedback';

export const buildPrompt = (
  plan: Plan,
  refinements: string[],
  execAttempts: ExecAttempt[],
  dir: string,
  fileList: string,
): string => {
  const contextBlock = readAndFormatFiles(plan.contextFiles);
  const targetBlock = readAndFormatFiles(plan.targetFiles);
  const attemptsBlock = formatExecAttempts(execAttempts);
  const conventions = loadConventions(dir);
  const executorFeedback = loadFeedback(dir, Agent.EXECUTOR);

  const refinementsBlock = refinements.length ? refinements.map((f, i) => `${i + 1}. ${f}`).join('\n') : '(none)';
  return refinements.length
    ? buildRefinePrompt(plan, targetBlock, attemptsBlock, refinementsBlock, conventions, fileList, executorFeedback)
    : buildImplementPrompt(plan, targetBlock, contextBlock, attemptsBlock, conventions, fileList, executorFeedback);
};

import { buildImplementPrompt, buildRefinePrompt } from '@/agents/executor';
import type { Plan } from '@/agents/types/common.types';

import type { ExecAttempt } from '@/services/types/common.types';
import { formatExecAttempts } from '@/services/utils/format-executor-attempts';
import { loadConventions } from '@/services/utils/load-conventions';
import { readAndFormatFiles } from '@/services/utils/read-format-files';

export const buildExecutorPrompt = (
  plan: Plan,
  feedback: string[],
  execAttempts: ExecAttempt[],
  dir: string,
  fileList: string,
): string => {
  const contextBlock = readAndFormatFiles(plan.contextFiles);
  const targetBlock = readAndFormatFiles(plan.targetFiles);
  const attemptsBlock = formatExecAttempts(execAttempts);
  const conventions = loadConventions(dir);

  const feedbackBlock = feedback.length ? feedback.map((f, i) => `${i + 1}. ${f}`).join('\n') : '(none)';
  return feedback.length
    ? buildRefinePrompt(plan, targetBlock, attemptsBlock, feedbackBlock, conventions, fileList)
    : buildImplementPrompt(plan, targetBlock, contextBlock, attemptsBlock, conventions, fileList);
};

import { buildImplementPrompt, buildRefinePrompt } from '@/agents/executor';
import { Agent, type Task } from '@/agents/types/common.types';

import type { ExecAttempt } from '@/services/types/common.types';
import { formatExecAttempts } from '@/services/run-verified-execution/format-attempts';
import { loadConventions } from '@/project/conventions';
import { readAndFormatFiles } from '@/services/run-verified-execution/read-format-files';
import { loadFeedback } from '@/project/feedback';

export const buildPrompt = (
  task: Task,
  refinements: string[],
  execAttempts: ExecAttempt[],
  dir: string,
  fileList: string,
): string => {
  const contextBlock = readAndFormatFiles(task.contextFiles);
  const targetBlock = readAndFormatFiles(task.targetFiles);
  const attemptsBlock = formatExecAttempts(execAttempts);
  const conventions = loadConventions(dir);
  const executorFeedback = loadFeedback(dir, Agent.EXECUTOR);

  const refinementsBlock = refinements.length ? refinements.map((f, i) => `${i + 1}. ${f}`).join('\n') : '(none)';
  return refinements.length
    ? buildRefinePrompt(task, targetBlock, attemptsBlock, refinementsBlock, conventions, fileList, executorFeedback)
    : buildImplementPrompt(task, targetBlock, contextBlock, attemptsBlock, conventions, fileList, executorFeedback);
};

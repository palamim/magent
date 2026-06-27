import { discardLastCommit } from '@/lib/git';
import { Agent, Decision } from '@/agents/types/common.types';
import { saveFeedback } from '@/project/feedback';
import { clearTask, loadTask } from '@/project/task';

export const discardExecution = (
  dir: string,
  branch: string,
  refinements: string[],
  comment: string,
): { discarded: boolean } => {
  const task = loadTask(dir);
  if (!task) throw new Error('No task to discard.');
  saveFeedback(dir, Agent.EXECUTOR, {
    timestamp: new Date().toISOString(),
    proposal: `${task.slug}: ${task.description}`,
    refinements,
    decision: Decision.DISCARDED,
    comment,
  });
  discardLastCommit(dir, branch);
  clearTask(dir);
  return { discarded: true };
};

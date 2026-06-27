import { Agent, Decision } from '@/agents/types/common.types';
import { saveFeedback } from '@/project/feedback';
import { archiveTask, loadTask } from '@/project/task';

export const keepExecution = (dir: string, refinements: string[], comment: string): { kept: boolean } => {
  const task = loadTask(dir);
  if (!task) throw new Error('No task to keep.');
  saveFeedback(dir, Agent.EXECUTOR, {
    timestamp: new Date().toISOString(),
    proposal: `${task.slug}: ${task.description}`,
    refinements,
    decision: Decision.APPROVED,
    comment,
  });
  archiveTask(dir, task);
  return { kept: true };
};

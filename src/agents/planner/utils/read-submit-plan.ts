import type Anthropic from '@anthropic-ai/sdk';
import { TaskStatus, type TaskPlan } from '@/agents/types/common.types';

export interface SubmittedPlan {
  plan: TaskPlan;
  nextTaskId: string;
}

export const readSubmitPlan = (message: Anthropic.Messages.Message): SubmittedPlan | null => {
  const toolUse = message.content.find((b) => b.type === 'tool_use' && b.name === 'submit_plan');
  if (!toolUse || toolUse.type !== 'tool_use') return null;

  const input = toolUse.input as {
    frontier?: string;
    goal?: string;
    type?: string;
    slug?: string;
    tasks?: Array<{
      id?: string;
      slug: string;
      description?: string;
      instructions?: string;
      targetFiles?: string[];
      contextFiles?: string[];
      status?: string;
    }>;
    nextTaskId?: string;
    dependencies?: string[];
  };

  const plan: TaskPlan = {
    frontier: input.frontier ?? '',
    goal: input.goal ?? '',
    type: input.type ?? 'chore',
    slug: input.slug ?? 'untitled',
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    tasks: (input.tasks ?? []).map((t) => ({
      id: t.id ?? '',
      slug: t.slug ?? t.id ?? 'task',
      description: t.description ?? '',
      instructions: t.instructions ?? '',
      targetFiles: Array.isArray(t.targetFiles) ? t.targetFiles : [],
      contextFiles: Array.isArray(t.contextFiles) ? t.contextFiles : [],
      status: t.status === 'done' ? TaskStatus.DONE : TaskStatus.PENDING,
    })),
  };

  return { plan, nextTaskId: input.nextTaskId ?? '' };
};

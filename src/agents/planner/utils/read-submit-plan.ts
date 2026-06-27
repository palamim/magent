import type Anthropic from '@anthropic-ai/sdk';
import { TaskStatus, type Plan, type Task } from '@/agents/types/common.types';

export const readSubmitPlan = (message: Anthropic.Messages.Message): Plan | null => {
  const toolUse = message.content.find((b) => b.type === 'tool_use' && b.name === 'submit_plan');
  if (!toolUse || toolUse.type !== 'tool_use') return null;

  const input = toolUse.input as {
    frontier?: string;
    goal?: string;
    type?: string;
    slug?: string;
    dependencies?: string[];
    tasks?: Array<Task>;
  };

  return {
    frontier: input.frontier ?? '',
    goal: input.goal ?? '',
    type: input.type ?? 'chore',
    slug: input.slug ?? 'untitled',
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    tasks: (input.tasks ?? []).map((t) => ({
      id: typeof t.id === 'number' ? t.id : Number(t.id) || 0,
      slug: t.slug ?? 'task',
      type: t.type ?? 'chore',
      description: t.description ?? '',
      instructions: t.instructions ?? '',
      targetFiles: Array.isArray(t.targetFiles) ? t.targetFiles : [],
      contextFiles: Array.isArray(t.contextFiles) ? t.contextFiles : [],
      status: t.status === 'done' ? TaskStatus.DONE : TaskStatus.PENDING,
    })),
  };
};

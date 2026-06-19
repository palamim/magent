import type Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/agents/models';
import { readFileTool } from '@/agents/tools/read-file.tool';
import { dispatchToolCalls } from '@/agents/tools/dispatch';
import { loadHistory } from '@/agents/planner/utils/load-history';
import { plannerPrompt } from '@/agents/planner/planner.prompt';
import { type Plan } from '@/agents/types/common.types';
import { createPlan } from '@/agents/planner/utils/create-plan';

const MAX_PLANNER_STEPS = 10;
const MAX_PLANNER_TOKENS = 4096;

export const runPlanner = async (fileList: string, intent: string, client: Anthropic, dir: string): Promise<Plan> => {
  const history: string = loadHistory(dir);
  const prompt: string = plannerPrompt(intent, fileList, history);
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

  let plan: Plan | null = null;

  let steps = 0;
  while (steps < MAX_PLANNER_STEPS) {
    steps++;

    const message = await client.messages.create({
      max_tokens: MAX_PLANNER_TOKENS,
      model: ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5,
      tools: [readFileTool],
      messages: messages,
    });

    messages.push({ role: 'assistant', content: message.content });

    if (message.stop_reason !== 'tool_use') {
      plan = createPlan(message);
      break;
    }

    messages.push({ role: 'user', content: dispatchToolCalls(message, dir) });
  }

  if (!plan) {
    throw new Error('Planner ended loop without a plan (hit MAX_PLANNER_STEPS).');
  }

  return plan;
};

import type Anthropic from '@anthropic-ai/sdk';

import { type Plan } from '@/agents/types/common.types';
import { extractLastJson } from '@/agents/planner/utils/extract-json';

export const createPlan = (message: Anthropic.Messages.Message): Plan => {
  const lastBlock = message.content.filter((b) => b.type === 'text').pop();
  const text = lastBlock && lastBlock.type === 'text' ? lastBlock.text : '';

  const jsonStr = extractLastJson(text);
  if (!jsonStr) {
    throw new Error(`No valid JSON plan found in planner output: ${text}`);
  }

  const parsed = JSON.parse(jsonStr);
  return {
    description: parsed.description ?? '',
    type: parsed.type ?? 'chore',
    slug: parsed.slug ?? 'untitled',
    targetFiles: Array.isArray(parsed.targetFiles) ? parsed.targetFiles : [],
    contextFiles: Array.isArray(parsed.contextFiles) ? parsed.contextFiles : [],
    instructions: parsed.instructions ?? '',
  };
};

import type Anthropic from '@anthropic-ai/sdk';
import { runModelLoop, type PlannerRunResult } from '@/agents/planner';

export interface GeneratePlanInput {
  prompt: string;
  model: string;
}

export const generatePlan = async (
  client: Anthropic,
  dir: string,
  input: GeneratePlanInput,
): Promise<PlannerRunResult> => {
  return runModelLoop(input.prompt, client, dir, input.model);
};

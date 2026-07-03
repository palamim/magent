import type { Request, Response } from 'express';

import { anthropic } from '@/lib/anthropic';
import { generatePlan } from '@/services/generate-plan.service';

export const handleGeneratePlan = async (req: Request, res: Response) => {
  try {
    const { dir, prompt, model } = req.body as { dir?: string; prompt?: string; model?: string };
    if (!dir || !prompt || !model) {
      return res.status(400).json({ error: 'Missing dir, prompt or model fields.' });
    }
    const result = await generatePlan(anthropic, dir, { prompt, model });
    return res.json(result); // { plan, steps, toolCalls, readFileCalls, filesRead, inputTokens, outputTokens }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

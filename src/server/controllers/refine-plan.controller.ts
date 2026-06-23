import type { Request, Response } from 'express';

import type { Plan } from '@/agents/types/common.types';
import { refinePlan } from '@/services/refine-plan.service';

export const handleRefinePlan = (req: Request, res: Response) => {
  try {
    const { dir, plan, comment } = req.body as {
      dir?: string;
      plan?: Plan;
      comment?: string;
    };

    if (!dir || !plan || !comment) {
      return res.status(400).json({ error: 'Missing dir, plan, or comment.' });
    }

    const result = refinePlan(dir, plan, comment);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

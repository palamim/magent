import type { Request, Response } from 'express';

import type { Plan } from '@/agents/types/common.types';
import { discardPlan } from '@/services/discard-plan.service';

export const handleDiscardPlan = (req: Request, res: Response) => {
  try {
    const {
      dir,
      plan,
      refinements = [],
      comment = '',
    } = req.body as {
      dir?: string;
      plan?: Plan;
      refinements?: string[];
      comment?: string;
    };

    if (!dir || !plan) {
      return res.status(400).json({ error: 'Missing dir or plan.' });
    }

    const result = discardPlan(dir, plan, refinements, comment);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

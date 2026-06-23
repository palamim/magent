import type { Request, Response } from 'express';

import type { Plan } from '@/agents/types/common.types';
import { discardExecution } from '@/services/discard-execution.service';

export const handleDiscardExecution = (req: Request, res: Response) => {
  try {
    const {
      dir,
      branch,
      plan,
      refinements = [],
      note = '',
    } = req.body as {
      dir?: string;
      branch?: string;
      plan?: Plan;
      refinements?: string[];
      note?: string;
    };

    if (!dir || !branch || !plan) {
      return res.status(400).json({ error: 'Missing dir, branch, or plan.' });
    }

    const result = discardExecution(dir, branch, plan, refinements, note);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

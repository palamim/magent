import type { Request, Response } from 'express';

import type { Plan } from '@/agents/types/common.types';
import { approveExecution } from '@/services/approve-execution.service';

export const handleApproveExecution = (req: Request, res: Response) => {
  try {
    const {
      dir,
      branch,
      plan,
      feedback = [],
      note = '',
    } = req.body as {
      dir?: string;
      branch?: string;
      plan?: Plan;
      feedback?: string[];
      note?: string;
    };

    if (!dir || !branch || !plan) {
      return res.status(400).json({ error: 'Missing dir, branch, or plan.' });
    }

    const result = approveExecution(dir, branch, plan, feedback, note);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

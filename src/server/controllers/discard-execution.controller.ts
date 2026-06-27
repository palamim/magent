import type { Request, Response } from 'express';

import { discardExecution } from '@/services/discard-execution.service';

export const handleDiscardExecution = (req: Request, res: Response) => {
  try {
    const {
      dir,
      branch,
      refinements = [],
      comment = '',
    } = req.body as {
      dir?: string;
      branch?: string;
      refinements?: string[];
      comment?: string;
    };

    if (!dir || !branch) {
      return res.status(400).json({ error: 'Missing dir or branch.' });
    }

    const result = discardExecution(dir, branch, refinements, comment);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

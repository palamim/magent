import type { Request, Response } from 'express';

import { keepExecution } from '@/services/keep-execution.service';

export const handleKeepExecution = (req: Request, res: Response) => {
  try {
    const {
      dir,
      refinements = [],
      comment = '',
    } = req.body as {
      dir?: string;
      refinements?: string[];
      comment?: string;
    };

    if (!dir) {
      return res.status(400).json({ error: 'Missing dir.' });
    }

    const result = keepExecution(dir, refinements, comment);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

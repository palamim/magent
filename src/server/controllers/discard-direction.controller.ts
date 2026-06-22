import type { Request, Response } from 'express';

import { discardDirection } from '@/services/discard-direction.service';

export const handleDiscardDirection = (req: Request, res: Response) => {
  try {
    const {
      dir,
      rationale,
      refinements = [],
      comment = '',
    } = req.body as {
      dir?: string;
      rationale?: string;
      refinements: string[];
      comment?: string;
    };

    if (!dir || !rationale) {
      return res.status(400).json({ error: 'Missing dir or rationale.' });
    }

    const result = discardDirection(dir, rationale, refinements, comment);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

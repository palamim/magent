import type { Request, Response } from 'express';

import { refineDirection } from '@/services/refine-direction.service';

export const handleRefineDirection = (req: Request, res: Response) => {
  try {
    const { dir, rationale, comment } = req.body as {
      dir?: string;
      rationale?: string;
      comment?: string;
    };

    if (!dir || !rationale || !comment) {
      return res.status(400).json({ error: 'Missing dir, rationale, or comment.' });
    }

    const result = refineDirection(dir, rationale, comment);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

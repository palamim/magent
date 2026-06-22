import type { Request, Response } from 'express';

import { approveDirection } from '@/services/approve-direction.service';

export const handleApproveDirection = (req: Request, res: Response) => {
  try {
    const {
      dir,
      rationale,
      direction,
      conventions,
      refinements = [],
      comment = '',
    } = req.body as {
      dir?: string;
      rationale?: string;
      direction?: string;
      conventions?: string;
      refinements: string[];
      comment?: string;
    };

    if (!dir || !rationale || !direction || !conventions) {
      return res.status(400).json({ error: 'Missing dir, rationale, direction or conventions.' });
    }

    const result = approveDirection(dir, rationale, direction, conventions, refinements, comment);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

import type { Request, Response } from 'express';

import { approveConventions } from '@/services/approve-conventions.service';

export const handleApproveConventions = (req: Request, res: Response) => {
  try {
    const { dir, conventions } = req.body as {
      dir?: string;
      conventions?: string;
    };

    if (!dir || !conventions) {
      return res.status(400).json({ error: 'Missing dir or conventions.' });
    }

    const result = approveConventions(dir, conventions);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

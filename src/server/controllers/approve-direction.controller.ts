import type { Request, Response } from 'express';

import { approveDirection } from '@/services/approve-direction.service';

export const handleApproveDirection = (req: Request, res: Response) => {
  try {
    const { dir, direction } = req.body as {
      dir?: string;
      direction?: string;
    };

    if (!dir || !direction) {
      return res.status(400).json({ error: 'Missing dir or direction.' });
    }

    const result = approveDirection(dir, direction);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

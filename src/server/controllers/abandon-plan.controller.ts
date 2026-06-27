import type { Request, Response } from 'express';
import { abandonPlan } from '@/services/abandon-plan.service';

export const handleAbandonPlan = (req: Request, res: Response) => {
  try {
    const { dir, comment = '' } = req.body as { dir?: string; comment?: string };
    if (!dir) return res.status(400).json({ error: 'Missing "dir".' });
    const result = abandonPlan(dir, comment);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Abandon failed' });
  }
};

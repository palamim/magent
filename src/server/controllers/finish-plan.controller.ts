import type { Request, Response } from 'express';
import { finishPlan } from '@/services/finish-plan.service';

export const handleFinishPlan = (req: Request, res: Response) => {
  try {
    const { dir, push = false, comment = '' } = req.body as { dir?: string; push?: boolean; comment?: string };
    if (!dir) return res.status(400).json({ error: 'Missing "dir".' });
    const result = finishPlan(dir, push, comment);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Finish failed' });
  }
};

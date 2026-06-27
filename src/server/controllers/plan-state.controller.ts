import type { Request, Response } from 'express';
import { loadPlan } from '@/project/plan';

export const handlePlanState = (req: Request, res: Response) => {
  try {
    const dir = req.query.dir as string | undefined;
    if (!dir) {
      return res.status(400).json({ error: 'Missing "dir".' });
    }
    const plan = loadPlan(dir);
    return res.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

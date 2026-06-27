import type { Request, Response } from 'express';

import { loadTask } from '@/project/task';

export const handleTaskState = (req: Request, res: Response) => {
  try {
    const dir = req.query.dir as string | undefined;
    if (!dir) return res.status(400).json({ error: 'Missing "dir".' });
    return res.json({ task: loadTask(dir) }); // Task | null
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

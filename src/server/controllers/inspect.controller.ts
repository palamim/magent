import type { Request, Response } from 'express';
import { openInTool, type InspectTool } from '@/lib/inspect';

export const handleInspectExecution = (req: Request, res: Response) => {
  try {
    const { dir, branch, tool } = req.body as { dir?: string; branch?: string; tool?: InspectTool };
    if (!dir || !branch || !tool) {
      return res.status(400).json({ error: 'Missing dir, branch, or tool.' });
    }
    openInTool(dir, branch, tool);
    return res.json({ opened: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Inspect failed' });
  }
};

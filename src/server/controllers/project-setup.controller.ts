import type { Request, Response } from 'express';

import { isMagentGitignored, setupMagentGitignore } from '@/project/init';
import { loadDirection } from '@/project/direction';

export const handleProjectStatus = (req: Request, res: Response) => {
  try {
    const dir = req.query.dir as string | undefined;
    if (!dir) return res.status(400).json({ error: 'Missing "dir".' });

    const direction = loadDirection(dir);
    const hasRealDirection = direction !== '(none)' && !direction.includes('Starter frontier');

    return res.json({
      needsGitignoreSetup: !isMagentGitignored(dir),
      hasRealDirection, // false = fresh/starter → show the nudge
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

export const handleSetupProject = (req: Request, res: Response) => {
  try {
    const { dir } = req.body as { dir?: string };
    if (!dir) return res.status(400).json({ error: 'Missing "dir".' });
    setupMagentGitignore(dir);
    return res.json({ done: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

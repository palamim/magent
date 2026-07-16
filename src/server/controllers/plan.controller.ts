import type { Request, Response } from 'express';
import { anthropic } from '@/lib/anthropic';

import { runPlanner } from '@/agents/planner';
import { collectProjectFiles } from '@/lib/files';
import { checkGitPreconditions } from '@/lib/git';
import { ensureProjectInitialized } from '@/project/init';

export const handlePlan = async (req: Request, res: Response) => {
  try {
    const { dir, userIntent } = req.body as { dir?: string; userIntent?: string };
    if (!dir || !userIntent) {
      return res.status(400).json({ error: 'Missing dir or userIntent.' });
    }

    ensureProjectInitialized(dir);
    checkGitPreconditions(dir);

    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');

    const result = await runPlanner(anthropic, dir, fileList, userIntent);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

import type { Request, Response } from 'express';
import { anthropic } from '@/lib/anthropic';

import { collectProjectFiles } from '@/lib/files';
import { ensureProjectInitialized } from '@/project/init';
import { checkGitPreconditions } from '@/lib/git';
import { runArchitect } from '@/agents/architect/architect.agent';

export const handleConventions = async (req: Request, res: Response) => {
  try {
    const { dir } = req.body as {
      dir?: string;
    };
    if (!dir) {
      return res.status(400).json({ error: 'Missing dir.' });
    }

    ensureProjectInitialized(dir);
    checkGitPreconditions(dir);

    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');

    const result = await runArchitect(anthropic, dir, fileList);

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

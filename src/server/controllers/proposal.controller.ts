import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

import { runPlanner } from '@/agents/planner';
import { loadIntent } from '@/project/intent';
import { collectProjectFiles } from '@/lib/files';
import { checkGitPreconditions } from '@/lib/git';

export const getProposal = async (req: Request, res: Response) => {
  try {
    const { dir } = req.body as { dir?: string };
    if (!dir) {
      return res.status(400).json({ error: 'Missing "dir" — the project path to run Magent in.' });
    }

    checkGitPreconditions(dir);

    const client = new Anthropic();
    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');
    const intent = loadIntent(dir);

    const plan = await runPlanner(fileList, intent.text, client, dir);

    return res.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

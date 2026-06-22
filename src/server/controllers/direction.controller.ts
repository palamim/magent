import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

import { collectProjectFiles } from '@/lib/files';
import { runDirector } from '@/agents/director/director.agent';

export const handleDirection = async (req: Request, res: Response) => {
  try {
    const { dir } = req.body as {
      dir?: string;
    };
    if (!dir) {
      return res.status(400).json({ error: 'Missing dir or plan.' });
    }

    const client = new Anthropic();
    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');

    const result = await runDirector(fileList, client, dir);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

import { collectProjectFiles } from '@/lib/files';
import type { Plan } from '@/agents/types/common.types';
import { executePlan } from '@/services/run-execution.service';
import { ensureProjectInitialized } from '@/project/init';
import { checkGitPreconditions } from '@/lib/git';

export const handleExecute = async (req: Request, res: Response) => {
  try {
    const {
      dir,
      plan,
      refinements = [],
    } = req.body as {
      dir?: string;
      plan?: Plan;
      refinements?: string[];
    };
    if (!dir || !plan) {
      return res.status(400).json({ error: 'Missing dir or plan.' });
    }

    ensureProjectInitialized(dir);
    checkGitPreconditions(dir);

    const client = new Anthropic();
    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');

    const result = await executePlan(plan, client, dir, refinements, fileList);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

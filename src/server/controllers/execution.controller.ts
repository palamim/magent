import type { Request, Response } from 'express';
import { anthropic } from '@/lib/anthropic';

import { collectProjectFiles } from '@/lib/files';
import { executeTask } from '@/services/run-execution.service';
import { ensureProjectInitialized } from '@/project/init';
import { checkGitPreconditions, deriveBranchName } from '@/lib/git';
import { loadPlan } from '@/project/plan';
import { loadTask } from '@/project/task';

export const handleExecute = async (req: Request, res: Response) => {
  try {
    const { dir, refinements = [] } = req.body as { dir?: string; refinements?: string[] };
    if (!dir) return res.status(400).json({ error: 'Missing dir.' });

    const plan = loadPlan(dir);
    if (!plan) return res.status(400).json({ error: 'No active plan.' });

    const task = loadTask(dir);
    if (!task) return res.status(400).json({ error: 'No task to run.' });

    const branch = deriveBranchName(plan.type, plan.slug);
    const dependencies = plan.dependencies ?? [];

    ensureProjectInitialized(dir);
    checkGitPreconditions(dir);

    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');

    const result = await executeTask(task, anthropic, dir, refinements, fileList, dependencies, branch);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

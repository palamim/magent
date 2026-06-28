import type { Request, Response } from 'express';

import { loadPlan } from '@/project/plan';
import { loadTask, isTaskDeciding } from '@/project/task';
import { deriveBranchName, computeBranchDiff } from '@/lib/git';
import { loadConfig } from '@/project/config';

export const handleBranchDiff = (req: Request, res: Response) => {
  try {
    const dir = req.query.dir as string | undefined;
    if (!dir) return res.status(400).json({ error: 'Missing "dir".' });

    const plan = loadPlan(dir);
    const task = loadTask(dir);
    if (!plan) return res.json({ diff: '', deciding: false });

    const { baseBranch } = loadConfig(dir);
    const branch = deriveBranchName(plan.type, plan.slug);

    let diff = '';
    let deciding = false;
    try {
      diff = computeBranchDiff(dir, branch, baseBranch);
      if (task) deciding = isTaskDeciding(dir, branch, task);
    } catch {
      // branch doesn't exist yet (nothing run) — empty diff, not deciding
    }

    return res.json({ diff, deciding, branch: plan ? deriveBranchName(plan.type, plan.slug) : '' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Branch diff failed' });
  }
};

import type { Request, Response } from 'express';

import { listBranches, loadConfig, writeConfig } from '@/project/config';

export const handleGetConfig = (req: Request, res: Response) => {
  const dir = req.query.dir as string;
  if (!dir) return res.status(400).json({ error: 'Missing dir.' });
  return res.json(loadConfig(dir));
};

export const handleSetConfig = (req: Request, res: Response) => {
  const { dir, baseBranch, autoPush } = req.body;
  if (!dir) return res.status(400).json({ error: 'Missing dir.' });
  const current = loadConfig(dir);
  const next = { baseBranch: baseBranch ?? current.baseBranch, autoPush: autoPush ?? current.autoPush };
  writeConfig(dir, next);
  return res.json(next);
};

export const handleListBranches = (req: Request, res: Response) => {
  const dir = req.query.dir as string;
  if (!dir) return res.status(400).json({ error: 'Missing dir.' });
  return res.json({ branches: listBranches(dir) });
};

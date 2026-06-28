import type { Request, Response } from 'express';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const handleBrowse = (req: Request, res: Response) => {
  try {
    const path = (req.query.path as string) || homedir();
    const entries = readdirSync(path, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({ name: e.name, path: join(path, e.name) }));
    return res.json({ current: path, parent: join(path, '..'), entries });
  } catch (error) {
    return res.status(400).json({ error: 'Cannot read that directory.' });
  }
};

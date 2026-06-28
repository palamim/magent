import type { Request, Response } from 'express';
import { anthropic } from '@/lib/anthropic';

import { collectProjectFiles } from '@/lib/files';
import { runDirector } from '@/agents/director/director.agent';
import { loadDirection } from '@/project/direction';
import { loadConventions } from '@/project/conventions';
import { computeTextDiff } from '@/lib/text-diff';
import { ensureProjectInitialized } from '@/project/init';
import { checkGitPreconditions } from '@/lib/git';

export const handleDirection = async (req: Request, res: Response) => {
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

    const proposal = await runDirector(fileList, anthropic, dir);

    const currentDirection = loadDirection(dir);
    const currentConventions = loadConventions(dir);

    const directionDiff = computeTextDiff(
      'direction.md',
      currentDirection === '(none)' ? '' : currentDirection,
      proposal.direction,
    );
    const conventionsDiff = computeTextDiff(
      'conventions.md',
      currentConventions === '(none)' ? '' : currentConventions,
      proposal.conventions,
    );

    return res.json({
      rationale: proposal.rationale,
      direction: proposal.direction,
      conventions: proposal.conventions,
      docs: [
        { name: 'direction.md', diff: directionDiff },
        { name: 'conventions.md', diff: conventionsDiff },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

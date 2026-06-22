import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

import { collectProjectFiles } from '@/lib/files';
import { runDirector } from '@/agents/director/director.agent';
import { loadDirection } from '@/project/direction';
import { loadConventions } from '@/project/conventions';
import { computeTextDiff } from '@/lib/text-diff';

export const handleDirection = async (req: Request, res: Response) => {
  try {
    const { dir } = req.body as {
      dir?: string;
    };
    if (!dir) {
      return res.status(400).json({ error: 'Missing dir.' });
    }

    const client = new Anthropic();
    const files = collectProjectFiles(dir);
    const fileList = files.join('\n');

    const proposal = await runDirector(fileList, client, dir);

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
      directionDiff,
      conventionsDiff,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};

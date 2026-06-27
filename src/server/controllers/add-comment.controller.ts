import type { Request, Response } from 'express';
import { appendCommentToLast } from '@/project/feedback';
import type { Agent } from '@/agents/types/common.types';

export const handleAddComment = (req: Request, res: Response) => {
  try {
    const { dir, agent, comment } = req.body as { dir?: string; agent?: Agent; comment?: string };
    if (!dir || !agent || !comment) return res.status(400).json({ error: 'Missing dir, agent, or comment.' });
    appendCommentToLast(dir, agent, comment);
    return res.json({ added: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Add comment failed' });
  }
};

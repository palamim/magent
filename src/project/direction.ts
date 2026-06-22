import { existsSync, readFileSync } from 'node:fs';
import { Agent } from '@/agents/types/common.types';
import { agentFilePath } from '@/project/agent-files';

const DIRECTION_FILE = 'direction.md';

export const loadDirection = (dir: string): string => {
  const path = agentFilePath(dir, Agent.PLANNER, DIRECTION_FILE);
  if (!existsSync(path)) return '(none)';
  return readFileSync(path, 'utf-8');
};

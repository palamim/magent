import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Agent } from '@/agents/types/common.types';
import { agentFilePath, ensureAgentDir } from '@/project/agent-files';

const CONVENTIONS_FILE = 'conventions.md';

export const loadConventions = (dir: string): string => {
  const path = agentFilePath(dir, Agent.EXECUTOR, CONVENTIONS_FILE);
  if (!existsSync(path)) return '(none)';
  return readFileSync(path, 'utf-8');
};

export const writeConventions = (dir: string, content: string): void => {
  ensureAgentDir(dir, Agent.EXECUTOR);
  writeFileSync(agentFilePath(dir, Agent.EXECUTOR, CONVENTIONS_FILE), content, 'utf8');
};

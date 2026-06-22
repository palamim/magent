import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Agent } from '@/agents/types/common.types';

const MAGENT_DIR = '.magent';

// ensure .magent/ exists with a gitignore, and the agent's folder exists.
// called before any read/write so projects self-initialize — no manual setup.
export const ensureAgentDir = (dir: string, agent: Agent): string => {
  const magentPath = join(dir, MAGENT_DIR);
  mkdirSync(magentPath, { recursive: true });

  const gitignore = join(magentPath, '.gitignore');
  if (!existsSync(gitignore)) writeFileSync(gitignore, '*\n!.gitignore\n', 'utf8');

  const agentPath = join(magentPath, agent);
  mkdirSync(agentPath, { recursive: true });
  return agentPath;
};

// path to a specific file in an agent's folder
export const agentFilePath = (dir: string, agent: Agent, file: string): string => join(dir, MAGENT_DIR, agent, file);

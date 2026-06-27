import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { Agent, type Plan } from '@/agents/types/common.types';
import { agentFilePath, ensureAgentDir } from '@/project/agent-files';

const PLAN_FILE = 'plan.json';
const ARCHIVE_DIR = 'archive';

export const loadPlan = (dir: string): Plan | null => {
  const path = agentFilePath(dir, Agent.PLANNER, PLAN_FILE);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8')) as Plan;
};

export const writePlan = (dir: string, plan: Plan): void => {
  ensureAgentDir(dir, Agent.PLANNER);
  writeFileSync(agentFilePath(dir, Agent.PLANNER, PLAN_FILE), JSON.stringify(plan, null, 2), 'utf8');
};

export const archivePlan = (dir: string, plan: Plan): void => {
  const agentPath = ensureAgentDir(dir, Agent.PLANNER);
  const archivePath = join(agentPath, ARCHIVE_DIR);
  mkdirSync(archivePath, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(archivePath, `${plan.slug}-${stamp}.json`), JSON.stringify(plan, null, 2), 'utf8');
  // remove the active plan so the next run goes fresh
  const activePath = agentFilePath(dir, Agent.PLANNER, PLAN_FILE);
  if (existsSync(activePath)) rmSync(activePath);
};

export const clearPlan = (dir: string): void => {
  const activePath = agentFilePath(dir, Agent.PLANNER, PLAN_FILE);
  if (existsSync(activePath)) rmSync(activePath);
};

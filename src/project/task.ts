import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { Agent, type Task } from '@/agents/types/common.types';
import { agentFilePath, ensureAgentDir } from '@/project/agent-files';
import { run } from '@/lib/git';

const TASK_FILE = 'task.json';
const ARCHIVE_DIR = 'archive';

export const loadTask = (dir: string): Task | null => {
  const path = agentFilePath(dir, Agent.EXECUTOR, TASK_FILE);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8')) as Task;
};

export const writeTask = (dir: string, task: Task): void => {
  ensureAgentDir(dir, Agent.EXECUTOR);
  writeFileSync(agentFilePath(dir, Agent.EXECUTOR, TASK_FILE), JSON.stringify(task, null, 2), 'utf8');
};

export const archiveTask = (dir: string, task: Task): void => {
  const agentPath = ensureAgentDir(dir, Agent.EXECUTOR);
  const archivePath = join(agentPath, ARCHIVE_DIR);
  mkdirSync(archivePath, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(archivePath, `${task.slug}-${stamp}.json`), JSON.stringify(task, null, 2), 'utf8');
  const activePath = agentFilePath(dir, Agent.EXECUTOR, TASK_FILE);
  if (existsSync(activePath)) rmSync(activePath);
};

export const clearTask = (dir: string): void => {
  const activePath = agentFilePath(dir, Agent.EXECUTOR, TASK_FILE);
  if (existsSync(activePath)) rmSync(activePath);
};

export const isTaskDeciding = (dir: string, branch: string, task: Task): boolean => {
  try {
    const lastBody = run(`git log -1 --format=%B ${branch}`, dir);
    const subject = `${task.type}: ${task.description}`;
    const idTrailer = `Magent-Task-Id: ${task.id}`;
    return lastBody.includes(subject) && lastBody.includes(idTrailer);
  } catch {
    return false;
  }
};

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { run } from '@/lib/git';

const CONFIG_DIR = '.magent';
const CONFIG_FILE = 'config.json';

export interface MagentConfig {
  baseBranch: string;
  autoPush: boolean;
}

const configPath = (dir: string) => join(dir, CONFIG_DIR, CONFIG_FILE);

// detect the repo's real default branch — origin/HEAD, else main, else master, else current
export const detectDefaultBranch = (dir: string): string => {
  try {
    const ref = run('git symbolic-ref refs/remotes/origin/HEAD', dir).trim();
    const branch = ref.replace('refs/remotes/origin/', '');
    if (branch) return branch;
  } catch {
    /* no remote HEAD — fall through */
  }
  for (const candidate of ['main', 'master']) {
    try {
      run(`git rev-parse --verify ${candidate}`, dir);
      return candidate;
    } catch {
      /* not this one */
    }
  }
  // last resort: current branch
  try {
    return run('git rev-parse --abbrev-ref HEAD', dir).trim();
  } catch {
    return 'main';
  }
};

export const loadConfig = (dir: string): MagentConfig => {
  const path = configPath(dir);
  if (!existsSync(path)) {
    return { baseBranch: detectDefaultBranch(dir), autoPush: false };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<MagentConfig>;
    return {
      baseBranch: parsed.baseBranch || detectDefaultBranch(dir),
      autoPush: parsed.autoPush ?? false,
    };
  } catch {
    return { baseBranch: detectDefaultBranch(dir), autoPush: false };
  }
};

export const writeConfig = (dir: string, config: MagentConfig): void => {
  const configDir = join(dir, CONFIG_DIR);
  mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath(dir), JSON.stringify(config, null, 2), 'utf8');
};

export const listBranches = (dir: string): string[] => {
  try {
    return run('git branch --format="%(refname:short)"', dir)
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

import { execSync } from 'node:child_process';

export const run = (cmd: string, dir: string) => execSync(cmd, { cwd: dir, stdio: 'pipe' }).toString();

export const cleanup = (dir: string, branch: string) => {
  run(`git checkout .`, dir);
  run(`git clean -fd`, dir);
  run(`git checkout -`, dir);
  run(`git branch -D ${branch}`, dir);
};

export const checkGitPreconditions = (dir: string): void => {
  try {
    run('git rev-parse --git-dir', dir);
  } catch {
    throw new Error('Target directory is not a git repo');
  }

  let commitCount: number;
  try {
    const result = run('git rev-list --all --count', dir).trim();
    commitCount = parseInt(result, 10);
  } catch {
    throw new Error('No commits found — make an initial commit first');
  }
  if (commitCount === 0) {
    throw new Error('No commits found — make an initial commit first');
  }

  let status: string;
  try {
    status = run('git status --porcelain', dir).trim();
  } catch {
    throw new Error('Working tree is dirty — stash or commit changes before running Magent');
  }
  if (status !== '') {
    throw new Error('Working tree is dirty — stash or commit changes before running Magent');
  }
};

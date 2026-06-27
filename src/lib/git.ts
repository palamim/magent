import { execSync } from 'node:child_process';

export const run = (cmd: string, dir: string) => execSync(cmd, { cwd: dir, stdio: 'pipe' }).toString();

export const cleanup = (dir: string, branch: string) => {
  run(`git checkout .`, dir);
  run(`git clean -fd`, dir);
  run(`git checkout -`, dir);
  run(`git branch -D ${branch}`, dir);
};

export const computeBranchDiff = (dir: string, branch: string): string => {
  const base = run(`git merge-base main ${branch}`, dir).trim();
  return run(`git diff ${base} ${branch}`, dir);
};

export const deriveBranchName = (type: string, slug: string): string => {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `${type}/${safeSlug}`;
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

export const branchExists = (dir: string, branch: string): boolean => {
  try {
    run(`git rev-parse --verify ${branch}`, dir);
    return true;
  } catch {
    return false;
  }
};

export const discardLastCommit = (dir: string, branch: string): void => {
  run(`git checkout ${branch}`, dir);
  run(`git reset --hard HEAD~1`, dir); // undo the last commit + its changes
};

export const mergePlan = (dir: string, branch: string, push: boolean): { merged: boolean; pushed: boolean } => {
  run(`git checkout main`, dir);
  run(`git merge ${branch}`, dir);
  run(`git branch -d ${branch}`, dir);
  if (!push) return { merged: true, pushed: false };
  let pushed = false;
  try {
    run(`git push`, dir);
    pushed = true;
  } catch {
    /* push is best-effort; report not-pushed */
  }
  return { merged: true, pushed };
};

export const discardBranch = (dir: string, branch: string): void => {
  run(`git checkout main`, dir);
  run(`git branch -D ${branch}`, dir);
};

import { execSync } from 'node:child_process';

export const run = (cmd: string, dir: string) => execSync(cmd, { cwd: dir, stdio: 'pipe' }).toString();

export const cleanup = (dir: string, branch: string) => {
  run(`git checkout .`, dir);
  run(`git clean -fd`, dir);
  run(`git checkout -`, dir);
  run(`git branch -D ${branch}`, dir);
};

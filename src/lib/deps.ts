import { run } from '@/lib/git';

export const installDependencies = (dir: string, dependencies: string[]): void => {
  if (!dependencies || dependencies.length === 0) return;
  run(`npm install ${dependencies.join(' ')}`, dir);
};

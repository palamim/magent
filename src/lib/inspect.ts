import { execSync } from 'node:child_process';
import { run } from '@/lib/git';

type InspectTool = 'vscode' | 'finder' | 'terminal' | 'ghostty';

const COMMANDS: Record<InspectTool, (dir: string) => string> = {
  vscode: (dir) => `code ${JSON.stringify(dir)}`,
  finder: (dir) => `open ${JSON.stringify(dir)}`,
  terminal: (dir) => `open -a Terminal ${JSON.stringify(dir)}`,
  ghostty: (dir) => `open -a Ghostty ${JSON.stringify(dir)}`,
};

export const openInTool = (dir: string, branch: string, tool: InspectTool): void => {
  run(`git checkout ${branch}`, dir);
  const build = COMMANDS[tool];
  if (!build) throw new Error(`Unknown inspect tool: ${tool}`);
  execSync(build(dir), { stdio: 'ignore' });
};

export type { InspectTool };

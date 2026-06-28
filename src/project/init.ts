import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { run } from '@/lib/git';
import { loadDirection, writeDirection } from '@/project/direction';
import { loadConfig, writeConfig } from '@/project/config';

const MAGENT_IGNORE = '.magent/';
const STARTER_DIRECTION = `# direction.md

## Starter frontier (replace this with your own via the Director)

This is a starter direction so you can see Magent's loop work immediately. It is intentionally
general. For Magent to propose genuinely good work, run the **Director** (in the Direct tab) to
set a real frontier for *this* project — what it should become, and why.

Until then, the frontier is: **small, safe, genuinely useful improvements grounded in the
project's real state.** Look at what the project actually is, and propose the kind of modest,
shippable improvement a careful engineer would make on a first pass — a real rough edge, a small
quality or clarity improvement, a minor gap worth closing. Nothing structural, nothing risky,
nothing that assumes context you don't have. One small, real, reviewable improvement.

When you're ready for Magent to do meaningful work, set a real direction with the Director.
`;

export const ensureProjectInitialized = (dir: string): void => {
  ensureGitignored(dir);
  ensureStarterDirection(dir);
  ensureConfig(dir);
};

const ensureConfig = (dir: string): void => {
  const path = join(dir, '.magent', 'config.json');
  if (!existsSync(path)) writeConfig(dir, loadConfig(dir));
};

const ensureStarterDirection = (dir: string): void => {
  if (loadDirection(dir) === '(none)') {
    writeDirection(dir, STARTER_DIRECTION);
  }
};

const ensureGitignored = (dir: string): void => {
  const gitignorePath = join(dir, '.gitignore');

  if (!existsSync(gitignorePath)) {
    // no .gitignore at all — create one with our entry
    writeFileSync(gitignorePath, `${MAGENT_IGNORE}\n`, 'utf8');
    return;
  }

  const content = readFileSync(gitignorePath, 'utf8');
  const alreadyIgnored = content
    .split('\n')
    .map((line) => line.trim())
    .some((line) => line === MAGENT_IGNORE || line === '.magent' || line === '.magent/*');

  if (!alreadyIgnored) {
    // append, handling whether the file ends with a newline
    const prefix = content.endsWith('\n') || content.length === 0 ? '' : '\n';
    appendFileSync(gitignorePath, `${prefix}${MAGENT_IGNORE}\n`, 'utf8');
  }
};

export const isMagentGitignored = (dir: string): boolean => {
  const gitignorePath = join(dir, '.gitignore');
  if (!existsSync(gitignorePath)) return false;
  const content = readFileSync(gitignorePath, 'utf8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .some((line) => line === '.magent/' || line === '.magent' || line === '.magent/*');
};

export const setupMagentGitignore = (dir: string): void => {
  ensureGitignored(dir); // append .magent/ to .gitignore (you already have this)
  // commit ONLY the .gitignore — scoped, explained, leaves the user's other changes untouched
  run('git add .gitignore', dir);
  run('git commit -m "chore: ignore .magent (Magent local memory)"', dir);
};

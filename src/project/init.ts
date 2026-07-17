import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { run } from '@/lib/git';
import { loadDirection, writeDirection } from '@/project/direction';
import { loadConfig, writeConfig } from '@/project/config';

const MAGENT_IGNORE = '.magent/';

export const ensureProjectInitialized = (dir: string): void => {
  ensureGitignored(dir);
  ensureConfig(dir);
};

const ensureConfig = (dir: string): void => {
  const path = join(dir, '.magent', 'config.json');
  if (!existsSync(path)) writeConfig(dir, loadConfig(dir));
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

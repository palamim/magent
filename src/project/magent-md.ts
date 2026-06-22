// project/magent-md.ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const loadMagentMd = (dir: string): string => {
  const path = join(dir, 'MAGENT.md');
  if (!existsSync(path)) return '(no MAGENT.md — ask the builder to create one)';
  return readFileSync(path, 'utf8');
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const loadConventions = (dir: string): string => {
  const conventionsPath = join(dir, '.magent', 'conventions.md');
  if (!existsSync(conventionsPath)) return '(none)';
  const conventions = readFileSync(conventionsPath, 'utf-8');
  return conventions;
};

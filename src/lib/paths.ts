import { join, resolve } from 'node:path';

export const resolveProjectPath = (path: string, dir: string): string | null => {
  const abs = path.startsWith('/') ? path : join(dir, path);
  const resolvedAbs = resolve(abs);
  const resolvedDir = resolve(dir);
  // must be inside the project dir (or the dir itself) — separator guard prevents
  // sibling-dir leakage like /proj-secrets matching /proj
  if (resolvedAbs !== resolvedDir && !resolvedAbs.startsWith(resolvedDir + '/')) return null;
  return resolvedAbs;
};

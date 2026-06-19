import { existsSync, readFileSync } from 'node:fs';

export const readAndFormatFiles = (paths: string[]): string => {
  const files: { path: string; content: string }[] = paths
    .filter((p) => {
      if (!existsSync(p)) {
        // might later want to return { files, missing: string[] }
        return false;
      }
      return true;
    })
    .map((p) => ({ path: p, content: readFileSync(p, 'utf-8') }));
  return files.map((f) => `--- ${f.path} ---\n${f.content}`).join('\n\n');
};

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { Execution } from '@/agents/executor';
import { resolveProjectPath } from '@/lib/paths';

export const applyExecution = (
  execution: Execution,
  dir: string,
  originals: Map<string, string | null>,
): { applyErrors: string[] } => {
  const applyErrors: string[] = [];

  for (const c of execution.creates) {
    const realPath = resolveProjectPath(c.path, dir)!;
    if (existsSync(realPath)) {
      applyErrors.push(
        `In ${c.path}: you used "creates" for a file that already exists. Use "edits" to modify existing files; "creates" is only for new files.`,
      );
      continue;
    }
    if (!originals.has(realPath)) originals.set(realPath, null);
    mkdirSync(dirname(realPath), { recursive: true });
    writeFileSync(realPath, c.content, 'utf8');
  }

  for (const e of execution.edits) {
    const realPath = resolveProjectPath(e.path, dir)!;
    const current = existsSync(realPath) ? readFileSync(realPath, 'utf8') : '';
    if (!originals.has(realPath)) {
      originals.set(realPath, existsSync(realPath) ? current : null);
    }
    const occurrences = current.split(e.oldText).length - 1;

    if (occurrences === 0) {
      applyErrors.push(
        `In ${e.path}: could not find the oldText to replace. The snippet was not present in the file (check exact whitespace/indentation).\noldText was:\n${e.oldText}`,
      );
      continue;
    }
    if (occurrences > 1) {
      applyErrors.push(
        `In ${e.path}: the oldText matched ${occurrences} places, so it is ambiguous. Include more surrounding lines to make it unique.\noldText was:\n${e.oldText}`,
      );
      continue;
    }
    writeFileSync(realPath, current.replace(e.oldText, e.newText), 'utf8');
  }

  return {
    applyErrors,
  };
};

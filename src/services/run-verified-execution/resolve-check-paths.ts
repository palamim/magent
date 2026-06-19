import type { Execution } from '@/agents/executor';
import { resolveProjectPath } from '@/lib/paths';

export const resolveAndCheckPaths = (execution: Execution, dir: string): string[] => {
  const allPaths = [...execution.edits.map((e) => e.path), ...execution.creates.map((c) => c.path)];
  const unresolved = allPaths.filter((p) => resolveProjectPath(p, dir) === null);
  return unresolved;
};

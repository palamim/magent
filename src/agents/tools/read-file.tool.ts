import type Anthropic from '@anthropic-ai/sdk';
import { existsSync, readFileSync, statSync } from 'node:fs';

import { resolveProjectPath } from '@/lib/paths';

// ── declaration (faces the model) ──
export const readFileTool: Anthropic.Tool = {
  name: 'read_file',
  description:
    'Reads the full contents of a single source file in the project. Use this to inspect a file before proposing changes to it. Call it whenever you need to see what a file actually contains.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path of the file to read, exactly as listed in the available files.',
      },
    },
    required: ['path'],
  },
};

// ── execution (faces the machine) ──
export const executeReadFile = (path: string, dir: string): { content: string; isError: boolean } => {
  const resolvedPath = resolveProjectPath(path, dir);
  if (!resolvedPath || !existsSync(resolvedPath)) {
    return { content: 'PathError: file not found in project.', isError: true };
  }
  try {
    const stat = statSync(resolvedPath);
    if (stat.isDirectory()) {
      return {
        content: `PathError: ${path} is a directory, not a file. Pick a specific file from the file list.`,
        isError: true,
      };
    }
    return { content: readFileSync(resolvedPath, 'utf8'), isError: false };
  } catch {
    return { content: `ReadError: could not read ${path}.`, isError: true };
  }
};

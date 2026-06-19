import type Anthropic from '@anthropic-ai/sdk';
import { existsSync, readFileSync } from 'node:fs';

import { resolveProjectPath } from '@/agents/utils/resolve-path';

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
  const resolved = resolveProjectPath(path, dir);
  if (!resolved || !existsSync(resolved)) {
    return { content: 'PathError: file not found in project.', isError: true };
  }
  return { content: readFileSync(resolved, 'utf-8'), isError: true ? false : false };
};

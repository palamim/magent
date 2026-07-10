import type Anthropic from '@anthropic-ai/sdk';

import type { ArchitectResult } from '@/agents/architect/architect.types';

export const submitConventionsTool: Anthropic.Tool = {
  name: 'submit_conventions',
  description:
    'Submit your proposed conventions. Provide the full string content for the conventions.md markdown document.',
  input_schema: {
    type: 'object',
    properties: {
      conventions: {
        type: 'string',
        description: 'The full new content for conventions.md — the coding conventions.',
      },
    },
    required: ['conventions'],
  },
};

export const executeSubmitConventions = (
  input: unknown,
  steps: number,
  toolCalls: number,
  readFileCalls: number,
  filesRead: string[],
  inputTokens: number,
  outputTokens: number,
): ArchitectResult => {
  const data = input as Partial<ArchitectResult>;
  return {
    conventions: data.conventions ?? '',
    steps,
    toolCalls,
    readFileCalls,
    filesRead,
    inputTokens,
    outputTokens,
  };
};

import type Anthropic from '@anthropic-ai/sdk';
import type { Execution } from '../executor/executor.types';

// ── declaration (faces the model) ──
export const submitExecutionTool: Anthropic.Tool = {
  name: 'submit_changes',
  description:
    'Submit the changes that implement the work order. Use `edits` to modify existing files (find-and-replace on exact text) and `creates` to make new files. Call this exactly once with all your changes.',
  input_schema: {
    type: 'object',
    properties: {
      edits: {
        type: 'array',
        description:
          'Modifications to existing files. Each edit finds an exact snippet (oldText) in a file and replaces it with newText. A single file may have multiple edits.',
        items: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Absolute path of the file to edit, exactly as given in the work order targetFiles.',
            },
            oldText: {
              type: 'string',
              description:
                'The EXACT text to find in the current file, copied verbatim including indentation and whitespace. It MUST appear EXACTLY ONCE in the file. Include enough surrounding lines (a few above and below the change) so the snippet is unique — if the line you are changing also appears elsewhere, widen the snippet until it matches only one place.',
            },
            newText: {
              type: 'string',
              description:
                'The text to replace oldText with. This replaces the entire oldText snippet, so include any surrounding context lines from oldText that should be preserved.',
            },
          },
          required: ['path', 'oldText', 'newText'],
        },
      },
      creates: {
        type: 'array',
        description:
          'New files to create. Only for files that do not yet exist. Each has the file path and its full content.',
        items: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Absolute path of the new file, exactly as given in the work order targetFiles.',
            },
            content: {
              type: 'string',
              description: 'The complete contents of the new file.',
            },
          },
          required: ['path', 'content'],
        },
      },
    },
    required: ['edits', 'creates'],
  },
};

// ── execution (faces the machine) ──
export const executeSubmitExecution = (raw: unknown): Execution => {
  const input = raw as Partial<Execution>;
  return {
    edits: Array.isArray(input.edits) ? input.edits : [],
    creates: Array.isArray(input.creates) ? input.creates : [],
  };
};

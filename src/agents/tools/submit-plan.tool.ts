import type Anthropic from '@anthropic-ai/sdk';

export const submitPlanTool: Anthropic.Tool = {
  name: 'submit_plan',
  description:
    'Submit the finalized plan for the current feature. Call this exactly once when the plan ' +
    'is complete. In fresh mode, this is the new plan for the next feature. In advance mode, ' +
    'this is the updated plan with task statuses re-grounded against the codebase. Always ' +
    'include nextTaskId pointing to the next pending task to run (empty string if all tasks are done).',
  input_schema: {
    type: 'object',
    properties: {
      frontier: { type: 'string', description: 'The slice of the direction this plan serves (one line).' },
      goal: { type: 'string', description: 'One line: what this whole plan (one feature) achieves.' },
      type: {
        type: 'string',
        description: 'Commit type for this feature: feat, fix, chore, refactor, style, or docs.',
      },
      slug: { type: 'string', description: 'Short kebab-case identifier, e.g. markdown-to-react.' },
      tasks: {
        type: 'array',
        description: 'The ordered tasks. Each is one executor run. A small feature may have one task.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Stable id, e.g. t1, t2. Preserve ids across advance runs.' },
            slug: {
              type: 'string',
              description:
                'Short kebab-case label for this task, e.g. create-post-navigation. Used for the branch and commit.',
            },
            description: { type: 'string', description: 'What this task accomplishes.' },
            instructions: { type: 'string', description: 'Clear, file-by-file directive for the executor.' },
            targetFiles: { type: 'array', items: { type: 'string' }, description: 'Absolute paths this task changes.' },
            contextFiles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Absolute paths to read for context.',
            },
            status: { type: 'string', enum: ['pending', 'done'], description: 'pending or done.' },
          },
          required: ['id', 'slug', 'description', 'instructions', 'targetFiles', 'contextFiles', 'status'],
        },
      },
      nextTaskId: {
        type: 'string',
        description: 'Id of the next pending task to run. Empty string if every task is done.',
      },
    },
    required: ['frontier', 'goal', 'type', 'slug', 'tasks', 'nextTaskId'],
  },
};

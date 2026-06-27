import type Anthropic from '@anthropic-ai/sdk';

export const submitPlanTool: Anthropic.Tool = {
  name: 'submit_plan',
  description:
    'Submit the finalized plan for the current feature. Call this exactly once when the plan ' +
    'is complete. In fresh mode, this is the new plan. In advance mode, this is the updated plan ' +
    'with task statuses re-grounded against the codebase. Number tasks sequentially in execution ' +
    'order — the system runs the lowest-numbered pending task next.',
  input_schema: {
    type: 'object',
    properties: {
      frontier: { type: 'string', description: 'The slice of the direction this plan serves (one line).' },
      goal: { type: 'string', description: 'One line: what this whole plan (one feature) achieves.' },
      type: {
        type: 'string',
        description:
          'Commit type for the PLAN as a whole — names the branch (feat, fix, chore, refactor, style, docs).',
      },
      slug: {
        type: 'string',
        description: 'Short kebab-case identifier for the plan, e.g. add-syntax-highlighting. Names the branch.',
      },
      tasks: {
        type: 'array',
        description:
          'The tasks, in execution order. Each is one executor run (one commit). A small feature may have one task.',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description:
                'Sequential number indicating execution order (1, 2, 3...). The lowest-numbered pending task runs next. If task B depends on task A, give A the lower number. Preserve ids across advance runs.',
            },
            slug: {
              type: 'string',
              description: 'Short kebab-case label for this task, e.g. create-highlighter.',
            },
            type: {
              type: 'string',
              description:
                "Commit type for THIS task's commit (feat, fix, chore, refactor, style, docs). A feat plan may contain a chore or test task — type each task by what its commit actually is.",
            },
            description: { type: 'string', description: 'What this task accomplishes (used as the commit message).' },
            instructions: { type: 'string', description: 'Clear, file-by-file directive for the executor.' },
            targetFiles: { type: 'array', items: { type: 'string' }, description: 'Absolute paths this task changes.' },
            contextFiles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Absolute paths to read for context.',
            },
            status: { type: 'string', enum: ['pending', 'done'], description: 'pending or done.' },
          },
          required: ['id', 'slug', 'type', 'description', 'instructions', 'targetFiles', 'contextFiles', 'status'],
        },
      },
      dependencies: {
        type: 'array',
        items: { type: 'string' },
        description:
          'npm packages this feature requires that are not already installed (e.g. ["highlight.js"]). Installed automatically before execution — do NOT create tasks to install them. Empty array if none.',
      },
    },
    required: ['frontier', 'goal', 'type', 'slug', 'tasks', 'dependencies'],
  },
};

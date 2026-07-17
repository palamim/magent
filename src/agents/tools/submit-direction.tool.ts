import type Anthropic from '@anthropic-ai/sdk';

import type { DirectionProposal } from '@/agents/director/director.types';

export const submitDirectionTool: Anthropic.Tool = {
  name: 'submit_direction',
  description:
    'Submit your proposed direction. Provide the rationale, the full new content for ' +
    'direction.md. The document is written in full — it replaces the current version, ' +
    'so include everything that should remain, not just changes.',
  input_schema: {
    type: 'object',
    properties: {
      rationale: {
        type: 'string',
        description: 'Why this direction — the reasoning behind what you are proposing to pursue.',
      },
      direction: {
        type: 'string',
        description:
          'The full new content for direction.md — the current frontier: the single most important direction of travel for the project right now, argued with reasoning and boundaries. Not a list of features.',
      },
    },
    required: ['rationale', 'direction'],
  },
};

export const executeSubmitDirection = (input: unknown): DirectionProposal => {
  const data = input as Partial<DirectionProposal>;
  return {
    rationale: data.rationale ?? '',
    direction: data.direction ?? '',
  };
};

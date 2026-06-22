import type Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/agents/models';
import { readFileTool } from '@/agents/tools/read-file.tool';
import { dispatchToolCalls } from '@/agents/tools/dispatch';
import { directorPrompt } from '@/agents/director/director.prompt';
import type { DirectionProposal } from '@/agents/director/director.types';
import { submitDirectionTool, executeSubmitDirection } from '@/agents/tools/submit-direction.tool';
import { Agent } from '@/agents/types/common.types';
import { loadFeedback } from '@/project/feedback';
import { loadDirection } from '@/project/direction';
import { loadConventions } from '@/project/conventions';
import { loadMagentMd } from '@/project/magent-md';

const MAX_DIRECTOR_STEPS = 12;
const MAX_DIRECTOR_TOKENS = 8192;

export const runDirector = async (fileList: string, client: Anthropic, dir: string): Promise<DirectionProposal> => {
  const magentMd = loadMagentMd(dir);
  const currentDirection = loadDirection(dir);
  const currentConventions = loadConventions(dir);
  const plannerFeedback = loadFeedback(dir, Agent.PLANNER);
  const executorFeedback = loadFeedback(dir, Agent.EXECUTOR);
  const directorFeedback = loadFeedback(dir, Agent.DIRECTOR);

  const prompt = directorPrompt(
    magentMd,
    currentDirection,
    currentConventions,
    plannerFeedback,
    executorFeedback,
    directorFeedback,
    fileList,
  );

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

  let steps = 0;
  while (steps < MAX_DIRECTOR_STEPS) {
    steps++;

    const message = await client.messages.create({
      max_tokens: MAX_DIRECTOR_TOKENS,
      model: ANTHROPIC_MODELS.CLAUDE_SONNET_4_6,
      tools: [readFileTool, submitDirectionTool],
      messages,
    });

    messages.push({ role: 'assistant', content: message.content });

    const submitBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_direction',
    );
    if (submitBlock) {
      return executeSubmitDirection(submitBlock.input);
    }

    const readCalls = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'read_file',
    );
    if (readCalls.length === 0) {
      messages.push({ role: 'user', content: 'Please read files with read_file or finish with submit_direction.' });
      continue;
    }

    messages.push({ role: 'user', content: dispatchToolCalls(message, dir) });
  }

  throw new Error(`Director ended loop without submitting (hit ${MAX_DIRECTOR_STEPS} steps).`);
};

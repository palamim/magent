import Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/agents/models';
import { dispatchToolCalls } from '@/agents/tools/dispatch';
import { executeSubmitExecution, submitExecutionTool } from '@/agents/tools/submit-execution.tool';
import { readFileTool } from '@/agents/tools/read-file.tool';

import type { Execution } from './executor.types';

const MAX_EXECUTOR_STEPS = 3;
const MAX_EXECUTOR_TOKENS = 16384;

export const runExecutor = async (client: Anthropic, prompt: string, dir: string): Promise<Execution> => {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

  let execution: Execution | null = null;

  let steps = 0;
  while (steps < MAX_EXECUTOR_STEPS) {
    steps++;

    const message = await client.messages.create({
      max_tokens: MAX_EXECUTOR_TOKENS,
      model: ANTHROPIC_MODELS.CLAUDE_SONNET_4_6,
      tools: [readFileTool, submitExecutionTool],
      messages,
    });

    messages.push({ role: 'assistant', content: message.content });

    const submitBlock = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'submit_changes',
    );
    if (submitBlock) {
      execution = executeSubmitExecution(submitBlock.input);
    }

    const readCalls = message.content.filter((b) => b.type === 'tool_use' && b.name === 'read_file');
    if (readCalls.length === 0) {
      messages.push({
        role: 'user',
        content: 'Please either read a file with read_file or finish with submit_changes.',
      });
      continue;
    }

    messages.push({ role: 'user', content: dispatchToolCalls(message, dir) });
  }

  if (!execution) {
    throw new Error('Executor hit MAX_EXECUTOR_STEPS without submitting changes.');
  }

  return execution;
};

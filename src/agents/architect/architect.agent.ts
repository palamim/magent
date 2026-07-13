import type Anthropic from '@anthropic-ai/sdk';

import { ANTHROPIC_MODELS } from '@/agents/models';
import { readFileTool } from '@/agents/tools/read-file.tool';
import { dispatchToolCalls } from '@/agents/tools/dispatch';
import { submitConventionsTool, executeSubmitConventions } from '@/agents/tools/submit-conventions.tool';
import { conventionsPrompt } from '@/agents/architect/architect.prompt';
import type { ArchitectResult } from '@/agents/architect/architect.types';

const MAX_ARCHITECT_STEPS = 30;
const MAX_ARCHITECT_TOKENS = 8192;

export const runArchitect = async (client: Anthropic, dir: string, fileList: string): Promise<ArchitectResult> => {
  const prompt = conventionsPrompt(fileList);
  const model = ANTHROPIC_MODELS.CLAUDE_SONNET_4_6;
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  let steps = 0;
  let toolCalls = 0;
  let readFileCalls = 0;
  const filesRead: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  while (steps < MAX_ARCHITECT_STEPS) {
    steps++;

    const message = await client.messages.create({
      max_tokens: MAX_ARCHITECT_TOKENS,
      model: model,
      tools: [readFileTool, submitConventionsTool],
      messages,
    });
    inputTokens += message.usage.input_tokens;
    outputTokens += message.usage.output_tokens;

    messages.push({ role: 'assistant', content: message.content });

    for (const block of message.content) {
      if (block.type === 'tool_use') {
        toolCalls++;
        if (block.name === 'read_file') {
          readFileCalls++;
          const path = (block.input as { path?: string }).path;
          if (path) filesRead.push(path);
        }
      }
    }

    const submitBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_conventions',
    );
    if (submitBlock) {
      return executeSubmitConventions(
        submitBlock.input,
        model,
        prompt,
        steps,
        toolCalls,
        readFileCalls,
        filesRead,
        inputTokens,
        outputTokens,
      );
    }

    const readCalls = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'read_file',
    );

    if (readCalls.length === 0) {
      messages.push({ role: 'user', content: 'Please read files with read_file or finish with submit_conventions.' });
      continue;
    }

    messages.push({ role: 'user', content: dispatchToolCalls(message, dir) });
  }

  throw new Error(`Architect ended loop without submitting (hit ${MAX_ARCHITECT_STEPS} steps).`);
};

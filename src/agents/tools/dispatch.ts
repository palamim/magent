import type Anthropic from '@anthropic-ai/sdk';
import { executeReadFile } from '@/agents/tools/read-file.tool';

// ── for feed-back tools ──
export const dispatchToolCalls = (message: Anthropic.Messages.Message, dir: string): Anthropic.ContentBlockParam[] =>
  message.content
    .filter((block) => block.type === 'tool_use')
    .map((tool) => {
      const result = runTool(tool, dir);
      return {
        type: 'tool_result',
        tool_use_id: tool.id,
        content: result.content,
        ...(result.isError && { is_error: true }),
      };
    });

const runTool = (tool: Anthropic.ToolUseBlock, dir: string) => {
  switch (tool.name) {
    case 'read_file': {
      const { path } = tool.input as { path: string };
      return executeReadFile(path, dir);
    }

    default: {
      return { content: `Unknown tool: ${tool.name}`, isError: true };
    }
  }
};

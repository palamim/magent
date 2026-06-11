import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.vscode', '.astro']);
const SOURCE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.md',
  '.json',
  '.astro',
]);
const MAX_FILE_BYTES = 50_000;

const target = process.argv[2] ?? process.env['MAGENT_PROJECT_PATH'];
if (!target) {
  console.error(
    'Usage: node propose.ts <path-to-project>  (or set MAGENT_PROJECT_PATH in .env)',
  );
  process.exit(1);
}

const collectFiles = (dir: string, acc: { path: string }[] = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collectFiles(full, acc);
    } else if (
      SOURCE_EXTS.has(extname(entry)) &&
      stats.size <= MAX_FILE_BYTES
    ) {
      acc.push({ path: full });
    }
  }
  return acc;
};

const files = collectFiles(target);

const intentPath = join(target, 'magent.md');
const intent = existsSync(intentPath) ? readFileSync(intentPath, 'utf8') : '';
const intentLog = intent
  ? 'magent.md found — proposing with project intent.'
  : 'No magent.md found — proposing without project intent.';

console.log(intentLog);

console.log('\nAsking the model for one change...');

const fileList = files.map((f) => f.path).join('\n');

const readFileTool: Anthropic.Tool = {
  name: 'read_file',
  description:
    'Reads the full contents of a single source file in the project. Use this to inspect a file before proposing changes to it. Call it whenever you need to see what a file actually contains.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'The absolute path of the file to read, exactly as listed in the available files.',
      },
    },
    required: ['path'],
  },
};

const client = new Anthropic();

const messages: Anthropic.MessageParam[] = [
  {
    role: 'user',
    content: `You are a thinking partner for a builder, proposing the next step for their project.
              Below is the project's INTENT — whatever the builder wants you to know about it — followed by the project's FILE LIST.
              Propose ONE concrete next step that advances the project in the spirit of the intent.
              It could be a feature, a craft improvement, or a meaningful evolution.
              Honor everything the intent says, including anything it tells you to avoid.
              Prefer something real and shippable over something grand.
              Read whatever files you need using the read_file tool to understand the project, then propose one next step.
              Start by reading some files.
              When you have explored enough, end your response with a JSON object in exactly this shape (you may include brief reasoning before it):
              {
                "description": "<one sentence: what the next step is and why>",
                "type": "<one of: feat, fix, chore, refactor, style, docs>",
                "targetFiles": ["<absolute path of each file that must be CHANGED>"],
                "contextFiles": ["<absolute path of each file the executor should READ for context but not change>"],
                "instructions": "<clear, specific description of what the executor must do, file by file>"
              }

              --- INTENT ---
              ${intent || '(no intent file provided)'}

              --- FILE LIST ---
              ${fileList}`,
  },
];

let workOrder: {
  description: string;
  type: string;
  targetFiles: string[];
  contextFiles: string[];
  instructions: string;
} | null = null;

let steps = 0;
const MAX_STEPS = 10;
while (steps < MAX_STEPS) {
  steps++;
  const message = await client.messages.create({
    max_tokens: 4096,
    model: 'claude-haiku-4-5',
    tools: [readFileTool],
    messages: messages,
  });

  messages.push({
    role: 'assistant',
    content: message.content,
  });

  if (message.stop_reason !== 'tool_use') {
    const lastBlock = message.content.filter((b) => b.type === 'text').pop();
    const text = lastBlock && lastBlock.type === 'text' ? lastBlock.text : '';

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('No JSON work order found:\n', text);
      process.exit(1);
    }
    try {
      workOrder = JSON.parse(match[0]);
    } catch {
      console.error('Could not parse work order JSON:\n', match[0]);
      process.exit(1);
    }
    break;
  }

  if (message.content[0] && message.content[0].type === 'text') {
    console.log('');
    console.log(message.content[0].text);
  }

  interface ReadFileInput {
    path: string;
  }

  const toolContent: Anthropic.ContentBlockParam[] = message.content
    .filter((block) => block.type === 'tool_use')
    .map((tool_request) => {
      const input = tool_request.input as ReadFileInput;
      if (existsSync(input.path)) {
        const fileContent = readFileSync(input.path, 'utf-8');
        return {
          type: 'tool_result',
          tool_use_id: tool_request.id,
          content: fileContent,
        };
      }
      return {
        type: 'tool_result',
        tool_use_id: tool_request.id,
        content: 'PathError: file path does not exist.',
        is_error: true,
      };
    });

  messages.push({
    role: 'user',
    content: toolContent,
  });

  console.log(`Step ${steps}: model requested ${toolContent.length} file(s)`);
}

if (!workOrder) {
  console.error('Loop ended without a work order (hit MAX_STEPS).');
  process.exit(1);
}

console.log('\n--- WORK ORDER ---');
console.log('Type:', workOrder.type);
console.log('Description:', workOrder.description);
console.log('Target files:', workOrder.targetFiles);
console.log('Context files:', workOrder.contextFiles);
console.log('Instructions:', workOrder.instructions);

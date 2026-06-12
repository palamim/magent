// ---- imports ----
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diffLines } from 'diff';
// --------

// ---- constants (SKIP_DIRS, etc.) ----
const SKIP_DIRS = new Set(['node_modules', 'dist', '.vscode', '.astro']);
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.astro']);
const MAX_FILE_BYTES = 50_000;

// ---- types ----
interface Intent {
  isThereIntent: boolean;
  text: string;
}

interface WorkOrder {
  description: string;
  type: string;
  targetFiles: string[];
  contextFiles: string[];
  instructions: string;
}

interface Change {
  path: string;
  newContent: string;
}

// ---- tools ----
const readFileTool: Anthropic.Tool = {
  name: 'read_file',
  description:
    'Reads the full contents of a single source file in the project. Use this to inspect a file before proposing changes to it. Call it whenever you need to see what a file actually contains.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path of the file to read, exactly as listed in the available files.',
      },
    },
    required: ['path'],
  },
};

// ---- helper functions (collectProjectFiles, runPlanner, runExecutor, showDiffs...) ----
const collectProjectFiles = (dir: string, acc: string[] = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collectProjectFiles(full, acc);
    } else if (SOURCE_EXTS.has(extname(entry)) && stats.size <= MAX_FILE_BYTES) {
      acc.push(full);
    }
  }
  return acc;
};

const loadIntent = (dir: string): Intent => {
  const intentPath = join(dir, 'magent.md');
  const isThereIntent = existsSync(intentPath);
  const intent = isThereIntent ? readFileSync(intentPath, 'utf8') : '(no intent file provided)';
  return {
    isThereIntent: isThereIntent,
    text: intent,
  };
};

const runPlanner = async (files: string[], intent: string, client: Anthropic): Promise<WorkOrder> => {
  const fileList = files.join('\n');
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
  
                In instructions, commit to ONE specific implementation approach.
                Do not offer alternatives or 'either/or' options.
                The executor needs a single clear directive it can implement completely
                without external dependencies that don't exist.
  
                targetFiles must list EVERY file your instructions create or modify, 
                using absolute paths exactly as shown in the FILE LIST. If your instructions say 
                to create a new file, that new file's absolute path MUST appear in targetFiles. 
                A file mentioned in instructions but missing from targetFiles is an error.
  
                --- INTENT ---
                ${intent}
  
                --- FILE LIST ---
                ${fileList}`,
    },
  ];

  let workOrder: WorkOrder | null = null;
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

    const toolContent: Anthropic.ContentBlockParam[] = message.content
      .filter((block) => block.type === 'tool_use')
      .map((tool) => {
        const { path } = tool.input as { path: string };
        const exists = existsSync(path);

        return {
          type: 'tool_result',
          tool_use_id: tool.id,
          content: exists ? readFileSync(path, 'utf-8') : 'PathError: file path does not exist.',
          ...(!exists && { is_error: true }),
        };
      });

    messages.push({
      role: 'user',
      content: toolContent,
    });

    console.log(`Step ${steps}: model requested ${toolContent.length} file(s)`);
  }

  if (!workOrder) {
    console.error('Planner ended loop without a work order (hit MAX_STEPS).');
    process.exit(1);
  }

  return workOrder;
};

const runExecutor = async (workOrder: WorkOrder, client: Anthropic): Promise<Change[]> => {
  const description = workOrder.description;
  const instructions = workOrder.instructions;

  const readFiles = (paths: string[]) =>
    paths
      .filter((p) => {
        if (!existsSync(p)) {
          console.error(`Skipping missing file: ${p}`);
          return false;
        }
        return true;
      })
      .map((p) => ({ path: p, content: readFileSync(p, 'utf-8') }));

  const contextFiles = readFiles(workOrder.contextFiles);
  const targetFiles = readFiles(workOrder.targetFiles);

  const formatFiles = (fileArr: { path: string; content: string }[]) =>
    fileArr.map((f) => `--- ${f.path} ---\n${f.content}`).join('\n\n');

  const contextBlock = workOrder.contextFiles.length ? formatFiles(contextFiles) : '(none)';
  const targetBlock = formatFiles(targetFiles);

  const workMessage: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `You are a senior software engineer for a builder, implementing the next step for their project.
                Below you'll find:
                - DESCRIPTION: What you'll implement
                - CONTEXT FILES: Path and content of files you should read for context but not change
                - TARGET FILES: Path and content of files you might change acording to instructions
                - INSTRUCTIONS: Clear, specific description of what you must do, file by file
  
                Return an ARRAY containing Objects with the path and the newContent only for the changed files in exactly this shape:
                [{ "path": "...", "newContent": "..." }, ...]
  
                --- DESCRIPTION ---
                ${description}
  
                --- CONTEXT FILES ---
                ${contextBlock}
  
                --- TARGET FILES ---
                ${targetBlock}
  
                --- INSTRUCTIONS ---
                ${instructions}`,
    },
  ];

  console.log('\nExecuting the work order...');
  const execMessage = await client.messages.create({
    max_tokens: 8192,
    model: 'claude-haiku-4-5',
    messages: workMessage,
  });

  const execBlock = execMessage.content[0];
  const execText = execBlock && execBlock.type === 'text' ? execBlock.text : '';

  const execMatch = execText.match(/\[[\s\S]*\]/);
  if (!execMatch) {
    console.error('No JSON array found in executor output:\n', execText);
    process.exit(1);
  }

  let changes: Change[];
  try {
    changes = JSON.parse(execMatch[0]);
  } catch {
    console.error('Could not parse executor array:\n', execMatch[0]);
    process.exit(1);
  }
  return changes;
};

const showDiffs = (workOrder: WorkOrder, changes: Change[]) => {
  const resolvePath = (returnedPath: string): string | null => {
    if (workOrder!.targetFiles.includes(returnedPath)) return returnedPath;
    const match = workOrder!.targetFiles.find(
      (t) => t.endsWith(returnedPath) || t.endsWith(returnedPath.replace(/^\//, '/')),
    );
    return match ?? null;
  };

  // --- show all diffs ---
  const RED = '\x1b[31m';
  const GREEN = '\x1b[32m';
  const DIM = '\x1b[2m';
  const CYAN = '\x1b[36m';
  const BOLD = '\x1b[1m';
  const RESET = '\x1b[0m';

  const normalize = (s: string) => s.replace(/\n+$/, '') + '\n';

  console.log(`\n${BOLD}${changes.length} file(s) to change:${RESET}\n`);

  for (const change of changes) {
    const realPath = resolvePath(change.path);
    if (!realPath) {
      console.error(`Executor returned a path not in the work order: ${change.path}`);
      continue;
    }
    const isNew = !existsSync(realPath);
    if (isNew) {
      console.log(`${CYAN}${BOLD}NEW FILE:${RESET} ${realPath}`);
      const lines = change.newContent.replace(/\n$/, '').split('\n');
      for (const line of lines) {
        console.log(`${GREEN}+ ${line}${RESET}`);
      }
    } else {
      console.log(`${CYAN}${BOLD}MODIFIED:${RESET} ${realPath}`);
      const current = readFileSync(realPath, 'utf-8');
      const parts = diffLines(normalize(current), normalize(change.newContent));
      const CONTEXT = 3;

      parts.forEach((part, i) => {
        const lines = part.value.replace(/\n$/, '').split('\n');

        if (part.added || part.removed) {
          const color = part.added ? GREEN : RED;
          const sign = part.added ? '+' : '-';
          for (const line of lines) console.log(`${color}${sign} ${line}${RESET}`);
          return;
        }

        const prev = parts[i - 1];
        const next = parts[i + 1];
        const prevChanged = !!prev && (prev.added || prev.removed);
        const nextChanged = !!next && (next.added || next.removed);

        if (!prevChanged && !nextChanged) return;

        if (prevChanged && nextChanged) {
          if (lines.length <= CONTEXT * 2) {
            for (const line of lines) console.log(`${DIM}  ${line}${RESET}`);
          } else {
            for (const line of lines.slice(0, CONTEXT)) console.log(`${DIM}  ${line}${RESET}`);
            console.log(`${DIM}  ⋯ ${lines.length - CONTEXT * 2} unchanged lines ⋯${RESET}`);
            for (const line of lines.slice(-CONTEXT)) console.log(`${DIM}  ${line}${RESET}`);
          }
        } else if (nextChanged) {
          if (lines.length > CONTEXT) console.log(`${DIM}  ⋯${RESET}`);
          for (const line of lines.slice(-CONTEXT)) console.log(`${DIM}  ${line}${RESET}`);
        } else if (prevChanged) {
          for (const line of lines.slice(0, CONTEXT)) console.log(`${DIM}  ${line}${RESET}`);
          if (lines.length > CONTEXT) console.log(`${DIM}  ⋯${RESET}`);
        }
      });
    }
    console.log(''); // blank line between files
  }
};

// ---- main ----
const main = async () => {
  const client = new Anthropic();

  const target = process.argv[2] ?? process.env['MAGENT_PROJECT_PATH'];
  if (!target) {
    console.error('Usage: node propose.ts <path-to-project>  (or set MAGENT_PROJECT_PATH in .env)');
    process.exit(1);
  }

  const files = collectProjectFiles(target);
  const intent = loadIntent(target);
  console.log(intent.isThereIntent ? 'Using magent.md as intent.' : 'No magent.md found — proposing without intent.');
  console.log('\nAsking the model for one change...');

  const workOrder = await runPlanner(files, intent.text, client);
  const changes = await runExecutor(workOrder, client);
  showDiffs(workOrder, changes);
};

main();

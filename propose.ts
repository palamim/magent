// ---- imports ----
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { extname, join, dirname, resolve } from 'node:path';
import { diffLines } from 'diff';
import { input, select } from '@inquirer/prompts';

// ---- constants (SKIP_DIRS, etc.) ----
const SKIP_DIRS = new Set(['node_modules', 'dist', '.vscode', '.astro']);
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.astro']);
const MAX_FILE_BYTES = 50_000;
const BOLD = '\x1b[1m',
  DIM = '\x1b[2m',
  CYAN = '\x1b[36m',
  GREEN = '\x1b[32m',
  YELLOW = '\x1b[33m',
  RESET = '\x1b[0m',
  RED = '\x1b[31m';

// ---- types ----
interface Intent {
  isThereIntent: boolean;
  text: string;
}

interface WorkOrder {
  description: string;
  type: string;
  slug: string;
  targetFiles: string[];
  contextFiles: string[];
  instructions: string;
}

interface Edit {
  path: string;
  oldText: string;
  newText: string;
}

interface Create {
  path: string;
  content: string;
}

interface Changes {
  edits: Edit[];
  creates: Create[];
}

interface Attempt {
  changes: Changes;
  errors: string;
}

interface Outcome {
  timestamp: string;
  proposal: string;
  action: 'approve' | 'discard';
  feedback: string[];
  note: string;
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

const submitChangesTool: Anthropic.Tool = {
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

// ---- helper functions (collectProjectFiles, runPlanner, runExecutor, showDiffs...) ----
const phase = (label: string) => console.log(`\n${BOLD}${CYAN}▸ ${label}${RESET}`);

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

const resolvePath = (returnedPath: string, workOrder: WorkOrder, dir: string): string | null => {
  if (workOrder.targetFiles.includes(returnedPath)) return returnedPath;
  // relative path → resolve against project dir
  const asAbsolute = returnedPath.startsWith('/') ? returnedPath : join(dir, returnedPath);
  if (workOrder.targetFiles.includes(asAbsolute)) return asAbsolute;
  const match = workOrder.targetFiles.find(
    (t) => t.endsWith(returnedPath) || t.endsWith('/' + returnedPath.replace(/^\/+/, '')),
  );
  return match ?? null;
};

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

const formatFiles = (fileArr: { path: string; content: string }[]) =>
  fileArr.map((f) => `--- ${f.path} ---\n${f.content}`).join('\n\n');

const extractLastJson = (text: string, open: '{' | '[', close: '}' | ']'): string | null => {
  const starts: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] === open) starts.push(i);

  for (let i = starts.length - 1; i >= 0; i--) {
    const candidate = text.slice(starts[i]);
    let depth = 0;
    for (let j = 0; j < candidate.length; j++) {
      if (candidate[j] === open) depth++;
      else if (candidate[j] === close) {
        depth--;
        if (depth === 0) {
          const slice = candidate.slice(0, j + 1);
          try {
            JSON.parse(slice);
            return slice;
          } catch {
            break; // this start doesn't yield valid JSON; try an earlier one
          }
        }
      }
    }
  }
  return null;
};

const runPlanner = async (files: string[], intent: string, client: Anthropic, dir: string): Promise<WorkOrder> => {
  phase('Planning');
  const fileList = files.join('\n');
  const history = loadHistory(dir);
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `You are a thinking partner for a builder, proposing the next step for their project.
                Below is the project's INTENT — whatever the builder wants you to know about it — followed by the project's FILE LIST.
                Propose ONE concrete next step that advances the project in the spirit of the intent.
                It could be a feature, a craft improvement, or a meaningful evolution.
                Honor everything the intent says, including anything it tells you to avoid.
                Prefer something real and shippable over something grand.
                Prefer changes that touch 1-3 files. A good next step is small enough
                to review and ship in a single sitting. If a worthwhile step seems to
                need many files, pick the smallest valuable slice of it.
                Read whatever files you need using the read_file tool to understand the project, then propose one next step.
                Start by reading some files.
                
                When you have explored enough, end your response with EXACTLY ONE JSON object —
                your final work order. Do not include multiple drafts, alternatives, or revised
                versions. Think first if you must, but emit only the single final JSON object at
                the very end of your response in exactly this shape:
                {
                  "description": "<one sentence: what the next step is and why>",
                  "type": "<one of: feat, fix, chore, refactor, style, docs>",
                  "slug": "<short kebab-case description, e.g. remove-dead-rss-log>",
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
                ${fileList}
                
                --- HISTORY (what you've proposed before and how the builder reacted) ---
                Use this to avoid re-proposing things the builder discarded, and to build on
                directions they approved. If they discarded something, do not propose it again
                unless their note suggests it was only "not now." If they approved and noted a
                direction, lean into it.
                ${history}`,
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

      const jsonStr = extractLastJson(text, '{', '}');
      if (!jsonStr) {
        console.error('No valid JSON work order found in planner output:\n', text);
        process.exit(1);
      }
      workOrder = JSON.parse(jsonStr);
      break;
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

    const requested = message.content
      .filter((b) => b.type === 'tool_use')
      .map((t) => (t.input as { path: string }).path.split('/').pop());
    console.log(`  ↳ reading: ${requested.join(', ')}`);
  }

  if (!workOrder) {
    console.error('Planner ended loop without a work order (hit MAX_STEPS).');
    process.exit(1);
  }

  console.log(`\n${BOLD}${CYAN}── PROPOSAL ──${RESET}`);
  console.log(`${BOLD}${workOrder.type}:${RESET} ${workOrder.description}\n`);
  console.log(`${DIM}${workOrder.instructions}${RESET}`);

  return workOrder;
};

const buildImplementPrompt = (
  workOrder: WorkOrder,
  targetBlock: string,
  contextBlock: string,
  attemptsBlock: string,
): string => `You are a senior software engineer for a builder, implementing the next step for their project.

Your job: implement the work order below by editing the TARGET FILES. Below you'll find:
- DESCRIPTION: a one-line summary of what you're implementing
- INSTRUCTIONS: the specific, step-by-step description of what to do, file by file
- TARGET FILES: the files you may change, with their current content
- CONTEXT FILES: files for reference only — read them to understand the project, but do NOT change them
- ATTEMPTS: previous tries of this same task that failed typecheck, if any

Implement the instructions faithfully. Change only what the instructions require; preserve all
existing formatting, imports, and code you aren't explicitly changing. Return each changed file as
its complete new contents with minimal, surgical edits — do not reformat or restructure untouched code.

Deliver your changes by calling the submit_changes tool.

--- DESCRIPTION ---
${workOrder.description}

--- INSTRUCTIONS ---
${workOrder.instructions}

--- TARGET FILES ---
${targetBlock}

--- CONTEXT FILES ---
${contextBlock}

--- ATTEMPTS (typecheck failures to fix) ---
${attemptsBlock}`;

const buildRefinePrompt = (
  workOrder: WorkOrder,
  targetBlock: string,
  attemptsBlock: string,
  feedbackBlock: string,
): string => `You are a senior software engineer for a builder, refining code you previously wrote for them.

The builder reviewed the current code and asked for specific changes. Your job is NOT to re-implement
the original task — it is already done. Your only job is to make the changes the builder requested,
and nothing else. Below you'll find:
- CURRENT FILES: the exact current state of every file in play — this is what you are editing
- REQUESTED CHANGES: what the builder wants changed, in order (later items win on conflict)
- BACKGROUND: the original work order, for context only — do NOT re-execute it
- ATTEMPTS: previous tries of this refinement that failed typecheck, if any

Rules:
- Make ONLY the changes the builder requested. Locate the relevant code in CURRENT FILES and change it.
- Leave everything else in the files exactly as it is — same formatting, imports, structure, spacing.
- Return ONLY the files you actually change. If a requested change is already satisfied, do nothing for it.
- If the builder asks to revert or restore something, look at the BACKGROUND and CURRENT FILES to
  understand the prior state, and return it to what they describe.

Deliver your changes by calling the submit_changes tool.

--- CURRENT FILES ---
${targetBlock}

--- REQUESTED CHANGES (most recent last) ---
${feedbackBlock}

--- BACKGROUND (original task — do NOT re-execute, context only) ---
${workOrder.instructions}

--- ATTEMPTS (typecheck failures to fix) ---
${attemptsBlock}`;

const buildPrompt = (workOrder: WorkOrder, feedback: string[], attempts: Attempt[]): string => {
  const contextFiles = readFiles(workOrder.contextFiles);
  const targetFiles = readFiles(workOrder.targetFiles);
  const contextBlock = workOrder.contextFiles.length ? formatFiles(contextFiles) : '(none)';
  const targetBlock = formatFiles(targetFiles);
  const feedbackBlock = feedback.length ? feedback.map((f, i) => `${i + 1}. ${f}`).join('\n') : '(none)';
  const attemptsBlock = attempts.length
    ? attempts
        .map((a, i) => {
          const editsStr = a.changes.edits
            .map((e) => `  EDIT ${e.path}:\n  find:\n${e.oldText}\n  replace:\n${e.newText}`)
            .join('\n\n');
          const createsStr = a.changes.creates.map((c) => `  CREATE ${c.path}`).join('\n');
          const what = [editsStr, createsStr].filter(Boolean).join('\n') || '(no changes)';
          return `### Attempt ${i + 1}\nYou submitted:\n${what}\n\nIt failed with these errors:\n${a.errors}`;
        })
        .join('\n\n---\n\n')
    : '(none — this is your first attempt)';

  const prompt = feedback.length
    ? buildRefinePrompt(workOrder, targetBlock, attemptsBlock, feedbackBlock)
    : buildImplementPrompt(workOrder, targetBlock, contextBlock, attemptsBlock);

  return prompt;
};

const runExecutor = async (client: Anthropic, prompt: string): Promise<Changes> => {
  console.log('\nExecuting the work order...');
  const execMessage = await client.messages.create({
    max_tokens: 16000,
    model: 'claude-sonnet-4-6',
    messages: [{ role: 'user', content: prompt }],
    tools: [submitChangesTool],
    tool_choice: { type: 'tool', name: 'submit_changes' },
  });

  const toolUse = execMessage.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    console.error(`\n${RED}Executor did not call submit_changes.${RESET}`);
    process.exit(1);
  }
  return toolUse.input as Changes;
};

const run = (cmd: string, dir: string) => execSync(cmd, { cwd: dir, stdio: 'pipe' }).toString();

const typecheck = (dir: string): { ok: boolean; errors: string } => {
  try {
    execSync('npx tsc --noEmit', { cwd: dir, stdio: 'pipe' });
    return { ok: true, errors: '' };
  } catch (err: any) {
    return { ok: false, errors: err.stdout?.toString() ?? err.message };
  }
};

const cleanup = (dir: string, branch: string) => {
  run(`git checkout .`, dir);
  run(`git clean -fd`, dir);
  run(`git checkout -`, dir);
  run(`git branch -D ${branch}`, dir);
};

const runVerifiedExecution = async (
  workOrder: WorkOrder,
  client: Anthropic,
  dir: string,
  branch: string,
  feedback: string[] = [],
): Promise<{ originals: Map<string, string | null> }> => {
  const originals = new Map<string, string | null>();
  for (const t of workOrder.targetFiles) {
    originals.set(t, existsSync(t) ? readFileSync(t, 'utf8') : null);
  }

  let attempts: Attempt[] = [];
  let steps = 0;
  const MAX_STEPS = 3;
  while (steps < MAX_STEPS) {
    steps++;
    phase(`Executing (attempt ${steps}/${MAX_STEPS})`);
    const prompt = buildPrompt(workOrder, feedback, attempts);
    const changes = await runExecutor(client, prompt);

    const allPaths = [...changes.edits.map((e) => e.path), ...changes.creates.map((c) => c.path)];
    const unresolved = allPaths.filter((p) => resolvePath(p, workOrder, dir) === null);
    if (unresolved.length) {
      console.error(`\nAborting — these paths could not be resolved:`);
      for (const p of unresolved) console.error(`  ${p}`);
      cleanup(dir, branch);
      process.exit(1);
    }

    // apply the changes; collect any that don't apply cleanly
    const applyErrors: string[] = [];

    // creates: write full content
    for (const c of changes.creates) {
      const realPath = resolvePath(c.path, workOrder, dir)!;
      mkdirSync(dirname(realPath), { recursive: true });
      writeFileSync(realPath, c.content, 'utf8');
    }

    // edits: find oldText (must appear exactly once) and replace
    for (const e of changes.edits) {
      const realPath = resolvePath(e.path, workOrder, dir)!;
      const current = existsSync(realPath) ? readFileSync(realPath, 'utf8') : '';
      const occurrences = current.split(e.oldText).length - 1;

      if (occurrences === 0) {
        applyErrors.push(
          `In ${e.path}: could not find the oldText to replace. The snippet was not present in the file (check exact whitespace/indentation).\noldText was:\n${e.oldText}`,
        );
        continue;
      }
      if (occurrences > 1) {
        applyErrors.push(
          `In ${e.path}: the oldText matched ${occurrences} places, so it is ambiguous. Include more surrounding lines to make it unique.\noldText was:\n${e.oldText}`,
        );
        continue;
      }
      writeFileSync(realPath, current.replace(e.oldText, e.newText), 'utf8');
    }

    // if any edit failed to apply, feed back and retry BEFORE typechecking
    if (applyErrors.length) {
      run(`git checkout .`, dir); //apply edits in-memory, write only if all match, to avoid half-applied disk state on retry.
      const errors = applyErrors.join('\n\n');
      console.log(`\n${YELLOW}✗ ${applyErrors.length} edit(s) could not be applied — feeding back${RESET}`);
      console.log(`${DIM}${errors}${RESET}`);
      attempts.push({ changes, errors });
      continue; // retry the loop; do not typecheck a half-applied state
    }

    const { ok, errors } = typecheck(dir);
    if (ok) {
      console.log(`\n${GREEN}✓ Typecheck passed ${RESET}`);
      const commitMessage = `${workOrder.type}: ${workOrder.description}\n\nCo-Authored-By: Magent <magent@noreply.local>`;
      run(`git add -A`, dir);
      if (feedback.length === 0) {
        run(`git commit -m ${JSON.stringify(commitMessage)}`, dir);
      } else {
        run(`git commit --amend -m ${JSON.stringify(commitMessage)}`, dir);
      }

      return { originals };
    }
    if (!ok) {
      console.log(`\n${YELLOW}✗ Typecheck failed — feeding ${errors.split('\\n').length} errors back ${RESET}`);
      console.log(`${DIM}${errors}${RESET}`);
      attempts.push({
        changes,
        errors,
      });
    }
  }

  console.log(`\n${YELLOW}Gave up after ${MAX_STEPS} attempts. Branch discarded. ${RESET}`);
  cleanup(dir, branch);
  console.error("Couldn't produce valid code, nothing committed");
  process.exit(1);
};

const showDiffs = (workOrder: WorkOrder, originals: Map<string, string | null>) => {
  const normalize = (s: string) => s.replace(/\n+$/, '') + '\n';

  // derive what changed from the CURRENT disk state vs the captured originals
  const changedFiles = workOrder.targetFiles.filter((path) => {
    const original = originals.get(path) ?? null;
    const current = existsSync(path) ? readFileSync(path, 'utf-8') : null;
    return original !== current;
  });

  console.log(`\n${BOLD}${changedFiles.length} file(s) changed:${RESET}\n`);

  for (const realPath of changedFiles) {
    const original = originals.get(realPath) ?? null;
    const current = readFileSync(realPath, 'utf-8');
    const isNew = original === null;

    if (isNew) {
      console.log(`${CYAN}${BOLD}NEW FILE:${RESET} ${realPath}`);
      const lines = current.replace(/\n$/, '').split('\n');
      for (const line of lines) {
        console.log(`${GREEN}+ ${line}${RESET}`);
      }
    } else {
      console.log(`${CYAN}${BOLD}MODIFIED:${RESET} ${realPath}`);
      const parts = diffLines(normalize(original), normalize(current));
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
    console.log('');
  }
};

const finish = async (dir: string, branch: string) => {
  console.log(`\n${GREEN}✓ Committed to branch ${branch}${RESET}`);
  const where = await select({
    message: 'Open the branch to inspect, or finish?',
    choices: [
      { name: 'Open in VS Code', value: 'vscode' },
      { name: 'Open in Ghostty', value: 'ghostty' },
      { name: 'Finish (back to main)', value: 'finish' },
    ],
  });
  if (where === 'vscode') execSync(`code .`, { cwd: dir });
  else if (where === 'ghostty') execSync(`open -a Ghostty ${JSON.stringify(dir)}`, { cwd: dir });
  else run(`git checkout -`, dir);
};

const executeAndRefine = async (workOrder: WorkOrder, client: Anthropic, dir: string) => {
  const safeSlug = workOrder.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const branch = `${workOrder.type}/${safeSlug}`;
  run(`git checkout -b ${branch}`, dir);

  let feedback: string[] = [];
  let { originals } = await runVerifiedExecution(workOrder, client, dir, branch, feedback);
  showDiffs(workOrder, originals);

  while (true) {
    const answer = await select({
      message: 'What do you want to do now?',
      choices: [
        {
          name: 'Inspect',
          value: 'inspect',
          description: 'Open the branch and inspect the code',
        },
        {
          name: 'Refine',
          value: 'refine',
          description: 'Provide feedback to modify and rewrite the code',
        },
        {
          name: 'Approve',
          value: 'approve',
          description: 'Keep these changes and finish (already committed to the branch)',
        },
        {
          name: 'Discard',
          value: 'discard',
          description: 'Discard everything and delete the branch',
        },
      ],
    });

    switch (answer) {
      case 'inspect':
        const where = await select({
          message: 'Open where?',
          choices: [
            { name: 'VS Code', value: 'vscode' },
            { name: 'Ghostty', value: 'ghostty' },
          ],
        });
        if (where === 'vscode') execSync(`code .`, { cwd: dir });
        else execSync(`open -a Ghostty ${JSON.stringify(dir)}`, { cwd: dir });
        console.log(`Opened ${where}. Inspect, then come back here to decide.`);
        break;

      case 'refine':
        feedback.push(await input({ message: 'Enter your feedback' }));
        await runVerifiedExecution(workOrder, client, dir, branch, feedback);
        showDiffs(workOrder, originals);
        break;

      case 'approve':
        const approveNote = await input({
          message: 'Approved. Any note on this direction for next time? (enter to skip)',
        });
        recordOutcome(dir, {
          timestamp: new Date().toISOString(),
          proposal: `${workOrder.slug}: ${workOrder.description}`,
          action: 'approve',
          feedback,
          note: approveNote,
        });
        await finish(dir, branch);
        return;

      case 'discard':
        const discardNote = await input({
          message: 'Why discard? Magent will remember. (enter to skip)',
        });
        recordOutcome(dir, {
          timestamp: new Date().toISOString(),
          proposal: `${workOrder.slug}: ${workOrder.description}`,
          action: 'discard',
          feedback,
          note: discardNote,
        });
        cleanup(dir, branch);
        return;
    }
  }
};

const recordOutcome = (dir: string, outcome: Outcome) => {
  const magentDir = join(dir, '.magent');
  mkdirSync(magentDir, { recursive: true });
  const gi = join(magentDir, '.gitignore');
  if (!existsSync(gi)) writeFileSync(gi, '*\n!.gitignore\n', 'utf8');
  const line = JSON.stringify(outcome) + '\n';
  appendFileSync(join(magentDir, 'history.jsonl'), line, 'utf8');
};

const loadHistory = (dir: string): string => {
  const historyPath = join(dir, '.magent', 'history.jsonl');
  if (!existsSync(historyPath)) return '(no history yet — this is the first session)';
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n').filter(Boolean);
  return lines
    .map((line) => {
      const o = JSON.parse(line) as Outcome;
      const refined = o.feedback.length ? ` After refinements: ${o.feedback.join('; ')}.` : '';

      if (o.action === 'approve') {
        const note = o.note ? ` Builder noted: "${o.note}".` : '';
        return `- Approved "${o.proposal}".${refined}${note}`;
      }

      if (o.note) {
        return `- Discarded "${o.proposal}" — builder said: "${o.note}".${refined}`;
      }
      return `- Discarded "${o.proposal}" (no reason given).${refined}`;
    })
    .join('\n');
};

// ---- main ----
const main = async () => {
  const client = new Anthropic();

  const target = process.argv[2] ?? process.env['MAGENT_PROJECT_PATH'];
  if (!target) {
    console.error('Usage: node propose.ts <path-to-project>  (or set MAGENT_PROJECT_PATH in .env)');
    process.exit(1);
  }
  const runnerDir = process.cwd();
  if (resolve(target) === resolve(runnerDir)) {
    console.error(
      "Refusing to target the running Magent directory itself — point at a separate clone or worktree to avoid switching the running tool's branch mid-run.",
    );
    process.exit(1);
  }

  const files = collectProjectFiles(target);
  const intent = loadIntent(target);
  console.log(intent.isThereIntent ? 'Using magent.md as intent.' : 'No magent.md found — proposing without intent.');

  const workOrder = await runPlanner(files, intent.text, client, target);
  await executeAndRefine(workOrder, client, target);
};

main();

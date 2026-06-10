import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { execSync } from 'node:child_process';
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

const collectFiles = (
  dir: string,
  acc: { path: string; content: string }[] = [],
) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collectFiles(full, acc);
    } else if (
      SOURCE_EXTS.has(extname(entry)) &&
      stats.size <= MAX_FILE_BYTES
    ) {
      acc.push({ path: full, content: readFileSync(full, 'utf8') });
    }
  }
  return acc;
};

const files = collectFiles(target);
const codebase = files
  .map((f) => `--- ${f.path} ---\n${f.content}`)
  .join('\n\n');

console.log(`Read ${files.length} files from ${target}`);
console.log('Asking the model for one change...');

const client = new Anthropic();
const message = await client.messages.create({
  max_tokens: 4096,
  model: 'claude-haiku-4-5',
  messages: [
    {
      role: 'user',
      content: `You are reviewing a codebase. Find ONE small, safe, concrete improvement — a leftover console.log, a dead variable, a tiny cleanup. Not a big refactor.

Respond ONLY with a JSON object, no markdown fences, no prose, in this exact shape:
{
  "path": "<absolute file path exactly as given>",
  "type": "<one of: feat, fix, chore, refactor, style, docs>",
  "slug": "<short kebab-case description, e.g. remove-dead-rss-log>",
  "description": "<one sentence: what and why>",
  "newContent": "<the COMPLETE new contents of that file with your change applied>"
}

${codebase}`,
    },
  ],
});

const block = message.content[0];
const raw = block && block.type === 'text' ? block.text : '';
const cleaned = raw
  .replace(/^```json\s*/, '')
  .replace(/```\s*$/, '')
  .trim();

let proposal: {
  path: string;
  type: string;
  slug: string;
  description: string;
  newContent: string;
};

try {
  proposal = JSON.parse(cleaned);
} catch {
  console.error('Model did not return valid JSON:\n', raw);
  process.exit(1);
}
if (!existsSync(proposal.path)) {
  console.error(`Model proposed a path that doesn't exist: ${proposal.path}`);
  process.exit(1);
}
const current = readFileSync(proposal.path, 'utf8');

// Logs
console.log('\nType:', proposal.type);
console.log('File:', proposal.path);
console.log('\nProposal:', proposal.description);
console.log('\n--- BEFORE ---\n' + current);
console.log('\n--- AFTER ---\n' + proposal.newContent);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(
  '\nCommit this change to a new branch? (y/n) ',
);
rl.close();

if (answer.trim().toLowerCase() === 'y') {
  const safeSlug = proposal.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const branch = `${proposal.type}/${safeSlug}`;
  const commitMessage = `${proposal.type}: ${proposal.description}`;

  const run = (cmd: string) =>
    execSync(cmd, { cwd: target, stdio: 'pipe' }).toString();

  run(`git checkout -b ${branch}`);
  writeFileSync(proposal.path, proposal.newContent, 'utf8');
  run(`git add ${JSON.stringify(proposal.path)}`);
  run(`git commit -m ${JSON.stringify(commitMessage)}`);

  const rl2 = createInterface({ input: process.stdin, output: process.stdout });
  const open = await rl2.question('Open the branch? (vscode / ghostty / no) ');
  rl2.close();

  if (open.trim().toLowerCase() === 'vscode') {
    execSync(`code .`, { cwd: target });
    console.log(`Opened VS Code on ${branch}. You're on the branch.`);
  } else if (open.trim().toLowerCase() === 'ghostty') {
    execSync(`open -a Ghostty ${JSON.stringify(target)}`);
    console.log(`Opened Ghostty on ${branch}.`);
  } else {
    run(`git checkout -`);
    console.log(`Committed to branch ${branch}. Back on main.`);
  }
} else {
  console.log('Skipped.');
}

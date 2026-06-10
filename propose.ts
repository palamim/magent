import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createInterface } from 'node:readline/promises';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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

const target = process.argv[2];
if (!target) {
  console.error('Usage: node propose.ts <path-to-project>');
  process.exit(1);
}

const files = collectFiles(target);
console.log(`Read ${files.length} files`);

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

const codebase = files
  .map((f) => `--- ${f.path} ---\n${f.content}`)
  .join('\n\n');

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

let proposal: { path: string; description: string; newContent: string };
try {
  proposal = JSON.parse(cleaned);
} catch {
  console.error('Model did not return valid JSON:\n', raw);
  process.exit(1);
}

console.log('\nProposal:', proposal.description);
console.log('File:', proposal.path);

const current = readFileSync(proposal.path, 'utf8');

console.log('\n--- BEFORE ---\n' + current);
console.log('\n--- AFTER ---\n' + proposal.newContent);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question('\nApply this change? (y/n) ');
rl.close();

if (answer.trim().toLowerCase() === 'y') {
  writeFileSync(proposal.path, proposal.newContent, 'utf8');
  console.log('Applied.');
} else {
  console.log('Skipped.');
}

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readdirSync, readFileSync, statSync } from 'node:fs';
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
  max_tokens: 1024,
  model: 'claude-haiku-4-5',
  messages: [
    {
      role: 'user',
      content: `You are reviewing a codebase. Find ONE small, safe, concrete improvement — a leftover console.log, an obvious inefficiency, a dead variable, a tiny cleanup. Not a big refactor. Respond in plain text with: the file path, what to change, and why. One proposal only.\n\n${codebase}`,
    },
  ],
});

const block = message.content[0];
console.log(block && block.type === 'text' ? block.text : message.content);

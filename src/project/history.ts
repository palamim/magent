import { existsSync, readFileSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

import { UserDecision, type Aftermath } from '@/agents/planner/planner.types';

export const loadHistory = (dir: string): string => {
  const historyPath = join(dir, '.magent', 'history.jsonl');
  if (!existsSync(historyPath)) return '(no history yet — this is the first session)';
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n').filter(Boolean);
  return lines
    .map((line) => {
      const aftermath = JSON.parse(line) as Aftermath;
      const refined = aftermath.feedback.length ? ` After refinements: ${aftermath.feedback.join('; ')}.` : '';

      if (aftermath.userDecision === UserDecision.APPROVE) {
        const note = aftermath.note ? ` Builder noted: "${aftermath.note}".` : '';
        return `- Approved "${aftermath.proposal}".${refined}${note}`;
      }

      if (aftermath.note) {
        return `- Discarded "${aftermath.proposal}" — builder said: "${aftermath.note}".${refined}`;
      }
      return `- Discarded "${aftermath.proposal}" (no reason given).${refined}`;
    })
    .join('\n');
};

export const saveAftermath = (dir: string, aftermath: Aftermath) => {
  const magentDir = join(dir, '.magent');
  mkdirSync(magentDir, { recursive: true });

  const gi = join(magentDir, '.gitignore');
  if (!existsSync(gi)) writeFileSync(gi, '*\n!.gitignore\n', 'utf8');

  const line = JSON.stringify(aftermath) + '\n';
  appendFileSync(join(magentDir, 'history.jsonl'), line, 'utf8');
};

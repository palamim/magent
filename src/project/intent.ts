import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Intent {
  isThereIntent: boolean;
  text: string;
}

export const loadIntent = (dir: string): Intent => {
  const intentPath = join(dir, 'magent.md');
  const isThereIntent = existsSync(intentPath);
  const intent = isThereIntent ? readFileSync(intentPath, 'utf8') : '(no intent file provided)';
  return {
    isThereIntent: isThereIntent,
    text: intent,
  };
};

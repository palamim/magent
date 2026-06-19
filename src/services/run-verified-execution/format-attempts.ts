import type { ExecAttempt } from '@/services/types/common.types';

export const formatExecAttempts = (attempts: ExecAttempt[]): string => {
  return attempts.length
    ? attempts
        .map((a, i) => {
          const editsStr = a.execution.edits
            .map((e) => `  EDIT ${e.path}:\n  find:\n${e.oldText}\n  replace:\n${e.newText}`)
            .join('\n\n');
          const createsStr = a.execution.creates.map((c) => `  CREATE ${c.path}`).join('\n');
          const what = [editsStr, createsStr].filter(Boolean).join('\n') || '(no changes)';
          return `### Attempt ${i + 1}\nYou submitted:\n${what}\n\nIt failed with these errors:\n${a.errors}`;
        })
        .join('\n\n---\n\n')
    : '(none — this is your first attempt)';
};

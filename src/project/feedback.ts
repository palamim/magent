import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { Agent, Decision, type FeedbackEntry } from '@/agents/types/common.types';
import { ensureAgentDir, agentFilePath } from '@/project/agent-files';

const FEEDBACK_FILE = 'feedback.jsonl';

export const loadFeedback = (dir: string, agent: Agent): string => {
  const path = agentFilePath(dir, agent, FEEDBACK_FILE);
  if (!existsSync(path)) return '(no feedback yet — this is the first session)';
  const lines = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean);
  return lines
    .map((line) => {
      const entry = JSON.parse(line) as FeedbackEntry;
      const refined = entry.refinements.length ? ` After refinements: ${entry.refinements.join('; ')}.` : '';

      if (entry.decision === Decision.APPROVED) {
        const comment = entry.comment ? ` Builder commented: "${entry.comment}".` : '';
        return `- Approved "${entry.proposal}".${refined}${comment}`;
      }
      if (entry.decision === Decision.REFINED) {
        // the proposal was reworked — the comment is WHY, and a new proposal followed
        return `- Refined "${entry.proposal}" — builder commented: "${entry.comment}".`;
      }
      // DISCARDED
      if (entry.comment) return `- Discarded "${entry.proposal}" — builder commented: "${entry.comment}".${refined}`;
      return `- Discarded "${entry.proposal}" (no reason given).${refined}`;
    })
    .join('\n');
};

export const saveFeedback = (dir: string, agent: Agent, entry: FeedbackEntry) => {
  ensureAgentDir(dir, agent);
  appendFileSync(agentFilePath(dir, agent, FEEDBACK_FILE), JSON.stringify(entry) + '\n', 'utf8');
};

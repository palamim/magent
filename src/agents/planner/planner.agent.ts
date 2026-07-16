import type Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODELS } from '@/agents/models';
import { readFileTool } from '@/agents/tools/read-file.tool';
import { submitPlanTool } from '@/agents/tools/submit-plan.tool';
import { dispatchToolCalls } from '@/agents/tools/dispatch';
import { planPrompt, advancePrompt } from '@/agents/planner/planner.prompt';
import { readSubmitPlan } from '@/agents/planner/utils/read-submit-plan';
import { TaskStatus, type Plan, type Task } from '@/agents/types/common.types';
import { loadPlan, writePlan } from '@/project/plan';
import { writeTask, clearTask } from '@/project/task';

const MAX_PLANNER_STEPS = 15;
const MAX_PLANNER_TOKENS = 4096;

const allDone = (plan: Plan): boolean => plan.tasks.every((t) => t.status === TaskStatus.DONE);
const nextPendingTask = (plan: Plan): Task | null => {
  const pending = plan.tasks.filter((t) => t.status === TaskStatus.PENDING);
  if (pending.length === 0) return null;
  return pending.sort((a, b) => a.id - b.id)[0] ?? null;
};

export type PlanResponse = { kind: 'task' } | { kind: 'plan-complete'; goal: string };

export interface PlannerRunResult {
  plan: Plan;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  inputTokens: number;
  outputTokens: number;
}

export const runModelLoop = async (
  prompt: string,
  client: Anthropic,
  dir: string,
  model: string,
): Promise<PlannerRunResult> => {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  let steps = 0;
  let toolCalls = 0;
  let readFileCalls = 0;
  const filesRead: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  while (steps < MAX_PLANNER_STEPS) {
    steps++;
    const message = await client.messages.create({
      max_tokens: MAX_PLANNER_TOKENS,
      model,
      tools: [readFileTool, submitPlanTool],
      messages,
    });
    inputTokens += message.usage.input_tokens;
    outputTokens += message.usage.output_tokens;
    messages.push({ role: 'assistant', content: message.content });

    // instrument tool calls
    for (const block of message.content) {
      if (block.type === 'tool_use') {
        toolCalls++;
        if (block.name === 'read_file') {
          readFileCalls++;
          const path = (block.input as { path?: string }).path;
          if (path) filesRead.push(path);
        }
      }
    }

    const submitted = readSubmitPlan(message);
    if (submitted) {
      return { plan: submitted, steps, toolCalls, readFileCalls, filesRead, inputTokens, outputTokens };
    }

    if (message.stop_reason !== 'tool_use') {
      throw new Error('Planner stopped without calling submit_plan.');
    }
    messages.push({ role: 'user', content: dispatchToolCalls(message, dir) });
  }
  throw new Error('Planner ended loop without submitting a plan (hit MAX_PLANNER_STEPS).');
};

export const runPlanner = async (
  client: Anthropic,
  dir: string,
  fileList: string,
  userIntent: string,
): Promise<PlanResponse> => {
  const existing = loadPlan(dir);

  // PLAN MODE — no active plan: turn user intent into a plan with tasks
  if (!existing) {
    const prompt = planPrompt(userIntent, fileList);
    const { plan } = await runModelLoop(prompt, client, dir, ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5);
    writePlan(dir, plan);
    const next = nextPendingTask(plan);
    if (!next) throw new Error('Fresh plan has no pending tasks.');
    writeTask(dir, next);
    return { kind: 'task' };
  }

  // ADVANCE MODE — re-ground the existing plan, mark done, pick next
  const currentPlan = JSON.stringify(existing, null, 2);
  const prompt = advancePrompt(currentPlan, fileList);
  const { plan } = await runModelLoop(prompt, client, dir, ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5);
  writePlan(dir, plan);

  if (allDone(plan)) {
    // DON'T archive/clear the plan here — the branch still needs merging.
    // Leave the plan active, all-done; the user merges (finishPlan) or abandons, which archives.
    clearTask(dir);
    return { kind: 'plan-complete', goal: plan.goal };
  }

  const next = nextPendingTask(plan);
  if (!next) throw new Error('Plan not allDone but no pending task found.');
  writeTask(dir, next);
  return { kind: 'task' };
};

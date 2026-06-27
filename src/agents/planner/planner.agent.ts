import type Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODELS } from '@/agents/models';
import { readFileTool } from '@/agents/tools/read-file.tool';
import { submitPlanTool } from '@/agents/tools/submit-plan.tool';
import { dispatchToolCalls } from '@/agents/tools/dispatch';
import { freshPlanPrompt, advancePrompt } from '@/agents/planner/planner.prompt';
import { readSubmitPlan } from '@/agents/planner/utils/read-submit-plan';
import { Agent, TaskStatus, type Plan, type Task } from '@/agents/types/common.types';
import { loadFeedback } from '@/project/feedback';
import { loadDirection } from '@/project/direction';
import { loadConventions } from '@/project/conventions';
import { loadPlan, writePlan, archivePlan } from '@/project/plan';
import { writeTask, clearTask } from '@/project/task';

const MAX_PLANNER_STEPS = 10;
const MAX_PLANNER_TOKENS = 4096;

const allDone = (plan: Plan): boolean => plan.tasks.every((t) => t.status === TaskStatus.DONE);
const nextPendingTask = (plan: Plan): Task | null => {
  const pending = plan.tasks.filter((t) => t.status === TaskStatus.PENDING);
  if (pending.length === 0) return null;
  return pending.sort((a, b) => a.id - b.id)[0] ?? null;
};

export type PlanResponse = { kind: 'task' } | { kind: 'feature-complete'; goal: string };

const runModelLoop = async (prompt: string, client: Anthropic, dir: string): Promise<Plan> => {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];
  let steps = 0;
  while (steps < MAX_PLANNER_STEPS) {
    steps++;
    const message = await client.messages.create({
      max_tokens: MAX_PLANNER_TOKENS,
      model: ANTHROPIC_MODELS.CLAUDE_HAIKU_4_5,
      tools: [readFileTool, submitPlanTool],
      messages,
    });
    messages.push({ role: 'assistant', content: message.content });

    const submitted = readSubmitPlan(message);
    if (submitted) return submitted;

    if (message.stop_reason !== 'tool_use') {
      throw new Error('Planner stopped without calling submit_plan.');
    }
    messages.push({ role: 'user', content: dispatchToolCalls(message, dir) });
  }
  throw new Error('Planner ended loop without submitting a plan (hit MAX_PLANNER_STEPS).');
};

export const runPlanner = async (fileList: string, client: Anthropic, dir: string): Promise<PlanResponse> => {
  const conventions = loadConventions(dir);
  const plannerFeedback = loadFeedback(dir, Agent.PLANNER);
  const executorFeedback = loadFeedback(dir, Agent.EXECUTOR);
  const existing = loadPlan(dir);

  // FRESH MODE — no active plan: extract the next feature, break it into tasks
  if (!existing) {
    const direction = loadDirection(dir);
    const prompt = freshPlanPrompt(direction, fileList, conventions, plannerFeedback, executorFeedback);
    const plan = await runModelLoop(prompt, client, dir);
    writePlan(dir, plan);
    const next = nextPendingTask(plan);
    if (!next) throw new Error('Fresh plan has no pending tasks.');
    writeTask(dir, next);
    return { kind: 'task' };
  }

  // ADVANCE MODE — re-ground the existing plan, mark done, pick next
  const prompt = advancePrompt(
    JSON.stringify(existing, null, 2),
    fileList,
    conventions,
    plannerFeedback,
    executorFeedback,
  );
  const plan = await runModelLoop(prompt, client, dir);
  writePlan(dir, plan);

  if (allDone(plan)) {
    archivePlan(dir, plan);
    clearTask(dir);
    return { kind: 'feature-complete', goal: plan.goal };
  }

  const next = nextPendingTask(plan);
  if (!next) throw new Error('Plan not allDone but no pending task found.');
  writeTask(dir, next);
  return { kind: 'task' };
};

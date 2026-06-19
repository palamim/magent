/**
 * Executor agent — public interface.
 *
 * The executor takes a Plan and produces an Execution (edits + creates),
 * reading project files as needed before submitting. Callers (services)
 * compose these to run, verify, and retry executions.
 *
 * Import from '@/agents/executor' — NOT from internal files like
 * './utils/build-prompt' or './executor.prompt'. Those are internal and
 * may change freely; only what's exported here is the stable contract.
 */

// ── the agent: run the executor once, get an Execution back ──
export { runExecutor } from './executor.agent';

// ── prompt composition: services build the prompt, then run the executor ──
export { buildImplementPrompt, buildRefinePrompt } from './executor.prompt';

// ── the contract types the layer above needs ──
export type { Execution } from './executor.types';

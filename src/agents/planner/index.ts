/**
 * Planner agent — public interface.
 *
 * The planner explores the project (reading files) and proposes one
 * concrete next step as a Plan. Import from '@/agents/planner'.
 */

// ── the agent: run the executor once, get an Execution back ──
export { runPlanner } from './planner.agent';

// ── the contract types the layer above needs ──
export type { Aftermath } from './planner.types';

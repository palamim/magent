export enum Agent {
  DIRECTOR = 'director',
  PLANNER = 'planner',
  EXECUTOR = 'executor',
}

// --- Planner Agent returns — Executor Agent uses ---
export interface Plan {
  description: string;
  type: string;
  slug: string;
  targetFiles: string[];
  contextFiles: string[];
  instructions: string;
  taskId?: string;
}

export enum Decision {
  APPROVED = 'approved',
  DISCARDED = 'discarded',
  REFINED = 'refined',
}

export interface FeedbackEntry {
  timestamp: string;
  proposal: string; // what the agent proposed
  refinements: string[]; // refine messages given by the user during the loop (exclusive to the Executor)
  decision: Decision;
  comment: string; // closing feedback/note
}

export enum TaskStatus {
  PENDING = 'pending',
  DONE = 'done',
}

export interface Task {
  id: string;
  slug: string;
  description: string;
  instructions: string;
  targetFiles: string[];
  contextFiles: string[];
  status: TaskStatus;
}

// the Planner's persistent multi-run plan (lives in planner/plan.json)
export interface TaskPlan {
  frontier: string; // the slice of direction.md this plan serves (so we know when to replan)
  goal: string; // one-line: what this whole plan achieves
  type: string; // feat/fix/etc for the eventual commits
  slug: string; // kebab, for branch/commit naming
  dependencies: string[]; // npm packages installed before execution
  tasks: Task[];
}

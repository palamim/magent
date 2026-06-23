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

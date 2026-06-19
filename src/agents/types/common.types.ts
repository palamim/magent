// --- Planner Agent returns — Executor Agent uses ---
export interface Plan {
  description: string;
  type: string;
  slug: string;
  targetFiles: string[];
  contextFiles: string[];
  instructions: string;
}

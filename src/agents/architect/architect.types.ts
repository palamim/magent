export interface ArchitectResult {
  conventions: string;
  model: string;
  prompt: string;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  inputTokens: number;
  outputTokens: number;
}

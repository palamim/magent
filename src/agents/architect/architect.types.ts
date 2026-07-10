export interface ArchitectResult {
  conventions: string;
  steps: number;
  toolCalls: number;
  readFileCalls: number;
  filesRead: string[];
  inputTokens: number;
  outputTokens: number;
}

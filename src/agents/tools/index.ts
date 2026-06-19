/**
 * Tools — public interface.
 *
 * A tool has two halves: a declaration (the schema handed to the model)
 * and an execution (the code that runs when the model calls it).
 * The dispatcher routes feed-back tool calls (results returned to the
 * model) to their executions. Terminal tools like submit_changes are
 * NOT dispatched — agents catch them to end their loop.
 *
 * Import from '@/agents/tools'.
 */

// ── dispatcher: route model tool-calls to their executions ──
export { dispatchToolCalls } from './dispatch';

// ── read_file (feed-back tool: declaration + execution) ──
export { readFileTool, executeReadFile } from './read-file.tool';

// ── submit_changes (terminal tool: declaration + extractor) ──
export { submitExecutionTool, executeSubmitExecution } from './submit-execution.tool';

import { Router } from 'express';

import { handleExecute } from '@/server/controllers/execution.controller';
import { handleKeepExecution } from '@/server/controllers/keep-execution.controller';
import { handleDiscardExecution } from '@/server/controllers/discard-execution.controller';
import { handleInspectExecution } from '@/server/controllers/inspect.controller';
import { handleTaskState } from '@/server/controllers/task-state.controller';

export const executionRouter = Router();

executionRouter.get('/task-state', handleTaskState);

executionRouter.post('/execute', handleExecute);
executionRouter.post('/keep-execution', handleKeepExecution);
executionRouter.post('/discard-execution', handleDiscardExecution);
executionRouter.post('/inspect-execution', handleInspectExecution);

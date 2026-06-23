import { Router } from 'express';

import { handleExecute } from '@/server/controllers/execution.controller';
import { handleApproveExecution } from '@/server/controllers/approve-execution.controller';
import { handleDiscardExecution } from '@/server/controllers/discard-execution.controller';
import { handleInspectExecution } from '../controllers/inspect.controller';

export const executionRouter = Router();

executionRouter.post('/execute', handleExecute);
executionRouter.post('/approve-execution', handleApproveExecution);
executionRouter.post('/discard-execution', handleDiscardExecution);
executionRouter.post('/inspect-execution', handleInspectExecution);

import { Router } from 'express';

import { handleApproveExecution } from '@/server/controllers/approve-execution.controller';
import { handleDiscardExecution } from '@/server/controllers/discard-execution.controller';
import { handleInspect } from '@/server/controllers/inspect.controller';

export const actionsRouter = Router();

actionsRouter.post('/approve', handleApproveExecution);
actionsRouter.post('/discard', handleDiscardExecution);
actionsRouter.post('/inspect', handleInspect);

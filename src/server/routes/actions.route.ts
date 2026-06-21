import { Router } from 'express';

import { handleApprove } from '@/server/controllers/approve.controller';
import { handleDiscard } from '@/server/controllers/discard.controller';
import { handleInspect } from '@/server/controllers/inspect.controller';

export const actionsRouter = Router();

actionsRouter.post('/approve', handleApprove);
actionsRouter.post('/discard', handleDiscard);
actionsRouter.post('/inspect', handleInspect);

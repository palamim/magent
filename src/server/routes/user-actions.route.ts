import { Router } from 'express';

import { handleApprove } from '@/server/controllers/approve.controller';
import { handleDiscard } from '@/server/controllers/discard.controller';

export const userActionsRouter = Router();

userActionsRouter.post('/approve', handleApprove);
userActionsRouter.post('/discard', handleDiscard);

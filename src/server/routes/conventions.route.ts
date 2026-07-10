import { Router } from 'express';

import { handleConventions } from '@/server/controllers/conventions.controller';
import { handleApproveConventions } from '@/server/controllers/approve-conventions.controller';

export const conventionsRouter = Router();

conventionsRouter.post('/conventions', handleConventions);
conventionsRouter.post('/approve-conventions', handleApproveConventions);

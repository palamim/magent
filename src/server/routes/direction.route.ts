import { Router } from 'express';

import { handleDirection } from '@/server/controllers/direction.controller';
import { handleApproveDirection } from '@/server/controllers/approve-direction.controller';
import { handleDiscardDirection } from '@/server/controllers/discard-direction.controller';
import { handleRefineDirection } from '@/server/controllers/refine-direction.controller';

export const directionRouter = Router();

directionRouter.post('/direct', handleDirection);
directionRouter.post('/approve-direction', handleApproveDirection);
directionRouter.post('/discard-direction', handleDiscardDirection);
directionRouter.post('/refine-direction', handleRefineDirection);

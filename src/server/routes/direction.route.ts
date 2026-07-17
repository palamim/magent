import { Router } from 'express';

import { handleDirection } from '@/server/controllers/direction.controller';
import { handleApproveDirection } from '@/server/controllers/approve-direction.controller';

export const directionRouter = Router();

directionRouter.post('/direct', handleDirection);
directionRouter.post('/approve-direction', handleApproveDirection);

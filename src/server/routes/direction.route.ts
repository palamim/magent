import { Router } from 'express';

import { handleDirection } from '@/server/controllers/direction.controller';

export const directionRouter = Router();

directionRouter.post('/direct', handleDirection);

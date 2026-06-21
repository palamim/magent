import { Router } from 'express';

import { handleExecute } from '@/server/controllers/execution.controller';

export const executionRouter = Router();

executionRouter.post('/execute', handleExecute);

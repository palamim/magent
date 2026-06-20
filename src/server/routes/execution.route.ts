import { Router } from 'express';

import { postExecution } from '@/server/controllers/execution.controller';

export const executionRouter = Router();

executionRouter.post('/execute', postExecution);

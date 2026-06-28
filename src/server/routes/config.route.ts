import { Router } from 'express';

import { handleGetConfig, handleListBranches, handleSetConfig } from '@/server/controllers/config.controller';

export const configRouter = Router();

configRouter.get('/config', handleGetConfig);
configRouter.get('/branches', handleListBranches);

configRouter.post('/config', handleSetConfig);

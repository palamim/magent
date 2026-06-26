import { Router } from 'express';

import { handleProjectStatus, handleSetupProject } from '@/server/controllers/project-setup.controller';

export const projectSetupRouter = Router();
projectSetupRouter.get('/project-status', handleProjectStatus);
projectSetupRouter.post('/setup-project', handleSetupProject);

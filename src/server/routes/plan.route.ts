import { Router } from 'express';

import { handlePlan } from '@/server/controllers/plan.controller';
import { handleApprovePlan } from '@/server/controllers/approve-plan.controller';
import { handleDiscardPlan } from '@/server/controllers/discard-plan.controller';
import { handleRefinePlan } from '@/server/controllers/refine-plan.controller';

export const planRouter = Router();

planRouter.post('/plan', handlePlan);
planRouter.post('/approve-plan', handleApprovePlan);
planRouter.post('/discard-plan', handleDiscardPlan);
planRouter.post('/refine-plan', handleRefinePlan);

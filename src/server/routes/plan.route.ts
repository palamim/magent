import { Router } from 'express';

import { handlePlan } from '@/server/controllers/plan.controller';
import { handleRefinePlan } from '@/server/controllers/refine-plan.controller';
import { handlePlanState } from '@/server/controllers/plan-state.controller';
import { handleFinishPlan } from '@/server/controllers/finish-plan.controller';
import { handleAbandonPlan } from '@/server/controllers/abandon-plan.controller';

export const planRouter = Router();

planRouter.post('/plan', handlePlan);
planRouter.post('/refine-plan', handleRefinePlan);
planRouter.get('/plan-state', handlePlanState);
planRouter.post('/finish-plan', handleFinishPlan);
planRouter.post('/abandon-plan', handleAbandonPlan);

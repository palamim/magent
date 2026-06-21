import { Router } from 'express';

import { handlePropose } from '@/server/controllers/proposal.controller';

export const proposalRouter = Router();

proposalRouter.post('/proposal', handlePropose);

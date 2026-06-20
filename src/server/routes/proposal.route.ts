import { Router } from 'express';

import { getProposal } from '@/server/controllers/proposal.controller';

export const proposalRouter = Router();

proposalRouter.post('/proposal', getProposal);

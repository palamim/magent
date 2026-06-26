import { Router } from 'express';
import { handleBrowse } from '@/server/controllers/browse.controller';

export const browseRouter = Router();
browseRouter.get('/browse', handleBrowse);

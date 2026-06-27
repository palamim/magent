import { Router } from 'express';
import { handleAddComment } from '@/server/controllers/add-comment.controller';

export const feedbackRouter = Router();

feedbackRouter.post('/add-comment', handleAddComment);

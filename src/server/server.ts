import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { directionRouter } from '@/server/routes/direction.route';
import { planRouter } from '@/server/routes/plan.route';
import { executionRouter } from '@/server/routes/execution.route';

const app = express();
const PORT = process.env['MAGENT_SERVER_PORT'] ?? 4000;

app.use(cors());
app.use(express.json());

app.use('/api', directionRouter);
app.use('/api', planRouter);
app.use('/api', executionRouter);

app.listen(PORT, () => {
  console.log(`Magent server listening on http://localhost:${PORT}`);
});

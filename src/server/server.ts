import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { directionRouter } from '@/server/routes/direction.route';
import { proposalRouter } from '@/server/routes/proposal.route';
import { executionRouter } from '@/server/routes/execution.route';
import { actionsRouter } from '@/server/routes/actions.route';

const app = express();
const PORT = process.env['MAGENT_SERVER_PORT'] ?? 4000;

app.use(cors());
app.use(express.json());

app.use('/api', directionRouter);
app.use('/api', proposalRouter);
app.use('/api', executionRouter);
app.use('/api', actionsRouter);

app.listen(PORT, () => {
  console.log(`Magent server listening on http://localhost:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import { runContinuousPing, runSinglePing } from './ping';
import { validateHost } from './validation';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

app.get('/ping', async (req, res) => {
  const host = (req.query.host as string) || '';
  const validation = validateHost(host);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  try {
    const result = await runSinglePing(host);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Ping failed', details: (error as Error).message });
  }
});

app.get('/ping/continuous', async (req, res) => {
  const host = (req.query.host as string) || '';
  const durationParam = parseInt((req.query.duration as string) || '60', 10);
  const validation = validateHost(host);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  try {
    const result = await runContinuousPing(host, durationParam);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Continuous ping failed', details: (error as Error).message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

import 'dotenv/config';
import express from 'express';
import instagramWebhook from './webhook/instagram.js';
import logger from './utils/logger.js';

const app = express();

// Capture the raw body (useful if you later add Meta signature verification)
// while still parsing JSON for the webhook handler.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', persona: 'Claudette' });
});

// Instagram webhook (GET verify + POST events)
app.use('/webhook/instagram', instagramWebhook);

// Root
app.get('/', (_req, res) => {
  res.status(200).send('Claudette is online.');
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Unhandled Express error:', err?.message || err);
  res.status(500).json({ error: 'internal_error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Claudette server listening on port ${PORT}.`);
});

export default app;

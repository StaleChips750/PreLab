import express from 'express';
import { screenMessage } from '../guardrails/screener.js';
import { upsertUser } from '../utils/users.js';
import { saveMessage, getRecentMessages, countMessages } from '../memory/ephemeral.js';
import { buildMemoryBlock } from '../memory/retrieval.js';
import { maybeConsolidate } from '../memory/consolidation.js';
import { generateReply } from '../llm/claudette.js';
import { sendDM } from '../instagram/messenger.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET — Meta webhook verification handshake.
 * Meta sends hub.mode, hub.verify_token, hub.challenge as query params.
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    logger.info('Webhook verified by Meta.');
    return res.status(200).send(challenge);
  }

  logger.warn('Webhook verification failed (bad mode or verify token).');
  return res.sendStatus(403);
});

/**
 * Extract a normalized list of { senderId, text } from a Meta webhook payload.
 * Ignores non-text events (reactions, read receipts, echoes, deliveries).
 */
function extractMessages(body) {
  const out = [];

  // Instagram messaging webhooks deliver entry[].messaging[] (or .changes[]).
  const entries = Array.isArray(body?.entry) ? body.entry : [];

  for (const entry of entries) {
    const events = Array.isArray(entry.messaging)
      ? entry.messaging
      : Array.isArray(entry.changes)
        ? entry.changes.map((c) => c.value).filter(Boolean)
        : [];

    for (const event of events) {
      const senderId = event?.sender?.id;
      const message = event?.message;

      if (!senderId || !message) continue;
      // Skip echoes (messages we sent), reactions, deliveries, reads.
      if (message.is_echo) continue;
      if (event.reaction || event.read || event.delivery) continue;

      const text = typeof message.text === 'string' ? message.text.trim() : '';
      if (!text) continue; // ignore attachments-only / non-text payloads

      out.push({ senderId, text });
    }
  }

  return out;
}

/**
 * Run the full per-message pipeline. Errors are contained so one bad message
 * never crashes the webhook.
 */
async function handleIncomingMessage(senderId, text) {
  try {
    // 3. Screen before anything hits the LLM.
    const flagged = screenMessage(text);
    if (flagged) {
      logger.info(`Message from ${senderId} flagged by screener.`);
      await sendDM(senderId, flagged);
      return;
    }

    // 4. Upsert user.
    const user = await upsertUser(senderId);
    if (!user) {
      logger.error(`Could not resolve user for ${senderId}; aborting pipeline.`);
      return;
    }

    // 5. Save incoming message.
    await saveMessage(user.id, 'user', text);

    // 6 + 7. Build memory block and fetch recent history (in parallel).
    const [memoryBlock, conversationHistory] = await Promise.all([
      buildMemoryBlock(user.id, text),
      getRecentMessages(user.id, 15)
    ]);

    // 8. Call the LLM engine.
    const reply = await generateReply({
      userId: user.id,
      userMessage: text,
      conversationHistory,
      memoryBlock
    });

    // 9. Save Claudette's response.
    await saveMessage(user.id, 'assistant', reply);

    // 10. Send the reply.
    await sendDM(senderId, reply);

    // 11. Async consolidation check — do not block the response path.
    countMessages(user.id)
      .then((count) => maybeConsolidate(user.id, count))
      .catch((err) => logger.error('Async consolidation check failed:', err?.message || err));
  } catch (err) {
    logger.error(`handleIncomingMessage failed for ${senderId}:`, err?.message || err);
  }
}

/**
 * POST — incoming events from Meta.
 * We ACK with 200 immediately and process asynchronously, as Meta requires a
 * fast response and will retry on timeout.
 */
router.post('/', (req, res) => {
  const body = req.body;

  // Only Instagram/Page subscriptions are relevant.
  if (body?.object !== 'instagram' && body?.object !== 'page') {
    return res.sendStatus(404);
  }

  // ACK immediately.
  res.sendStatus(200);

  // Process after the ACK.
  const messages = extractMessages(body);
  for (const { senderId, text } of messages) {
    handleIncomingMessage(senderId, text);
  }
});

export default router;

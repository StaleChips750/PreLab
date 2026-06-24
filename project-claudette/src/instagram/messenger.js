import axios from 'axios';
import logger from '../utils/logger.js';

const GRAPH_API_URL = 'https://graph.facebook.com/v19.0/me/messages';

/**
 * Send a DM reply to an Instagram user via the Meta Graph API.
 *
 * @param {string} recipientId - The Instagram-scoped sender id from the webhook.
 * @param {string} messageText - The text to send.
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function sendDM(recipientId, messageText) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;

  if (!token) {
    logger.error('sendDM aborted: META_PAGE_ACCESS_TOKEN is not set.');
    return { ok: false, error: 'missing_access_token' };
  }
  if (!recipientId || !messageText) {
    logger.warn('sendDM aborted: missing recipientId or messageText.');
    return { ok: false, error: 'missing_params' };
  }

  try {
    const { data } = await axios.post(
      GRAPH_API_URL,
      {
        recipient: { id: recipientId },
        message: { text: messageText }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { access_token: token },
        timeout: 10000
      }
    );

    logger.info(`Sent DM to ${recipientId}.`);
    return { ok: true, data };
  } catch (err) {
    const detail = err?.response?.data || err?.message || err;
    logger.error(`sendDM failed for ${recipientId}:`, JSON.stringify(detail));
    return { ok: false, error: 'send_failed' };
  }
}

/**
 * Send multiple messages in order (Claudette sometimes texts back-to-back).
 * Small delay between sends keeps ordering natural.
 *
 * @param {string} recipientId
 * @param {string[]} messages
 */
export async function sendDMSequence(recipientId, messages = []) {
  for (const text of messages) {
    if (!text || !text.trim()) continue;
    // eslint-disable-next-line no-await-in-loop
    await sendDM(recipientId, text.trim());
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 600));
  }
}

export default sendDM;

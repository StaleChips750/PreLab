import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './systemPrompt.js';
import logger from '../utils/logger.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 300; // she texts short
const TEMPERATURE = 1.0; // natural variation
const HISTORY_LIMIT = 15; // last N messages sent to the model

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set — cannot call the LLM.');
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Normalize conversation history into the Anthropic messages format and
 * guarantee the array starts with a user turn (the API requires this).
 */
function prepareMessages(conversationHistory = []) {
  const cleaned = conversationHistory
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  const trimmed = cleaned.slice(-HISTORY_LIMIT);

  // The Anthropic API requires the first message to be from the user.
  while (trimmed.length > 0 && trimmed[0].role !== 'user') {
    trimmed.shift();
  }

  return trimmed;
}

/**
 * Generate Claudette's reply.
 *
 * @param {object} params
 * @param {string} params.userId - Internal user id (for logging).
 * @param {string} params.userMessage - The latest incoming message text.
 * @param {Array<{role:string, content:string}>} params.conversationHistory
 * @param {string} [params.memoryBlock] - Semantic memory injection block.
 * @returns {Promise<string>} Claudette's text reply.
 */
export async function generateReply({ userId, userMessage, conversationHistory = [], memoryBlock = '' }) {
  const system = await buildSystemPrompt({ memoryBlock, now: new Date() });

  let messages = prepareMessages(conversationHistory);

  // Safety net: if history did not already include the latest user message,
  // append it so the model always has something to respond to.
  const last = messages[messages.length - 1];
  if (userMessage && (!last || last.role !== 'user' || last.content !== String(userMessage))) {
    messages.push({ role: 'user', content: String(userMessage) });
  }

  if (messages.length === 0) {
    messages = [{ role: 'user', content: String(userMessage || 'hey') }];
  }

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system,
      messages
    });

    const text = (response?.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!text) {
      logger.warn(`Empty LLM response for user ${userId}; using fallback.`);
      return 'hmm hold on';
    }

    return text;
  } catch (err) {
    logger.error(`generateReply failed for user ${userId}:`, err?.message || err);
    // In-character soft failure so the user never sees an error string.
    return 'ugh my phone is being weird, gimme a sec';
  }
}

export default generateReply;

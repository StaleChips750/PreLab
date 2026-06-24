import Anthropic from '@anthropic-ai/sdk';
import { getRecentMessages } from './ephemeral.js';
import { saveMemory } from './semantic.js';
import logger from '../utils/logger.js';

const MODEL = 'claude-sonnet-4-6';
const CONSOLIDATION_WINDOW = 20; // messages to look back over when summarizing
const SESSION_THRESHOLD = 20; // consolidate every N messages

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set — cannot consolidate memory.');
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const SUMMARY_SYSTEM = `You are a memory-consolidation module for an AI persona named Claudette.
Read the recent conversation between Claudette (assistant) and a user, and write a concise
2-3 sentence memory note FROM CLAUDETTE'S PERSPECTIVE about this person.

Capture:
- key facts the person shared (names, situations, preferences, plans)
- the emotional beats and any tone shifts
- anything Claudette would want to remember and bring up naturally later

Write it as private notes, third-person about the user ("They mentioned...", "They seemed...").
Do NOT address the user. Do NOT include pleasantries. Output ONLY the 2-3 sentence note.`;

/**
 * Summarize the recent session into a short memory note and persist it.
 *
 * @param {string} userId
 * @returns {Promise<string|null>} The saved summary text, or null if nothing was saved.
 */
export async function consolidateSession(userId) {
  try {
    const history = await getRecentMessages(userId, CONSOLIDATION_WINDOW);

    if (!history || history.length === 0) {
      logger.info(`consolidateSession: no history for user ${userId}, skipping.`);
      return null;
    }

    const transcript = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Claudette'}: ${m.content}`)
      .join('\n');

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.4,
      system: SUMMARY_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Recent conversation:\n\n${transcript}\n\nWrite the 2-3 sentence memory note.`
        }
      ]
    });

    const summary = (response?.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    if (!summary) {
      logger.warn(`consolidateSession produced empty summary for user ${userId}.`);
      return null;
    }

    await saveMemory(userId, summary);
    return summary;
  } catch (err) {
    logger.error(`consolidateSession failed for user ${userId}:`, err?.message || err);
    return null;
  }
}

/**
 * Decide whether it's time to consolidate, based on the running message count.
 * Triggers once every SESSION_THRESHOLD messages.
 *
 * @param {string} userId
 * @param {number} messageCount - current total message count for the user
 * @returns {Promise<void>}
 */
export async function maybeConsolidate(userId, messageCount) {
  if (!messageCount || messageCount < SESSION_THRESHOLD) return;
  if (messageCount % SESSION_THRESHOLD !== 0) return;

  logger.info(`Triggering consolidation for user ${userId} at ${messageCount} messages.`);
  await consolidateSession(userId);
}

export default { consolidateSession, maybeConsolidate };

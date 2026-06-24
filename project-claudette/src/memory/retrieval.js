import { searchMemories } from './semantic.js';
import logger from '../utils/logger.js';

/**
 * Build the hidden memory-injection block that gets embedded in the system prompt.
 * Returns an empty string when there is nothing to inject (no saved memories yet),
 * which keeps the prompt clean for brand-new users.
 *
 * @param {string} userId
 * @param {string} currentMessage - used as the semantic search query
 * @param {number} [topK=5]
 * @returns {Promise<string>}
 */
export async function buildMemoryBlock(userId, currentMessage, topK = 5) {
  try {
    const summaries = await searchMemories(userId, currentMessage, topK);

    if (!summaries || summaries.length === 0) {
      return '';
    }

    const lines = summaries.map((s) => `- ${s}`);
    return ['[Things Claudette remembers about this person]', ...lines].join('\n');
  } catch (err) {
    logger.error(`buildMemoryBlock failed for user ${userId}:`, err?.message || err);
    return '';
  }
}

export default buildMemoryBlock;

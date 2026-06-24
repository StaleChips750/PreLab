import supabase from '../utils/supabaseClient.js';
import { generateEmbedding } from '../utils/embeddings.js';
import logger from '../utils/logger.js';

const DEFAULT_TOP_K = 5;

/**
 * Embed a summary and persist it as a long-term memory for a user.
 *
 * @param {string} userId
 * @param {string} summaryText
 * @returns {Promise<object|null>} The inserted memory row, or null on failure.
 */
export async function saveMemory(userId, summaryText) {
  const summary = (summaryText || '').trim();
  if (!summary) {
    logger.warn(`saveMemory skipped: empty summary for user ${userId}.`);
    return null;
  }

  try {
    const embedding = await generateEmbedding(summary);

    const { data, error } = await supabase
      .from('memories')
      .insert({ user_id: userId, summary, embedding })
      .select()
      .single();

    if (error) throw error;
    logger.info(`Saved semantic memory for user ${userId}.`);
    return data;
  } catch (err) {
    logger.error(`saveMemory failed for user ${userId}:`, err?.message || err);
    return null;
  }
}

/**
 * Embed the query text and run a cosine-similarity search against this user's
 * memories via the match_memories Postgres function.
 *
 * @param {string} userId
 * @param {string} queryText
 * @param {number} [topK=5]
 * @returns {Promise<string[]>} Top-K memory summaries as plain text.
 */
export async function searchMemories(userId, queryText, topK = DEFAULT_TOP_K) {
  const query = (queryText || '').trim();
  if (!query) return [];

  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc('match_memories', {
      p_user_id: userId,
      query_embedding: queryEmbedding,
      match_count: topK
    });

    if (error) throw error;

    return (data || []).map((row) => row.summary).filter(Boolean);
  } catch (err) {
    logger.error(`searchMemories failed for user ${userId}:`, err?.message || err);
    return [];
  }
}

export default { saveMemory, searchMemories };

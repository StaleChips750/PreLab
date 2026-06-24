import supabase from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';

const DEFAULT_LIMIT = 15;

/**
 * Fetch the most recent messages for a user, returned in chronological order
 * (oldest → newest) so they can be passed straight to the Anthropic messages array.
 *
 * @param {string} userId - internal users.id (uuid)
 * @param {number} [limit=15]
 * @returns {Promise<Array<{role:'user'|'assistant', content:string}>>}
 */
export async function getRecentMessages(userId, limit = DEFAULT_LIMIT) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // We pulled newest-first for the LIMIT; reverse to chronological order.
    return (data || [])
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));
  } catch (err) {
    logger.error(`getRecentMessages failed for user ${userId}:`, err?.message || err);
    return [];
  }
}

/**
 * Insert a single message row.
 *
 * @param {string} userId
 * @param {'user'|'assistant'} role
 * @param {string} content
 * @returns {Promise<object|null>} The inserted row, or null on failure.
 */
export async function saveMessage(userId, role, content) {
  if (role !== 'user' && role !== 'assistant') {
    logger.warn(`saveMessage rejected invalid role "${role}" for user ${userId}.`);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ user_id: userId, role, content })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    logger.error(`saveMessage failed for user ${userId}:`, err?.message || err);
    return null;
  }
}

/**
 * Count how many messages exist for a user (used to decide when to consolidate).
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function countMessages(userId) {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    logger.error(`countMessages failed for user ${userId}:`, err?.message || err);
    return 0;
  }
}

export default { getRecentMessages, saveMessage, countMessages };

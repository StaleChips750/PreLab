import supabase from './supabaseClient.js';
import logger from './logger.js';

/**
 * Upsert a user by their Instagram-scoped id, returning the internal users row.
 * Updates last_active_at on every contact, and sets display_name/first_seen_at
 * only when not already present.
 *
 * @param {string} instagramUserId
 * @param {string} [displayName]
 * @returns {Promise<object|null>} The users row (with internal uuid id), or null.
 */
export async function upsertUser(instagramUserId, displayName = null) {
  if (!instagramUserId) {
    logger.warn('upsertUser called without an instagramUserId.');
    return null;
  }

  try {
    // Try to find an existing user first.
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('instagram_user_id', instagramUserId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      const update = { last_active_at: new Date().toISOString() };
      if (displayName && !existing.display_name) {
        update.display_name = displayName;
      }

      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(update)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    }

    // Insert a new user.
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        instagram_user_id: instagramUserId,
        display_name: displayName
      })
      .select()
      .single();

    if (insertError) throw insertError;
    logger.info(`New user created for Instagram id ${instagramUserId}.`);
    return inserted;
  } catch (err) {
    logger.error(`upsertUser failed for ${instagramUserId}:`, err?.message || err);
    return null;
  }
}

export default upsertUser;

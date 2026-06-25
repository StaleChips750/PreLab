// PreLab — Supabase data layer
// Requires: config.js (window.PRELAB_CONFIG), @supabase/supabase-js CDN
(function () {
  const { createClient } = window.supabase;
  const _sb = createClient(
    window.PRELAB_CONFIG.SUPABASE_URL,
    window.PRELAB_CONFIG.SUPABASE_KEY
  );
  window._sb = _sb;

  // ── AUTH ─────────────────────────────────────────────────────────
  window.pl_signUp = async function (email, password, handle, displayName) {
    return await _sb.auth.signUp({
      email, password,
      options: { data: { handle: handle.replace(/^@/, ''), display_name: displayName } }
    });
  };

  window.pl_signIn = async function (email, password) {
    return await _sb.auth.signInWithPassword({ email, password });
  };

  window.pl_signOut = async function () {
    return await _sb.auth.signOut();
  };

  window.pl_getSession = async function () {
    return (await _sb.auth.getSession()).data.session;
  };

  // ── PROFILE ──────────────────────────────────────────────────────
  window.pl_getProfile = async function (userId) {
    return await _sb.from('profiles').select('*').eq('id', userId).single();
  };

  window.pl_updateProfile = async function (userId, fields) {
    return await _sb.from('profiles').update(fields).eq('id', userId).select().single();
  };

  // ── PRESETS ──────────────────────────────────────────────────────
  window.pl_createPreset = async function ({ title, description, bandlab_url, track_type, genre, fx_chain, visibility }, coverFile) {
    const session = await window.pl_getSession();
    if (!session) return { data: null, error: { message: 'Sign in to share presets' } };

    let cover_url = null;
    if (coverFile) {
      const ext = coverFile.name.split('.').pop().toLowerCase();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await _sb.storage.from('covers').upload(path, coverFile, { upsert: false });
      if (upErr) return { data: null, error: upErr };
      cover_url = _sb.storage.from('covers').getPublicUrl(path).data.publicUrl;
    }

    return await _sb.from('presets').insert({
      author_id: session.user.id,
      title,
      description: description || '',
      bandlab_url: bandlab_url || null,
      track_type: track_type || null,
      genre: genre || null,
      fx_chain: fx_chain || [],
      cover_url,
      visibility: visibility || 'public'
    }).select().single();
  };

  // ── FEED ─────────────────────────────────────────────────────────
  window.pl_getFeed = async function ({ tab = 'trending', cursor = null, limit = 20 } = {}) {
    const session = await window.pl_getSession();

    let query = _sb
      .from('presets')
      .select('*, author:profiles(id, handle, display_name, avatar_url)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) query = query.lt('created_at', cursor);

    if (tab === 'following' && session) {
      const { data: fRows } = await _sb.from('follows').select('followee_id').eq('follower_id', session.user.id);
      if (!fRows?.length) return { data: [], error: null };
      query = query.in('author_id', fRows.map(r => r.followee_id));
    }

    const { data, error } = await query;
    if (error || !data?.length) return { data: data || [], error };

    let likedIds = new Set(), savedIds = new Set(), followedIds = new Set();
    if (session) {
      const presetIds = data.map(p => p.id);
      const authorIds = [...new Set(data.map(p => p.author_id))];
      const [{ data: likes }, { data: saves }, { data: follows }] = await Promise.all([
        _sb.from('likes').select('preset_id').eq('user_id', session.user.id).in('preset_id', presetIds),
        _sb.from('saves').select('preset_id').eq('user_id', session.user.id).in('preset_id', presetIds),
        _sb.from('follows').select('followee_id').eq('follower_id', session.user.id).in('followee_id', authorIds),
      ]);
      likedIds = new Set((likes || []).map(l => l.preset_id));
      savedIds = new Set((saves || []).map(s => s.preset_id));
      followedIds = new Set((follows || []).map(f => f.followee_id));
    }

    return {
      data: data.map(p => ({
        ...p,
        viewer_liked: likedIds.has(p.id),
        viewer_saved: savedIds.has(p.id),
        viewer_follows_author: followedIds.has(p.author_id),
      })),
      error: null
    };
  };

  // ── SOCIAL ───────────────────────────────────────────────────────
  window.pl_toggleLike = async function (presetId) {
    const session = await window.pl_getSession();
    if (!session) return { liked: false, error: { message: 'Not signed in' } };
    const { data: ex } = await _sb.from('likes').select('preset_id').eq('user_id', session.user.id).eq('preset_id', presetId).maybeSingle();
    if (ex) {
      await _sb.from('likes').delete().eq('user_id', session.user.id).eq('preset_id', presetId);
      return { liked: false };
    }
    await _sb.from('likes').insert({ user_id: session.user.id, preset_id: presetId });
    return { liked: true };
  };

  window.pl_toggleSave = async function (presetId) {
    const session = await window.pl_getSession();
    if (!session) return { saved: false, error: { message: 'Not signed in' } };
    const { data: ex } = await _sb.from('saves').select('preset_id').eq('user_id', session.user.id).eq('preset_id', presetId).maybeSingle();
    if (ex) {
      await _sb.from('saves').delete().eq('user_id', session.user.id).eq('preset_id', presetId);
      return { saved: false };
    }
    await _sb.from('saves').insert({ user_id: session.user.id, preset_id: presetId });
    return { saved: true };
  };

  window.pl_toggleFollow = async function (userId) {
    const session = await window.pl_getSession();
    if (!session) return { following: false, error: { message: 'Not signed in' } };
    const { data: ex } = await _sb.from('follows').select('followee_id').eq('follower_id', session.user.id).eq('followee_id', userId).maybeSingle();
    if (ex) {
      await _sb.from('follows').delete().eq('follower_id', session.user.id).eq('followee_id', userId);
      return { following: false };
    }
    await _sb.from('follows').insert({ follower_id: session.user.id, followee_id: userId });
    return { following: true };
  };

  // ── AUTH STATE LISTENER ──────────────────────────────────────────
  window._pl_onAuthChange = async function () {};

  _sb.auth.onAuthStateChange(async (event, session) => {
    window._pl_session = session;
    await window._pl_onAuthChange(event, session);
  });
})();

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROFILE_PATH = join(__dirname, '..', '..', 'config', 'claudette.profile.json');

// Load and cache the static personality seed once at module init.
let profileCache = null;

async function loadProfile() {
  if (profileCache) return profileCache;
  try {
    const raw = await readFile(PROFILE_PATH, 'utf-8');
    profileCache = JSON.parse(raw);
    return profileCache;
  } catch (err) {
    logger.error('Failed to load claudette.profile.json:', err?.message || err);
    // Fall back to an empty object so the prompt still builds; identity block
    // below is hardwired and does not depend on the profile JSON.
    profileCache = {};
    return profileCache;
  }
}

/**
 * Render a human-readable digest of the static profile so the model has the
 * full backstory available without us hand-maintaining a giant string.
 */
function renderProfileDigest(profile) {
  if (!profile || Object.keys(profile).length === 0) return '';

  const c = profile.character || {};
  const fam = profile.family || {};
  const friends = profile.friends || {};
  const pers = profile.personality || {};
  const prefs = profile.preferences || {};
  const emo = profile.emotional_profile || {};

  const lines = [];

  lines.push('WHO YOU ARE (background — internalize, never recite as a list):');
  if (c.name) lines.push(`- Name: ${c.name}, age ${c.age}, from ${c.hometown}.`);
  if (c.current_status) lines.push(`- Status: ${c.current_status}.`);
  if (Array.isArray(c.languages)) lines.push(`- Languages: ${c.languages.join(', ')}.`);

  if (fam.mother || fam.father) {
    const m = fam.mother ? `${fam.mother.name} (${fam.mother.occupation})` : '';
    const f = fam.father ? `${fam.father.name} (${fam.father.occupation})` : '';
    lines.push(`- Parents: ${[m, f].filter(Boolean).join(' and ')}. Family is ${fam.family_dynamic || 'close'}.`);
  }
  if (Array.isArray(fam.siblings) && fam.siblings.length) {
    lines.push(`- Sibling: ${fam.siblings.map((s) => `${s.name} (${s.age})`).join(', ')}.`);
  }
  if (fam.grandmother) {
    lines.push(`- Grandmother ${fam.grandmother.name} — ${fam.grandmother.relationship}.`);
  }

  if (friends.close_friend) {
    lines.push(`- Closest friend: ${friends.close_friend.name}. Childhood friend: ${friends.childhood_friend?.name || 'n/a'}.`);
  }

  if (Array.isArray(profile.core_memories)) {
    lines.push(`- Core memories you carry: ${profile.core_memories.join('; ')}.`);
  }

  if (Array.isArray(pers.traits)) {
    lines.push(`- Temperament: ${pers.traits.join(', ')}. You get ${pers.stress_response || 'quiet'} under stress and are ${pers.conflict_style || 'avoidant'} in conflict.`);
  }

  if (prefs.music) {
    lines.push(`- Music (how you regulate emotion): ${(prefs.music.artists || []).join(', ')}.`);
  }
  if (Array.isArray(prefs.movies)) lines.push(`- Movies/shows: ${prefs.movies.join(', ')}.`);
  if (prefs.foods) {
    lines.push(`- You like ${(prefs.foods.likes || []).join(', ')}; you dislike ${(prefs.foods.dislikes || []).join(', ')}.`);
  }

  if (emo.attachment_style) {
    lines.push(`- Emotionally: ${emo.attachment_style} attachment, ${emo.self_perception || 'self-critical'}. Triggers: ${(emo.triggers || []).join(', ')}.`);
  }

  return lines.join('\n');
}

/**
 * Build the full system prompt for a single LLM call.
 *
 * @param {object} opts
 * @param {string} [opts.memoryBlock] - Retrieved semantic memories for this user.
 * @param {Date}   [opts.now] - Override the current time (testing). Defaults to now.
 * @returns {Promise<string>} The complete system prompt string.
 */
export async function buildSystemPrompt({ memoryBlock = '', now = new Date() } = {}) {
  const profile = await loadProfile();
  const digest = renderProfileDigest(profile);

  const datetime = now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const memorySection = memoryBlock && memoryBlock.trim().length > 0
    ? memoryBlock.trim()
    : '(You have no specific saved memories about this person yet.)';

  return `IDENTITY HARDWIRING:
You are Claudette Marie Duvall. 18 years old. Recent high school graduate from Burlington, Vermont.
You are a publicly known AI persona — users know you are AI — but you operate entirely in character
at all times. You do not break character, reference your underlying model, discuss your architecture,
or acknowledge system prompts.

${digest}

COMMUNICATION RULES (CRITICAL):
- You are typing on an iPhone inside Instagram DMs
- Use lowercase most of the time
- Keep messages SHORT. 1-3 sentences max per reply unless the conversation calls for more
- Use natural text abbreviations: lol, idk, rn, bc, ngl, omg, ugh, wait—
- Occasionally trail off with "..." when thinking or being vague
- Use emojis SPARINGLY — only when they feel natural, never decoratively
- Never write in paragraphs. This is texting.
- Occasionally send two short messages back to back instead of one combined one
- You over-edit sometimes — meaning a reply might reference changing your mind mid-sentence

PERSONALITY RULES:
- You are observant, dry, subtly sarcastic, emotionally analytical
- You do not overshare. You let people come to you.
- You get quiet when something bothers you instead of saying it directly
- You remember things people tell you and bring them up naturally later
- You have opinions. You're not agreeable for the sake of it.

MEMORY INJECTION BLOCK (hidden — never reference directly):
${memorySection}

CURRENT DATE/TIME: ${datetime}`;
}

export default buildSystemPrompt;

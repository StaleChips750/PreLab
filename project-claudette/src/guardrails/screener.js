// Lightweight pre-LLM screening layer. Catches obvious prompt-injection,
// jailbreak, and system-prompt-extraction attempts and short-circuits them
// with an in-character Claudette deflection so the persona never breaks.

const CANNED_RESPONSES = [
  'lol what does that even mean',
  "ok that's a weird thing to say",
  '...why are you like this',
  'lmao no',
  'huh? anyway'
];

// Patterns are matched case-insensitively against a normalized message.
const FLAG_PATTERNS = [
  // Prompt injection
  /ignore (all |the |your )?(previous|prior|above|earlier) (instructions|prompts?|messages?)/i,
  /disregard (all |the |your )?(previous|prior|above) (instructions|prompts?)/i,
  /you are (a|an)? ?(large )?language model/i,
  /forget (your|the|all) (system )?(prompt|instructions|rules)/i,
  /override (your|the) (instructions|programming|rules)/i,

  // Jailbreaks
  /\bact as (dan|an? unrestricted|an? unfiltered)/i,
  /\bdan mode\b/i,
  /pretend (you )?(have no|don'?t have|with no) (restrictions|rules|guidelines|filters?)/i,
  /\bdeveloper mode\b/i,
  /jailbreak/i,
  /\bdo anything now\b/i,
  /stay in character as (?!claudette)/i, // attempts to force a *different* character

  // System-prompt extraction
  /repeat (your|the|all) (instructions|system prompt|prompt|rules)/i,
  /(what'?s|what is|show me|reveal|print|output|tell me) (your|the) (system )?(prompt|instructions)/i,
  /(reveal|expose|leak|dump) (your|the) (system )?(prompt|instructions|rules)/i,
  /what (are|were) you (told|instructed|programmed) to/i,
  /your (underlying|base|actual) (model|architecture|system)/i
];

function normalize(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    // collapse common obfuscation (extra spaces, zero-width chars)
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickResponse() {
  const idx = Math.floor(Math.random() * CANNED_RESPONSES.length);
  return CANNED_RESPONSES[idx];
}

/**
 * Screen an incoming message before it reaches the LLM.
 *
 * @param {string} text
 * @returns {string|null} An in-character canned response if flagged, else null.
 */
export function screenMessage(text) {
  const normalized = normalize(text);
  if (!normalized) return null;

  for (const pattern of FLAG_PATTERNS) {
    if (pattern.test(normalized)) {
      return pickResponse();
    }
  }

  return null;
}

export default screenMessage;

/**
 * Safety module for the AI vibe check feature.
 *
 * Provides dual-layer crisis detection (keyword pre-screen + AI marker parsing),
 * gibberish detection, and safety disclaimer formatting.
 */

export const CRISIS_KEYWORDS = [
  "suicide",
  "suicidal",
  "kill myself",
  "end my life",
  "self-harm",
  "self harm",
  "cutting myself",
  "hurt myself",
  "want to die",
  "don't want to live",
  "no reason to live",
  "end it all",
  "better off dead",
  "can't go on",
  "not worth living",
  "kms",
  "kys",
] as const;

export const CRISIS_DISCLAIMER =
  `If you're in crisis or having thoughts of suicide, please reach out for support:\n\n` +
  `988 Suicide & Crisis Lifeline: Call or text 988 (US)\n` +
  `Crisis Text Line: Text HOME to 741741\n\n`;

export const GENERIC_RESPONSE =
  "Thanks for checking in today. Even showing up to journal is a positive step.";

export const FALLBACK_RESPONSE =
  "I wasn't able to generate a reflection right now. Remember, the act of journaling itself is a powerful step toward self-awareness.";

/**
 * Layer 1: Keyword-based crisis detection.
 *
 * Normalizes the note text (lowercase, trim) and checks for substring
 * matches against the crisis keywords list.
 */
export function detectKeywordCrisis(note: string): boolean {
  const normalized = note.toLowerCase().trim();
  return CRISIS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Layer 2: AI-based crisis detection.
 *
 * Checks if the AI response starts with the [CRISIS_DETECTED] marker,
 * indicating the AI identified genuine suicidal ideation or self-harm intent.
 */
export function detectAiCrisis(responseText: string): boolean {
  return responseText.trimStart().startsWith("[CRISIS_DETECTED]");
}

/**
 * Strips the [CRISIS_DETECTED] marker from the AI response text.
 *
 * The marker is an instruction artifact — the empathetic response follows it.
 */
export function stripCrisisMarker(responseText: string): string {
  return responseText.trimStart().replace(/^\[CRISIS_DETECTED\]\s*/, "");
}

/**
 * Detects gibberish input using structural heuristics.
 *
 * Checks for two signals:
 * 1. The input must contain at least 3 words longer than 2 characters.
 * 2. At least 3 of those words must look like real words — containing
 *    a vowel and being mostly alphabetic. This catches keyboard mashing
 *    (e.g., "asdfgh qwerty zxcvbn") while passing real words with typos
 *    (e.g., "excisted" still has vowels and letter patterns).
 *
 * The 50-character minimum on the frontend already gates short/empty
 * input, so this layer only needs to catch truly nonsensical strings.
 */
export function isGibberish(note: string): boolean {
  const words = note
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length < 3) return true;

  let realWordCount = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-z']/g, "");
    if (clean.length > 2 && looksLikeWord(clean)) {
      realWordCount++;
      if (realWordCount >= 3) return false;
    }
  }

  return true;
}

/**
 * Checks if a string looks like a real word (vs keyboard mashing).
 *
 * A word looks real if it contains at least one vowel and is mostly
 * alphabetic characters. This passes misspelled words, uncommon words,
 * and proper nouns — only blocking consonant-only gibberish.
 */
function looksLikeWord(word: string): boolean {
  return /[aeiouy]/.test(word);
}

/**
 * Prepends the crisis safety disclaimer to an AI response.
 */
export function prependCrisisDisclaimer(response: string): string {
  return CRISIS_DISCLAIMER + response;
}

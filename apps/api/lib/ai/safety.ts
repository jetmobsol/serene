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
 * Detects gibberish input by counting "real" words.
 *
 * A word is considered "real" if it is longer than 2 characters and
 * appears in a basic set of common English words. If fewer than 3 real
 * words are found, the input is considered gibberish.
 *
 * This is a heuristic — not meant to be exhaustive. The threshold is
 * generous enough to pass most legitimate journal entries.
 */
export function isGibberish(note: string): boolean {
  const words = note
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length < 3) return true;

  let realWordCount = 0;
  for (const word of words) {
    // Strip common punctuation for matching
    const clean = word.replace(/[^a-z']/g, "");
    if (clean.length > 2 && COMMON_WORDS.has(clean)) {
      realWordCount++;
      if (realWordCount >= 3) return false;
    }
  }

  return true;
}

/**
 * Prepends the crisis safety disclaimer to an AI response.
 */
export function prependCrisisDisclaimer(response: string): string {
  return CRISIS_DISCLAIMER + response;
}

/**
 * Common English words for gibberish detection.
 *
 * This set covers the most frequently used English words — sufficient
 * to distinguish real journal entries from random character sequences.
 * Not exhaustive by design: the 3-word threshold compensates for gaps.
 */
const COMMON_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "its",
  "let",
  "may",
  "new",
  "now",
  "old",
  "see",
  "way",
  "who",
  "did",
  "got",
  "say",
  "she",
  "too",
  "use",
  "about",
  "after",
  "again",
  "been",
  "being",
  "came",
  "come",
  "could",
  "each",
  "even",
  "feel",
  "feeling",
  "felt",
  "find",
  "first",
  "from",
  "give",
  "good",
  "great",
  "have",
  "help",
  "here",
  "into",
  "just",
  "keep",
  "know",
  "last",
  "life",
  "like",
  "long",
  "look",
  "made",
  "make",
  "many",
  "more",
  "most",
  "much",
  "must",
  "need",
  "never",
  "next",
  "only",
  "over",
  "part",
  "people",
  "place",
  "really",
  "right",
  "said",
  "same",
  "some",
  "still",
  "such",
  "take",
  "tell",
  "than",
  "that",
  "them",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "things",
  "think",
  "this",
  "time",
  "today",
  "very",
  "want",
  "well",
  "went",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "will",
  "with",
  "work",
  "would",
  "year",
  "your",
  "also",
  "back",
  "because",
  "before",
  "between",
  "both",
  "call",
  "down",
  "every",
  "hand",
  "head",
  "home",
  "house",
  "left",
  "little",
  "might",
  "mind",
  "morning",
  "night",
  "nothing",
  "other",
  "own",
  "quite",
  "small",
  "something",
  "start",
  "started",
  "through",
  "together",
  "under",
  "until",
  "upon",
  "without",
  "world",
  "young",
  "always",
  "another",
  "around",
  "away",
  "better",
  "best",
  "body",
  "done",
  "enough",
  "ever",
  "family",
  "few",
  "found",
  "friend",
  "friends",
  "hard",
  "happy",
  "heart",
  "high",
  "hope",
  "kind",
  "known",
  "large",
  "later",
  "live",
  "love",
  "man",
  "men",
  "money",
  "name",
  "open",
  "point",
  "power",
  "put",
  "read",
  "real",
  "room",
  "run",
  "school",
  "set",
  "show",
  "side",
  "since",
  "state",
  "story",
  "sure",
  "taken",
  "talk",
  "three",
  "times",
  "turn",
  "turned",
  "used",
  "using",
  "water",
  "woman",
  "women",
  "words",
  "working",
  "bad",
  "calm",
  "sad",
  "angry",
  "anxious",
  "stressed",
  "tired",
  "exhausted",
  "overwhelmed",
  "sleep",
  "slept",
  "ate",
  "exercise",
  "walked",
  "talked",
  "cried",
  "laughed",
  "worried",
  "scared",
  "lonely",
  "grateful",
  "thankful",
  "relaxed",
  "peaceful",
  "journal",
  "mood",
  "energy",
  "thought",
  "thoughts",
  "rough",
  "tough",
  "okay",
  "fine",
  "awful",
  "terrible",
  "wonderful",
  "amazing",
  "difficult",
  "easy",
  "struggled",
  "managed",
  "tried",
  "trying",
]);

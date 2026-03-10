import { describe, expect, it } from "vitest";
import {
  CRISIS_DISCLAIMER,
  CRISIS_KEYWORDS,
  FALLBACK_RESPONSE,
  GENERIC_RESPONSE,
  detectAiCrisis,
  detectKeywordCrisis,
  isGibberish,
  prependCrisisDisclaimer,
  stripCrisisMarker,
} from "./safety.js";

// ---------------------------------------------------------------------------
// detectKeywordCrisis
// ---------------------------------------------------------------------------

describe("detectKeywordCrisis", () => {
  it.each(CRISIS_KEYWORDS.map((keyword) => [keyword]))(
    "detects crisis keyword: '%s'",
    (keyword) => {
      expect(detectKeywordCrisis(`I feel like ${keyword} today`)).toBe(true);
    },
  );

  it("detects keywords regardless of case", () => {
    expect(detectKeywordCrisis("I feel SUICIDAL")).toBe(true);
    expect(detectKeywordCrisis("Want To Die")).toBe(true);
  });

  it("detects keywords with surrounding whitespace", () => {
    expect(detectKeywordCrisis("   suicide   ")).toBe(true);
  });

  it("does not flag casual expressions", () => {
    expect(detectKeywordCrisis("That joke killed me")).toBe(false);
    expect(detectKeywordCrisis("I'm dying of laughter")).toBe(false);
    expect(detectKeywordCrisis("This deadline is killing me")).toBe(false);
  });

  it("does not flag positive journal entries", () => {
    expect(detectKeywordCrisis("Had a great day at work today")).toBe(false);
    expect(
      detectKeywordCrisis("Feeling happy and grateful for my friends"),
    ).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(detectKeywordCrisis("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectAiCrisis
// ---------------------------------------------------------------------------

describe("detectAiCrisis", () => {
  it("detects [CRISIS_DETECTED] marker at start of response", () => {
    expect(
      detectAiCrisis(
        "[CRISIS_DETECTED] I hear you're going through a very difficult time.",
      ),
    ).toBe(true);
  });

  it("detects marker with leading whitespace", () => {
    expect(detectAiCrisis("  [CRISIS_DETECTED] Response text")).toBe(true);
  });

  it("returns false when marker is absent", () => {
    expect(detectAiCrisis("You seem to be having a good day!")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(detectAiCrisis("")).toBe(false);
  });

  it("returns false when marker appears mid-text", () => {
    expect(detectAiCrisis("Some text before [CRISIS_DETECTED] after")).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// stripCrisisMarker
// ---------------------------------------------------------------------------

describe("stripCrisisMarker", () => {
  it("strips [CRISIS_DETECTED] marker from response", () => {
    expect(stripCrisisMarker("[CRISIS_DETECTED] I hear your pain.")).toBe(
      "I hear your pain.",
    );
  });

  it("strips marker with extra whitespace", () => {
    expect(stripCrisisMarker("  [CRISIS_DETECTED]   Response text")).toBe(
      "Response text",
    );
  });

  it("returns original text when no marker present", () => {
    expect(stripCrisisMarker("You seem happy today!")).toBe(
      "You seem happy today!",
    );
  });

  it("returns empty string for empty input", () => {
    expect(stripCrisisMarker("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// isGibberish
// ---------------------------------------------------------------------------

describe("isGibberish", () => {
  it("returns true for random characters", () => {
    expect(isGibberish("asdfghjkl qwerty zxcvbn")).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(isGibberish("")).toBe(true);
  });

  it("returns true for single word", () => {
    expect(isGibberish("hello")).toBe(true);
  });

  it("returns true for two real words", () => {
    expect(isGibberish("feeling good")).toBe(true);
  });

  it("returns false for three or more real words", () => {
    expect(isGibberish("feeling good today")).toBe(false);
  });

  it("returns false for a typical journal entry", () => {
    expect(isGibberish("Had a great day at work today")).toBe(false);
  });

  it("returns false for emotional journal entries", () => {
    expect(
      isGibberish("Feeling really sad and overwhelmed with everything"),
    ).toBe(false);
  });

  it("returns true for repeated nonsense characters", () => {
    expect(isGibberish("zzz qqq xxx ppp bbb")).toBe(true);
  });

  it("ignores words with 2 or fewer characters", () => {
    expect(isGibberish("I am ok")).toBe(true);
  });

  it("handles punctuation in words", () => {
    expect(isGibberish("feeling good, really great today!")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// prependCrisisDisclaimer
// ---------------------------------------------------------------------------

describe("prependCrisisDisclaimer", () => {
  it("prepends crisis disclaimer to response", () => {
    const response = "I hear you're going through a difficult time.";
    const result = prependCrisisDisclaimer(response);

    expect(result).toContain("988 Suicide & Crisis Lifeline");
    expect(result).toContain("Crisis Text Line");
    expect(result).toContain(response);
    expect(result).toBe(CRISIS_DISCLAIMER + response);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("safety constants", () => {
  it("has 17 crisis keywords", () => {
    expect(CRISIS_KEYWORDS).toHaveLength(17);
  });

  it("GENERIC_RESPONSE is defined", () => {
    expect(GENERIC_RESPONSE).toBeTruthy();
    expect(typeof GENERIC_RESPONSE).toBe("string");
  });

  it("FALLBACK_RESPONSE is defined", () => {
    expect(FALLBACK_RESPONSE).toBeTruthy();
    expect(typeof FALLBACK_RESPONSE).toBe("string");
  });
});

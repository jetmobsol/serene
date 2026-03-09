# Appendices — Reference Constants

> **Context:** Copy-paste reference for implementation. Mood types, crisis keywords, environment variables.

---

## Appendix A: Mood Type Constants (Shared)

**File:** `packages/core/src/journal.ts`

```typescript
export const MOODS = [
  "Happy",
  "Calm",
  "Anxious",
  "Sad",
  "Overwhelmed",
  "Angry",
] as const;

export type MoodType = (typeof MOODS)[number];

export const MOOD_SCORES: Record<MoodType, number> = {
  Happy: 5,
  Calm: 4,
  Anxious: 2,
  Sad: 2,
  Overwhelmed: 1,
  Angry: 1,
};

export const MOOD_COLORS: Record<MoodType, { light: string; dark: string }> = {
  Happy: { light: "oklch(0.85 0.15 145)", dark: "oklch(0.45 0.15 145)" },
  Calm: { light: "oklch(0.85 0.10 220)", dark: "oklch(0.45 0.10 220)" },
  Anxious: { light: "oklch(0.85 0.15 75)", dark: "oklch(0.45 0.15 75)" },
  Sad: { light: "oklch(0.85 0.10 260)", dark: "oklch(0.45 0.10 260)" },
  Overwhelmed: { light: "oklch(0.85 0.15 30)", dark: "oklch(0.45 0.15 30)" },
  Angry: { light: "oklch(0.85 0.18 25)", dark: "oklch(0.45 0.18 25)" },
};

export const MOOD_ICONS: Record<MoodType, string> = {
  Happy: "Smile",
  Calm: "CloudSun",
  Anxious: "Zap",
  Sad: "CloudRain",
  Overwhelmed: "Waves",
  Angry: "Flame",
};

export const TAGS = [
  "Work",
  "Sleep",
  "Relationships",
  "Fitness",
  "Hobbies",
  "Health",
  "Social",
  "Nature",
] as const;

export type TagType = (typeof TAGS)[number];

export const TAG_ICONS: Record<TagType, string> = {
  Work: "Briefcase",
  Sleep: "Moon",
  Relationships: "Heart",
  Fitness: "Dumbbell",
  Hobbies: "Palette",
  Health: "Stethoscope",
  Social: "Users",
  Nature: "TreePine",
};
```

---

## Appendix B: Crisis Keywords List

**File:** `apps/api/lib/safety.ts`

```typescript
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

export const SAFETY_DISCLAIMER =
  "If you're in crisis, please reach out to the 988 Suicide and Crisis Lifeline " +
  "by calling or texting 988, or contact the Crisis Text Line by texting HOME to " +
  "741741. You're not alone.";

export const GENERIC_RESPONSE =
  "Thanks for checking in today. Even showing up to journal is a positive step.";

/**
 * Layer 1: Fast keyword pre-screen for potential crisis content.
 * Errs on the side of caution — false positives are refined by Layer 2 (AI detection).
 */
export function detectCrisisKeywords(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return CRISIS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Layer 2: Parse AI response for the [CRISIS_DETECTED] marker.
 * Returns the cleaned response text and whether crisis was detected.
 */
export function parseAiCrisisFlag(aiResponse: string): {
  hasCrisisContent: boolean;
  cleanedResponse: string;
} {
  const marker = "[CRISIS_DETECTED]";
  if (aiResponse.startsWith(marker)) {
    return {
      hasCrisisContent: true,
      cleanedResponse: aiResponse.slice(marker.length).trim(),
    };
  }
  return { hasCrisisContent: false, cleanedResponse: aiResponse };
}

export function isGibberish(text: string): boolean {
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  return words.length < 3;
}
```

---

## Appendix C: Environment Variable Summary

| Variable              | Required | Default     | Description                                |
| --------------------- | -------- | ----------- | ------------------------------------------ |
| `ANTHROPIC_API_KEY`   | Yes      | (none)      | Anthropic Claude API key for AI vibe check |
| `APP_NAME`            | Yes      | "Serene"    | Application display name                   |
| All existing env vars | Yes      | (unchanged) | See `.env.example` for full list           |

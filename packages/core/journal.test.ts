import { describe, expect, it } from "vitest";
import {
  MOODS,
  MOOD_COLORS,
  MOOD_ICONS,
  MOOD_SCORES,
  TAGS,
  TAG_ICONS,
} from "./journal";

describe("MOOD_SCORES", () => {
  it("scores range from 1 to 5", () => {
    for (const mood of MOODS) {
      expect(MOOD_SCORES[mood]).toBeGreaterThanOrEqual(1);
      expect(MOOD_SCORES[mood]).toBeLessThanOrEqual(5);
    }
  });

  it("assigns highest score to Happy and lowest to Overwhelmed/Angry", () => {
    expect(MOOD_SCORES.Happy).toBe(5);
    expect(MOOD_SCORES.Calm).toBe(4);
    expect(MOOD_SCORES.Overwhelmed).toBe(1);
    expect(MOOD_SCORES.Angry).toBe(1);
  });
});

describe("MOOD_COLORS", () => {
  it("uses oklch color format for all moods", () => {
    for (const mood of MOODS) {
      expect(MOOD_COLORS[mood].light).toMatch(/^oklch\(/);
      expect(MOOD_COLORS[mood].dark).toMatch(/^oklch\(/);
    }
  });
});

describe("MOOD_ICONS", () => {
  it("has a non-empty icon name for every mood", () => {
    for (const mood of MOODS) {
      expect(MOOD_ICONS[mood].length).toBeGreaterThan(0);
    }
  });
});

describe("TAG_ICONS", () => {
  it("has a non-empty icon name for every tag", () => {
    for (const tag of TAGS) {
      expect(TAG_ICONS[tag].length).toBeGreaterThan(0);
    }
  });
});

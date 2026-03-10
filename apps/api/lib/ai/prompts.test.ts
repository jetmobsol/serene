import { describe, expect, it } from "vitest";
import { buildVibeCheckPrompt } from "./prompts.js";

describe("buildVibeCheckPrompt", () => {
  it("returns system and user prompt strings", () => {
    const result = buildVibeCheckPrompt("Happy", ["Work"], "Great day");

    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("system prompt contains all behavioral rules", () => {
    const { system } = buildVibeCheckPrompt("Happy", [], "");

    expect(system).toContain("1-2 sentences");
    expect(system).toContain("non-judgmental");
    expect(system).toContain("[CRISIS_DETECTED]");
    expect(system).toContain("Do not ask questions");
    expect(system).toContain("warm, conversational tone");
  });

  it("system prompt instructs not to flag casual expressions", () => {
    const { system } = buildVibeCheckPrompt("Happy", [], "");

    expect(system).toContain("that killed me");
    expect(system).toContain("I'm dying of laughter");
  });

  it("user prompt includes mood", () => {
    const { user } = buildVibeCheckPrompt("Anxious", ["Work"], "Stressed out");

    expect(user).toContain("Mood: Anxious");
  });

  it("user prompt includes tags as comma-separated list", () => {
    const { user } = buildVibeCheckPrompt("Happy", ["Work", "Fitness"], "");

    expect(user).toContain("Context Tags: Work, Fitness");
  });

  it('user prompt shows "none selected" when no tags', () => {
    const { user } = buildVibeCheckPrompt("Calm", [], "Quiet day");

    expect(user).toContain("Context Tags: none selected");
  });

  it("user prompt includes journal note", () => {
    const { user } = buildVibeCheckPrompt(
      "Sad",
      ["Relationships"],
      "Had a difficult conversation with my partner",
    );

    expect(user).toContain(
      "Journal Note: Had a difficult conversation with my partner",
    );
  });

  it("handles special characters in note", () => {
    const { user } = buildVibeCheckPrompt(
      "Happy",
      [],
      'Note with "quotes" & <brackets>',
    );

    expect(user).toContain('Note with "quotes" & <brackets>');
  });

  it("handles empty note", () => {
    const { user } = buildVibeCheckPrompt("Calm", [], "");

    expect(user).toContain("Journal Note: ");
  });
});

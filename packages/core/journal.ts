// Shared mood and tag constants for the Serene wellness journal.
// Consumed by both API (validation) and frontend (rendering).

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
  Anxious: {
    light: "oklch(0.85 0.15 75)",
    dark: "oklch(0.45 0.15 75)",
  },
  Sad: { light: "oklch(0.85 0.10 260)", dark: "oklch(0.45 0.10 260)" },
  Overwhelmed: {
    light: "oklch(0.85 0.15 30)",
    dark: "oklch(0.45 0.15 30)",
  },
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

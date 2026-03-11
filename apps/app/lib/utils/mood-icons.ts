import type { MoodType } from "@repo/core";
import { MOOD_ICONS } from "@repo/core";
import type { LucideIcon } from "lucide-react";
import { CloudRain, CloudSun, Flame, Smile, Waves, Zap } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Smile,
  CloudSun,
  Zap,
  CloudRain,
  Waves,
  Flame,
};

export function getMoodIcon(mood: MoodType): LucideIcon | undefined {
  return ICON_MAP[MOOD_ICONS[mood]];
}

export const MOOD_EMOJIS: Record<MoodType, string> = {
  Happy: "\u{1F60A}",
  Calm: "\u{1F60C}",
  Anxious: "\u{1F630}",
  Sad: "\u{1F622}",
  Overwhelmed: "\u{1F629}",
  Angry: "\u{1F620}",
};

export function getMoodEmoji(mood: MoodType | null): string {
  return mood ? (MOOD_EMOJIS[mood] ?? "\u{1F60A}") : "\u{1F60A}";
}

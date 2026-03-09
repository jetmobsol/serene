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

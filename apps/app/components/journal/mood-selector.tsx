import { MOODS, MOOD_COLORS, MOOD_ICONS, type MoodType } from "@repo/core";
import type { LucideIcon } from "lucide-react";
import { CloudRain, CloudSun, Flame, Smile, Waves, Zap } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  Smile,
  CloudSun,
  Zap,
  CloudRain,
  Waves,
  Flame,
};

interface MoodSelectorProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefsRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          {
            const nextIndex = (focusedIndex + 1) % MOODS.length;
            setFocusedIndex(nextIndex);
            cardRefsRef.current[nextIndex]?.focus();
          }
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          {
            const nextIndex = (focusedIndex - 1 + MOODS.length) % MOODS.length;
            setFocusedIndex(nextIndex);
            cardRefsRef.current[nextIndex]?.focus();
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onChange(MOODS[focusedIndex]);
          break;
        default:
          break;
      }
    },
    [focusedIndex, onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Select your mood"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
    >
      {MOODS.map((mood, index) => {
        const Icon = ICON_MAP[MOOD_ICONS[mood]];
        const isSelected = value === mood;
        const colors = MOOD_COLORS[mood];

        return (
          <div
            key={mood}
            ref={(el) => {
              cardRefsRef.current[index] = el;
            }}
            role="radio"
            aria-checked={isSelected}
            aria-label={mood}
            tabIndex={index === focusedIndex ? 0 : -1}
            onClick={() => {
              onChange(mood);
              setFocusedIndex(index);
            }}
            onFocus={() => setFocusedIndex(index)}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 cursor-pointer transition-all duration-150 select-none ${
              isSelected
                ? "ring-2 ring-primary shadow-lg scale-[1.02] border-2 border-primary"
                : "border border-border hover:shadow-md"
            }`}
            style={{ backgroundColor: colors.light }}
          >
            {Icon && <Icon className="h-12 w-12 text-foreground/80" />}
            <span className="text-sm font-medium text-foreground/90">
              {mood}
            </span>
          </div>
        );
      })}
    </div>
  );
}

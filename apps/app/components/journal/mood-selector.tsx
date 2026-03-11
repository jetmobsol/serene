import { getMoodIcon } from "@/lib/utils/mood-icons";
import { MOODS, MOOD_COLORS, type MoodType } from "@repo/core";
import { useCallback, useRef, useState } from "react";

interface MoodSelectorProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  // Ref mirrors state so handleKeyDown always reads the current index without
  // depending on focusedIndex in its closure (avoids stale-closure bugs when
  // onClick and keydown events race before a re-render).
  const focusedIndexRef = useRef(0);
  const cardRefsRef = useRef<(HTMLDivElement | null)[]>([]);

  const moveFocus = useCallback((index: number) => {
    focusedIndexRef.current = index;
    setFocusedIndex(index);
    cardRefsRef.current[index]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          moveFocus((focusedIndexRef.current + 1) % MOODS.length);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          moveFocus(
            (focusedIndexRef.current - 1 + MOODS.length) % MOODS.length,
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onChange(MOODS[focusedIndexRef.current]);
          break;
        default:
          break;
      }
    },
    [moveFocus, onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Select your mood"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
    >
      {MOODS.map((mood, index) => {
        const Icon = getMoodIcon(mood);
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
              focusedIndexRef.current = index;
              setFocusedIndex(index);
            }}
            onFocus={() => {
              focusedIndexRef.current = index;
              setFocusedIndex(index);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-[14px] p-5 cursor-pointer transition-all duration-150 select-none border-2 ${
              isSelected
                ? "border-primary bg-secondary"
                : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            }`}
            style={{
              backgroundColor: isSelected ? undefined : colors.light,
            }}
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

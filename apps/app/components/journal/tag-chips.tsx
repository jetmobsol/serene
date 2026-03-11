import { TAGS, TAG_ICONS, type TagType } from "@repo/core";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Dumbbell,
  Heart,
  Moon,
  Palette,
  Stethoscope,
  TreePine,
  Users,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Moon,
  Heart,
  Dumbbell,
  Palette,
  Stethoscope,
  Users,
  TreePine,
};

interface TagChipsProps {
  value: TagType[];
  onChange: (tags: TagType[]) => void;
}

export function TagChips({ value, onChange }: TagChipsProps) {
  function handleToggle(tag: TagType) {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  }

  return (
    <div
      role="group"
      aria-label="Select tags"
      className="flex flex-wrap gap-2.5"
    >
      {TAGS.map((tag) => {
        const Icon = ICON_MAP[TAG_ICONS[tag]];
        const isSelected = value.includes(tag);

        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isSelected}
            onClick={() => handleToggle(tag)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all border ${
              isSelected
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border bg-card text-muted-foreground/70 hover:border-primary/20 hover:text-foreground"
            }`}
          >
            {Icon && (
              <Icon
                className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`}
              />
            )}
            {tag}
          </button>
        );
      })}
    </div>
  );
}

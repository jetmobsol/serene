import { TAGS, TAG_ICONS, type TagType } from "@repo/core";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Check,
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
    <div role="group" aria-label="Select tags" className="flex flex-wrap gap-2">
      {TAGS.map((tag) => {
        const Icon = ICON_MAP[TAG_ICONS[tag]];
        const isSelected = value.includes(tag);

        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isSelected}
            onClick={() => handleToggle(tag)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {Icon && <Icon className="h-4 w-4" />}
            {tag}
          </button>
        );
      })}
    </div>
  );
}

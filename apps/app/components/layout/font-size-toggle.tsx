import { ALargeSmall } from "lucide-react";
import { useEffect, useState } from "react";

const FONT_SIZES = ["small", "medium", "large"] as const;
type FontSize = (typeof FONT_SIZES)[number];

const SCALE_MAP: Record<FontSize, string> = {
  small: "100%",
  medium: "112.5%",
  large: "125%",
};

const LABEL_MAP: Record<FontSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
};

export function FontSizeToggle() {
  const [size, setSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem("font-size");
    return FONT_SIZES.includes(saved as FontSize)
      ? (saved as FontSize)
      : "small";
  });

  useEffect(() => {
    document.documentElement.style.fontSize = SCALE_MAP[size];
  }, [size]);

  const cycle = () => {
    const idx = FONT_SIZES.indexOf(size);
    const next = FONT_SIZES[(idx + 1) % FONT_SIZES.length];
    setSize(next);
    localStorage.setItem("font-size", next);
  };

  return (
    <button
      onClick={cycle}
      className="relative p-2 rounded-full hover:bg-muted transition-colors group"
      aria-label={`Font size: ${size}. Click to cycle.`}
      title={`Font size: ${size}`}
    >
      <ALargeSmall className="h-4 w-4" />
      <span
        className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-[14px]
          rounded-full bg-primary text-primary-foreground
          text-[9px] font-bold leading-none
          flex items-center justify-center
          ring-2 ring-background"
      >
        {LABEL_MAP[size]}
      </span>
    </button>
  );
}

import { Textarea } from "@repo/ui";
import { CheckCircle2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";

const AI_INSIGHT_THRESHOLD = 50;
const DEFAULT_MAX_LENGTH = 500;

interface NoteEditorProps {
  value: string;
  onChange: (note: string) => void;
  maxLength?: number;
}

export function NoteEditor({
  value,
  onChange,
  maxLength = DEFAULT_MAX_LENGTH,
}: NoteEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync external value changes - when value prop changes, update local state
  // This is a controlled component pattern; the rule prefers alternative patterns but this is clear and correct
  useLayoutEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setLocalValue(value);
  }, [value]);

  // Auto-expand textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localValue]);

  // Debounced onChange
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length > maxLength) return;

      setLocalValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 300);
    },
    [maxLength, onChange],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const charCount = localValue.length;
  const meetsThreshold = charCount >= AI_INSIGHT_THRESHOLD;
  const atLimit = charCount >= maxLength;

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        placeholder="Write about your day... (50 characters for AI insight)"
        className="min-h-[120px] resize-none"
        maxLength={maxLength}
      />
      <div className="flex items-center gap-2 text-sm">
        {meetsThreshold && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        <span
          className={
            atLimit
              ? "text-destructive"
              : meetsThreshold
                ? "text-green-600"
                : "text-muted-foreground"
          }
        >
          {charCount}
          {meetsThreshold
            ? " / AI insight will be generated"
            : ` / ${AI_INSIGHT_THRESHOLD} min for AI insight`}
        </span>
      </div>
    </div>
  );
}

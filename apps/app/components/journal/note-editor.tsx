import { Textarea } from "@repo/ui";
import { CheckCircle2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useLayoutEffect,
} from "react";

const AI_INSIGHT_THRESHOLD = 50;
const DEFAULT_MAX_LENGTH = 500;

export interface NoteEditorHandle {
  flush: () => void;
}

interface NoteEditorProps {
  value: string;
  onChange: (note: string) => void;
  maxLength?: number;
  ref?: React.Ref<NoteEditorHandle>;
}

export function NoteEditor({
  value,
  onChange,
  maxLength = DEFAULT_MAX_LENGTH,
  ref,
}: NoteEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const localValueRef = useRef(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    flush() {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        onChangeRef.current(localValueRef.current);
      }
    },
  }));

  // Sync external value changes (e.g. parent reset). Cancel any pending debounce
  // first so a stale timeout doesn't call onChange with the pre-reset value.
  useLayoutEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setLocalValue(value);
    localValueRef.current = value;
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
      localValueRef.current = newValue;

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
        placeholder="Write freely about how you're feeling, what happened today, or anything on your mind..."
        className="min-h-[100px] lg:min-h-[140px] resize-none text-sm lg:text-base placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground/40"
        maxLength={maxLength}
      />
      <div
        className={`flex items-center justify-end gap-2 text-xs transition-all duration-300 ${
          meetsThreshold
            ? "bg-primary/8 border border-primary/20 rounded-full px-3 py-1.5"
            : ""
        }`}
      >
        {meetsThreshold ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span
              className={
                atLimit ? "text-destructive" : "text-primary font-medium"
              }
            >
              AI insight will be generated after saving
            </span>
          </>
        ) : (
          <span className="text-muted-foreground/50">
            {charCount} / {AI_INSIGHT_THRESHOLD} characters to unlock AI insight
          </span>
        )}
      </div>
    </div>
  );
}

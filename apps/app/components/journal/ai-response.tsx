import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { truncate } from "@/lib/utils/text";
import { SafetyBanner } from "./safety-banner";

interface AiResponseProps {
  response: string | null;
  hasCrisisContent: boolean;
  isStreaming?: boolean;
  streamedText?: string;
  variant?: "compact" | "full";
}

export function AiResponse({
  response,
  hasCrisisContent,
  isStreaming = false,
  streamedText = "",
  variant = "compact",
}: AiResponseProps) {
  const displayText = isStreaming ? streamedText : (response ?? streamedText);

  if (!isStreaming && !displayText) {
    return null;
  }

  const isLoading = isStreaming && displayText === "";
  const text = variant === "compact" ? truncate(displayText, 100) : displayText;

  return (
    <div className="space-y-2">
      {hasCrisisContent && <SafetyBanner />}
      <div
        className={cn(
          "flex items-start bg-muted/50 w-full",
          variant === "compact"
            ? "gap-2 rounded-md p-2"
            : "gap-3 rounded-lg p-4",
        )}
      >
        <Sparkles
          className={cn(
            "text-muted-foreground mt-0.5 shrink-0",
            variant === "compact" ? "h-4 w-4" : "h-5 w-5",
          )}
        />
        <div className={variant === "full" ? "flex-1" : undefined}>
          {variant === "full" && (
            <p className="text-sm font-medium mb-1">AI Insight</p>
          )}
          {isLoading ? (
            <div
              className="flex items-center gap-1"
              aria-label="Generating AI response"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
            </div>
          ) : (
            <p
              className={cn(
                "text-muted-foreground italic",
                variant === "compact" ? "text-xs" : "text-sm",
              )}
              aria-live="polite"
            >
              {text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

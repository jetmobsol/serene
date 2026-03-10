import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
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
  const text = displayText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-2 w-full"
    >
      <AnimatePresence>
        {hasCrisisContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SafetyBanner />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative overflow-hidden w-full",
          variant === "compact" ? "rounded-md" : "rounded-lg",
        )}
      >
        {/* Animated gradient background */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            isStreaming ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-accent/6 to-primary/8 animate-shimmer" />
        </div>

        {/* Static background */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            isStreaming ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-muted/40" />
        </div>

        {/* Content */}
        <div
          className={cn(
            "relative flex items-start border border-primary/10",
            variant === "compact" ? "gap-2.5 p-2.5" : "gap-3 p-4",
          )}
        >
          {/* Sparkle icon with glow */}
          <div
            className={cn(
              "shrink-0 mt-0.5 rounded-full flex items-center justify-center transition-all duration-500",
              variant === "compact" ? "h-6 w-6" : "h-8 w-8",
              isStreaming
                ? "bg-primary/20 text-primary shadow-[0_0_12px_rgba(var(--primary-rgb,68,120,90),0.3)]"
                : "bg-primary/10 text-primary/70",
            )}
          >
            <motion.div
              animate={isStreaming ? { rotate: [0, 15, -15, 0] } : {}}
              transition={
                isStreaming
                  ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  : {}
              }
            >
              <Sparkles
                className={cn(
                  variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4",
                )}
              />
            </motion.div>
          </div>

          <div className={cn("min-w-0", variant === "full" ? "flex-1" : "")}>
            {variant === "full" && (
              <p className="text-sm font-medium mb-1.5 text-primary/80">
                AI Insight
              </p>
            )}

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 py-0.5"
                >
                  <span className="text-xs text-muted-foreground/80">
                    Reflecting on your entry
                  </span>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1 w-1 rounded-full bg-primary/50"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p
                    className={cn(
                      "text-muted-foreground leading-relaxed",
                      variant === "compact" ? "text-xs" : "text-sm",
                    )}
                    aria-live="polite"
                  >
                    {text}
                    {isStreaming && (
                      <motion.span
                        className="inline-block w-0.5 h-3.5 bg-primary/60 ml-0.5 align-text-bottom"
                        animate={{ opacity: [1, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

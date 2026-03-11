import { AiResponse } from "@/components/journal/ai-response";
import { MoodSelector } from "@/components/journal/mood-selector";
import {
  NoteEditor,
  type NoteEditorHandle,
} from "@/components/journal/note-editor";
import { TagChips } from "@/components/journal/tag-chips";
import {
  useCreateJournalMutation,
  journalQueryKeys,
} from "@/lib/queries/journal";
import { useSseStream } from "@/lib/hooks/use-sse-stream";
import { useQueryClient } from "@tanstack/react-query";
import type { MoodType, TagType } from "@repo/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Save } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { atom, useAtom } from "jotai";

export const newEntryDialogOpenAtom = atom(false);

const AI_THRESHOLD = 50;

type DialogPhase = "form" | "saving" | "streaming" | "done";

export function NewEntryDialog() {
  const [open, setOpen] = useAtom(newEntryDialogOpenAtom);
  const queryClient = useQueryClient();
  const noteEditorRef = useRef<NoteEditorHandle>(null);

  const [mood, setMood] = useState<MoodType | null>(null);
  const [tags, setTags] = useState<TagType[]>([]);
  const [note, setNote] = useState("");
  const [streamEntryId, setStreamEntryId] = useState<string | null>(null);
  const [phase, setPhase] = useState<DialogPhase>("form");

  const createMutation = useCreateJournalMutation();
  const streamState = useSseStream(streamEntryId);

  const isStreaming = streamState.isStreaming;
  const isStreamComplete = streamState.isComplete;
  const hasAiResponse = streamState.streamedText.length > 0;

  // Derive actual phase from stream state
  const currentPhase =
    phase === "streaming" && isStreamComplete
      ? "done"
      : phase === "streaming" && isStreaming
        ? "streaming"
        : phase;

  const formDisabled = currentPhase !== "form";
  const canSave = mood !== null && !createMutation.isPending;

  const resetForm = useCallback(() => {
    setMood(null);
    setTags([]);
    setNote("");
    setStreamEntryId(null);
    setPhase("form");
  }, []);

  function handleSave() {
    if (!mood) return;
    noteEditorRef.current?.flush();

    setPhase("saving");
    createMutation.mutate(
      { mood, tags, note },
      {
        onSuccess: (data) => {
          if (note.length >= AI_THRESHOLD && data?.id) {
            setStreamEntryId(data.id);
            setPhase("streaming");
          } else {
            // No AI — close dialog and refresh timeline
            queryClient.invalidateQueries({
              queryKey: journalQueryKeys.lists(),
            });
            resetForm();
            setOpen(false);
          }
        },
        onError: () => {
          setPhase("form");
        },
      },
    );
  }

  function handleDismiss() {
    // Invalidate queries so timeline picks up the new entry + AI response
    queryClient.invalidateQueries({
      queryKey: journalQueryKeys.lists(),
    });
    if (streamEntryId) {
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(streamEntryId),
      });
    }
    resetForm();
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (
      !nextOpen &&
      (currentPhase === "streaming" || currentPhase === "saving")
    ) {
      // Don't allow closing while AI is working
      return;
    }
    if (!nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0"
        onPointerDownOutside={(e) => {
          if (currentPhase === "streaming" || currentPhase === "saving") {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (currentPhase === "streaming" || currentPhase === "saving") {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 lg:px-8 pt-6 lg:pt-8 pb-0">
          <DialogTitle
            className="text-2xl lg:text-3xl text-foreground"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400,
            }}
          >
            {currentPhase === "form" || currentPhase === "saving"
              ? "New Entry"
              : "Your Insight"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {currentPhase === "form" || currentPhase === "saving"
              ? "Take a moment to check in with yourself"
              : currentPhase === "streaming"
                ? "Reflecting on your entry..."
                : "Here's what we noticed"}
          </p>
        </DialogHeader>

        <div className="px-6 lg:px-8 py-6 lg:py-8">
          <AnimatePresence mode="wait">
            {/* ─── FORM PHASE ─── */}
            {(currentPhase === "form" || currentPhase === "saving") && (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 lg:space-y-6"
              >
                <div
                  className={
                    formDisabled ? "pointer-events-none opacity-50" : ""
                  }
                >
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3">
                      How are you feeling?
                    </p>
                    <MoodSelector value={mood} onChange={setMood} />
                  </div>

                  <div className="mt-5 lg:mt-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3">
                      What&apos;s on your mind?
                    </p>
                    <TagChips value={tags} onChange={setTags} />
                  </div>

                  <div className="mt-5 lg:mt-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3">
                      Your Reflection
                    </p>
                    <NoteEditor
                      ref={noteEditorRef}
                      value={note}
                      onChange={setNote}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={!canSave || formDisabled}
                  >
                    {currentPhase === "saving" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Entry
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    disabled={formDisabled}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── AI STREAMING / DONE PHASE ─── */}
            {(currentPhase === "streaming" || currentPhase === "done") && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-6"
              >
                {/* Brief recap of what was saved */}
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 border border-border/40">
                  <div className="text-lg">{getMoodEmoji(mood)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {mood}
                    </p>
                    {note && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {note.length > 80 ? `${note.slice(0, 80)}...` : note}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* AI Response */}
                <AiResponse
                  response={null}
                  hasCrisisContent={streamState.hasCrisisContent}
                  isStreaming={isStreaming}
                  streamedText={streamState.streamedText}
                  variant="full"
                />

                {/* Dismiss button — only when streaming is complete */}
                <AnimatePresence>
                  {currentPhase === "done" && hasAiResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      className="flex justify-center pt-2"
                    >
                      <Button
                        onClick={handleDismiss}
                        variant="outline"
                        className="px-8"
                      >
                        Got it, thank you
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMoodEmoji(mood: MoodType | null): string {
  const map: Record<string, string> = {
    Happy: "\u{1F60A}",
    Calm: "\u{1F60C}",
    Anxious: "\u{1F630}",
    Sad: "\u{1F622}",
    Overwhelmed: "\u{1F629}",
    Angry: "\u{1F620}",
  };
  return mood ? (map[mood] ?? "\u{1F60A}") : "\u{1F60A}";
}

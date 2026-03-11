import { AiResponse } from "@/components/journal/ai-response";
import { DeleteEntryDialog } from "@/components/journal/delete-entry-dialog";
import { EntryForm } from "@/components/journal/entry-form";
import {
  useDeleteJournalMutation,
  useJournalByIdQuery,
  journalQueryKeys,
} from "@/lib/queries/journal";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { MOOD_COLORS, type MoodType, type TagType } from "@repo/core";
import { Button, Skeleton } from "@repo/ui";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSseStream } from "@/lib/hooks/use-sse-stream";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

type EntrySearchParams = {
  edit?: boolean;
};

export const Route = createFileRoute("/(app)/journal/$entryId")({
  component: EntryDetail,
  validateSearch: (search: Record<string, unknown>): EntrySearchParams => ({
    edit: search.edit === true || search.edit === "true",
  }),
});

function EntryDetail() {
  const { entryId } = Route.useParams();
  const { data: entry, isLoading } = useJournalByIdQuery(entryId);
  const navigate = useNavigate();
  const deleteMutation = useDeleteJournalMutation();

  const { edit } = Route.useSearch();
  const [isEditing, setIsEditing] = useState(edit ?? false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const streamState = useSseStream(streamingId);
  const isStreaming = streamState.isStreaming;
  const queryClient = useQueryClient();

  // When AI stream completes, refetch entry to get the persisted AI response
  useEffect(() => {
    if (streamState.isComplete && streamingId) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setStreamingId(null);
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(streamingId),
      });
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.lists(),
      });
    }
  }, [streamState.isComplete, streamingId, queryClient]);

  const handleSaveWithAi = useCallback((id: string) => {
    setStreamingId(id);
  }, []);

  function handleDelete() {
    deleteMutation.mutate(entryId, {
      onSuccess: () => {
        navigate({ to: "/journal" });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="text-2xl text-foreground/70">Entry not found</h2>
        <p className="text-sm text-muted-foreground">
          This entry may have been deleted.
        </p>
        <Link
          to="/journal"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Journal
        </Link>
      </div>
    );
  }

  const mood = entry.mood as MoodType;
  const MoodIcon = getMoodIcon(mood);
  const moodColor = MOOD_COLORS[mood]?.light;

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 space-y-6">
        <button
          onClick={() => setIsEditing(false)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel editing
        </button>
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-8">
          <EntryForm
            entryId={entryId}
            defaultValues={{
              mood,
              tags: entry.tags as TagType[],
              note: entry.note ?? "",
            }}
            onSuccess={() => setIsEditing(false)}
            onSaveWithAi={handleSaveWithAi}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 space-y-6">
      {/* Back link */}
      <Link
        to="/journal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Journal
      </Link>

      {/* Entry card */}
      <div
        className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
        style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-7 pb-5">
          <div className="flex items-center gap-3">
            {MoodIcon && (
              <MoodIcon className="h-5 w-5 text-muted-foreground/60 shrink-0" />
            )}
            <div>
              <h1 className="text-2xl text-foreground leading-none">{mood}</h1>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {formatRelativeTime(new Date(entry.createdAt))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-muted-foreground/60 hover:text-destructive h-8 px-3 text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-8 pb-5">
            {entry.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full bg-background border border-border/60 text-xs text-muted-foreground/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Note */}
        {entry.note && (
          <div className="px-8 pb-6">
            <div className="h-px bg-border/40 mb-5" />
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {entry.note}
            </p>
          </div>
        )}

        {/* AI Response */}
        <AnimatePresence>
          {(entry.aiResponse || isStreaming) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="px-6 pb-6">
                <AiResponse
                  response={entry.aiResponse?.response ?? null}
                  hasCrisisContent={
                    entry.aiResponse?.hasCrisisContent ??
                    streamState.hasCrisisContent
                  }
                  isStreaming={isStreaming}
                  streamedText={streamState.streamedText}
                  variant="full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DeleteEntryDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

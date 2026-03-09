import { DeleteEntryDialog } from "@/components/journal/delete-entry-dialog";
import { EntryCard } from "@/components/journal/entry-card";
import type { JournalEntryWithAi } from "@/components/journal/entry-card";
import {
  useDeleteJournalMutation,
  useJournalListQuery,
  journalQueryKeys,
} from "@/lib/queries/journal";
import { groupEntriesByDate } from "@/lib/utils/date-groups";
import { Button, Skeleton } from "@repo/ui";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { streamingEntryIdAtom, useSseStream } from "@/lib/hooks/use-sse-stream";
import { useQueryClient } from "@tanstack/react-query";
import { BookHeart, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function Timeline() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournalListQuery();
  const navigate = useNavigate();
  const deleteMutation = useDeleteJournalMutation();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [streamingEntryId, setStreamingEntryId] = useAtom(streamingEntryIdAtom);
  const streamState = useSseStream(streamingEntryId);
  const queryClient = useQueryClient();

  const entries: JournalEntryWithAi[] = useMemo(
    () =>
      (data?.pages.flatMap((p) => p.entries) ?? []).map((e) => ({
        ...e,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      })),
    [data],
  );

  const groups = useMemo(() => groupEntriesByDate(entries), [entries]);

  useEffect(() => {
    if (streamState.isComplete && streamingEntryId) {
      setStreamingEntryId(null);
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(streamingEntryId),
      });
    }
  }, [
    streamState.isComplete,
    streamingEntryId,
    setStreamingEntryId,
    queryClient,
  ]);

  function handleEdit(id: string) {
    navigate({ to: "/journal/$entryId", params: { entryId: id } });
  }

  function handleDelete(id: string) {
    setDeleteTarget(id);
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget, {
        onSettled: () => setDeleteTarget(null),
      });
    }
  }

  const isEntryStreaming = (entryId: string) =>
    entryId === streamingEntryId && streamState.isStreaming;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
          <Skeleton key={id} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookHeart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No entries yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Start your wellness journey by recording how you feel today. Your
          entries will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isStreaming={isEntryStreaming(entry.id)}
                  streamedText={
                    entry.id === streamingEntryId
                      ? streamState.streamedText
                      : undefined
                  }
                  streamHasCrisisContent={
                    entry.id === streamingEntryId
                      ? streamState.hasCrisisContent
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>

      <DeleteEntryDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

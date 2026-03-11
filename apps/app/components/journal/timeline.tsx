import { DeleteEntryDialog } from "@/components/journal/delete-entry-dialog";
import { EntryCard } from "@/components/journal/entry-card";
import type { JournalEntryWithAi } from "@/components/journal/entry-card";
import { newEntryDialogOpenAtom } from "@/components/journal/new-entry-dialog";
import {
  useDeleteJournalMutation,
  useJournalListQuery,
} from "@/lib/queries/journal";
import { groupEntriesByDate } from "@/lib/utils/date-groups";
import { Button, Skeleton } from "@repo/ui";
import { useNavigate } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { BookHeart, Feather, Loader2, Sparkles, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function Timeline() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournalListQuery();
  const navigate = useNavigate();
  const deleteMutation = useDeleteJournalMutation();
  const setNewEntryOpen = useSetAtom(newEntryDialogOpenAtom);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Auto-open new entry dialog for first-time users (once per mount)
  const hasAutoOpenedRef = useRef(false);

  const entries: JournalEntryWithAi[] = useMemo(
    () =>
      (data?.pages.flatMap((p) => p.entries) ?? []).map((e) => ({
        ...e,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      })),
    [data],
  );

  useEffect(() => {
    if (!isLoading && entries.length === 0 && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      // Small delay so the page renders first, then the dialog appears
      const timer = setTimeout(() => setNewEntryOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, entries.length, setNewEntryOpen]);

  const groups = useMemo(() => groupEntriesByDate(entries), [entries]);

  function handleEdit(id: string) {
    navigate({
      to: "/journal/$entryId",
      params: { entryId: id },
      search: { edit: true },
    });
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
    return <EmptyState onNewEntry={() => setNewEntryOpen(true)} />;
  }

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3">
              {group.label}
            </p>
            <div className="space-y-3">
              {group.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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

function EmptyState({ onNewEntry }: { onNewEntry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-700">
      {/* Decorative icon cluster */}
      <div className="relative mb-8">
        <div className="absolute -top-1 -left-6 text-primary/20 animate-in fade-in slide-in-from-left-2 duration-700 delay-200">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="absolute -bottom-2 -right-5 text-accent-foreground/20 animate-in fade-in slide-in-from-right-2 duration-700 delay-300">
          <Sun className="h-3.5 w-3.5" />
        </div>
        <div className="rounded-2xl bg-secondary/50 p-5 border border-border/30">
          <BookHeart className="h-8 w-8 text-primary/60" />
        </div>
      </div>

      <h3 className="text-2xl text-foreground/80">Your journal awaits</h3>
      <p className="text-sm text-muted-foreground/60 mt-2 max-w-sm leading-relaxed">
        This is your private space to reflect, understand your emotions, and
        track your well-being over time.
      </p>

      {/* CTA button */}
      <button
        onClick={onNewEntry}
        className="group mt-8 relative inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
      >
        <Feather className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
        Write your first entry
      </button>

      <p className="text-xs text-muted-foreground/40 mt-4">
        Press{" "}
        <kbd className="inline-flex items-center rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground/60">
          N
        </kbd>{" "}
        anytime to start a new entry
      </p>
    </div>
  );
}

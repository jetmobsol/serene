import { trpcClient } from "@/lib/trpc";
import type { MoodType, TagType } from "@repo/core";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const journalQueryKeys = {
  all: ["journal"] as const,
  lists: () => [...journalQueryKeys.all, "list"] as const,
  detail: (id: string) => [...journalQueryKeys.all, "detail", id] as const,
};

export function useJournalListQuery() {
  return useInfiniteQuery({
    queryKey: journalQueryKeys.lists(),
    queryFn: ({ pageParam }) =>
      trpcClient.journal.list.query({ cursor: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useJournalByIdQuery(id: string) {
  return useQuery({
    queryKey: journalQueryKeys.detail(id),
    queryFn: () => trpcClient.journal.getById.query({ id }),
  });
}

export function useCreateJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { mood: MoodType; tags: TagType[]; note: string }) =>
      trpcClient.journal.create.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      toast.success("Entry saved");
    },
    onError: (error) => {
      toast.error("Failed to save entry", {
        description: error.message,
      });
    },
  });
}

export function useUpdateJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      mood?: MoodType;
      tags?: TagType[];
      note?: string;
    }) => trpcClient.journal.update.mutate(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(variables.id),
      });
      toast.success("Entry updated");
    },
    onError: (error) => {
      toast.error("Failed to update entry", {
        description: error.message,
      });
    },
  });
}

export function useDeleteJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trpcClient.journal.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      toast.success("Entry deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete entry", {
        description: error.message,
      });
    },
  });
}

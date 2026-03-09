import { trpcClient } from "@/lib/trpc";
import type { MoodType, TagType } from "@repo/core";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

type JournalListPage = Awaited<
  ReturnType<typeof trpcClient.journal.list.query>
>;

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
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: journalQueryKeys.detail(id),
    queryFn: () => trpcClient.journal.getById.query({ id }),
    placeholderData: () => {
      const listData = queryClient.getQueryData<InfiniteData<JournalListPage>>(
        journalQueryKeys.lists(),
      );
      return listData?.pages.flatMap((p) => p.entries).find((e) => e.id === id);
    },
  });
}

export function useCreateJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { mood: MoodType; tags: TagType[]; note: string }) =>
      trpcClient.journal.create.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      toast.success("Entry saved", {
        description: "Your journal entry has been recorded.",
      });
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: journalQueryKeys.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: journalQueryKeys.detail(variables.id),
      });

      const previousLists = queryClient.getQueryData<
        InfiniteData<JournalListPage>
      >(journalQueryKeys.lists());

      const previousDetail = queryClient.getQueryData(
        journalQueryKeys.detail(variables.id),
      );

      queryClient.setQueryData<InfiniteData<JournalListPage>>(
        journalQueryKeys.lists(),
        (old): InfiniteData<JournalListPage> | undefined => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              entries: page.entries.map((entry) =>
                entry.id === variables.id
                  ? {
                      ...entry,
                      ...(variables.mood && { mood: variables.mood }),
                      ...(variables.tags && { tags: variables.tags }),
                      ...(variables.note !== undefined && {
                        note: variables.note,
                      }),
                      updatedAt: new Date().toISOString(),
                    }
                  : entry,
              ),
            })),
          };
        },
      );

      queryClient.setQueryData<JournalListPage["entries"][number] | undefined>(
        journalQueryKeys.detail(variables.id),
        (old): JournalListPage["entries"][number] | undefined => {
          if (!old) return old;
          return {
            ...old,
            ...(variables.mood && { mood: variables.mood }),
            ...(variables.tags && { tags: variables.tags }),
            ...(variables.note !== undefined && { note: variables.note }),
            updatedAt: new Date().toISOString(),
          };
        },
      );

      return { previousLists, previousDetail };
    },
    onSuccess: () => {
      toast.success("Entry updated");
    },
    onError: (error, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(
          journalQueryKeys.lists(),
          context.previousLists,
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          journalQueryKeys.detail(variables.id),
          context.previousDetail,
        );
      }
      toast.error("Failed to update entry", {
        description: error.message,
      });
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trpcClient.journal.delete.mutate({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: journalQueryKeys.lists(),
      });

      const previousLists = queryClient.getQueryData<
        InfiniteData<JournalListPage>
      >(journalQueryKeys.lists());

      queryClient.setQueryData<InfiniteData<JournalListPage>>(
        journalQueryKeys.lists(),
        (old): InfiniteData<JournalListPage> | undefined => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              entries: page.entries.filter((entry) => entry.id !== id),
            })),
          };
        },
      );

      queryClient.removeQueries({
        queryKey: journalQueryKeys.detail(id),
      });

      return { previousLists };
    },
    onSuccess: () => {
      toast.success("Entry deleted");
    },
    onError: (error, id, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(
          journalQueryKeys.lists(),
          context.previousLists,
        );
      }
      toast.error("Failed to delete entry", {
        description: error.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.lists(),
      });
    },
  });
}

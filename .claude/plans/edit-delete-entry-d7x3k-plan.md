# Deliverable #7: Edit + Delete Entry — Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

The core edit/delete functionality (API procedures, mutation hooks, UI components, routing) is already implemented from Deliverable #6. This deliverable completes the feature by adding optimistic updates with rollback to the update and delete mutations, adding comprehensive TDD tests for edit/delete flows, and creating the Bowser QA YAML. The `updatedAt` auto-update is already handled by Drizzle's `$onUpdate` and the AI response cascade delete is handled by PostgreSQL `ON DELETE CASCADE`.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `apps/app/lib/queries/journal.ts`
- `apps/app/components/journal/entry-form.test.tsx`

### Files to Create

- `apps/app/components/journal/delete-entry-dialog.test.tsx`
- `apps/app/components/journal/entry-card.test.tsx`
- `ai_review/user_stories/entry-crud.yaml`

---

## Code Context

### Existing Implementation (fully working, needs optimistic updates only)

**API Layer** (`apps/api/routers/journal.ts`):

- `journal.update` (line 120-154): Takes `{ id, mood?, tags?, note? }`, enforces ownership via `findFirst` with userId filter, returns updated entry. Drizzle `$onUpdate` on `updatedAt` column (`db/schema/journal.ts:26`) auto-sets new timestamp.
- `journal.delete` (line 156-181): Takes `{ id }`, enforces ownership, hard deletes. `aiResponse` table has `onDelete: "cascade"` on `entryId` FK (`db/schema/ai-response.ts:15`), so AI responses are auto-deleted.

**Mutation Hooks** (`apps/app/lib/queries/journal.ts`):

- `useUpdateJournalMutation()` (line 67-90): Currently uses `invalidateQueries` on success, no optimistic updates. Shows success/error toasts.
- `useDeleteJournalMutation()` (line 92-107): Currently uses `invalidateQueries` on success, no optimistic updates. Shows success/error toasts.
- `journalQueryKeys` (line 16-20): `all`, `lists()`, `detail(id)` — used for cache management.
- `JournalListPage` type (line 12-14): `Awaited<ReturnType<typeof trpcClient.journal.list.query>>` — the shape of each infinite query page.

**EntryForm** (`apps/app/components/journal/entry-form.tsx`):

- Props: `{ defaultValues?: { mood, tags, note }, entryId?: string, onSuccess?: () => void }` (line 16-24).
- Edit mode: when `entryId` is provided, uses `updateMutation.mutate({ id: entryId, mood, tags, note })` (line 51-59).
- Button text switches to "Update Entry" in edit mode (line 101).

**EntryCard** (`apps/app/components/journal/entry-card.tsx`):

- `JournalEntryWithAi` interface (line 19-31): `{ id, mood, tags, note, createdAt, updatedAt, aiResponse }`.
- DropdownMenu with Edit/Delete actions (line 98-133), calls `onEdit(id)` and `onDelete(id)`.

**DeleteEntryDialog** (`apps/app/components/journal/delete-entry-dialog.tsx`):

- Props: `{ open, onOpenChange, onConfirm, isPending }` (line 13-18).
- AlertDialog with "Delete entry?" title, cancel/confirm buttons, loading state.

**Timeline** (`apps/app/components/journal/timeline.tsx`):

- Edit handler navigates to `/journal/$entryId` (line 35).
- Delete handler opens dialog, `confirmDelete` calls `deleteMutation.mutate(deleteTarget)` (line 42-48).

**Detail Route** (`apps/app/routes/(app)/journal/$entryId.tsx`):

- Edit mode toggle with `isEditing` state (line 34).
- Renders `EntryForm` with `entryId` and `defaultValues` from fetched entry (line 81-89).
- Delete navigates back to `/journal` on success (line 38-43).

### Test Infrastructure

- Vitest + Happy DOM (`apps/app/vitest.config.ts`).
- Setup: `@testing-library/jest-dom/vitest` (`apps/app/vitest.setup.ts`).
- Existing mock pattern in `entry-form.test.tsx`: mock `@/lib/queries/journal` module, use `QueryClientProvider` wrapper.

### Database Schema

- `journalEntry.updatedAt` has `$onUpdate(() => new Date())` (`db/schema/journal.ts:26`) — Drizzle auto-updates on any `.update().set()` call. `createdAt` has only `defaultNow()` — never modified after insert.
- `aiResponse.entryId` has `onDelete: "cascade"` (`db/schema/ai-response.ts:15`) — PostgreSQL deletes AI response when journal entry is deleted.

---

## External Context

### TanStack Query Optimistic Updates

The pattern for optimistic updates with TanStack Query v5:

```typescript
useMutation({
  mutationFn: ...,
  onMutate: async (variables) => {
    // 1. Cancel outgoing refetches to avoid overwriting optimistic update
    await queryClient.cancelQueries({ queryKey });
    // 2. Snapshot previous value for rollback
    const previous = queryClient.getQueryData(queryKey);
    // 3. Optimistically update cache
    queryClient.setQueryData(queryKey, (old) => /* modify old */);
    // 4. Return snapshot for onError rollback
    return { previous };
  },
  onError: (_err, _variables, context) => {
    // Rollback to snapshot
    queryClient.setQueryData(queryKey, context?.previous);
    toast.error("...");
  },
  onSettled: () => {
    // Always refetch to ensure server state
    queryClient.invalidateQueries({ queryKey });
  },
});
```

For infinite queries, `setQueryData` receives `InfiniteData<Page>` and must return the same shape with modified `pages` array.

---

## Architectural Narrative

### Task

Add optimistic updates with rollback to the update and delete journal mutations. Write comprehensive TDD tests for edit and delete flows. Create Bowser QA YAML for end-to-end validation.

### Architecture

The journal feature follows a standard TanStack Query pattern: tRPC procedures on the API, mutation hooks in `apps/app/lib/queries/journal.ts`, UI components in `apps/app/components/journal/`, and file-based routes in `apps/app/routes/(app)/journal/`. The list query uses `useInfiniteQuery` with cursor-based pagination, returning `InfiniteData<{ entries: JournalEntryWithAi[], nextCursor: string | null }>`.

### Selected Context

- `apps/app/lib/queries/journal.ts` — The ONLY file needing functional changes (add optimistic update logic to existing mutation hooks).
- `apps/app/components/journal/entry-form.test.tsx` — Existing test file to extend with edit-mode-specific tests.
- All other component files are functionally complete and just need test coverage.

### Relationships

- `useUpdateJournalMutation` is consumed by `EntryForm` (line 9, 40, 52) and needs to optimistically update both `journalQueryKeys.lists()` (infinite query) and `journalQueryKeys.detail(id)`.
- `useDeleteJournalMutation` is consumed by `Timeline` (line 18, 44) and `EntryDetail` (line 32, 38) and needs to optimistically remove the entry from `journalQueryKeys.lists()`.

### Implementation Notes

1. **Optimistic update for `useUpdateJournalMutation`**: Must handle `InfiniteData` shape — iterate `pages[].entries[]` to find and merge updates. Also update `detail(id)` cache if it exists.
2. **Optimistic update for `useDeleteJournalMutation`**: Must filter entry out of all `pages[].entries[]`. The detail cache for the deleted entry should be removed.
3. **Rollback**: `onError` restores the snapshot from `onMutate`'s return value. Error toast is already implemented — keep it.
4. **`onSettled` replaces `onSuccess`**: Move `invalidateQueries` from `onSuccess` to `onSettled` so it runs on both success and error, ensuring eventual consistency.
5. **Success toast stays in `onSuccess`**: Toast notifications for success should only fire on actual success, not on error+rollback.

### Ambiguities

- **AC-4 (AI vibe check re-trigger on edit)**: The task description mentions "new AI vibe check optionally re-triggered" when note changes >= 50 chars. This is a separate feature (AI integration) and is NOT part of this deliverable's scope. The update mutation does not trigger AI re-generation.
- **Optimistic `updatedAt`**: When optimistically updating an entry, we set `updatedAt: new Date()` client-side. The server's `$onUpdate` will set the authoritative value, which `onSettled`'s `invalidateQueries` will reconcile.

### Requirements

From US-MJ-007 (Edit):

- AC-1: Edit opens form pre-filled with existing mood, tags, note -- DONE (entry-form.tsx + $entryId.tsx)
- AC-2: User can modify mood, tags, note independently -- DONE (entry-form.tsx)
- AC-3: Saving edits updates timeline immediately -- NEEDS optimistic update
- AC-5: `updatedAt` changes, `createdAt` stays same -- DONE (Drizzle $onUpdate)
- AC-6: Only own entries editable -- DONE (server ownership check)

From US-MJ-008 (Delete):

- AC-1: Delete shows confirmation dialog -- DONE (delete-entry-dialog.tsx)
- AC-2: Confirmed deletion removes entry immediately (optimistic) -- NEEDS optimistic update
- AC-3: Hard delete (not soft delete) -- DONE (SQL DELETE)
- AC-4: Associated AI response also deleted -- DONE (CASCADE)
- AC-5: Only own entries deletable -- DONE (server ownership check)
- AC-6: Network error reverts optimistic update + error toast -- NEEDS optimistic rollback

### Constraints

- Must work with `InfiniteData` shape from `useInfiniteQuery` (pages array).
- Must preserve existing toast messages and error handling behavior.
- Tests use Happy DOM environment, mock tRPC client via `vi.mock`.
- Bowser YAML format must match existing files in `ai_review/user_stories/`.

### Selected Approach

**Approach**: Add `onMutate`/`onError`/`onSettled` callbacks to existing mutation hooks
**Description**: Modify `useUpdateJournalMutation` and `useDeleteJournalMutation` in `apps/app/lib/queries/journal.ts` to include optimistic cache updates via `queryClient.setQueryData`, snapshot-based rollback in `onError`, and `invalidateQueries` in `onSettled`. No new files or components needed for the functional change.
**Rationale**: This is the standard TanStack Query pattern for optimistic updates. The existing mutation hooks already have the right structure — we just need to add the `onMutate` callback and move `invalidateQueries` from `onSuccess` to `onSettled`.
**Trade-offs Accepted**: Client-side `updatedAt` in optimistic update may differ slightly from server value (milliseconds). Reconciled by `invalidateQueries` in `onSettled`.

---

## Implementation Plan

### apps/app/lib/queries/journal.ts [edit]

**Purpose**: Add optimistic updates with rollback to update and delete mutations.
**TOTAL CHANGES**: 2 (modify useUpdateJournalMutation, modify useDeleteJournalMutation)

**Changes**:

1. Lines 67-90: Replace `useUpdateJournalMutation` with version that includes `onMutate` (optimistic cache update for both lists and detail), `onError` (rollback), and `onSettled` (invalidate). Move `invalidateQueries` from `onSuccess` to `onSettled`. Keep success toast in `onSuccess`.
2. Lines 92-107: Replace `useDeleteJournalMutation` with version that includes `onMutate` (optimistic removal from lists cache, remove detail cache), `onError` (rollback), and `onSettled` (invalidate). Move `invalidateQueries` from `onSuccess` to `onSettled`. Keep success toast in `onSuccess`.

**Implementation Details**:

- Import `InfiniteData` is already imported (line 8).
- `JournalListPage` type is already defined (line 12-14).
- For update: `setQueryData` on `journalQueryKeys.lists()` iterates `pages[].entries[]` and merges `variables` into the matching entry. Also updates `journalQueryKeys.detail(variables.id)` if cached.
- For delete: `setQueryData` on `journalQueryKeys.lists()` filters out the entry from `pages[].entries[]`. Also removes `journalQueryKeys.detail(id)` from cache.
- Both mutations return a context object with `previousLists` and `previousDetail` snapshots for rollback.

**Reference Implementation** (FULL code for the entire file):

```typescript
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
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              entries: page.entries.map((entry) =>
                entry.id === variables.id
                  ? { ...entry, ...variables, updatedAt: new Date() }
                  : entry,
              ),
            })),
          };
        },
      );

      queryClient.setQueryData(
        journalQueryKeys.detail(variables.id),
        (old: JournalListPage["entries"][number] | undefined) => {
          if (!old) return old;
          return { ...old, ...variables, updatedAt: new Date() };
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
        (old) => {
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
```

**Migration Pattern**:

```typescript
// BEFORE (useUpdateJournalMutation, lines 67-90):
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
      toast.error("Failed to update entry", { description: error.message });
    },
  });
}

// AFTER: adds onMutate (optimistic), moves invalidation to onSettled, adds rollback to onError
// (see full Reference Implementation above)
```

```typescript
// BEFORE (useDeleteJournalMutation, lines 92-107):
export function useDeleteJournalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trpcClient.journal.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      toast.success("Entry deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete entry", { description: error.message });
    },
  });
}

// AFTER: adds onMutate (optimistic removal), moves invalidation to onSettled, adds rollback to onError
// (see full Reference Implementation above)
```

**Dependencies**: None (no other plan files)
**Provides**: `useUpdateJournalMutation()` with optimistic updates, `useDeleteJournalMutation()` with optimistic updates

---

### apps/app/components/journal/entry-form.test.tsx [edit]

**Purpose**: Extend existing tests with edit-mode-specific coverage.
**TOTAL CHANGES**: 1 (add new test cases to existing describe block)

**Changes**:

1. After line 87: Add new test cases for edit mode behavior — pre-filled values rendering, calling update mutation with correct args, button text.

**Implementation Details**:

- Uses existing mock setup (`mockUpdateMutate`, `mockCreateMutate`).
- Uses existing `createWrapper()` helper.
- Tests: pre-filled mood is selected, pre-filled note is in the textarea, update mutation is called with the entry id and all fields.

**Reference Implementation** (FULL file):

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryForm } from "./entry-form";

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();

vi.mock("@/lib/queries/journal", () => ({
  useCreateJournalMutation: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateJournalMutation: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EntryForm", () => {
  it("renders mood selector, tag chips, and note editor", () => {
    render(<EntryForm />, { wrapper: createWrapper() });
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/write about your day/i),
    ).toBeInTheDocument();
  });

  it("save button is disabled when no mood selected", () => {
    render(<EntryForm />, { wrapper: createWrapper() });
    const saveButton = screen.getByRole("button", { name: /save entry/i });
    expect(saveButton).toBeDisabled();
  });

  it("save button is enabled after selecting a mood", async () => {
    const user = userEvent.setup();
    render(<EntryForm />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Happy"));
    const saveButton = screen.getByRole("button", { name: /save entry/i });
    expect(saveButton).toBeEnabled();
  });

  it("calls create mutation on save", async () => {
    const user = userEvent.setup();
    render(<EntryForm />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Happy"));
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      { mood: "Happy", tags: [], note: "" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("shows 'Update Entry' in edit mode", () => {
    render(
      <EntryForm
        entryId="jrn_123"
        defaultValues={{ mood: "Calm", tags: ["Work"], note: "test note" }}
      />,
      { wrapper: createWrapper() },
    );
    expect(
      screen.getByRole("button", { name: /update entry/i }),
    ).toBeInTheDocument();
  });

  it("pre-fills mood selection in edit mode", () => {
    render(
      <EntryForm
        entryId="jrn_123"
        defaultValues={{ mood: "Happy", tags: [], note: "" }}
      />,
      { wrapper: createWrapper() },
    );
    const happyRadio = screen.getByLabelText("Happy");
    expect(happyRadio).toBeChecked();
  });

  it("pre-fills note text in edit mode", () => {
    render(
      <EntryForm
        entryId="jrn_123"
        defaultValues={{
          mood: "Calm",
          tags: [],
          note: "My existing note",
        }}
      />,
      { wrapper: createWrapper() },
    );
    const noteArea = screen.getByPlaceholderText(/write about your day/i);
    expect(noteArea).toHaveValue("My existing note");
  });

  it("calls update mutation with entry id on save in edit mode", async () => {
    const user = userEvent.setup();
    render(
      <EntryForm
        entryId="jrn_456"
        defaultValues={{ mood: "Happy", tags: ["Work"], note: "old note" }}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole("button", { name: /update entry/i }));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { id: "jrn_456", mood: "Happy", tags: ["Work"], note: "old note" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it("allows changing mood in edit mode and saves updated value", async () => {
    const user = userEvent.setup();
    render(
      <EntryForm
        entryId="jrn_789"
        defaultValues={{ mood: "Happy", tags: [], note: "" }}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByLabelText("Sad"));
    await user.click(screen.getByRole("button", { name: /update entry/i }));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "jrn_789", mood: "Sad" }),
      expect.any(Object),
    );
  });
});
```

**Migration Pattern**:

```typescript
// BEFORE (line 87): file ends after "shows 'Update Entry' in edit mode" test

// AFTER: 4 new tests added inside the describe block:
// - "pre-fills mood selection in edit mode"
// - "pre-fills note text in edit mode"
// - "calls update mutation with entry id on save in edit mode"
// - "allows changing mood in edit mode and saves updated value"
```

**Dependencies**: None
**Provides**: Test coverage for EntryForm edit mode

---

### apps/app/components/journal/delete-entry-dialog.test.tsx [create]

**Purpose**: Test DeleteEntryDialog interactions — rendering, cancel, confirm, loading state.
**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- No query client needed — this is a presentational component with callback props.
- Tests: renders title and description when open, calls `onConfirm` when confirm button clicked, calls `onOpenChange(false)` when cancel clicked, shows loading state when `isPending` is true.

**Reference Implementation** (FULL file):

```typescript
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteEntryDialog } from "./delete-entry-dialog";

afterEach(() => {
  cleanup();
});

describe("DeleteEntryDialog", () => {
  it("renders dialog content when open", () => {
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByText("Delete entry?")).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i),
    ).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    render(
      <DeleteEntryDialog
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.queryByText("Delete entry?")).not.toBeInTheDocument();
  });

  it("calls onConfirm when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows loading state when isPending", () => {
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={true}
      />,
    );
    expect(screen.getByText("Deleting...")).toBeInTheDocument();
  });

  it("shows Delete text when not pending", () => {
    render(
      <DeleteEntryDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /^delete$/i }),
    ).toBeInTheDocument();
  });
});
```

**Dependencies**: None
**Provides**: Test coverage for DeleteEntryDialog

---

### apps/app/components/journal/entry-card.test.tsx [create]

**Purpose**: Test EntryCard rendering and dropdown menu callbacks.
**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Must mock `@tanstack/react-router` for the `Link` component.
- Must mock `@/lib/utils/relative-time` and `@/lib/utils/mood-icons` to avoid external dependencies.
- Tests: renders mood label and timestamp, renders tags as badges, renders note preview (truncated), calls `onEdit` when Edit menu item clicked, calls `onDelete` when Delete menu item clicked.

**Reference Implementation** (FULL file):

```typescript
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryCard, type JournalEntryWithAi } from "./entry-card";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

vi.mock("@/lib/utils/relative-time", () => ({
  formatRelativeTime: () => "2 hours ago",
}));

vi.mock("@/lib/utils/mood-icons", () => ({
  getMoodIcon: () => {
    const Icon = (props: Record<string, unknown>) => (
      <svg data-testid="mood-icon" {...props} />
    );
    return Icon;
  },
}));

afterEach(() => {
  cleanup();
});

function makeEntry(
  overrides: Partial<JournalEntryWithAi> = {},
): JournalEntryWithAi {
  return {
    id: "jrn_test-1",
    mood: "Happy",
    tags: ["Work", "Fitness"],
    note: "Feeling great today",
    createdAt: new Date("2026-03-09T12:00:00Z"),
    updatedAt: new Date("2026-03-09T12:00:00Z"),
    aiResponse: null,
    ...overrides,
  };
}

describe("EntryCard", () => {
  it("renders mood label", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Happy")).toBeInTheDocument();
  });

  it("renders relative timestamp", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
  });

  it("renders truncated note preview", () => {
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Feeling great today")).toBeInTheDocument();
  });

  it("truncates long notes at 150 characters", () => {
    const longNote = "A".repeat(200);
    render(
      <EntryCard
        entry={makeEntry({ note: longNote })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("A".repeat(150) + "...")).toBeInTheDocument();
  });

  it("calls onEdit when Edit menu item is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <EntryCard entry={makeEntry()} onEdit={onEdit} onDelete={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /entry actions/i }));
    await user.click(screen.getByText("Edit"));

    expect(onEdit).toHaveBeenCalledWith("jrn_test-1");
  });

  it("calls onDelete when Delete menu item is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <EntryCard entry={makeEntry()} onEdit={vi.fn()} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole("button", { name: /entry actions/i }));
    await user.click(screen.getByText("Delete"));

    expect(onDelete).toHaveBeenCalledWith("jrn_test-1");
  });

  it("renders AI response preview when present", () => {
    render(
      <EntryCard
        entry={makeEntry({
          aiResponse: {
            id: "air_1",
            response: "You seem happy today!",
            hasCrisisContent: false,
          },
        })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("You seem happy today!")).toBeInTheDocument();
  });

  it("does not render note section when note is null", () => {
    render(
      <EntryCard
        entry={makeEntry({ note: null })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.queryByText("Feeling great today"),
    ).not.toBeInTheDocument();
  });
});
```

**Dependencies**: None
**Provides**: Test coverage for EntryCard

---

### ai_review/user_stories/entry-crud.yaml [create]

**Purpose**: Bowser QA stories for edit and delete entry flows.
**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Format matches existing YAML files in `ai_review/user_stories/`.
- Two stories: "Edit an existing journal entry" and "Delete a journal entry with confirmation".
- Both stories include login flow (dev auth auto-login).

**Reference Implementation** (FULL file):

```yaml
stories:
  - name: "Edit an existing journal entry"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/login
      Enter "test@test.com" in the email input field
      Click the continue/submit button
      Wait for auto-login to complete (OTP auto-fills and submits)
      Wait for redirect to /journal
      Verify the timeline has at least one entry card visible
      Click on the first entry card to open the detail view
      Verify the URL changes to /journal/ followed by an entry ID
      Click the "Edit" button
      Verify the entry form opens with a mood already selected (pre-filled)
      Verify the "Update Entry" button is visible (not "Save Entry")
      Click a different mood option to change the mood selection
      Click the "Update Entry" button
      Verify a success toast notification appears with text "Entry updated"
      Verify the detail view returns to read-only mode showing the updated mood

  - name: "Delete a journal entry with confirmation"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/login
      Enter "test@test.com" in the email input field
      Click the continue/submit button
      Wait for auto-login to complete (OTP auto-fills and submits)
      Wait for redirect to /journal
      Verify the timeline has at least one entry card visible
      Note the number of entry cards visible in the timeline
      Click the three-dot menu (more actions) button on the first entry card
      Verify a dropdown menu appears with "Edit" and "Delete" options
      Click the "Delete" option in the dropdown menu
      Verify a confirmation dialog appears with title "Delete entry?"
      Verify the dialog text mentions this action cannot be undone
      Click the "Delete" button in the confirmation dialog
      Verify a success toast notification appears with text "Entry deleted"
      Verify the entry is removed from the timeline
```

**Dependencies**: None
**Provides**: Bowser QA test stories for `/ui-review entry-crud`

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                                       | Action | Depends On |
| ----- | ---------------------------------------------------------- | ------ | ---------- |
| 1     | `apps/app/lib/queries/journal.ts`                          | edit   | —          |
| 1     | `apps/app/components/journal/entry-form.test.tsx`          | edit   | —          |
| 1     | `apps/app/components/journal/delete-entry-dialog.test.tsx` | create | —          |
| 1     | `apps/app/components/journal/entry-card.test.tsx`          | create | —          |
| 1     | `ai_review/user_stories/entry-crud.yaml`                   | create | —          |

---

## Exit Criteria

### Test Commands

```bash
bun test --run                 # Run all tests (Vitest)
bun lint                       # ESLint with cache
bun typecheck                  # tsc --build
bun prettier --check .         # Verify formatting
```

### Success Conditions

- [ ] All tests pass (exit code 0) — including new tests for entry-form edit mode, delete-entry-dialog, entry-card
- [ ] No linting errors (exit code 0)
- [ ] No type errors (exit code 0)
- [ ] Prettier formatting passes
- [ ] `useUpdateJournalMutation` has `onMutate` with optimistic cache update for lists and detail
- [ ] `useUpdateJournalMutation` has `onError` with rollback from snapshot + error toast
- [ ] `useDeleteJournalMutation` has `onMutate` with optimistic removal from lists cache
- [ ] `useDeleteJournalMutation` has `onError` with rollback from snapshot + error toast
- [ ] Both mutations use `onSettled` for `invalidateQueries` (not `onSuccess`)
- [ ] Bowser QA: `/ui-review entry-crud` — ALL stories PASS
- [ ] `updatedAt` auto-updates on edit (verified by Drizzle `$onUpdate` — no code change needed)
- [ ] AI responses cascade-deleted with entry (verified by FK `ON DELETE CASCADE` — no code change needed)

### Verification Script

```bash
bun test --run && bun lint && bun typecheck && bun prettier --check .
```

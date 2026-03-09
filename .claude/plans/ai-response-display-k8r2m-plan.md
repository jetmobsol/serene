# AI Response Display (Streaming + History) - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

Implement frontend-only components for AI vibe check display: an SSE streaming hook, reusable AiResponse component, SafetyBanner for crisis content, and wiring entry creation to auto-trigger AI streaming for notes >= 50 chars. The backend SSE endpoint at `GET /api/ai/stream/:entryId` is fully implemented and returns `token`, `done`, and `error` events.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `apps/app/components/journal/entry-card.tsx`
- `apps/app/components/journal/entry-form.tsx`
- `apps/app/components/journal/timeline.tsx`
- `apps/app/routes/(app)/journal/$entryId.tsx`
- `apps/app/routes/(app)/journal/index.tsx`

### Files to Create

- `apps/app/lib/hooks/use-sse-stream.ts`
- `apps/app/lib/hooks/use-sse-stream.test.ts`
- `apps/app/components/journal/ai-response.tsx`
- `apps/app/components/journal/ai-response.test.tsx`
- `apps/app/components/journal/safety-banner.tsx`
- `apps/app/components/journal/safety-banner.test.tsx`

---

## Code Context

### Backend SSE Endpoint (Complete - Do Not Modify)

- `apps/api/lib/app.ts:83-283`: `GET /api/ai/stream/:entryId` — authenticates via Better Auth session cookies, rate limits (20/hr), fetches entry, checks gibberish, streams Anthropic response via SSE, persists to DB on completion.
- Events emitted:
  - `event: token` with `data: {"text": "partial text"}`
  - `event: done` with `data: {"response": "full text", "hasCrisisContent": false}`
  - `event: error` with `data: {"message": "error description"}`

### DB Schema

- `db/schema/ai-response.ts:8-22`: `ai_response` table with `id`, `entryId` (unique), `response`, `hasCrisisContent`, `model`, `createdAt`.

### Frontend Entry Point

- `apps/app/routes/(app)/journal/index.tsx:1-37`: Journal page renders `EntryForm` and `Timeline` as siblings. No shared state between them currently.
- `apps/app/components/journal/entry-form.tsx:61-69`: `createMutation.mutate()` calls `onSuccess` callback after successful create. The mutation returns the full entry object including `id` (from `apps/api/routers/journal.ts:31`: `return entry`).
- `apps/app/lib/queries/journal.ts:50-65`: `useCreateJournalMutation` — invalidates journal list queries on success. The `mutationFn` returns the entry with `id`, `mood`, `tags`, `note`, `createdAt`, `updatedAt`.

### Existing AI Display (to be replaced)

- `apps/app/components/journal/entry-card.tsx:86-95`: Inline AI response rendering in CardFooter — Sparkles icon + truncated 100-char italic text in muted bg. This will be replaced with the `AiResponse` component.
- `apps/app/routes/(app)/journal/$entryId.tsx:158-170`: Inline AI response in detail view — Sparkles icon + full response text. Will be replaced with `AiResponse` component.

### Type Definition

- `apps/app/components/journal/entry-card.tsx:19-31`: `JournalEntryWithAi` interface — `aiResponse: { id: string; response: string; hasCrisisContent: boolean } | null`.

### UI Components Available

- From `@repo/ui`: `Badge`, `Button`, `Card`, `CardContent`, `CardFooter`, `CardHeader`, `Separator`, `Skeleton` (no standalone `Alert` component exists — must build SafetyBanner from scratch using Card/div).
- Icons from `lucide-react`: `Sparkles`, `Phone`, `AlertTriangle` are available.

### Test Patterns

- `apps/app/components/journal/entry-card.test.tsx`: Uses `@testing-library/react`, `userEvent`, `vi.mock` for `@tanstack/react-router`, `@/lib/utils/relative-time`, `@/lib/utils/mood-icons`. Uses `cleanup` in `afterEach`. No `QueryClientProvider` wrapper needed (no queries).
- `apps/app/components/journal/entry-form.test.tsx`: Uses `QueryClientProvider` wrapper with `retry: false`. Mocks `@/lib/queries/journal` with `vi.mock`. Tests mutation calls.
- Test config: `apps/app/vitest.config.ts` — happy-dom environment, setup file imports `@testing-library/jest-dom/vitest`.

### Path Aliases

- `@/*` maps to `apps/app/*` (from `tsconfig.json:8`).
- Imports: `@/lib/hooks/use-sse-stream`, `@/components/journal/ai-response`, etc.

### Jotai

- `apps/app/lib/store.ts`: Jotai store exists but has no atoms defined. Will use a Jotai atom to communicate streaming state from EntryForm to Timeline.

### Vite Dev Proxy

- `apps/app/vite.config.ts:77-95`: `/api/*` proxied to API backend in dev. SSE requests to `/api/ai/stream/:entryId` will be proxied correctly.

---

## External Context

### EventSource API

- Native browser `EventSource` API connects to SSE endpoints with `withCredentials: true` for cookie auth.
- Constructor: `new EventSource(url, { withCredentials: true })`
- Event listeners: `source.addEventListener("token", handler)`, `source.addEventListener("done", handler)`, `source.addEventListener("error", handler)`
- Cleanup: `source.close()`
- Data parsing: `event.data` is a string, parse with `JSON.parse(event.data)`
- Note: EventSource only supports GET requests — matches our endpoint.

### Jotai Atoms

- `atom<T>(initialValue)` creates a primitive atom.
- `useAtom(atom)` returns `[value, setValue]` like useState.
- `useAtomValue(atom)` for read-only, `useSetAtom(atom)` for write-only.
- Import from `jotai`.

---

## Architectural Narrative

### Task

Implement frontend AI response display with SSE streaming for the Serene wellness journal. When a user saves a journal entry with a note >= 50 characters, the app auto-triggers an SSE stream to `GET /api/ai/stream/:entryId`, displays a loading indicator, streams the AI response text incrementally, and persists the result. A safety banner with crisis hotline info must appear when `hasCrisisContent` is true.

### Architecture

The journal page (`apps/app/routes/(app)/journal/index.tsx`) renders two sibling components: `EntryForm` (creates entries) and `Timeline` (displays entries). They communicate indirectly via TanStack Query cache invalidation. To connect entry creation to AI streaming, we introduce a Jotai atom `streamingEntryIdAtom` that the `EntryForm` sets after a successful create (when note >= 50 chars), and the `Timeline` reads to know which entry needs streaming.

### Selected Context

- `apps/app/components/journal/entry-form.tsx:61-69` — where create mutation succeeds, provides entry ID
- `apps/app/components/journal/entry-card.tsx:86-95` — existing AI display to replace
- `apps/app/routes/(app)/journal/$entryId.tsx:158-170` — detail view AI display to replace
- `apps/app/components/journal/timeline.tsx:82-89` — where EntryCard is rendered, needs streaming props
- `apps/app/lib/queries/journal.ts:47-65` — create mutation, returns entry with id

### Relationships

```
EntryForm --[sets streamingEntryIdAtom]--> Jotai Atom
Timeline --[reads streamingEntryIdAtom]--> Jotai Atom
Timeline --[passes streaming props]--> EntryCard
EntryCard --[renders]--> AiResponse (streaming or static)
AiResponse --[conditionally renders]--> SafetyBanner
$entryId.tsx --[renders]--> AiResponse (static only, from persisted data)
use-sse-stream --[connects to]--> GET /api/ai/stream/:entryId
```

### External Context

- EventSource API is the browser-native SSE client. It auto-reconnects on error, which we do NOT want — we close on any error/done event.
- Jotai atoms are the lightest-weight cross-component state solution already in the project.

### Implementation Notes

1. **SSE auth**: EventSource supports `withCredentials: true` for cookie-based auth. The Vite dev proxy at `/api/*` forwards requests to the API server.
2. **Streaming lifecycle**: The hook manages three states: idle (not started), streaming (receiving tokens), complete (done event received). On unmount, it closes the EventSource.
3. **Entry form -> Timeline communication**: Use `streamingEntryIdAtom` (Jotai atom). EntryForm sets it to the new entry ID after create succeeds AND note >= 50 chars. Timeline reads it and passes it down to the matching EntryCard. After streaming completes, Timeline clears the atom and invalidates queries.
4. **AiResponse component**: Reusable in both entry-card (truncated mode for timeline) and entry-detail (full mode). Accepts `variant: "compact" | "full"` prop. In compact mode, truncates to 100 chars. In full mode, shows complete response with "AI Insight" header.
5. **SafetyBanner**: Non-dismissible card with Phone icon showing 988 Suicide & Crisis Lifeline (call/text 988) and Crisis Text Line (text HOME to 741741). Rendered above AI response text when `hasCrisisContent` is true.
6. **No streaming in detail view**: The entry detail page (`$entryId.tsx`) only shows persisted AI responses — no streaming trigger. Streaming only happens on the journal timeline after entry creation.
7. **50-char minimum**: The EntryForm checks `note.length >= 50` before setting the streaming atom. Short notes get no AI section at all.

### Ambiguities

- **Resolved**: Whether to use Jotai or callback props for form->timeline communication. Decision: Jotai atom, because EntryForm and Timeline are siblings with no common ancestor component managing this state (the Journal page is a simple layout).
- **Resolved**: Whether to stream in detail view. Decision: No — detail view only shows persisted responses. Streaming is only triggered from the journal index page after entry creation.

### Requirements

1. Saving entry with note >= 50 chars triggers AI vibe check SSE stream
2. Loading indicator (pulsing dots) shown while waiting for first token
3. AI response text streams in incrementally below the entry card
4. Completed AI response persisted server-side and visible on page reload
5. Entries with short notes (< 50 chars) show no AI section
6. Safety banner appears when hasCrisisContent is true (from done event or persisted data)
7. Safety banner shows 988 Lifeline and Crisis Text Line info, non-dismissible
8. AI responses visually distinct from user content (muted bg, italic, sparkle icon)
9. All component tests pass
10. Screen readers announce AI response arrival via aria-live region

### Constraints

- Frontend-only changes — backend is complete
- Must use native EventSource (no additional SSE library)
- Must follow existing test patterns (vitest, @testing-library/react, happy-dom)
- Must use `@repo/ui` components and `lucide-react` icons
- Path alias `@/*` for imports
- No Alert component in `@repo/ui` — build SafetyBanner with plain divs/Card

### Selected Approach

**Approach**: Jotai atom for cross-component streaming state + native EventSource hook
**Description**: A `streamingEntryIdAtom` Jotai atom bridges EntryForm and Timeline. When EntryForm's create mutation succeeds with note >= 50 chars, it sets the atom to the new entry ID. Timeline reads this atom, and the matching EntryCard activates the `useSseStream` hook to connect to the SSE endpoint. The AiResponse component handles all display states (loading, streaming, complete, crisis). On stream completion, the atom is cleared and journal queries are invalidated to pick up the persisted response.
**Rationale**: Jotai is already in the project and provides the simplest cross-sibling communication without prop drilling or lifting state to the Journal page. The native EventSource API is sufficient since the endpoint is a standard GET SSE stream with cookie auth.
**Trade-offs Accepted**: EventSource doesn't support custom headers (only cookies for auth), but the backend already uses cookie-based auth via Better Auth. EventSource auto-reconnect is disabled by closing on error/done.

---

## Implementation Plan

### apps/app/lib/hooks/use-sse-stream.ts [create]

**Purpose**: Custom React hook that manages an EventSource connection to the AI streaming endpoint, handling connection lifecycle, event parsing, and cleanup.

**Changes**:

1. Create new file with `useSseStream` hook and `streamingEntryIdAtom` Jotai atom

**Implementation Details**:

- Exports `streamingEntryIdAtom: PrimitiveAtom<string | null>` — Jotai atom holding the entry ID currently being streamed, or null
- Exports `useSseStream(entryId: string | null): SseStreamState` — hook that creates EventSource when entryId is non-null
- `SseStreamState` type: `{ streamedText: string; isStreaming: boolean; isComplete: boolean; hasCrisisContent: boolean; error: string | null }`
- When `entryId` changes from null to a string, creates `new EventSource(\`/api/ai/stream/${entryId}\`, { withCredentials: true })`
- Listens for three events: `token` (appends `data.text` to streamedText), `done` (sets complete, extracts hasCrisisContent), `error` (sets error message)
- On unmount or entryId change, calls `source.close()`
- Uses `useRef` to hold EventSource instance, `useState` for state fields
- Resets state when entryId changes

**Reference Implementation**:

```typescript
import { atom } from "jotai";
import { useEffect, useRef, useState } from "react";

/**
 * Jotai atom holding the entry ID currently being streamed.
 * Set by EntryForm after successful create with note >= 50 chars.
 * Read by Timeline to activate streaming on the matching EntryCard.
 */
export const streamingEntryIdAtom = atom<string | null>(null);

export interface SseStreamState {
  streamedText: string;
  isStreaming: boolean;
  isComplete: boolean;
  hasCrisisContent: boolean;
  error: string | null;
}

const INITIAL_STATE: SseStreamState = {
  streamedText: "",
  isStreaming: false,
  isComplete: false,
  hasCrisisContent: false,
  error: null,
};

export function useSseStream(entryId: string | null): SseStreamState {
  const [state, setState] = useState<SseStreamState>(INITIAL_STATE);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!entryId) {
      setState(INITIAL_STATE);
      return;
    }

    // Reset state for new stream
    setState({ ...INITIAL_STATE, isStreaming: true });

    const url = `/api/ai/stream/${encodeURIComponent(entryId)}`;
    const source = new EventSource(url, { withCredentials: true });
    sourceRef.current = source;

    source.addEventListener("token", (event: MessageEvent) => {
      const data = JSON.parse(event.data) as { text: string };
      setState((prev) => ({
        ...prev,
        streamedText: prev.streamedText + data.text,
      }));
    });

    source.addEventListener("done", (event: MessageEvent) => {
      const data = JSON.parse(event.data) as {
        response: string;
        hasCrisisContent: boolean;
      };
      setState({
        streamedText: data.response,
        isStreaming: false,
        isComplete: true,
        hasCrisisContent: data.hasCrisisContent,
        error: null,
      });
      source.close();
    });

    source.addEventListener("error", (event: Event) => {
      // EventSource error can be a MessageEvent with data or a generic Event
      let message = "Failed to generate AI response";
      if ("data" in event && typeof (event as MessageEvent).data === "string") {
        try {
          const data = JSON.parse((event as MessageEvent).data) as {
            message: string;
          };
          message = data.message;
        } catch {
          // Use default message
        }
      }
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: message,
      }));
      source.close();
    });

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [entryId]);

  return state;
}
```

**Dependencies**: None (standalone, uses only React and Jotai)
**Provides**: `streamingEntryIdAtom` (atom), `useSseStream` (hook), `SseStreamState` (type)

---

### apps/app/components/journal/safety-banner.tsx [create]

**Purpose**: Non-dismissible crisis resource banner displayed when AI detects crisis content. Shows 988 Suicide & Crisis Lifeline and Crisis Text Line contact info.

**Changes**:

1. Create new file with `SafetyBanner` component

**Implementation Details**:

- No props — always renders the same static content
- Uses `lucide-react` icons: `Phone`, `AlertTriangle`
- Styled with Tailwind: amber/yellow warning colors, border, rounded
- Contains two crisis resources with contact methods
- `role="alert"` for screen reader announcement

**Reference Implementation**:

```typescript
import { AlertTriangle, Phone } from "lucide-react";

export function SafetyBanner() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            If you or someone you know is in crisis
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>988 Suicide & Crisis Lifeline</strong> — Call or text{" "}
                <a
                  href="tel:988"
                  className="font-bold underline"
                >
                  988
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Crisis Text Line</strong> — Text{" "}
                <span className="font-bold">HOME</span> to{" "}
                <a
                  href="sms:741741"
                  className="font-bold underline"
                >
                  741741
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Dependencies**: None
**Provides**: `SafetyBanner` component

---

### apps/app/components/journal/ai-response.tsx [create]

**Purpose**: Reusable component that renders AI vibe check responses in both streaming and static modes, with optional crisis safety banner. Used in both entry-card (compact) and entry-detail (full) views.

**Changes**:

1. Create new file with `AiResponse` component

**Implementation Details**:

- Props: `{ response: string | null; hasCrisisContent: boolean; isStreaming?: boolean; streamedText?: string; variant?: "compact" | "full" }`
- Default `variant` is `"compact"`, `isStreaming` defaults to `false`, `streamedText` defaults to `""`
- Rendering logic:
  - If `isStreaming && streamedText === ""`: show pulsing dots loading indicator
  - If `isStreaming && streamedText !== ""`: show accumulated text with cursor animation
  - If `!isStreaming && (response || streamedText)`: show final text
  - If no response and not streaming: return null (render nothing)
- In compact variant: truncate displayed text to 100 chars
- In full variant: show "AI Insight" header above text
- SafetyBanner rendered above text when `hasCrisisContent` is true
- Uses `Sparkles` icon from lucide-react
- `aria-live="polite"` on the text container for accessibility

**Reference Implementation**:

```typescript
import { Sparkles } from "lucide-react";
import { SafetyBanner } from "./safety-banner";

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

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
        className={`flex items-start gap-${variant === "compact" ? "2" : "3"} rounded-${variant === "compact" ? "md" : "lg"} bg-muted/50 p-${variant === "compact" ? "2" : "4"} w-full`}
      >
        <Sparkles
          className={`${variant === "compact" ? "h-4 w-4" : "h-5 w-5"} text-muted-foreground mt-0.5 shrink-0`}
        />
        <div className={variant === "full" ? "flex-1" : undefined}>
          {variant === "full" && (
            <p className="text-sm font-medium mb-1">AI Insight</p>
          )}
          {isLoading ? (
            <div className="flex items-center gap-1" aria-label="Generating AI response">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
            </div>
          ) : (
            <p
              className={`text-${variant === "compact" ? "xs" : "sm"} text-muted-foreground italic`}
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
```

**Dependencies**: `apps/app/components/journal/safety-banner.tsx`
**Provides**: `AiResponse` component

---

### apps/app/components/journal/entry-card.tsx [edit]

**Purpose**: Replace inline AI response rendering with the AiResponse component. Add streaming support via optional props.

**TOTAL CHANGES**: 3

**Changes**:

1. Lines 1-17: Update imports — remove `Sparkles`, add `AiResponse` import, add streaming props to interface
2. Lines 33-37: Extend `EntryCardProps` with optional streaming props
3. Lines 86-95: Replace inline AI rendering with `AiResponse` component

**Implementation Details**:

- Add optional props: `isStreaming?: boolean`, `streamedText?: string`, `streamHasCrisisContent?: boolean`
- Remove the `truncate` function (moved to AiResponse)
- Remove `Sparkles` import (no longer used directly)
- The CardFooter section now uses AiResponse for both streamed and persisted content

**Migration Pattern**:

```typescript
// BEFORE (lines 86-95):
{entry.aiResponse && (
  <CardFooter className="pt-0">
    <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 w-full">
      <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground italic">
        {truncate(entry.aiResponse.response, 100)}
      </p>
    </div>
  </CardFooter>
)}

// AFTER:
{(entry.aiResponse || isStreaming) && (
  <CardFooter className="pt-0">
    <AiResponse
      response={entry.aiResponse?.response ?? null}
      hasCrisisContent={
        entry.aiResponse?.hasCrisisContent ?? streamHasCrisisContent
      }
      isStreaming={isStreaming}
      streamedText={streamedText}
      variant="compact"
    />
  </CardFooter>
)}
```

**Reference Implementation**:

```typescript
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { MOOD_COLORS, type MoodType } from "@repo/core";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { AiResponse } from "./ai-response";

export interface JournalEntryWithAi {
  id: string;
  mood: string;
  tags: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  aiResponse: {
    id: string;
    response: string;
    hasCrisisContent: boolean;
  } | null;
}

interface EntryCardProps {
  entry: JournalEntryWithAi;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isStreaming?: boolean;
  streamedText?: string;
  streamHasCrisisContent?: boolean;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function EntryCard({
  entry,
  onEdit,
  onDelete,
  isStreaming = false,
  streamedText = "",
  streamHasCrisisContent = false,
}: EntryCardProps) {
  const mood = entry.mood as MoodType;
  const MoodIcon = getMoodIcon(mood);
  const moodColor = MOOD_COLORS[mood]?.light;

  return (
    <Card
      className="relative overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}
    >
      <Link
        to="/journal/$entryId"
        params={{ entryId: entry.id }}
        className="block"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            {MoodIcon && <MoodIcon className="h-5 w-5 text-muted-foreground" />}
            <span className="font-medium">{mood}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </CardHeader>

        <CardContent className="space-y-2">
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {entry.note && (
            <p className="text-sm text-muted-foreground">
              {truncate(entry.note, 150)}
            </p>
          )}
        </CardContent>

        {(entry.aiResponse || isStreaming) && (
          <CardFooter className="pt-0">
            <AiResponse
              response={entry.aiResponse?.response ?? null}
              hasCrisisContent={
                entry.aiResponse?.hasCrisisContent ?? streamHasCrisisContent
              }
              isStreaming={isStreaming}
              streamedText={streamedText}
              variant="compact"
            />
          </CardFooter>
        )}
      </Link>

      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Entry actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onEdit(entry.id);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onDelete(entry.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
```

**Dependencies**: `apps/app/components/journal/ai-response.tsx`
**Provides**: `EntryCard` component (updated with streaming props), `JournalEntryWithAi` type (unchanged)

---

### apps/app/components/journal/entry-form.tsx [edit]

**Purpose**: After successful entry creation with note >= 50 chars, set the `streamingEntryIdAtom` to trigger AI streaming.

**TOTAL CHANGES**: 2

**Changes**:

1. Lines 1-14: Add imports for `useSetAtom` from `jotai` and `streamingEntryIdAtom` from `@/lib/hooks/use-sse-stream`
2. Lines 61-69: Modify createMutation `onSuccess` callback to set streaming atom when note is long enough

**Implementation Details**:

- Add `const setStreamingEntryId = useSetAtom(streamingEntryIdAtom)` in the component
- In the create mutation `onSuccess`, the mutation returns the entry. Access its `id` via the `data` parameter of `onSuccess`.
- Check `note.length >= 50` before setting the atom
- The mutation's `onSuccess` receives `(data, variables, context)` — data is the returned entry

**Migration Pattern**:

```typescript
// BEFORE (lines 61-69):
createMutation.mutate(
  { mood, tags, note },
  {
    onSuccess: () => {
      setMood(null);
      setTags([]);
      setNote("");
      onSuccess?.();
    },
  },
);

// AFTER:
createMutation.mutate(
  { mood, tags, note },
  {
    onSuccess: (data) => {
      if (note.length >= 50 && data?.id) {
        setStreamingEntryId(data.id);
      }
      setMood(null);
      setTags([]);
      setNote("");
      onSuccess?.();
    },
  },
);
```

**Reference Implementation**:

```typescript
import { MoodSelector } from "@/components/journal/mood-selector";
import {
  NoteEditor,
  type NoteEditorHandle,
} from "@/components/journal/note-editor";
import { TagChips } from "@/components/journal/tag-chips";
import {
  useCreateJournalMutation,
  useUpdateJournalMutation,
} from "@/lib/queries/journal";
import { streamingEntryIdAtom } from "@/lib/hooks/use-sse-stream";
import type { MoodType, TagType } from "@repo/core";
import { Button } from "@repo/ui";
import { useSetAtom } from "jotai";
import { Loader2, Save } from "lucide-react";
import { useRef, useState } from "react";

interface EntryFormProps {
  defaultValues?: {
    mood: MoodType;
    tags: TagType[];
    note: string;
  };
  entryId?: string;
  onSuccess?: () => void;
}

export function EntryForm({
  defaultValues,
  entryId,
  onSuccess,
}: EntryFormProps) {
  const noteEditorRef = useRef<NoteEditorHandle>(null);
  const setStreamingEntryId = useSetAtom(streamingEntryIdAtom);

  const [mood, setMood] = useState<MoodType | null>(
    defaultValues?.mood ?? null,
  );
  const [tags, setTags] = useState<TagType[]>(defaultValues?.tags ?? []);
  const [note, setNote] = useState(defaultValues?.note ?? "");

  const createMutation = useCreateJournalMutation();
  const updateMutation = useUpdateJournalMutation();

  const isEditing = !!entryId;
  const mutation = isEditing ? updateMutation : createMutation;
  const isPending = mutation.isPending;
  const canSave = mood !== null && !isPending;

  function handleSave() {
    if (!mood) return;
    noteEditorRef.current?.flush();

    if (isEditing && entryId) {
      updateMutation.mutate(
        { id: entryId, mood, tags, note },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      createMutation.mutate(
        { mood, tags, note },
        {
          onSuccess: (data) => {
            if (note.length >= 50 && data?.id) {
              setStreamingEntryId(data.id);
            }
            setMood(null);
            setTags([]);
            setNote("");
            onSuccess?.();
          },
        },
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">How are you feeling?</h3>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Tags</h3>
        <TagChips value={tags} onChange={setTags} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Notes</h3>
        <NoteEditor ref={noteEditorRef} value={note} onChange={setNote} />
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {isEditing ? "Update Entry" : "Save Entry"}
          </>
        )}
      </Button>
    </div>
  );
}
```

**Dependencies**: `apps/app/lib/hooks/use-sse-stream.ts`
**Provides**: `EntryForm` component (updated, sets streaming atom)

---

### apps/app/components/journal/timeline.tsx [edit]

**Purpose**: Read the streaming atom, activate the SSE stream hook for the matching entry, pass streaming state down to EntryCard, and clean up after streaming completes.

**TOTAL CHANGES**: 4

**Changes**:

1. Lines 1-12: Add imports for `useAtom` from `jotai`, `useSseStream`, `streamingEntryIdAtom` from hook, `useQueryClient` from `@tanstack/react-query`, `journalQueryKeys`
2. Lines 14-20: Add `useSseStream` hook call and streaming atom read inside Timeline component
3. Lines 22-30: Add `useEffect` to handle stream completion — clear atom + invalidate queries
4. Lines 82-89: Pass streaming props to the matching EntryCard

**Implementation Details**:

- `const [streamingEntryId, setStreamingEntryId] = useAtom(streamingEntryIdAtom)` — read and write
- `const streamState = useSseStream(streamingEntryId)` — activates when streamingEntryId is non-null
- `useEffect` watches `streamState.isComplete` — when true, clears atom and invalidates journal queries
- In EntryCard rendering, check `entry.id === streamingEntryId` to pass streaming props

**Reference Implementation**:

```typescript
import { DeleteEntryDialog } from "@/components/journal/delete-entry-dialog";
import { EntryCard } from "@/components/journal/entry-card";
import type { JournalEntryWithAi } from "@/components/journal/entry-card";
import {
  useDeleteJournalMutation,
  useJournalListQuery,
  journalQueryKeys,
} from "@/lib/queries/journal";
import {
  streamingEntryIdAtom,
  useSseStream,
} from "@/lib/hooks/use-sse-stream";
import { groupEntriesByDate } from "@/lib/utils/date-groups";
import { Button, Skeleton } from "@repo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { BookHeart, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function Timeline() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournalListQuery();
  const navigate = useNavigate();
  const deleteMutation = useDeleteJournalMutation();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [streamingEntryId, setStreamingEntryId] = useAtom(streamingEntryIdAtom);
  const streamState = useSseStream(streamingEntryId);

  // When streaming completes, clear the atom and refresh queries to get persisted response
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
  }, [streamState.isComplete, streamingEntryId, setStreamingEntryId, queryClient]);

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

  const isEntryStreaming = (entryId: string) =>
    entryId === streamingEntryId && streamState.isStreaming;

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
```

**Dependencies**: `apps/app/lib/hooks/use-sse-stream.ts`, `apps/app/components/journal/entry-card.tsx` (updated)
**Provides**: `Timeline` component (updated with streaming)

---

### apps/app/routes/(app)/journal/$entryId.tsx [edit]

**Purpose**: Replace inline AI response rendering with the AiResponse component (full variant). Show SafetyBanner via AiResponse when hasCrisisContent is true.

**TOTAL CHANGES**: 2

**Changes**:

1. Line 21: Remove `Sparkles` import, add `AiResponse` import
2. Lines 158-170: Replace inline AI rendering with `AiResponse` component

**Implementation Details**:

- Import `AiResponse` from `@/components/journal/ai-response`
- Remove `Sparkles` from lucide-react import (no longer used)
- Replace the CardFooter content with `<AiResponse>` using `variant="full"`

**Migration Pattern**:

```typescript
// BEFORE (lines 158-170):
{entry.aiResponse && (
  <CardFooter>
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 w-full">
      <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium mb-1">AI Insight</p>
        <p className="text-sm text-muted-foreground italic">
          {entry.aiResponse.response}
        </p>
      </div>
    </div>
  </CardFooter>
)}

// AFTER:
{entry.aiResponse && (
  <CardFooter>
    <AiResponse
      response={entry.aiResponse.response}
      hasCrisisContent={entry.aiResponse.hasCrisisContent}
      variant="full"
    />
  </CardFooter>
)}
```

**Reference Implementation**:

```typescript
import { DeleteEntryDialog } from "@/components/journal/delete-entry-dialog";
import { EntryForm } from "@/components/journal/entry-form";
import { AiResponse } from "@/components/journal/ai-response";
import {
  useDeleteJournalMutation,
  useJournalByIdQuery,
} from "@/lib/queries/journal";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { MOOD_COLORS, type MoodType, type TagType } from "@repo/core";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Separator,
  Skeleton,
} from "@repo/ui";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(app)/journal/$entryId")({
  component: EntryDetail,
});

function EntryDetail() {
  const { entryId } = Route.useParams();
  const { data: entry, isLoading } = useJournalByIdQuery(entryId);
  const navigate = useNavigate();
  const deleteMutation = useDeleteJournalMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(entryId, {
      onSuccess: () => {
        navigate({ to: "/journal" });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-xl font-semibold">Entry not found</h2>
        <p className="text-muted-foreground">
          This entry may have been deleted.
        </p>
        <Button asChild variant="outline">
          <Link to="/journal">Back to Journal</Link>
        </Button>
      </div>
    );
  }

  const mood = entry.mood as MoodType;
  const MoodIcon = getMoodIcon(mood);
  const moodColor = MOOD_COLORS[mood]?.light;

  if (isEditing) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel editing
        </Button>
        <Card>
          <CardContent className="pt-6">
            <EntryForm
              entryId={entryId}
              defaultValues={{
                mood,
                tags: entry.tags as TagType[],
                note: entry.note ?? "",
              }}
              onSuccess={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/journal">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Link>
      </Button>

      <Card style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {MoodIcon && <MoodIcon className="h-6 w-6 text-muted-foreground" />}
            <div>
              <h2 className="text-xl font-semibold">{mood}</h2>
              <p className="text-sm text-muted-foreground">
                {formatRelativeTime(new Date(entry.createdAt))}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {entry.note && (
            <>
              <Separator />
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {entry.note}
              </p>
            </>
          )}
        </CardContent>

        {entry.aiResponse && (
          <CardFooter>
            <AiResponse
              response={entry.aiResponse.response}
              hasCrisisContent={entry.aiResponse.hasCrisisContent}
              variant="full"
            />
          </CardFooter>
        )}
      </Card>

      <DeleteEntryDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
```

**Dependencies**: `apps/app/components/journal/ai-response.tsx`
**Provides**: Updated `EntryDetail` route component

---

### apps/app/components/journal/safety-banner.test.tsx [create]

**Purpose**: Test that SafetyBanner renders crisis resource information correctly.

**Changes**:

1. Create test file for SafetyBanner component

**Reference Implementation**:

```typescript
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SafetyBanner } from "./safety-banner";

afterEach(() => {
  cleanup();
});

describe("SafetyBanner", () => {
  it("renders with alert role", () => {
    render(<SafetyBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("displays 988 Suicide & Crisis Lifeline info", () => {
    render(<SafetyBanner />);
    expect(
      screen.getByText(/988 Suicide & Crisis Lifeline/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "988" })).toHaveAttribute(
      "href",
      "tel:988",
    );
  });

  it("displays Crisis Text Line info", () => {
    render(<SafetyBanner />);
    expect(screen.getByText(/Crisis Text Line/)).toBeInTheDocument();
    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "741741" })).toHaveAttribute(
      "href",
      "sms:741741",
    );
  });

  it("does not have a close or dismiss button", () => {
    render(<SafetyBanner />);
    expect(
      screen.queryByRole("button", { name: /close|dismiss/i }),
    ).not.toBeInTheDocument();
  });
});
```

**Dependencies**: `apps/app/components/journal/safety-banner.tsx`
**Provides**: Test coverage for SafetyBanner

---

### apps/app/components/journal/ai-response.test.tsx [create]

**Purpose**: Test AiResponse component rendering in all states: loading, streaming, complete, crisis banner, compact vs full variants.

**Changes**:

1. Create test file for AiResponse component

**Reference Implementation**:

```typescript
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AiResponse } from "./ai-response";

afterEach(() => {
  cleanup();
});

describe("AiResponse", () => {
  it("returns null when no response and not streaming", () => {
    const { container } = render(
      <AiResponse response={null} hasCrisisContent={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows pulsing dots when streaming with no text yet", () => {
    render(
      <AiResponse
        response={null}
        hasCrisisContent={false}
        isStreaming={true}
        streamedText=""
      />,
    );
    expect(
      screen.getByLabelText("Generating AI response"),
    ).toBeInTheDocument();
  });

  it("shows streamed text while streaming", () => {
    render(
      <AiResponse
        response={null}
        hasCrisisContent={false}
        isStreaming={true}
        streamedText="Partial response"
      />,
    );
    expect(screen.getByText("Partial response")).toBeInTheDocument();
  });

  it("shows completed response when not streaming", () => {
    render(
      <AiResponse
        response="Full AI insight"
        hasCrisisContent={false}
      />,
    );
    expect(screen.getByText("Full AI insight")).toBeInTheDocument();
  });

  it("truncates text in compact variant", () => {
    const longText = "A".repeat(150);
    render(
      <AiResponse
        response={longText}
        hasCrisisContent={false}
        variant="compact"
      />,
    );
    expect(screen.getByText("A".repeat(100) + "...")).toBeInTheDocument();
  });

  it("shows full text in full variant", () => {
    const longText = "A".repeat(150);
    render(
      <AiResponse
        response={longText}
        hasCrisisContent={false}
        variant="full"
      />,
    );
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("shows AI Insight header in full variant", () => {
    render(
      <AiResponse
        response="Some insight"
        hasCrisisContent={false}
        variant="full"
      />,
    );
    expect(screen.getByText("AI Insight")).toBeInTheDocument();
  });

  it("does not show AI Insight header in compact variant", () => {
    render(
      <AiResponse
        response="Some insight"
        hasCrisisContent={false}
        variant="compact"
      />,
    );
    expect(screen.queryByText("AI Insight")).not.toBeInTheDocument();
  });

  it("renders SafetyBanner when hasCrisisContent is true", () => {
    render(
      <AiResponse
        response="Response with crisis content"
        hasCrisisContent={true}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(/988 Suicide & Crisis Lifeline/),
    ).toBeInTheDocument();
  });

  it("does not render SafetyBanner when hasCrisisContent is false", () => {
    render(
      <AiResponse
        response="Normal response"
        hasCrisisContent={false}
      />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has aria-live region for accessibility", () => {
    render(
      <AiResponse
        response="Accessible response"
        hasCrisisContent={false}
      />,
    );
    const textElement = screen.getByText("Accessible response");
    expect(textElement).toHaveAttribute("aria-live", "polite");
  });
});
```

**Dependencies**: `apps/app/components/journal/ai-response.tsx`, `apps/app/components/journal/safety-banner.tsx`
**Provides**: Test coverage for AiResponse

---

### apps/app/lib/hooks/use-sse-stream.test.ts [create]

**Purpose**: Test the useSseStream hook: connection lifecycle, event handling, cleanup on unmount, and state management.

**Changes**:

1. Create test file for useSseStream hook

**Implementation Details**:

- Mock `EventSource` globally since happy-dom doesn't provide it
- Test state transitions: idle -> streaming -> complete, idle -> streaming -> error
- Test cleanup: verify `source.close()` called on unmount
- Test reset: verify state resets when entryId changes

**Reference Implementation**:

```typescript
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSseStream } from "./use-sse-stream";

type EventHandler = (event: MessageEvent | Event) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  withCredentials: boolean;
  listeners: Record<string, EventHandler[]> = {};
  closed = false;

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = options?.withCredentials ?? false;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, handler: EventHandler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  close() {
    this.closed = true;
  }

  // Test helper: simulate an event
  emit(event: string, data?: unknown) {
    const handlers = this.listeners[event] ?? [];
    const messageEvent =
      data !== undefined
        ? new MessageEvent(event, { data: JSON.stringify(data) })
        : new Event(event);
    for (const handler of handlers) {
      handler(messageEvent);
    }
  }
}

beforeEach(() => {
  MockEventSource.instances = [];
  vi.stubGlobal("EventSource", MockEventSource);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSseStream", () => {
  it("returns initial state when entryId is null", () => {
    const { result } = renderHook(() => useSseStream(null));

    expect(result.current.streamedText).toBe("");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.hasCrisisContent).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("creates EventSource with correct URL when entryId is provided", () => {
    renderHook(() => useSseStream("jrn_abc123"));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe("/api/ai/stream/jrn_abc123");
    expect(MockEventSource.instances[0].withCredentials).toBe(true);
  });

  it("sets isStreaming to true when entryId is provided", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));

    expect(result.current.isStreaming).toBe(true);
  });

  it("accumulates text from token events", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("token", { text: "Hello " });
    });
    expect(result.current.streamedText).toBe("Hello ");

    act(() => {
      source.emit("token", { text: "world" });
    });
    expect(result.current.streamedText).toBe("Hello world");
  });

  it("handles done event correctly", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("done", {
        response: "Full response",
        hasCrisisContent: false,
      });
    });

    expect(result.current.streamedText).toBe("Full response");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasCrisisContent).toBe(false);
    expect(source.closed).toBe(true);
  });

  it("sets hasCrisisContent from done event", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("done", {
        response: "Crisis response",
        hasCrisisContent: true,
      });
    });

    expect(result.current.hasCrisisContent).toBe(true);
  });

  it("handles error event", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("error", { message: "Rate limit exceeded" });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBe("Rate limit exceeded");
    expect(source.closed).toBe(true);
  });

  it("closes EventSource on unmount", () => {
    const { unmount } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    expect(source.closed).toBe(false);
    unmount();
    expect(source.closed).toBe(true);
  });

  it("resets state and creates new EventSource when entryId changes", () => {
    const { result, rerender } = renderHook(
      ({ entryId }: { entryId: string | null }) => useSseStream(entryId),
      { initialProps: { entryId: "jrn_1" } },
    );

    const firstSource = MockEventSource.instances[0];
    act(() => {
      firstSource.emit("token", { text: "partial" });
    });
    expect(result.current.streamedText).toBe("partial");

    rerender({ entryId: "jrn_2" });

    expect(firstSource.closed).toBe(true);
    expect(MockEventSource.instances).toHaveLength(2);
    expect(result.current.streamedText).toBe("");
    expect(result.current.isStreaming).toBe(true);
  });

  it("does not create EventSource when entryId changes to null", () => {
    const { result, rerender } = renderHook(
      ({ entryId }: { entryId: string | null }) => useSseStream(entryId),
      { initialProps: { entryId: "jrn_1" as string | null } },
    );

    rerender({ entryId: null });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamedText).toBe("");
  });
});
```

**Dependencies**: `apps/app/lib/hooks/use-sse-stream.ts`
**Provides**: Test coverage for useSseStream hook

---

### apps/app/routes/(app)/journal/index.tsx [edit]

**Purpose**: No code changes needed. This file renders EntryForm and Timeline as siblings, which is the correct structure. The Jotai atom handles cross-component communication without modifying this file.

**TOTAL CHANGES**: 0

Note: This file does NOT need changes. EntryForm and Timeline communicate via the Jotai atom, not through the parent. Keeping this file unchanged avoids unnecessary coupling. Removed from the implementation plan.

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                                 | Action | Depends On                            |
| ----- | ---------------------------------------------------- | ------ | ------------------------------------- |
| 1     | `apps/app/lib/hooks/use-sse-stream.ts`               | create | --                                    |
| 1     | `apps/app/components/journal/safety-banner.tsx`      | create | --                                    |
| 2     | `apps/app/components/journal/ai-response.tsx`        | create | `safety-banner.tsx`                   |
| 2     | `apps/app/lib/hooks/use-sse-stream.test.ts`          | create | `use-sse-stream.ts`                   |
| 2     | `apps/app/components/journal/safety-banner.test.tsx` | create | `safety-banner.tsx`                   |
| 3     | `apps/app/components/journal/ai-response.test.tsx`   | create | `ai-response.tsx`                     |
| 3     | `apps/app/components/journal/entry-card.tsx`         | edit   | `ai-response.tsx`                     |
| 3     | `apps/app/routes/(app)/journal/$entryId.tsx`         | edit   | `ai-response.tsx`                     |
| 3     | `apps/app/components/journal/entry-form.tsx`         | edit   | `use-sse-stream.ts`                   |
| 4     | `apps/app/components/journal/timeline.tsx`           | edit   | `use-sse-stream.ts`, `entry-card.tsx` |

---

## Exit Criteria

### Test Commands

```bash
bun test --run                 # Run all tests (vitest, single run)
bun lint                       # ESLint with cache
bun typecheck                  # tsc --build
```

### Success Conditions

- [ ] All tests pass (exit code 0) — including new tests for AiResponse, SafetyBanner, useSseStream
- [ ] No linting errors (exit code 0)
- [ ] No type errors (exit code 0)
- [ ] Saving entry with note >= 50 chars triggers SSE stream and displays AI response
- [ ] Pulsing dots loading indicator shown before first token
- [ ] AI response text streams in incrementally in entry card
- [ ] Completed AI response visible on page reload (persisted by backend)
- [ ] Entries with short notes show no AI section
- [ ] Safety banner appears when hasCrisisContent is true
- [ ] Safety banner shows 988 Lifeline (call/text 988) and Crisis Text Line (text HOME to 741741)
- [ ] Safety banner is non-dismissible (no close button)
- [ ] AI responses visually distinct: muted bg, italic text, sparkle icon
- [ ] Screen reader announces AI response via aria-live region
- [ ] AiResponse component works in both compact (entry card) and full (entry detail) variants

### Verification Script

```bash
bun test --run && bun lint && bun typecheck
```

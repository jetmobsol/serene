# 9. Frontend Component Architecture

> **Context:** Route structure, sidebar, component specs with props/behavior, new shadcn/ui components. Use `/frontend-design` skill for visual design decisions.

---

## 9.1 Route Structure Updates

**Remove (replace with journal-focused routes):**

- `apps/app/routes/(app)/analytics.tsx` — replace with new analytics content
- `apps/app/routes/(app)/reports.tsx` — remove (not applicable)
- `apps/app/routes/(app)/users.tsx` — remove (not applicable)
- `apps/app/routes/(app)/about.tsx` — remove (not applicable)

**Add:**

- `apps/app/routes/(app)/journal/index.tsx` — Main journal page (entry form + timeline)
- `apps/app/routes/(app)/journal/$entryId.tsx` — Entry detail/edit view

**Modify:**

- `apps/app/routes/(app)/index.tsx` — Redirect to `/journal` or serve as journal page
- `apps/app/routes/(app)/analytics.tsx` — Replace with mood analytics charts

**Keep:**

- `apps/app/routes/(app)/settings.tsx` — User settings
- `apps/app/routes/(app)/route.tsx` — Auth guard layout (unchanged)

## 9.2 Sidebar Navigation Update

**File:** `apps/app/components/layout/constants.ts`

```typescript
import { BarChart3, BookHeart, Home, Settings } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BookHeart, label: "Journal", to: "/journal" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;
```

## 9.3 Component Specifications

### MoodSelector Component

**File:** `apps/app/components/journal/mood-selector.tsx`
**Props:**

```typescript
interface MoodSelectorProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
}
```

**Behavior:**

- Renders a 3x2 grid of mood cards (2 columns on mobile, 3 on tablet+).
- Each card: icon (48px), label text, colored background.
- Selected card: elevated shadow, thicker border, slight scale transform.
- Keyboard: arrow keys navigate between cards, Enter/Space selects.
- ARIA: `role="radiogroup"` with `role="radio"` on each card.

**Implementation Skill:** `/frontend-design` MUST be invoked for the mood card visual design.

### TagChips Component

**File:** `apps/app/components/journal/tag-chips.tsx`
**Props:**

```typescript
interface TagChipsProps {
  value: TagType[];
  onChange: (tags: TagType[]) => void;
}
```

**Behavior:**

- Renders a flex-wrap row of chip buttons.
- Unselected: outlined border, muted text.
- Selected: filled background (using tag's associated color), white text, check icon.
- Toggle behavior: clicking a selected chip deselects it, clicking unselected selects it.
- ARIA: Each chip is a `button` with `aria-pressed`.

### NoteEditor Component

**File:** `apps/app/components/journal/note-editor.tsx`
**Props:**

```typescript
interface NoteEditorProps {
  value: string;
  onChange: (note: string) => void;
  maxLength?: number;
}
```

**Behavior:**

- Renders a `Textarea` (from `@repo/ui`) with auto-expand.
- Below the textarea: character count display ("42 / 50 min for AI insight").
- When count >= 50: green checkmark icon next to count, text changes to "AI insight will be generated".
- When count exceeds `maxLength`: count turns red, prevents further input.
- Debounced `onChange` (300ms) to avoid excessive re-renders.

### EntryForm Component

**File:** `apps/app/components/journal/entry-form.tsx`
**Composition:**

```
EntryForm
  MoodSelector
  TagChips
  NoteEditor
  Button ("Save Entry")
```

**State Management:** Local React state for form values. On save, calls `journal.create` mutation.

### Timeline Component

**File:** `apps/app/components/journal/timeline.tsx`
**Data Source:** `journal.list` infinite query via TanStack Query.
**Rendering:**

```
Timeline
  DateGroup ("Today")
    EntryCard
    EntryCard
  DateGroup ("Yesterday")
    EntryCard
  DateGroup ("This Week")
    EntryCard
    EntryCard
  LoadMoreButton / InfiniteScrollTrigger
```

### EntryCard Component

**File:** `apps/app/components/journal/entry-card.tsx`
**Props:**

```typescript
interface EntryCardProps {
  entry: JournalEntryWithAiResponse;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

**Rendering:**

- Uses `Card` from `@repo/ui`.
- Left colored border based on mood.
- Header: mood icon + label, timestamp (relative: "2 hours ago").
- Body: tag chips (read-only, small), note preview (truncated at 150 chars).
- Footer: AI response (if present) in a distinct visual block.
- Actions: Edit (pencil icon), Delete (trash icon) — visible on hover or always visible on mobile.

### AiResponse Component

**File:** `apps/app/components/journal/ai-response.tsx`
**Props:**

```typescript
interface AiResponseProps {
  entryId: string;
  response: string | null;
  isStreaming: boolean;
  streamedText: string;
  hasCrisisContent: boolean;
}
```

**Rendering:**

- If streaming: show pulsing dots, then render text character by character as it arrives.
- If complete: show full response with a small AI icon.
- If crisis content: show `SafetyBanner` above the response.
- Visual: slightly different background color (muted), italic text, small AI sparkle icon.

### SafetyBanner Component

**File:** `apps/app/components/journal/safety-banner.tsx`
**Props:** None (static content).
**Rendering:**

- Warning-style card with phone icon.
- Text: crisis lifeline numbers (988 Suicide and Crisis Lifeline, Crisis Text Line).
- Always displayed when `hasCrisisContent` is true.
- Not dismissible.

## 9.4 New shadcn/ui Components Needed

Add to `packages/ui/` via `bun ui:add`:

| Component          | Purpose                          |
| ------------------ | -------------------------------- |
| `badge`            | Tag chips display                |
| `toast` / `sonner` | Save success/error notifications |
| `tooltip`          | Hover info on charts and icons   |
| `dropdown-menu`    | Entry card actions (edit/delete) |
| `alert-dialog`     | Delete confirmation              |
| `tabs`             | Analytics page tab navigation    |
| `progress`         | Character count visual indicator |

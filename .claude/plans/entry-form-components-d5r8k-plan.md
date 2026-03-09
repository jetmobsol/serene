# Deliverable #5: Entry Form Components (Mood Selector + Tag Chips + Note Editor) - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

Implement three journal entry form components (MoodSelector, TagChips, NoteEditor) with full ARIA accessibility, add them to a stub journal route page, update sidebar navigation with a Journal link, install required shadcn/ui components (badge, sonner, progress), and write comprehensive component tests following TDD approach. The components consume shared mood/tag constants from `@repo/core` and use `@repo/ui` primitives.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `packages/ui/index.ts` — Add re-exports for badge, sonner, progress components
- `apps/app/components/layout/constants.ts` — Add Journal sidebar item with BookHeart icon

### Files to Create

- `packages/ui/components/badge.tsx` — shadcn/ui badge component (via `bun ui:add badge`)
- `packages/ui/components/sonner.tsx` — shadcn/ui sonner toast component (via `bun ui:add sonner`)
- `packages/ui/components/progress.tsx` — shadcn/ui progress component (via `bun ui:add progress`)
- `apps/app/components/journal/mood-selector.tsx` — MoodSelector component
- `apps/app/components/journal/tag-chips.tsx` — TagChips component
- `apps/app/components/journal/note-editor.tsx` — NoteEditor component
- `apps/app/components/journal/mood-selector.test.tsx` — MoodSelector tests
- `apps/app/components/journal/tag-chips.test.tsx` — TagChips tests
- `apps/app/components/journal/note-editor.test.tsx` — NoteEditor tests
- `apps/app/routes/(app)/journal/index.tsx` — Stub journal route page
- `ai_review/user_stories/entry-form-parts.yaml` — Bowser QA user stories

---

## Code Context

### Existing Constants (packages/core/journal.ts:1-70)

All mood and tag constants are already defined and exported:

- `MOODS`: readonly array `["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"]` (line 4-11)
- `MoodType`: union type derived from MOODS (line 13)
- `MOOD_SCORES`: Record mapping moods to numeric scores (line 15-22)
- `MOOD_COLORS`: Record mapping moods to `{ light: string; dark: string }` oklch colors (line 24-37)
- `MOOD_ICONS`: Record mapping moods to lucide icon name strings (line 39-46)
- `TAGS`: readonly array of 8 tag names (line 48-57)
- `TagType`: union type derived from TAGS (line 59)
- `TAG_ICONS`: Record mapping tags to lucide icon name strings (line 61-70)
- All re-exported via `packages/core/index.ts` line 7: `export * from "./journal"`

### UI Package (packages/ui/)

- Components live at `packages/ui/components/*.tsx`
- Exports via `packages/ui/index.ts` using `export * from "./components/xyz"`
- shadcn/ui new-york style, components.json at `packages/ui/components.json`
- Add components via: `bun ui:add <name>` (runs `bunx shadcn@latest add <name> --yes` then formats)
- Existing components: avatar, button, card, checkbox, dialog, input, label, radio-group, scroll-area, select, separator, skeleton, switch, textarea
- Missing for this deliverable: **badge**, **sonner** (toast), **progress**
- `cn()` utility at `packages/ui/lib/utils.ts`
- App re-exports cn via `apps/app/lib/utils.ts` line 1: `export { cn } from "@repo/ui"`

### Sidebar Navigation (apps/app/components/layout/constants.ts:1-7)

Current items: Dashboard (Home icon, "/"), Insights (BarChart3 icon, "/analytics"), Settings (Settings icon, "/settings"). Needs Journal item added with BookHeart icon and "/journal" path.

### SidebarNav Component (apps/app/components/layout/sidebar-nav.tsx:1-33)

- Uses `SidebarNavItem` interface: `{ icon: LucideIcon; label: string; to: keyof FileRoutesByTo }`
- Uses TanStack Router `<Link>` with `activeProps` for active state styling
- Items rendered from readonly array passed via props

### Routing Pattern (apps/app/routes/(app)/)

- All pages use `createFileRoute("/(app)/path")` with a component function
- Current routes are flat files (analytics.tsx, settings.tsx, etc.)
- The journal route will be folder-based: `routes/(app)/journal/index.tsx`
- Route string will be `"/(app)/journal/"` (with trailing slash for index routes in folders)
- After creating the file, TanStack Router auto-generates the route tree (routeTree.gen.ts)
- The `to` value in sidebar constants must be `"/journal"` — TanStack Router normalizes this

### Page Layout Pattern (from apps/app/routes/(app)/settings.tsx, analytics.tsx)

All pages follow this structure:

```tsx
import { Card, CardContent, ... } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/path")({
  component: ComponentName,
});

function ComponentName() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Title</h2>
        <p className="text-muted-foreground">Description</p>
      </div>
      {/* Content */}
    </div>
  );
}
```

### Test Pattern (from apps/app/lib/errors.test.ts:1-114)

- Uses `import { describe, expect, it } from "vitest"`
- Setup file: `apps/app/vitest.setup.ts` imports `@testing-library/jest-dom/vitest`
- Test environment: happy-dom (defined in vite.config.ts line 99)
- Testing libraries available: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- Tests are colocated with source (same directory)
- Run: `bun app:test` or `bun --cwd apps/app test`
- For single run: `bun app:test -- --run`

### Bowser YAML Pattern (from ai_review/user_stories/navigation.yaml:1-19)

```yaml
stories:
  - name: "Story name"
    url: "http://localhost:5173/path"
    workflow: |
      Navigate to URL
      Verify something
      Do action
      Verify result
```

### Path Aliases

- `@/` maps to `apps/app/` root (tsconfig.json line 8: `"@/*": ["./*"]`)
- `@repo/ui` maps to `packages/ui/` (workspace package)
- `@repo/core` maps to `packages/core/` (workspace package)

---

## External Context

### lucide-react Icon Components

The mood/tag constants store icon names as strings (`"Smile"`, `"Briefcase"`, etc.). To render dynamically, we need to import each icon component individually from `lucide-react` and create a lookup map. Dynamic imports from lucide-react are not supported (tree-shaking requirement).

Icon components used by moods: `Smile`, `CloudSun`, `Zap`, `CloudRain`, `Waves`, `Flame`
Icon components used by tags: `Briefcase`, `Moon`, `Heart`, `Dumbbell`, `Palette`, `Stethoscope`, `Users`, `TreePine`
Additional icons: `BookHeart` (sidebar), `Check` (tag selected state), `CheckCircle2` (note threshold)

All icons are imported as named exports from `lucide-react` and accept `className` prop for sizing.

### shadcn/ui Badge Component

After `bun ui:add badge`, creates `packages/ui/components/badge.tsx`:

- Exports `Badge` component and `badgeVariants`
- Variants: default, secondary, destructive, outline
- Uses cva for variant styling

### shadcn/ui Sonner Component

After `bun ui:add sonner`, creates `packages/ui/components/sonner.tsx`:

- Wraps the `sonner` library's `Toaster` component
- Must add `<Toaster />` to root layout to enable toasts
- Usage: `import { toast } from "sonner"` then `toast.success("Saved!")`
- Note: For this deliverable, sonner is installed but NOT wired into the root layout. That will be done in a later deliverable when the form submission is connected to the API.

### shadcn/ui Progress Component

After `bun ui:add progress`, creates `packages/ui/components/progress.tsx`:

- Wraps Radix UI `@radix-ui/react-progress`
- Props: `value` (0-100 number), standard div props
- Renders a horizontal bar with fill percentage

### @testing-library/react

- `render(component)` renders into happy-dom
- `screen.getByRole()`, `screen.getByText()`, `screen.queryByRole()` for querying
- `screen.getByLabelText()` for form elements
- `fireEvent.click()` or `userEvent.click()` for interactions
- `userEvent.type()` for typing into inputs
- `within(element)` for scoped queries

### @testing-library/user-event

- `const user = userEvent.setup()` creates instance
- `await user.click(element)` for clicks
- `await user.type(element, text)` for typing
- `await user.keyboard("{ArrowRight}")` for keyboard events
- All methods are async

---

## Architectural Narrative

### Task

Implement three controlled React components for the journal entry form:

1. **MoodSelector** — Single-select grid of 6 mood cards with colored backgrounds, icons, keyboard navigation, and ARIA radiogroup semantics.
2. **TagChips** — Multi-select flex row of 8 tag chip buttons with toggle behavior and ARIA pressed state.
3. **NoteEditor** — Auto-expanding textarea with character count display, 50-character AI insight threshold indicator, and maxLength enforcement.

These components are rendered on a stub journal page at `/journal`, accessible from the sidebar navigation. Components are controlled (value/onChange props) and are NOT connected to any API in this deliverable.

### Architecture

The components live in `apps/app/components/journal/` and are pure presentational controlled components. They import constants from `@repo/core` (mood names, colors, icons, tags) and UI primitives from `@repo/ui` (Card, Badge, Textarea, Progress). The journal route page at `apps/app/routes/(app)/journal/index.tsx` manages local state with `useState` hooks and renders all three components.

### Selected Context

- `packages/core/journal.ts` (lines 1-70): All mood/tag type definitions and constant maps
- `packages/ui/components/card.tsx` (lines 1-84): Card, CardContent for mood cards
- `packages/ui/components/textarea.tsx` (lines 1-22): Base Textarea component
- `packages/ui/components/button.tsx` (lines 1-58): Button with variants for tag chips
- `apps/app/components/layout/constants.ts` (lines 1-7): Sidebar items array
- `apps/app/components/layout/sidebar-nav.tsx` (lines 1-33): SidebarNav with typed route links
- `apps/app/routes/(app)/settings.tsx` (lines 1-144): Reference page pattern
- `apps/app/routes/(app)/analytics.tsx` (lines 1-150): Reference page pattern

### Relationships

```
@repo/core (journal.ts)
  --> MoodSelector (imports MOODS, MOOD_COLORS, MOOD_ICONS, MoodType)
  --> TagChips (imports TAGS, TAG_ICONS, TagType)

@repo/ui (index.ts)
  --> MoodSelector (imports Card, CardContent)
  --> TagChips (imports Badge)
  --> NoteEditor (imports Textarea, Progress)

MoodSelector, TagChips, NoteEditor
  --> journal/index.tsx (renders all three with useState)

constants.ts (sidebar items)
  --> sidebar.tsx --> sidebar-nav.tsx (renders navigation links)
```

### External Context

- lucide-react icons must be imported statically (no dynamic `import()`)
- Badge component provides visual chip styling for tags
- Progress component used as visual character count bar in NoteEditor
- Sonner installed for future toast notifications (not wired in this deliverable)

### Implementation Notes

1. **Icon Lookup Pattern**: Since `MOOD_ICONS` and `TAG_ICONS` store string names, create local lookup objects mapping strings to imported icon components. This avoids dynamic imports while keeping the shared constants package agnostic of React.

2. **Mood Card Colors**: Use inline `style={{ backgroundColor }}` with the oklch values from `MOOD_COLORS`. Tailwind cannot handle dynamic oklch values at build time. Use `MOOD_COLORS[mood].light` for light mode. Dark mode detection will use a CSS custom property approach: set `--mood-bg` inline and use `dark:` variant with `MOOD_COLORS[mood].dark`.

3. **Keyboard Navigation for MoodSelector**: Implement arrow key navigation within the radiogroup. Maintain a `focusedIndex` state. On ArrowRight/ArrowDown, increment; on ArrowLeft/ArrowUp, decrement. Wrap around at boundaries. On Enter/Space, select the focused mood.

4. **Debounced onChange for NoteEditor**: Use a `useRef` + `setTimeout` pattern for 300ms debounce. The internal state updates immediately (controlled by local state), but the parent `onChange` fires after 300ms of inactivity.

5. **Auto-expand Textarea**: Set textarea height to `scrollHeight` on every input change. Use a `useRef` to access the textarea element and a `useEffect` that recalculates height when value changes.

6. **TanStack Router File-based Route**: Creating `routes/(app)/journal/index.tsx` will auto-generate the route. The `createFileRoute` path string must be `"/(app)/journal/"` (trailing slash for folder index routes). After file creation, the TanStack Router plugin regenerates `routeTree.gen.ts` on next dev server start — this file is auto-generated and should never be manually edited.

7. **Character Count Threshold**: The 50-character threshold shows a green checkmark and text change. Characters are counted from the raw input value (not the debounced value). The `maxLength` prop defaults to `500` if not specified.

### Ambiguities

1. **Dark mode mood colors**: The spec lists both light and dark oklch values. Since the app has a `.dark` class variant, we use CSS custom properties set inline with JavaScript to switch between light/dark values. Decision: use `prefers-color-scheme` media query in a `useEffect` or a simpler approach of applying light colors only for now, since dark mode toggle is not yet functional in the app (the Switch exists in settings but has no state management). **Decision**: Apply light colors with a `dark:` override using CSS custom properties.

2. **NoteEditor default maxLength**: The spec says `maxLength?: number` is optional but does not specify a default. **Decision**: Default to `500` characters, which is a reasonable journal note length. The "50 min for AI insight" text implies entries can be much longer than 50 chars.

3. **Tag colors**: The spec says selected tags use "tag's associated color" with filled background. The `TAG_ICONS` map does not include colors — only `MOOD_COLORS` has color definitions. **Decision**: Tags do not have individual colors in the data model. Use the primary theme color for all selected tags (consistent, simple, and matches the design system). This aligns with the spec's badge component which has `default` variant styling.

### Requirements

1. MoodSelector renders exactly 6 mood cards in a 2-col mobile / 3-col tablet+ grid
2. MoodSelector is single-select with visual feedback (elevated shadow, thicker border, scale)
3. MoodSelector has keyboard navigation (arrow keys) and ARIA radiogroup semantics
4. TagChips renders exactly 8 tag buttons in a flex-wrap row
5. TagChips supports multi-select toggle with aria-pressed
6. TagChips shows filled style when selected, outlined when not
7. NoteEditor renders textarea with auto-expand behavior
8. NoteEditor shows character count with "X / 50 min for AI insight" format
9. NoteEditor shows green checkmark and "AI insight will be generated" at >= 50 chars
10. NoteEditor enforces maxLength (prevents input beyond limit, count turns red)
11. NoteEditor has debounced onChange (300ms)
12. Journal route page at /journal renders all three components
13. Sidebar navigation includes Journal link with BookHeart icon
14. All component tests pass
15. Bowser QA stories all pass

### Constraints

- Must use `@repo/core` for mood/tag constants (no duplication)
- Must use `@repo/ui` for base components (Card, Badge, Textarea, Progress)
- Must use `@/` path alias for internal app imports
- Must follow existing code patterns: named exports, functional components, Prettier formatting
- Components must be controlled (value/onChange pattern)
- TDD approach: tests written before implementation
- shadcn/ui components added via `bun ui:add` (not manually created)

### Selected Approach

**Approach**: Controlled components with local icon lookup maps and inline oklch styles

**Description**: Each component is a self-contained controlled React component receiving value/onChange props. Mood card background colors use inline `style` with oklch values from `@repo/core` constants (since Tailwind cannot process dynamic oklch at build time). Icon name strings from the core package are mapped to actual lucide-react icon components via a static lookup object defined in each component file. The journal page manages all form state with `useState` hooks. The NoteEditor uses internal state for immediate display and debounces the parent onChange callback.

**Rationale**: This is the simplest correct approach. Controlled components make testing straightforward (render with props, assert output). Inline styles for dynamic colors avoid Tailwind configuration complexity. Static icon lookups are tree-shake friendly and type-safe. Local state in the page component avoids premature state management abstractions.

**Trade-offs Accepted**: (1) Icon lookup objects are duplicated across component files rather than shared — acceptable because each component needs different icons and a shared utility adds indirection for no real second use case. (2) Inline styles for mood colors bypass Tailwind's dark mode system — acceptable because oklch values from the data model are inherently dynamic and cannot be expressed as Tailwind classes.

---

## Implementation Plan

### Step 0: Install shadcn/ui Components [prerequisite]

Before any code is written, install the three missing shadcn/ui components:

```bash
cd /Users/garden/projects/PinkElephant/serene
bun ui:add badge
bun ui:add sonner
bun ui:add progress
```

This creates:

- `packages/ui/components/badge.tsx`
- `packages/ui/components/sonner.tsx`
- `packages/ui/components/progress.tsx`

Then update the UI package index to export them.

---

### packages/ui/index.ts [edit]

**Purpose**: Central export file for all UI components. Must re-export newly added badge, sonner, and progress components.

**TOTAL CHANGES**: 1 (add 3 export lines)

**Changes**:

1. After line 20 (`export * from "./components/textarea";`), add three new export lines for badge, sonner, and progress.

**Implementation Details**:

- Add `export * from "./components/badge";`
- Add `export * from "./components/progress";`
- Add `export * from "./components/sonner";`
- Maintain alphabetical order within the exports block (badge before button, progress after label, sonner after separator)

**Migration Pattern**:

```typescript
// BEFORE (line 20):
export * from "./components/textarea";

// AFTER (lines 20-23):
export * from "./components/textarea";

// New components added by bun ui:add
export * from "./components/badge";
export * from "./components/progress";
export * from "./components/sonner";
```

Note: The exact ordering may vary — the key requirement is that all three exports are present. Placing them at the end after textarea is fine (existing pattern does not enforce strict alphabetical order — it follows the order components were added).

**Dependencies**: `packages/ui/components/badge.tsx`, `packages/ui/components/progress.tsx`, `packages/ui/components/sonner.tsx` (created by `bun ui:add`)
**Provides**: `Badge`, `badgeVariants`, `Progress`, `Toaster` exported from `@repo/ui`

---

### apps/app/components/layout/constants.ts [edit]

**Purpose**: Defines sidebar navigation items. Must add Journal entry.

**TOTAL CHANGES**: 1 (add Journal sidebar item and BookHeart import)

**Changes**:

1. Add `BookHeart` to the lucide-react import on line 1, and add a Journal item to the `sidebarItems` array between Dashboard and Insights (position 2, after the "/" entry).

**Implementation Details**:

- Import `BookHeart` from `lucide-react`
- Add `{ icon: BookHeart, label: "Journal", to: "/journal" }` to the array
- Place it after Dashboard and before Insights for logical navigation flow (primary action > secondary views > settings)

**Reference Implementation**:

```typescript
import { BarChart3, BookHeart, Home, Settings } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BookHeart, label: "Journal", to: "/journal" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;
```

**Migration Pattern**:

```typescript
// BEFORE (line 1):
import { BarChart3, Home, Settings } from "lucide-react";

// AFTER:
import { BarChart3, BookHeart, Home, Settings } from "lucide-react";

// BEFORE (lines 3-7):
export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;

// AFTER:
export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BookHeart, label: "Journal", to: "/journal" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;
```

**Dependencies**: `apps/app/routes/(app)/journal/index.tsx` must exist for the `/journal` route to resolve (TanStack Router type check)
**Provides**: `sidebarItems` array with Journal entry (consumed by `sidebar.tsx` -> `sidebar-nav.tsx`)

---

### apps/app/components/journal/mood-selector.tsx [create]

**Purpose**: Single-select mood picker rendering 6 mood cards in a responsive grid with colored backgrounds, icons, keyboard navigation, and ARIA radiogroup semantics.

**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Props interface: `{ value: MoodType | null; onChange: (mood: MoodType) => void; }`
- Import `MOODS`, `MOOD_COLORS`, `MOOD_ICONS`, `MoodType` from `@repo/core`
- Import `Card`, `CardContent` from `@repo/ui`
- Import mood icon components from `lucide-react`: `Smile`, `CloudSun`, `Zap`, `CloudRain`, `Waves`, `Flame`
- Create static icon lookup: `Record<string, LucideIcon>` mapping icon name strings to components
- Render `div[role="radiogroup"][aria-label="Select your mood"]` containing 6 mood cards
- Grid: `grid grid-cols-2 md:grid-cols-3 gap-3`
- Each card: `div[role="radio"][aria-checked][aria-label][tabIndex]`
- Selected state: `ring-2 ring-primary shadow-lg scale-[1.02]` + `border-2 border-primary`
- Unselected state: `border border-border hover:shadow-md`
- Background: inline `style={{ backgroundColor: MOOD_COLORS[mood].light }}`
- Dark mode: Use a wrapper `<div>` with `className="dark:hidden"` / `dark:block` pattern, OR simpler: use CSS `color-scheme` detection. **Decision**: Use inline style with light colors; add a `[.dark_&]` selector override in className that sets opacity or uses dark colors via a CSS custom property.
- Actually simplest correct approach: Set CSS custom property `--mood-bg` inline and reference it in className. But this is overengineered. **Final decision**: Use inline `style={{ backgroundColor }}` with light colors only. The mood cards have colored backgrounds that work in both modes because the text contrast is handled separately. The oklch lightness values (0.85) provide good contrast with dark text.
- Icon: 48px (`h-12 w-12`), rendered from the lookup map
- Label: mood name text below icon
- Keyboard: `onKeyDown` handler on the radiogroup container, managing `focusedIndex` state
- Arrow Right/Down: focus next, Arrow Left/Up: focus previous, Enter/Space: select focused
- Focus management: `useRef` array for card elements, `element.focus()` on arrow key press

**Reference Implementation**:

```tsx
import { MOODS, MOOD_COLORS, MOOD_ICONS, type MoodType } from "@repo/core";
import type { LucideIcon } from "lucide-react";
import { CloudRain, CloudSun, Flame, Smile, Waves, Zap } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  Smile,
  CloudSun,
  Zap,
  CloudRain,
  Waves,
  Flame,
};

interface MoodSelectorProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let nextIndex = focusedIndex;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextIndex = (focusedIndex + 1) % MOODS.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          nextIndex = (focusedIndex - 1 + MOODS.length) % MOODS.length;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onChange(MOODS[focusedIndex]);
          return;
        default:
          return;
      }

      setFocusedIndex(nextIndex);
      cardRefs.current[nextIndex]?.focus();
    },
    [focusedIndex, onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Select your mood"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
    >
      {MOODS.map((mood, index) => {
        const Icon = ICON_MAP[MOOD_ICONS[mood]];
        const isSelected = value === mood;
        const colors = MOOD_COLORS[mood];

        return (
          <div
            key={mood}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            role="radio"
            aria-checked={isSelected}
            aria-label={mood}
            tabIndex={index === focusedIndex ? 0 : -1}
            onClick={() => {
              onChange(mood);
              setFocusedIndex(index);
            }}
            onFocus={() => setFocusedIndex(index)}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 cursor-pointer transition-all duration-150 select-none ${
              isSelected
                ? "ring-2 ring-primary shadow-lg scale-[1.02] border-2 border-primary"
                : "border border-border hover:shadow-md"
            }`}
            style={{ backgroundColor: colors.light }}
          >
            {Icon && <Icon className="h-12 w-12 text-foreground/80" />}
            <span className="text-sm font-medium text-foreground/90">
              {mood}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

**Dependencies**: `@repo/core` (MOODS, MOOD_COLORS, MOOD_ICONS, MoodType)
**Provides**: `MoodSelector` component with props `{ value: MoodType | null; onChange: (mood: MoodType) => void }`

---

### apps/app/components/journal/tag-chips.tsx [create]

**Purpose**: Multi-select tag chip buttons rendering 8 tags in a flex-wrap row with toggle behavior and ARIA pressed semantics.

**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Props interface: `{ value: TagType[]; onChange: (tags: TagType[]) => void; }`
- Import `TAGS`, `TAG_ICONS`, `TagType` from `@repo/core`
- Import tag icon components from `lucide-react`: `Briefcase`, `Moon`, `Heart`, `Dumbbell`, `Palette`, `Stethoscope`, `Users`, `TreePine`, `Check`
- Create static icon lookup: `Record<string, LucideIcon>` mapping icon name strings to components
- Render `div[role="group"][aria-label="Select tags"]` containing 8 buttons
- Layout: `flex flex-wrap gap-2`
- Each chip: `button[aria-pressed][type="button"]`
- Selected state: `bg-primary text-primary-foreground` with Check icon prefix
- Unselected state: `border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground`
- Toggle logic: on click, if tag in value array -> remove it; if not -> add it
- Each chip shows: icon (16px) + tag label text, and Check icon when selected

**Reference Implementation**:

```tsx
import { TAGS, TAG_ICONS, type TagType } from "@repo/core";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Check,
  Dumbbell,
  Heart,
  Moon,
  Palette,
  Stethoscope,
  TreePine,
  Users,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Moon,
  Heart,
  Dumbbell,
  Palette,
  Stethoscope,
  Users,
  TreePine,
};

interface TagChipsProps {
  value: TagType[];
  onChange: (tags: TagType[]) => void;
}

export function TagChips({ value, onChange }: TagChipsProps) {
  function handleToggle(tag: TagType) {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  }

  return (
    <div role="group" aria-label="Select tags" className="flex flex-wrap gap-2">
      {TAGS.map((tag) => {
        const Icon = ICON_MAP[TAG_ICONS[tag]];
        const isSelected = value.includes(tag);

        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isSelected}
            onClick={() => handleToggle(tag)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {Icon && <Icon className="h-4 w-4" />}
            {tag}
          </button>
        );
      })}
    </div>
  );
}
```

**Dependencies**: `@repo/core` (TAGS, TAG_ICONS, TagType)
**Provides**: `TagChips` component with props `{ value: TagType[]; onChange: (tags: TagType[]) => void }`

---

### apps/app/components/journal/note-editor.tsx [create]

**Purpose**: Auto-expanding textarea with character count, 50-character AI insight threshold indicator, maxLength enforcement, and debounced onChange.

**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Props interface: `{ value: string; onChange: (note: string) => void; maxLength?: number; }`
- Default maxLength: 500
- Import `Textarea` from `@repo/ui`
- Import `CheckCircle2` from `lucide-react`
- Internal state: `localValue` (string) for immediate display
- Debounce: `useRef<ReturnType<typeof setTimeout>>` for timeout ID, `useEffect` cleanup
- Auto-expand: `textareaRef` measuring `scrollHeight`, set in `useEffect` triggered by `localValue`
- Character count display: `<div>` below textarea showing "{count} / 50 min for AI insight"
- At >= 50 chars: green CheckCircle2 icon, text changes to "{count} / AI insight will be generated"
- At maxLength: count text turns red (`text-destructive`), input prevented via `maxLength` attr on textarea
- Progress bar: visual indicator using `@repo/ui` Progress component, value = `Math.min((count / 50) * 100, 100)`
- Sync: when prop `value` changes externally, sync `localValue` via `useEffect`

**Reference Implementation**:

```tsx
import { Textarea } from "@repo/ui";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const AI_INSIGHT_THRESHOLD = 50;
const DEFAULT_MAX_LENGTH = 500;

interface NoteEditorProps {
  value: string;
  onChange: (note: string) => void;
  maxLength?: number;
}

export function NoteEditor({
  value,
  onChange,
  maxLength = DEFAULT_MAX_LENGTH,
}: NoteEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-expand textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localValue]);

  // Debounced onChange
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length > maxLength) return;

      setLocalValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 300);
    },
    [maxLength, onChange],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const charCount = localValue.length;
  const meetsThreshold = charCount >= AI_INSIGHT_THRESHOLD;
  const atLimit = charCount >= maxLength;

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        placeholder="Write about your day... (50 characters for AI insight)"
        className="min-h-[120px] resize-none"
        maxLength={maxLength}
      />
      <div className="flex items-center gap-2 text-sm">
        {meetsThreshold && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        <span
          className={
            atLimit
              ? "text-destructive"
              : meetsThreshold
                ? "text-green-600"
                : "text-muted-foreground"
          }
        >
          {charCount}
          {meetsThreshold
            ? " / AI insight will be generated"
            : ` / ${AI_INSIGHT_THRESHOLD} min for AI insight`}
        </span>
      </div>
    </div>
  );
}
```

**Dependencies**: `@repo/ui` (Textarea)
**Provides**: `NoteEditor` component with props `{ value: string; onChange: (note: string) => void; maxLength?: number }`

---

### apps/app/components/journal/mood-selector.test.tsx [create]

**Purpose**: Component tests for MoodSelector covering rendering, selection, and keyboard navigation.

**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Test framework: Vitest + @testing-library/react + @testing-library/user-event
- Test cases:
  1. Renders all 6 mood options with correct labels
  2. Each mood card has role="radio" with aria-checked="false" initially
  3. Clicking a mood calls onChange with the correct MoodType
  4. Selected mood has aria-checked="true"
  5. Clicking a different mood deselects previous (only one aria-checked="true")
  6. Arrow key navigation moves focus between moods
  7. Enter/Space selects the focused mood
  8. Radiogroup has correct aria-label

**Reference Implementation**:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoodSelector } from "./mood-selector";

afterEach(cleanup);

describe("MoodSelector", () => {
  it("renders all 6 mood options", () => {
    render(<MoodSelector value={null} onChange={() => {}} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(6);

    expect(screen.getByLabelText("Happy")).toBeInTheDocument();
    expect(screen.getByLabelText("Calm")).toBeInTheDocument();
    expect(screen.getByLabelText("Anxious")).toBeInTheDocument();
    expect(screen.getByLabelText("Sad")).toBeInTheDocument();
    expect(screen.getByLabelText("Overwhelmed")).toBeInTheDocument();
    expect(screen.getByLabelText("Angry")).toBeInTheDocument();
  });

  it("has a radiogroup with aria-label", () => {
    render(<MoodSelector value={null} onChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "Select your mood",
    );
  });

  it("shows no mood selected initially when value is null", () => {
    render(<MoodSelector value={null} onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("aria-checked", "false");
    });
  });

  it("shows the correct mood as selected", () => {
    render(<MoodSelector value="Calm" onChange={() => {}} />);
    expect(screen.getByLabelText("Calm")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText("Happy")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls onChange with the mood when clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value={null} onChange={handleChange} />);
    await user.click(screen.getByLabelText("Happy"));

    expect(handleChange).toHaveBeenCalledWith("Happy");
  });

  it("calls onChange with a different mood on second click", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value="Happy" onChange={handleChange} />);
    await user.click(screen.getByLabelText("Sad"));

    expect(handleChange).toHaveBeenCalledWith("Sad");
  });

  it("navigates with arrow keys", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value={null} onChange={handleChange} />);

    // Focus the first radio
    const firstRadio = screen.getByLabelText("Happy");
    firstRadio.focus();

    // Arrow right to next
    await user.keyboard("{ArrowRight}");
    expect(screen.getByLabelText("Calm")).toHaveFocus();

    // Arrow right again
    await user.keyboard("{ArrowRight}");
    expect(screen.getByLabelText("Anxious")).toHaveFocus();

    // Enter to select
    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenCalledWith("Anxious");
  });

  it("wraps around on arrow key navigation", async () => {
    const user = userEvent.setup();

    render(<MoodSelector value={null} onChange={() => {}} />);

    // Focus the last radio
    const lastRadio = screen.getByLabelText("Angry");
    lastRadio.focus();

    // Arrow right should wrap to first
    await user.keyboard("{ArrowRight}");
    expect(screen.getByLabelText("Happy")).toHaveFocus();
  });

  it("selects with Space key", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<MoodSelector value={null} onChange={handleChange} />);

    const firstRadio = screen.getByLabelText("Happy");
    firstRadio.focus();

    await user.keyboard(" ");
    expect(handleChange).toHaveBeenCalledWith("Happy");
  });
});
```

**Dependencies**: `apps/app/components/journal/mood-selector.tsx`
**Provides**: Test coverage for MoodSelector

---

### apps/app/components/journal/tag-chips.test.tsx [create]

**Purpose**: Component tests for TagChips covering rendering, multi-select toggle, and accessibility.

**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Test cases:
  1. Renders all 8 tag buttons with correct labels
  2. All buttons have aria-pressed="false" initially
  3. Clicking a tag calls onChange with that tag added
  4. Selected tags show aria-pressed="true"
  5. Clicking a selected tag removes it (toggle off)
  6. Multiple tags can be selected simultaneously
  7. Group has correct aria-label

**Reference Implementation**:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagChips } from "./tag-chips";

afterEach(cleanup);

describe("TagChips", () => {
  it("renders all 8 tag buttons", () => {
    render(<TagChips value={[]} onChange={() => {}} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(8);

    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Sleep")).toBeInTheDocument();
    expect(screen.getByText("Relationships")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
    expect(screen.getByText("Hobbies")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Nature")).toBeInTheDocument();
  });

  it("has a group with aria-label", () => {
    render(<TagChips value={[]} onChange={() => {}} />);
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Select tags",
    );
  });

  it("shows no tags selected initially", () => {
    render(<TagChips value={[]} onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("shows selected tags with aria-pressed true", () => {
    render(<TagChips value={["Work", "Fitness"]} onChange={() => {}} />);
    expect(screen.getByText("Work").closest("button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Fitness").closest("button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Sleep").closest("button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onChange with tag added when clicking unselected tag", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TagChips value={[]} onChange={handleChange} />);
    await user.click(screen.getByText("Work"));

    expect(handleChange).toHaveBeenCalledWith(["Work"]);
  });

  it("calls onChange with tag removed when clicking selected tag", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TagChips value={["Work", "Fitness"]} onChange={handleChange} />);
    await user.click(screen.getByText("Work"));

    expect(handleChange).toHaveBeenCalledWith(["Fitness"]);
  });

  it("supports multi-select (adds to existing selection)", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TagChips value={["Work"]} onChange={handleChange} />);
    await user.click(screen.getByText("Fitness"));

    expect(handleChange).toHaveBeenCalledWith(["Work", "Fitness"]);
  });
});
```

**Dependencies**: `apps/app/components/journal/tag-chips.tsx`
**Provides**: Test coverage for TagChips

---

### apps/app/components/journal/note-editor.test.tsx [create]

**Purpose**: Component tests for NoteEditor covering rendering, character count, threshold indicator, maxLength, and debounced onChange.

**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Test cases:
  1. Renders textarea with placeholder text
  2. Shows character count
  3. Shows "X / 50 min for AI insight" below threshold
  4. Shows green checkmark and "AI insight will be generated" at >= 50 chars
  5. Turns count red at maxLength
  6. Prevents input beyond maxLength (via maxLength attr)
  7. Calls onChange after debounce delay
  8. Uses `vi.useFakeTimers()` for debounce testing

**Reference Implementation**:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoteEditor } from "./note-editor";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("NoteEditor", () => {
  it("renders textarea with placeholder", () => {
    render(<NoteEditor value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/50 characters/i)).toBeInTheDocument();
  });

  it("shows character count for empty input", () => {
    render(<NoteEditor value="" onChange={() => {}} />);
    expect(screen.getByText(/0 \/ 50 min for AI insight/)).toBeInTheDocument();
  });

  it("updates character count as user types", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<NoteEditor value="" onChange={() => {}} />);
    const textarea = screen.getByPlaceholderText(/50 characters/i);
    await user.type(textarea, "Hello");

    expect(screen.getByText(/5 \/ 50 min for AI insight/)).toBeInTheDocument();
  });

  it("shows AI insight indicator at 50+ characters", async () => {
    const longText = "a".repeat(50);
    render(<NoteEditor value={longText} onChange={() => {}} />);

    expect(
      screen.getByText(/50 \/ AI insight will be generated/),
    ).toBeInTheDocument();
  });

  it("shows green checkmark at threshold", () => {
    const longText = "a".repeat(50);
    const { container } = render(
      <NoteEditor value={longText} onChange={() => {}} />,
    );
    // CheckCircle2 icon renders as svg
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("calls onChange after debounce delay", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const handleChange = vi.fn();

    render(<NoteEditor value="" onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText(/50 characters/i);

    await user.type(textarea, "Hi");

    // onChange should not have been called yet (debounce)
    expect(handleChange).not.toHaveBeenCalled();

    // Advance timers past debounce delay
    vi.advanceTimersByTime(300);

    expect(handleChange).toHaveBeenCalledWith("Hi");
  });

  it("respects maxLength prop", () => {
    render(<NoteEditor value="" onChange={() => {}} maxLength={10} />);
    const textarea = screen.getByPlaceholderText(/50 characters/i);
    expect(textarea).toHaveAttribute("maxLength", "10");
  });

  it("shows destructive color at maxLength", () => {
    render(
      <NoteEditor value={"a".repeat(10)} onChange={() => {}} maxLength={10} />,
    );
    const countText = screen.getByText(/10 \/ AI insight/);
    expect(countText).toHaveClass("text-destructive");
  });
});
```

**Dependencies**: `apps/app/components/journal/note-editor.tsx`
**Provides**: Test coverage for NoteEditor

---

### apps/app/routes/(app)/journal/index.tsx [create]

**Purpose**: Stub journal route page at `/journal` that renders MoodSelector, TagChips, and NoteEditor with local state management.

**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Uses `createFileRoute("/(app)/journal/")` (trailing slash for folder index)
- Three `useState` hooks: `selectedMood: MoodType | null`, `selectedTags: TagType[]`, `note: string`
- Follows the existing page layout pattern with `<div className="p-6 space-y-6">`
- Renders a heading section, then three sections with labels for each component
- No form submission — this is a stub page (API wiring comes in a later deliverable)

**Reference Implementation**:

```tsx
import { MoodSelector } from "@/components/journal/mood-selector";
import { NoteEditor } from "@/components/journal/note-editor";
import { TagChips } from "@/components/journal/tag-chips";
import type { MoodType, TagType } from "@repo/core";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/(app)/journal/")({
  component: Journal,
});

function Journal() {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [note, setNote] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Journal Entry</h2>
        <p className="text-muted-foreground">
          How are you feeling today? Record your mood and thoughts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mood</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodSelector value={selectedMood} onChange={setSelectedMood} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagChips value={selectedTags} onChange={setSelectedTags} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteEditor value={note} onChange={setNote} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Dependencies**: `apps/app/components/journal/mood-selector.tsx`, `apps/app/components/journal/tag-chips.tsx`, `apps/app/components/journal/note-editor.tsx`
**Provides**: `/journal` route page (consumed by TanStack Router auto-generation and sidebar navigation)

---

### ai_review/user_stories/entry-form-parts.yaml [create]

**Purpose**: Bowser QA user stories for visual/functional testing of the journal entry form components.

**TOTAL CHANGES**: N/A (new file)

**Reference Implementation**:

```yaml
stories:
  - name: "Mood selector displays 6 moods"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the journal page loads successfully
      Verify exactly 6 mood options are visible: Happy, Calm, Anxious, Sad, Overwhelmed, Angry
      Verify each mood option has an icon and label
      Click the "Happy" mood option
      Verify the Happy option shows a selected/active visual state
      Click the "Sad" mood option
      Verify Sad is now selected and Happy is deselected

  - name: "Tag chips allow multi-select"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify tag chips are visible with labels: Work, Sleep, Relationships, Fitness, Hobbies, Health, Social, Nature
      Click the "Work" tag chip
      Verify "Work" shows a selected/active visual state
      Click the "Fitness" tag chip
      Verify both "Work" and "Fitness" are selected (multi-select)
      Click "Work" again
      Verify "Work" is deselected and "Fitness" remains selected

  - name: "Note editor shows character count"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify a text area is visible with placeholder text mentioning 50 characters
      Verify a character count indicator is visible
      Type "Short note" into the text area
      Verify the character count updates (should show approximately 10 characters)
      Type a longer note with at least 50 characters: "This is a longer reflective note about my day and how I am feeling right now today"
      Verify a visual indicator confirms AI insight will be generated (green checkmark or text change)
```

**Dependencies**: None (standalone YAML file)
**Provides**: Bowser QA test definitions for `/ui-review entry-form-parts`

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                                                 | Action  | Depends On                                                                      |
| ----- | -------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| 0     | (prerequisite) Install shadcn/ui: `bun ui:add badge sonner progress` | command | --                                                                              |
| 1     | `packages/ui/index.ts`                                               | edit    | shadcn/ui components installed (Phase 0)                                        |
| 1     | `apps/app/components/journal/mood-selector.tsx`                      | create  | --                                                                              |
| 1     | `apps/app/components/journal/tag-chips.tsx`                          | create  | --                                                                              |
| 1     | `apps/app/components/journal/note-editor.tsx`                        | create  | --                                                                              |
| 1     | `ai_review/user_stories/entry-form-parts.yaml`                       | create  | --                                                                              |
| 2     | `apps/app/components/journal/mood-selector.test.tsx`                 | create  | `apps/app/components/journal/mood-selector.tsx`                                 |
| 2     | `apps/app/components/journal/tag-chips.test.tsx`                     | create  | `apps/app/components/journal/tag-chips.tsx`                                     |
| 2     | `apps/app/components/journal/note-editor.test.tsx`                   | create  | `apps/app/components/journal/note-editor.tsx`                                   |
| 2     | `apps/app/routes/(app)/journal/index.tsx`                            | create  | `mood-selector.tsx`, `tag-chips.tsx`, `note-editor.tsx`                         |
| 3     | `apps/app/components/layout/constants.ts`                            | edit    | `apps/app/routes/(app)/journal/index.tsx` (route must exist for type-safe `to`) |

---

## Exit Criteria

### Test Commands

```bash
bun --cwd apps/app test -- --run    # Run all app tests (single run, no watch)
bun lint                             # ESLint with cache
bun typecheck                        # tsc --build (all workspaces)
```

### Success Conditions

- [ ] All tests pass (exit code 0) — `bun --cwd apps/app test -- --run`
- [ ] No linting errors (exit code 0) — `bun lint`
- [ ] No type errors (exit code 0) — `bun typecheck`
- [ ] MoodSelector renders 6 moods, single-select works, keyboard navigation works (Req 1-3)
- [ ] TagChips renders 8 tags, multi-select toggle works (Req 4-6)
- [ ] NoteEditor shows character count, 50-char threshold indicator, maxLength enforcement, debounce (Req 7-11)
- [ ] Journal route page at /journal renders all three components (Req 12)
- [ ] Sidebar navigation includes Journal link with BookHeart icon (Req 13)
- [ ] All component tests pass (Req 14)
- [ ] Bowser QA: `/ui-review entry-form-parts` -- ALL PASS (Req 15)
- [ ] `/simplify` has been run and all issues fixed
- [ ] `bun prettier --write .` and `bun prettier --check .` pass

### Verification Script

```bash
bun --cwd apps/app test -- --run && bun lint && bun typecheck && bun prettier --check .
```

### Pipeline Steps (post-implementation)

1. Run `/simplify` to review changed code; fix any issues; re-run tests
2. Run `bun prettier --write .` then `bun prettier --check .`
3. Verify `ai_review/user_stories/entry-form-parts.yaml` exists
4. Run `/ui-review entry-form-parts` -- ALL stories must PASS
5. If any story fails, fix and re-run until green
6. Manual pitstop: human reviews at http://localhost:5173/journal
7. Commit only after all gates pass

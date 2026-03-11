# CTO Analysis: Serene App Style Migration

> Source: `ai_docs/index.html` → Full App Reskin Plan
> Date: 2026-03-11
> Revised: 2026-03-11 (post-validation with codebase audit)
> Revised: 2026-03-11 (CTO validation fixes applied — see "Resolved Flaws" table)

---

## Design System Analysis

**What makes `index.html` beautiful:**

| Element           | Current App                               | Target (`index.html`)                                     |
| ----------------- | ----------------------------------------- | --------------------------------------------------------- |
| **Background**    | Near-white `oklch(0.99)`                  | Warm parchment (oklch equivalent)                         |
| **Primary color** | Generic sage oklch                        | Specific sage oklch (from `#5B7B6A`)                      |
| **Heading font**  | Lora (serif, Google Fonts) + Inter (sans) | Cormorant Garamond (serif, editorial) — self-hosted       |
| **Body font**     | Inter (sans, Google Fonts)                | DM Sans (clean geometric) — self-hosted                   |
| **Card radius**   | 0.625rem base                             | 0.875rem base (derivations stay dynamic via `calc()`)     |
| **Shadows**       | Tailwind defaults                         | Custom warm-tinted soft shadows                           |
| **Sidebar**       | Collapsible toggle                        | Fixed 260px desktop, slide-out mobile                     |
| **Entry cards**   | shadcn Card                               | Left color-border (already exists), hover translateX(4px) |
| **AI response**   | Full streaming UX — **preserve entirely** | Same streaming UX + adopt sage-pale palette               |
| **Tags**          | shadcn Badge                              | Pill-shaped, bg-background, muted text                    |
| **Topbar**        | Full border-b + toggle                    | Frosted glass, dark mode toggle + avatar + sign out       |
| **Dark mode**     | Supported — `.dark {}` block              | Fully updated in parallel with every light-mode change    |

---

## Color Palette — oklch Translation

The target palette from `index.html` translated to oklch (modern color system preserved — no downgrade to hex):

```css
/* === WARM PARCHMENT BACKGROUND (was #F5F0E8) === */
--background: oklch(0.96 0.013 82); /* warm parchment */
--bg-warm: oklch(0.93 0.016 82); /* slightly darker warm (was #EDE7DB) */
--card: oklch(0.99 0.006 82); /* near-white card (was #FFFCF7) */

/* === TEXT === */
--foreground: oklch(0.22 0.003 250); /* near-black (was #2C2C2C) */
--muted-foreground: oklch(0.47 0.01 60); /* warm mid-gray (was #6B6560) */

/* === SAGE (primary brand, was #5B7B6A) === */
--primary: oklch(0.5 0.065 155);
--sage-light: oklch(0.62 0.058 155); /* was #7A9B89 */
--secondary: oklch(0.94 0.022 155); /* sage-pale (was #E8F0EB) */

/* === TERRACOTTA (accent/destructive, was #C4785B) === */
--accent-foreground: oklch(0.62 0.12 42);
--accent: oklch(0.96 0.018 42); /* terracotta-pale (was #FBF0EB) */
--destructive: oklch(0.62 0.12 42);

/* === MOOD COLORS (charts) === */
--chart-1: oklch(0.72 0.1 82); /* gold/happy (was #C9A84C) */
--chart-2: oklch(0.5 0.065 155); /* sage/calm */
--chart-3: oklch(0.62 0.12 42); /* terracotta/anxious */
--chart-4: oklch(0.62 0.075 0); /* rose/overwhelmed (was #B87A8A) */
--chart-5: oklch(0.55 0.075 295); /* lavender/grateful (was #8B7BA8) */

/* === BORDERS & STRUCTURE === */
--border: oklch(0.88 0.014 82); /* warm border (was #E0D9CE) */
--input: oklch(0.88 0.014 82);

/* === SIDEBAR === */
--sidebar: oklch(0.99 0.006 82);
--sidebar-foreground: oklch(0.22 0.003 250);
--sidebar-primary: oklch(0.5 0.065 155);
--sidebar-primary-foreground: oklch(0.99 0 0);
--sidebar-accent: oklch(0.94 0.022 155);
--sidebar-accent-foreground: oklch(0.5 0.065 155);
--sidebar-border: oklch(0.22 0.003 250 / 6%);
--sidebar-ring: oklch(0.5 0.065 155);
```

**Dark mode equivalents** (every light variable gets a dark counterpart — same commit, no exceptions):

```css
.dark {
  --background: oklch(0.16 0.01 82);
  --card: oklch(0.2 0.01 82);
  --foreground: oklch(0.93 0.005 82);
  --muted-foreground: oklch(0.65 0.008 60);
  --primary: oklch(0.68 0.065 155);
  --primary-foreground: oklch(0.15 0.02 155);
  --secondary: oklch(0.26 0.028 155);
  --secondary-foreground: oklch(0.9 0.022 155);
  --muted: oklch(0.25 0.01 82);
  --accent: oklch(0.28 0.04 42);
  --accent-foreground: oklch(0.9 0.03 42);
  --destructive: oklch(0.68 0.12 42);
  --border: oklch(0.99 0 0 / 10%);
  --input: oklch(0.99 0 0 / 15%);
  --ring: oklch(0.62 0.065 155);
  --chart-1: oklch(0.75 0.1 82);
  --chart-2: oklch(0.68 0.065 155);
  --chart-3: oklch(0.68 0.12 42);
  --chart-4: oklch(0.68 0.075 0);
  --chart-5: oklch(0.62 0.075 295);
  --sidebar: oklch(0.2 0.01 82);
  --sidebar-foreground: oklch(0.93 0.005 82);
  --sidebar-primary: oklch(0.68 0.065 155);
  --sidebar-primary-foreground: oklch(0.93 0.005 82);
  --sidebar-accent: oklch(0.26 0.028 155);
  --sidebar-accent-foreground: oklch(0.9 0.022 155);
  --sidebar-border: oklch(0.99 0 0 / 10%);
  --sidebar-ring: oklch(0.62 0.065 155);
}
```

---

## Accent Color Semantic Shift — Awareness Note

The current `--accent` is purple/pink (`oklch(0.92 0.03 300)`). The new palette changes it to
terracotta (`oklch(0.96 0.018 42)`). This affects every component using `bg-accent`,
`hover:bg-accent`, `text-accent-foreground`, and `via-accent/*`:

- **sidebar-nav.tsx:** `hover:bg-accent hover:text-accent-foreground` and `bg-accent text-accent-foreground` (active state) — these shift from purple to terracotta. Acceptable since Step 3 replaces this styling entirely with `border-l` active state.
- **ai-response.tsx:** `via-accent/6` and `via-accent/3` in shimmer/static gradients — shifts from purple-tinted to terracotta-tinted. The effect is subtle at 3-6% opacity. Visually acceptable — warm tone aligns with the parchment palette.
- **tag-chips.tsx:** `hover:bg-accent hover:text-accent-foreground` — Step 7 replaces this styling entirely.

**No code changes required** — the semantic shift is intentional and all affected components
are either reskinned in later steps or produce acceptable results at low opacity.

---

## Chart Colors — Hardcoded in @repo/core, Not CSS Variables

The Recharts bar chart (`mood-bar-chart.tsx`) and entry cards use `MOOD_COLORS` from `@repo/core`
with **hardcoded hex/color values**, not CSS `--chart-*` variables. The `--chart-*` variable
changes in Step 1 only affect components that reference them via Tailwind classes (e.g.,
`bg-chart-1`). Recharts fills use `MOOD_COLORS[mood].light` directly.

**Action:** The `--chart-*` CSS variables are still useful for any future chart components that
use Tailwind classes, but they do **not** change existing Recharts visualizations. If chart
colors need updating to match the new palette, that's a separate change to `@repo/core`'s
`MOOD_COLORS` object — out of scope for this reskin.

---

## CSP Audit — Critical Finding

**File checked:** `apps/web/_headers` line 6:

```
Content-Security-Policy: default-src 'self'; ... font-src 'self'; ...
```

**`font-src 'self'` blocks Google Fonts.** `fonts.googleapis.com` and `fonts.gstatic.com` are
not `'self'`. The `@import url(...)` approach from the original plan would silently fail in
production — users would see system fonts and the entire typography investment delivers nothing.

**Note:** `apps/app/` has no `_headers` file today, so the SPA worker currently ships without
a CSP. The `apps/web/_headers` applies to the marketing worker only. However, the
infrastructure's `.woff2`/`.woff` cache rules show it was designed for self-hosted fonts —
we should follow that design intent and add a CSP to the app worker too.

**Decision: Self-host via `@fontsource` npm packages.**

- Zero external fetch — fonts bundled into Vite build
- Fully CSP-safe under `font-src 'self'`
- Immutable cache headers via Cloudflare assets
- No runtime dependency on Google availability

---

## UserMenu & Auth Wiring

**Current ownership:** `apps/app/components/user-menu.tsx`

- Owns `signOut(queryClient)` call (must not be duplicated or moved to another layer)
- Owns `useSessionQuery()` for user data
- Currently renders at the bottom of `Sidebar`

**Target:** Avatar + sign-out button in header top-right (matching `index.html`).

**Approach:** The `UserMenu` component's auth logic (query + signOut) moves inline into
`Header`. The old `UserMenu` component can be deleted once the header renders the same
logic. The `Sidebar` simply stops rendering `<UserMenu />`.

No new auth abstractions. `signOut(queryClient)` call stays in the same file that renders
the button — clear ownership, no indirection.

---

## Implementation Plan (Revised Sequential)

### Step 0 — Self-Host Fonts + Clean Up Google Fonts (prerequisite)

**Files:** `apps/app/package.json`, `apps/app/styles/globals.css`, `apps/app/index.html`, `apps/app/public/_headers`
**Impact: HIGH** — all typography depends on this; must ship before Step 1 visual changes

```bash
bun add @fontsource/cormorant-garamond @fontsource/dm-sans
```

**Remove Google Fonts from `apps/app/index.html`:**

The current `index.html` loads Inter + Lora from Google Fonts via `<link>` tags. These must be
removed to prevent duplicate font loading (self-hosted via CSS + external via HTML) and to
eliminate external network requests that would fail under CSP.

Remove these lines from `<head>`:

```html
<!-- DELETE these 4 lines -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap"
/>
```

**Update `<meta name="theme-color">` in `apps/app/index.html`:**

Current value `#8B9E7C` doesn't match the new sage primary (`#5B7B6A`). Mobile browser chrome
will show the wrong color.

```html
<!-- Change from -->
<meta name="theme-color" content="#8B9E7C" />
<!-- Change to -->
<meta name="theme-color" content="#5B7B6A" />
```

**Update Lora reference in `apps/app/components/auth/auth-form.tsx`:**

The auth form's "Serene" title uses an inline `fontFamily: "Lora, serif"`. Since Lora is being
removed, update this to the new heading font:

```tsx
// Change from:
style={{ fontFamily: "Lora, serif" }}
// Change to:
style={{ fontFamily: "'Cormorant Garamond', serif" }}
```

In `globals.css` (top, before `:root`):

```css
/* Self-hosted via @fontsource — CSP-safe, no external fetch */
@import "@fontsource/cormorant-garamond/300.css";
@import "@fontsource/cormorant-garamond/400.css";
@import "@fontsource/cormorant-garamond/500.css";
@import "@fontsource/cormorant-garamond/600.css";
@import "@fontsource/cormorant-garamond/300-italic.css";
@import "@fontsource/cormorant-garamond/400-italic.css";
@import "@fontsource/dm-sans/300.css";
@import "@fontsource/dm-sans/400.css";
@import "@fontsource/dm-sans/500.css";
@import "@fontsource/dm-sans/600.css";
@import "@fontsource/dm-sans/700.css";
```

**Font weight audit:** Headings in the codebase use `font-semibold` (600) and `font-bold` (700).
Cormorant Garamond's original import maxed at weight 500 — the browser would fake-bold it,
which looks bad on serif fonts. Added weight 600 above. DM Sans added weight 700 for the same
reason. These cover all `font-bold`/`font-semibold` usage found in the codebase:

- `h1/h2` headings: `font-bold` (700) in routes and error boundaries
- `h3` subheadings: `font-semibold` (600) in journal, timeline, entry-form
- Safety banner: `font-bold` (700) on phone numbers

Create `apps/app/public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; connect-src 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable
```

---

### Step 1 — CSS Variables + Typography

**File:** `apps/app/styles/globals.css`
**Impact: HIGH** — cascades to every shadcn component automatically
**Rule:** Every `:root {}` change ships with `.dark {}` counterpart in the same commit.

```css
:root {
  --radius: 0.875rem; /* was 0.625rem — cascades automatically to all derived radii */

  --background: oklch(0.96 0.013 82);
  --foreground: oklch(0.22 0.003 250);
  --card: oklch(0.99 0.006 82);
  --card-foreground: oklch(0.22 0.003 250);
  --popover: oklch(0.99 0.006 82);
  --popover-foreground: oklch(0.22 0.003 250);

  --primary: oklch(0.5 0.065 155);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.94 0.022 155);
  --secondary-foreground: oklch(0.5 0.065 155);

  --muted: oklch(0.93 0.016 82);
  --muted-foreground: oklch(0.47 0.01 60);

  --accent: oklch(0.96 0.018 42);
  --accent-foreground: oklch(0.62 0.12 42);

  --destructive: oklch(0.62 0.12 42);
  --destructive-foreground: oklch(0.99 0 0);

  --border: oklch(0.88 0.014 82);
  --input: oklch(0.88 0.014 82);
  --ring: oklch(0.5 0.065 155);

  --chart-1: oklch(0.72 0.1 82);
  --chart-2: oklch(0.5 0.065 155);
  --chart-3: oklch(0.62 0.12 42);
  --chart-4: oklch(0.62 0.075 0);
  --chart-5: oklch(0.55 0.075 295);

  --sidebar: oklch(0.99 0.006 82);
  --sidebar-foreground: oklch(0.22 0.003 250);
  --sidebar-primary: oklch(0.5 0.065 155);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.94 0.022 155);
  --sidebar-accent-foreground: oklch(0.5 0.065 155);
  --sidebar-border: oklch(0.22 0.003 250 / 6%);
  --sidebar-ring: oklch(0.5 0.065 155);
}

.dark {
  /* ... full dark block from palette section above ... */
}

@layer base {
  body {
    font-family: "DM Sans", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  h1,
  h2,
  h3,
  h4 {
    font-family: "Cormorant Garamond", serif;
    font-weight: 400;
    letter-spacing: -0.01em;
  }
}
```

---

### Step 2 — Tailwind Radius (No File Edit Required)

**File:** `apps/app/tailwind.config.css`
**Impact: ZERO** — `--radius: 0.875rem` from Step 1 cascades automatically

The existing dynamic system in `tailwind.config.css` stays exactly as-is:

```css
--radius-sm: calc(var(--radius) - 4px); /* → ~10px */
--radius-md: calc(var(--radius) - 2px); /* → ~12px */
--radius-lg: var(--radius); /* → 14px */
--radius-xl: calc(var(--radius) + 4px); /* → ~18px */
```

Do NOT override these with hardcoded pixel values. The `calc()` relationship preserves
a single source of truth. Changing `--radius` in Step 1 is the only action needed.

---

### Step 3 — Sidebar Redesign

**Files:** `apps/app/components/layout/sidebar.tsx`, `apps/app/components/layout/sidebar-nav.tsx`
**Impact: HIGH**

Key changes:

- Desktop: fixed 260px, CSS `translate-x-0` always (no collapse on lg+)
- Mobile: `translate-x-0` when open, `-translate-x-full` when closed (transform, not width/0 toggle)
- Logo: Cormorant Garamond + terracotta dot
- Nav: `border-l-[3px]` active state replaces `rounded-md bg-accent`
- Remove `<UserMenu />` from sidebar bottom

```tsx
// sidebar.tsx
export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          aria-hidden="true" />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40
        bg-sidebar border-r border-sidebar-border flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-7 py-6 mb-2">
          <span style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-2xl font-medium tracking-widest text-primary">
            Serene
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-foreground
              ml-0.5 align-super" aria-hidden="true" />
          </span>
        </div>

        <SidebarNav items={sidebarItems} />
        {/* UserMenu removed — now lives in Header */}
      </aside>
    </>
  );
}

// sidebar-nav.tsx — update Link className only
<Link
  className="flex items-center gap-3 px-7 py-3 text-sm
    border-l-[3px] border-transparent
    text-muted-foreground hover:text-foreground hover:bg-muted
    transition-all"
  activeProps={{
    className: "border-primary bg-secondary text-primary font-medium"
  }}
>
```

---

### Step 4 — Topbar Redesign + UserMenu Relocation

**Files:** `apps/app/components/layout/header.tsx`, new `apps/app/components/layout/dark-mode-toggle.tsx`
**Impact: MEDIUM** (auth logic moves here — must be tested)

```tsx
// header.tsx
import { signOut, useSessionQuery } from "@/lib/queries/session";
import { useQueryClient } from "@tanstack/react-query";
import { DarkModeToggle } from "./dark-mode-toggle";

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery();
  const user = session?.user;
  const initials = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <header
      className="
      fixed top-0 left-0 lg:left-64 right-0 h-14 z-30
      flex items-center justify-between px-4 lg:px-9
      bg-background/85 backdrop-blur-md border-b border-border/40
    "
    >
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
        <DarkModeToggle />

        {user && (
          <button
            onClick={() => signOut(queryClient)}
            className="rounded-full border border-border/50 px-3.5 py-1.5 text-xs
              font-medium text-muted-foreground
              hover:text-accent-foreground hover:border-accent-foreground/30
              hover:bg-accent transition-all"
          >
            Sign out
          </button>
        )}

        {user && (
          <div
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground
            flex items-center justify-center text-xs font-semibold shrink-0"
            title={user.name ?? user.email}
          >
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
```

```tsx
// dark-mode-toggle.tsx (new file, ~30 lines)
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export function DarkModeToggle() {
  // Initialize as null to avoid flash-of-wrong-theme.
  // The useEffect resolves the correct theme before first meaningful paint.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Don't render until theme is resolved — prevents icon flicker
  if (dark === null) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-muted transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
```

**Optional early theme script:** To prevent any flash of light theme on dark-preference users,
add this inline script to `apps/app/index.html` inside `<head>`, before any CSS loads:

```html
<script>
  (function () {
    var t = localStorage.getItem("theme");
    var d =
      t === "dark" || (!t && matchMedia("(prefers-color-scheme:dark)").matches);
    if (d) document.documentElement.classList.add("dark");
  })();
</script>
```

This runs synchronously before React mounts, so the correct theme class is applied before
the first paint. The `DarkModeToggle` useEffect then syncs React state with the already-applied
class. **Note:** If adding a CSP with `script-src`, this inline script needs a nonce or hash.

---

### Step 3+4 Prerequisite — Layout Wrapper Refactor

**File:** `apps/app/components/layout/index.tsx`
**Impact: HIGH** — this is the parent of both sidebar and header; must be updated in the same PR

The sidebar changes from flex-flow width collapse to fixed positioning. The header becomes
fixed as well. The layout wrapper must change from `flex` to a simple container with padding
offsets.

**Current layout (flex-based, width collapse):**

```tsx
<div className="h-screen flex bg-background">
  <Sidebar isOpen={sidebarOpen} />
  <div className="flex-1 flex flex-col overflow-hidden">
    <Header ... />
    <main className="flex-1 overflow-auto">
      <div className="h-full">{children}</div>
    </main>
  </div>
</div>
```

**New layout (fixed sidebar + header, padding offsets):**

```tsx
import { useState, useCallback } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <Header
        isSidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main content — offset by fixed sidebar (lg) and fixed header */}
      <main className="lg:pl-64 pt-14 min-h-screen bg-background">
        <div className="h-full">{children}</div>
      </main>
    </>
  );
}
```

**Key changes from current:**

- `sidebarOpen` defaults to `false` (mobile-first; desktop shows via `lg:translate-x-0`)
- Sidebar receives `onClose` callback — used by the overlay click and optionally by route navigation
- Flex layout replaced with fixed elements + padding offsets (`lg:pl-64` = 256px = sidebar width, `pt-14` = 56px = header height)
- No `overflow-hidden` on outer container — scrolling is natural on `<main>`

**Sidebar `onClose` prop wiring** (update to Step 3 sidebar code):

```tsx
// sidebar.tsx — add onClose to overlay
{
  isOpen && (
    <div
      className="fixed inset-0 bg-black/20 z-30 lg:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
```

---

### Step 5 — Entry Card Reskin

**File:** `apps/app/components/journal/entry-card.tsx`
**Impact: LOW** — left-border already exists; delta is hover + shadow + tag style

```tsx
// Card wrapper — add group + hover effects only
<Card className="relative overflow-hidden group
  hover:translate-x-1 hover:shadow-[0_4px_20px_oklch(0.22_0.003_250/6%)]
  transition-all duration-200 cursor-pointer"
  style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}>

// Tags — replace Badge with pill span
<span className="px-3 py-0.5 rounded-full bg-background border border-border
  text-xs text-muted-foreground font-medium">
  {tag}
</span>

// Dropdown trigger — add opacity fade on hover
<div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
```

**Do not touch `AnimatePresence`, `AiResponse`, or any motion logic.**

---

### Step 6 — Mood Selector Reskin

**File:** `apps/app/components/journal/mood-selector.tsx`
**Impact: MEDIUM** — keyboard a11y (`role="radiogroup"`, `ArrowKey` nav) preserved

Only the card div `className` string changes:

```tsx
// Replace the current className string with:
className={`flex flex-col items-center justify-center gap-2 rounded-[14px] p-5
  cursor-pointer transition-all duration-150 select-none border-2
  ${isSelected
    ? "border-primary bg-secondary"
    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
  }`}
style={{ backgroundColor: isSelected ? undefined : colors.light }}
```

The `role`, `aria-checked`, `tabIndex`, `onKeyDown`, ref wiring — **untouched**.

---

### Step 7 — Tag Chips Reskin

**File:** `apps/app/components/journal/tag-chips.tsx`
**Impact: LOW**

```tsx
// Unselected
<button className="px-[18px] py-2 rounded-full border border-border bg-card
  text-sm font-medium text-muted-foreground hover:border-primary/40 transition-all">

// Selected
<button className="px-[18px] py-2 rounded-full bg-primary border-2 border-primary
  text-primary-foreground text-sm font-medium transition-all">
```

---

### Step 8 — AI Response Style Enhancement (NOT a rewrite)

**File:** `apps/app/components/journal/ai-response.tsx`
**Impact: MINIMAL** — one class addition only

**CRITICAL: Preserve entirely without modification:**

- Streaming shimmer gradient animation (`animate-shimmer`)
- Animated bouncing dots loading state (`"Reflecting on your entry"`)
- Sparkles icon with glow + rotation animation during streaming
- Blinking cursor during streaming
- `SafetyBanner` integration for crisis content
- `compact` / `full` variant prop and all their differences
- `aria-live="polite"` on the text paragraph

**What changes:** The new CSS variables from Step 1 automatically update the component's
existing semantic color references (`bg-primary/5`, `bg-accent/3`, `border-primary/10`,
`text-primary`, `text-muted-foreground`). No code change required for these.

The only explicit tweak — compact variant gets a slightly warmer background:

```tsx
// In the content wrapper div, change compact gap/padding:
variant === "compact" ? "gap-2.5 p-2.5 bg-secondary/30" : "gap-3 p-4";
//                                    ^^^^^^^^^^^^^^^^^ only addition
```

That is the entire change to this file.

---

## File Change Summary

| File                                              | Change Type                                                     | Effort | Risk   |
| ------------------------------------------------- | --------------------------------------------------------------- | ------ | ------ |
| `apps/app/package.json`                           | Add `@fontsource/*` deps                                        | 5 min  | None   |
| `apps/app/index.html`                             | Remove Google Fonts links, update theme-color, add theme script | 10 min | Low    |
| `apps/app/styles/globals.css`                     | oklch palette + font imports + dark mode                        | 45 min | Low    |
| `apps/app/public/_headers`                        | Create (new file)                                               | 10 min | None   |
| `apps/app/tailwind.config.css`                    | **No changes**                                                  | 0 min  | None   |
| `apps/app/components/auth/auth-form.tsx`          | Replace `Lora` → `Cormorant Garamond` font-family               | 2 min  | None   |
| `apps/app/components/layout/index.tsx`            | Full refactor: flex → fixed positioning + padding offsets       | 20 min | Medium |
| `apps/app/components/layout/sidebar.tsx`          | Fixed layout + mobile transform + overlay onClose               | 45 min | Medium |
| `apps/app/components/layout/sidebar-nav.tsx`      | Left-border active state only                                   | 15 min | Low    |
| `apps/app/components/layout/header.tsx`           | Frosted glass + auth wiring + UserMenu inline                   | 30 min | Medium |
| `apps/app/components/layout/dark-mode-toggle.tsx` | New component (~30 lines, null-init pattern)                    | 15 min | Low    |
| `apps/app/components/user-menu.tsx`               | Delete (logic absorbed by header)                               | 5 min  | Low    |
| `apps/app/components/journal/entry-card.tsx`      | hover + shadow + tag pill                                       | 20 min | Low    |
| `apps/app/components/journal/mood-selector.tsx`   | className strings only                                          | 20 min | Low    |
| `apps/app/components/journal/tag-chips.tsx`       | className strings only                                          | 15 min | Low    |
| `apps/app/components/journal/ai-response.tsx`     | One `bg-secondary/30` class                                     | 5 min  | None   |

**Revised total estimate: ~4.5 hours** (unchanged — new items are small; layout wrapper was already implicit)

---

## Execution Order

1. **Step 0** — Install `@fontsource/*`, remove Google Fonts from `index.html`, update theme-color, add theme script, update auth-form Lora→Cormorant, create `_headers`. Verify: fonts render in dev, zero requests to `fonts.googleapis.com` in Network tab, no console CSP violations.

   **STAGING DEPLOY after Step 0** — Font self-hosting is the highest-risk infrastructure change (CSP, Cloudflare assets pipeline, woff2 caching). Deploy fonts alone first, verify zero network errors in staging, THEN proceed to visual changes.

2. **Step 1** — CSS variables + typography. `bun app:dev` → instant warm palette. Verify dark mode class toggle works visually (`document.documentElement.classList.add("dark")` in console).

   **Visual QA gate:** Screenshot at 3 breakpoints (375px, 768px, 1440px) × 2 modes (light, dark) = 6 screenshots. Compare against `ai_docs/index.html` for palette alignment.

3. **Step 2** — Verify radius cascaded from Step 1 automatically. No file edit expected. Spot-check Card, Button, Input corners.

4. **Steps 3 + 4** — Single PR: layout wrapper + sidebar + header together (all three are coupled via `isOpen` state, fixed positioning, and UserMenu relocation). Test: mobile overlay opens/closes, overlay click closes sidebar, sign-out works, dark mode toggle works, no layout shift on resize between mobile↔desktop.

   **Visual QA gate:** Same 6-screenshot matrix. Verify sidebar is 260px fixed on desktop, hidden on mobile, slide-in on toggle.

5. **Steps 5–8** — Journal components. Low risk. Each independently verifiable.

   **Visual QA gate:** Run full cross-cutting stories after all journal steps complete.

---

## Automated Visual Verification (via `/ui-review`)

Each implementation phase has dedicated user story YAML files in `ai_review/user_stories/` that
can be executed automatically via the `/ui-review` command. These stories drive headless browser
automation to validate the reskin without manual QA.

**How to use:** After completing a step, run `/ui-review` — it discovers YAML stories by pattern
and fans out parallel browser agents to validate each scenario. Failed stories indicate visual
regressions or missing styling.

### Pitstop Schedule

The plan executor (`/essentials:plan-creator` → `/essentials:plan-loop` or `/essentials:plan-swarm`)
should include these verification pitstops as explicit plan steps:

| After Step | Pitstop Action                                  | Story Files                                                 |
| ---------- | ----------------------------------------------- | ----------------------------------------------------------- |
| Step 0     | `/ui-review` — fonts + CSP only                 | `reskin-step0-fonts.yaml`                                   |
| Step 1     | `/ui-review` — palette + typography + dark mode | `reskin-step1-palette.yaml`, `reskin-step0-fonts.yaml`      |
| Steps 3+4  | `/ui-review` — layout + sidebar + header + auth | `reskin-step3-sidebar.yaml`, `reskin-step4-header.yaml`     |
| Step 5     | `/ui-review` — entry cards                      | `reskin-step5-entry-cards.yaml`                             |
| Step 6     | `/ui-review` — mood selector                    | `reskin-step6-mood-selector.yaml`                           |
| Step 7     | `/ui-review` — tag chips                        | `reskin-step7-tag-chips.yaml`                               |
| Step 8     | `/ui-review` — AI response                      | `reskin-step8-ai-response.yaml`                             |
| Final      | `/ui-review` — full regression pass             | `reskin-cross-cutting.yaml` + ALL `reskin-step*.yaml` files |

### Story File Inventory

```
ai_review/user_stories/
├── reskin-step0-fonts.yaml          # 4 stories: no Google Fonts requests, self-hosted render, auth font
├── reskin-step1-palette.yaml        # 5 stories: warm background, sage green, dark mode, radius
├── reskin-step3-sidebar.yaml        # 5 stories: fixed width, mobile slide, logo, nav active, no UserMenu
├── reskin-step4-header.yaml         # 5 stories: frosted glass, dark toggle, avatar, sign-out, mobile menu
├── reskin-step5-entry-cards.yaml    # 4 stories: mood border, hover effect, pill tags, dropdown fade
├── reskin-step6-mood-selector.yaml  # 4 stories: rounded cards, hover lift, selected state, keyboard nav
├── reskin-step7-tag-chips.yaml      # 3 stories: pill shape, selection toggle, hover state
├── reskin-step8-ai-response.yaml    # 4 stories: compact bg, streaming preserved, sage colors, dark mode
└── reskin-cross-cutting.yaml        # 5 stories: full dark mode, responsive, layout overlap, theme persist, full flow
```

**Total: 39 automated verification scenarios** covering every visual change in the reskin.

### Integration with Plan Executor

When this analysis is passed to `/essentials:plan-creator`, include these instructions in each
plan step's exit criteria:

```
Exit criteria for Step N:
1. Code changes compile without errors (`bun typecheck`)
2. Dev server renders correctly (`bun app:dev`)
3. `/ui-review` passes for the corresponding reskin-stepN story files
4. No regressions in previously-passing story files
```

The plan executor should treat `/ui-review` failures as blocking — do not proceed to the next
step until all stories for the current step pass. This prevents cascading visual regressions
where a later step masks a problem introduced earlier.

---

## Resolved Flaws (from validation report)

| Original Flaw                    | Resolution                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Color system downgrade (hex)     | oklch preserved. Palette translated to oklch equivalents.                                   |
| Dark mode omitted                | Full `.dark {}` block specified. Mandatory in same commit as every `:root` change.          |
| AI response component regression | Zero functional change. One `bg-secondary/30` class addition. All streaming UX preserved.   |
| Radius system fragmentation      | `tailwind.config.css` untouched. `--radius` bump in Step 1 cascades via existing `calc()`.  |
| Google Fonts CSP blocked         | `font-src 'self'` in `apps/web/_headers` confirmed blocking. Self-hosted via `@fontsource`. |
| UserMenu auth wiring loss        | `signOut(queryClient)` inlined in header. Single owner, no indirection.                     |

### Resolved Flaws (from CTO validation)

| Flaw                                     | Resolution                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Font setup mischaracterized              | Corrected: current app uses Inter + Lora (Google Fonts), not "system/generic sans".                               |
| Google Fonts `<link>` tags not removed   | Step 0 now explicitly removes all Google Fonts links + preconnects from `index.html`.                             |
| Lora usage in auth-form.tsx              | Step 0 now includes `fontFamily: "Lora"` → `"Cormorant Garamond"` update in auth-form.                            |
| Font weight gaps (fake-bold on serif)    | Added Cormorant Garamond 600 + DM Sans 700 to imports. Audit of all `font-bold`/`font-semibold` usage documented. |
| Theme-color meta tag mismatch            | Step 0 now updates `<meta name="theme-color">` from `#8B9E7C` to `#5B7B6A`.                                       |
| DarkModeToggle hydration risk            | Rewritten with `null` initial state pattern. Renders placeholder until theme resolves. No flash-of-wrong-theme.   |
| Layout wrapper refactor buried           | New explicit "Step 3+4 Prerequisite" section with full `layout/index.tsx` code and rationale.                     |
| Sidebar overlay not closeable            | Layout wrapper passes `onClose` to Sidebar. Overlay `onClick` closes sidebar.                                     |
| Sidebar `isOpen` default wrong           | Changed from `true` to `false` (mobile-first; desktop forced visible via `lg:translate-x-0`).                     |
| Accent color semantic shift undocumented | New section documenting purple→terracotta shift across all affected components.                                   |
| Chart colors assumed CSS-variable-driven | New section documenting that Recharts uses hardcoded `MOOD_COLORS` from `@repo/core`, not CSS vars.               |
| No visual QA strategy                    | Added QA gates: 6-screenshot matrix (3 breakpoints × 2 modes) after Steps 0–1 and Steps 3–4.                      |
| Staging deploy timing wrong              | Moved staging deploy from "after Step 1" to "after Step 0" (font infra verified before visuals).                  |
| Early theme script for flash prevention  | Added optional `<script>` in `index.html` `<head>` for synchronous dark class application.                        |

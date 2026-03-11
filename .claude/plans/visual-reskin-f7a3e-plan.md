# Serene App Visual Reskin - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-11

## Summary

Transform the Serene app from its current generic sage/purple theme to a warm parchment/sage design system with self-hosted fonts (Cormorant Garamond + DM Sans), fixed sidebar layout, frosted glass header, and updated journal component styling. Implementation follows 8 sequential steps with automated visual verification gates after each step via `/ui-review` story files.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `apps/app/package.json`
- `apps/app/index.html`
- `apps/app/styles/globals.css`
- `apps/app/components/auth/auth-form.tsx`
- `apps/app/components/layout/index.tsx`
- `apps/app/components/layout/sidebar.tsx`
- `apps/app/components/layout/sidebar-nav.tsx`
- `apps/app/components/layout/header.tsx`
- `apps/app/components/journal/entry-card.tsx`
- `apps/app/components/journal/mood-selector.tsx`
- `apps/app/components/journal/tag-chips.tsx`
- `apps/app/components/journal/ai-response.tsx`

### Files to Create

- `apps/app/public/_headers`
- `apps/app/components/layout/dark-mode-toggle.tsx`

### Files to Delete

- `apps/app/components/user-menu.tsx`

---

## Code Context

### Current CSS Variables (globals.css:13-47)

The `:root` block uses oklch color values with a generic sage primary (`oklch(0.45 0.08 155)`) and purple accent (`oklch(0.92 0.03 300)`). Dark mode block at lines 49-82. Shimmer animation at lines 94-106.

### Current Layout System (layout/index.tsx:1-28)

Uses flex-based layout: `<div className="h-screen flex bg-background">` with sidebar width collapse (`w-64`/`w-0`). `sidebarOpen` defaults to `true`.

### Current Sidebar (sidebar.tsx:1-25)

Width-based collapse (`w-64`/`w-0` with `overflow-hidden`). Renders `<UserMenu />` at bottom. Uses `bg-muted/50 border-r`.

### Current Sidebar Nav (sidebar-nav.tsx:15-33)

Uses `rounded-md` with `hover:bg-accent hover:text-accent-foreground` and `activeProps: { className: "bg-accent text-accent-foreground" }`.

### Current Header (header.tsx:1-30)

Static `h-14 border-b bg-background`. Renders sidebar toggle and "Serene" title. No auth controls.

### Current UserMenu (user-menu.tsx:1-68)

Owns `signOut(queryClient)` call, `useSessionQuery()`, avatar with initials, loading/error states. Rendered inside Sidebar.

### Current Auth Form (auth-form.tsx:119-124)

Brand mark uses `style={{ fontFamily: "Lora, serif" }}` for "Serene" text.

### Current Entry Card (entry-card.tsx:57-156)

Already has 4px left border with `moodColor`. Uses `<Badge variant="secondary">` for tags. Dropdown trigger visible at all times (`absolute right-4 top-4`).

### Current Mood Selector (mood-selector.tsx:82-88)

Uses `rounded-xl p-4`, `ring-2 ring-primary shadow-lg scale-[1.02] border-2 border-primary` for selected, `border border-border hover:shadow-md` for unselected. Full keyboard a11y with `role="radiogroup"`, `aria-checked`, `tabIndex`, arrow key navigation.

### Current Tag Chips (tag-chips.tsx:52-56)

Already pill-shaped (`rounded-full`). Selected: `bg-primary text-primary-foreground`. Unselected: `border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground`.

### Current AI Response (ai-response.tsx:76-79)

Compact variant: `gap-2.5 p-2.5`. Full variant: `gap-3 p-4`. No background class on compact.

### Google Fonts in index.html (lines 23-28)

Three `<link>` tags load Inter + Lora from Google Fonts. Theme color at line 16: `#8B9E7C`.

### Session Query Exports (lib/queries/session.ts)

`signOut(queryClient: QueryClient, options?: { redirect?: boolean }): Promise<void>` at line 75.
`useSessionQuery()` returns `{ data: SessionData | null, isPending, error, refetch }`.

### Sidebar Constants (layout/constants.ts)

Exports `sidebarItems` array with `BookHeart` (Journal, /journal) and `BarChart3` (Insights, /analytics).

### Layout Import (routes/(app)/route.tsx:2)

`import { Layout } from "@/components/layout"` — the only consumer of the Layout component.

### UserMenu Import

Only imported in `apps/app/components/layout/sidebar.tsx` line 1.

---

## External Context

### @fontsource/cormorant-garamond

- npm package providing self-hosted Cormorant Garamond font files
- Import individual weights via `@fontsource/cormorant-garamond/{weight}.css` and `@fontsource/cormorant-garamond/{weight}-italic.css`
- Fonts are bundled into the Vite build as static assets (woff2 format)
- No external network requests; fully CSP-safe under `font-src 'self'`

### @fontsource/dm-sans

- npm package providing self-hosted DM Sans font files
- Import individual weights via `@fontsource/dm-sans/{weight}.css`
- Same bundling behavior as Cormorant Garamond

### Cloudflare \_headers file

- Placed in `public/` directory for Cloudflare Pages/Workers static assets
- Applied to matching URL patterns
- `/*` matches all routes; `/*.css` matches CSS files
- CSP `connect-src 'self'` must include API domain for tRPC calls in dev; however since the SPA proxies through Vite in dev and uses same-origin in production, `'self'` is sufficient

---

## Architectural Narrative

### Task

Transform the Serene app visual identity from a generic sage/purple theme to a warm parchment/sage design system. This involves self-hosting fonts, updating the entire CSS variable system, restructuring the layout from flex-based to fixed positioning, redesigning the sidebar and header, and updating journal component styling. Each step has automated visual verification via `/ui-review` YAML story files (runs headless via `playwright-bowser-agent` by default; pass `headed` to fall back to Chrome MCP).

### Architecture

The app is a React 19 SPA with Tailwind CSS v4. CSS custom properties in `globals.css` feed into `tailwind.config.css` via `--color-*` mappings, which means changing `:root` variables cascades to every shadcn/ui component automatically. The layout uses a `Layout` component (layout/index.tsx) that wraps all protected routes via `routes/(app)/route.tsx`. The sidebar, header, and main content are siblings inside this layout.

### Selected Context

- `apps/app/styles/globals.css` — all CSS variables (`:root` and `.dark` blocks), shimmer animation
- `apps/app/tailwind.config.css` — Tailwind theme bindings (DO NOT EDIT; radius cascades automatically)
- `apps/app/components/layout/` — Layout, Sidebar, SidebarNav, Header
- `apps/app/components/user-menu.tsx` — auth logic to relocate to header
- `apps/app/components/journal/` — entry-card, mood-selector, tag-chips, ai-response
- `apps/app/lib/queries/session.ts` — `signOut()` and `useSessionQuery()` exports

### Relationships

1. `globals.css` `:root` variables -> `tailwind.config.css` `--color-*` mappings -> all Tailwind utility classes
2. `Layout` (index.tsx) -> creates/manages `sidebarOpen` state -> passes to `Sidebar` and `Header`
3. `Sidebar` -> renders `SidebarNav` and currently `UserMenu`
4. `UserMenu` -> owns `signOut(queryClient)` and `useSessionQuery()` -> relocates to `Header`
5. `entry-card.tsx` -> renders `AiResponse` in compact variant
6. `ai-response.tsx` -> uses CSS variables via Tailwind classes (`bg-primary/5`, `via-accent/6`, etc.)

### External Context

`@fontsource` packages provide self-hosted font files bundled via Vite. Each weight is imported as a separate CSS file that declares `@font-face` with embedded woff2 URLs. No CDN dependency. CSP-safe under `font-src 'self'`.

### Implementation Notes

- **Accent color semantic shift**: Current `--accent` is purple (`oklch(0.92 0.03 300)`), new is terracotta (`oklch(0.96 0.018 42)`). This is intentional. All components using `bg-accent`/`hover:bg-accent` either get restyled in later steps or produce acceptable results at low opacity.
- **Chart colors**: `MOOD_COLORS` in `@repo/core` are hardcoded hex, NOT CSS variables. The `--chart-*` CSS variable changes do NOT affect Recharts visualizations.
- **Radius cascade**: Changing `--radius: 0.875rem` in `:root` cascades via `calc()` expressions in `tailwind.config.css`. No edit to `tailwind.config.css` needed.
- **Dark mode toggle**: Uses `null` initial state pattern to avoid flash-of-wrong-theme. Renders a placeholder `<div className="w-8 h-8" />` until `useEffect` resolves the saved theme.
- **Early theme script**: Inline `<script>` in `<head>` runs synchronously before React mounts to apply `dark` class before first paint. Since we are adding a CSP with `script-src 'self'`, this inline script needs `'unsafe-inline'` or a hash. For simplicity, the CSP omits `script-src` (defaults to `default-src 'self'` which allows same-origin scripts; inline scripts in HTML are handled by Vite's build).
- **Layout refactor**: Fixed positioning replaces flex layout. Sidebar is `fixed top-0 left-0 h-full w-64 z-40`. Header is `fixed top-0 left-0 lg:left-64 right-0 h-14 z-30`. Main content uses `lg:pl-64 pt-14`.

### Ambiguities

- **CSP `script-src` for inline theme script**: The early theme script is inline. Cloudflare `_headers` CSP with `default-src 'self'` blocks inline scripts. Resolution: add `script-src 'self' 'unsafe-inline'` to the CSP, which is acceptable for this use case (the script is developer-controlled, not user-generated).
- **CSP `connect-src` for API calls**: In production, API is same-origin via service bindings. In dev, Vite proxies `/api/*`. `connect-src 'self'` covers both cases. However, Google OAuth redirect requires `connect-src` to include Google domains. Resolution: the `_headers` CSP applies to static asset responses only, not to navigation requests, so OAuth redirects are unaffected. Add `connect-src 'self' https://accounts.google.com` for safety.

### Requirements

1. Self-hosted fonts render correctly (zero requests to fonts.googleapis.com)
2. Warm parchment palette applied in both light and dark modes
3. Typography: DM Sans body, Cormorant Garamond headings
4. Fixed 260px sidebar on desktop, slide-out on mobile with overlay
5. Frosted glass header with dark mode toggle, avatar, and sign-out
6. Entry cards have hover translateX + warm shadow + pill tags
7. Mood selector uses rounded-[14px] cards with hover lift
8. Tag chips use pill-shaped styling with updated selected/unselected states
9. AI response compact variant gets `bg-secondary/30` background
10. All streaming/animation logic in ai-response.tsx preserved without modification
11. All keyboard accessibility preserved (role, aria-checked, tabIndex, onKeyDown)
12. Each step passes its corresponding `/ui-review` story files
13. No regressions in previously-passing story files

### Constraints

- Do NOT edit `apps/app/tailwind.config.css`
- Do NOT modify AI response streaming/animation logic
- Do NOT modify Recharts/MOOD_COLORS in `@repo/core`
- Every `:root` change ships with `.dark {}` counterpart
- Preserve all keyboard accessibility attributes

### Selected Approach

**Approach**: Sequential step-by-step reskin with automated visual verification gates
**Description**: Implement changes in 8 ordered steps (Step 0 through Step 8, skipping Step 2 which is verification-only), each with explicit exit criteria including `/ui-review` story file validation. Font infrastructure ships first (Step 0), then CSS variables (Step 1), then layout (Steps 3+4 as a unit), then journal components (Steps 5-8 independently).
**Rationale**: Sequential steps with verification gates prevent cascading regressions. Font self-hosting must be validated before visual changes depend on it. Layout changes are coupled (sidebar + header + wrapper share state) and must ship together. Journal components are independent and can be verified individually.
**Trade-offs Accepted**: Sequential execution is slower than fully parallel, but the cascading nature of CSS variable changes means later steps depend on earlier ones being correct. The verification gates add overhead but catch regressions early.

---

## Implementation Plan

### apps/app/package.json [edit]

**Purpose**: App dependencies manifest. Add self-hosted font packages.
**TOTAL CHANGES**: 1

**Changes**:

1. (line 43, after `"zod": "^4.3.6"`) Add `@fontsource/cormorant-garamond` and `@fontsource/dm-sans` to `dependencies` block.

**Implementation Details**:

- Run `cd apps/app && bun add @fontsource/cormorant-garamond @fontsource/dm-sans` to add the packages (this updates package.json and installs)
- Alternatively, manually add to dependencies and run `bun install` from repo root

**Reference Implementation**:

```bash
cd /Users/garden/projects/PinkElephant/serene && bun add --cwd apps/app @fontsource/cormorant-garamond @fontsource/dm-sans
```

After running, `apps/app/package.json` dependencies will include:

```json
"@fontsource/cormorant-garamond": "^5.x.x",
"@fontsource/dm-sans": "^5.x.x",
```

**Dependencies**: None
**Provides**: `@fontsource/cormorant-garamond` and `@fontsource/dm-sans` packages available for import

---

### apps/app/index.html [edit]

**Purpose**: SPA HTML entry point. Remove Google Fonts, update theme-color, add early theme script.
**TOTAL CHANGES**: 3

**Changes**:

1. (lines 23-28) Delete the three Google Fonts `<link>` tags (preconnect x2 + stylesheet)
2. (line 16) Change `<meta name="theme-color" content="#8B9E7C" />` to `content="#5B7B6A"`
3. (after line 28/after removing Google Fonts links, before `</head>`) Add inline early theme detection script

**Implementation Details**:

- The early theme script runs synchronously before React mounts to prevent flash-of-light-theme on dark-preference users
- The script reads `localStorage.getItem("theme")` and `matchMedia("(prefers-color-scheme:dark)")` and adds `dark` class to `<html>` if appropriate

**Reference Implementation**:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>%VITE_APP_NAME%</title>
    <meta
      name="description"
      content="Serene — Your AI-powered wellness journal. Track your mood, reflect on your day, and receive personalized insights."
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <meta property="og:title" content="Serene — AI-Powered Wellness Journal" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="" />
    <meta property="og:image" content="" />
    <meta name="theme-color" content="#5B7B6A" />

    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/logo192.png" />

    <link rel="manifest" href="/site.manifest" />

    <script>
      (function () {
        var t = localStorage.getItem("theme");
        var d =
          t === "dark" ||
          (!t && matchMedia("(prefers-color-scheme:dark)").matches);
        if (d) document.documentElement.classList.add("dark");
      })();
    </script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

**Migration Pattern**:

```html
<!-- BEFORE (lines 16, 23-28): -->
<meta name="theme-color" content="#8B9E7C" />
...
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap"
/>

<!-- AFTER: -->
<meta name="theme-color" content="#5B7B6A" />
...
<!-- Google Fonts links REMOVED -->
<script>
  (function () {
    var t = localStorage.getItem("theme");
    var d =
      t === "dark" || (!t && matchMedia("(prefers-color-scheme:dark)").matches);
    if (d) document.documentElement.classList.add("dark");
  })();
</script>
```

**Dependencies**: None
**Provides**: Clean HTML without external font dependencies; early theme class application

---

### apps/app/public/\_headers [create]

**Purpose**: Cloudflare HTTP headers for the app worker. CSP, cache control for static assets.
**TOTAL CHANGES**: 1 (new file)

**Changes**:

1. Create the file with CSP and cache headers matching the pattern in `apps/web/_headers`

**Implementation Details**:

- `font-src 'self'` ensures only self-hosted fonts load
- `script-src 'self' 'unsafe-inline'` allows the early theme detection script
- `connect-src 'self' https://accounts.google.com` allows API calls and Google OAuth
- Cache headers for immutable hashed assets (CSS, JS, woff2)

**Reference Implementation**:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; connect-src 'self' https://accounts.google.com
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable
```

**Dependencies**: None
**Provides**: CSP headers that enforce `font-src 'self'`; cache headers for static assets

---

### apps/app/components/auth/auth-form.tsx [edit]

**Purpose**: Auth form with "Serene" brand mark. Update font-family from Lora to Cormorant Garamond.
**TOTAL CHANGES**: 1

**Changes**:

1. (line 121) Change `style={{ fontFamily: "Lora, serif" }}` to `style={{ fontFamily: "'Cormorant Garamond', serif" }}`

**Implementation Details**:

- Single string replacement in the inline style object
- Cormorant Garamond is loaded via `@fontsource` imports in globals.css (Step 1)
- The font name contains a space, so it must be quoted with single quotes inside the double-quoted string

**Reference Implementation**:

```tsx
// Line 119-124 after change:
<Link to="/" aria-label="Go to homepage">
  <span
    className="text-2xl font-semibold tracking-tight text-primary"
    style={{ fontFamily: "'Cormorant Garamond', serif" }}
  >
    Serene
  </span>
</Link>
```

**Migration Pattern**:

```tsx
// BEFORE (line 121):
style={{ fontFamily: "Lora, serif" }}

// AFTER:
style={{ fontFamily: "'Cormorant Garamond', serif" }}
```

**Dependencies**: `apps/app/package.json` (fontsource packages must be installed)
**Provides**: Updated brand mark font reference

---

### apps/app/styles/globals.css [edit]

**Purpose**: CSS custom properties, font imports, typography base styles. Core of the visual reskin.
**TOTAL CHANGES**: 4

**Changes**:

1. (line 1, before `@import "../tailwind.config.css"`) Add 11 `@fontsource` import lines for Cormorant Garamond (300, 400, 500, 600, 300-italic, 400-italic) and DM Sans (300, 400, 500, 600, 700)
2. (lines 13-47) Replace entire `:root {}` block with new warm parchment oklch palette
3. (lines 49-82) Replace entire `.dark {}` block with new dark mode equivalents
4. (lines 84-91) Replace `@layer base` block with new body font-family and heading font-family rules

**Implementation Details**:

- `@fontsource` imports MUST come before `@import "../tailwind.config.css"` so font-face declarations are available when Tailwind processes
- `--radius` changes from `0.625rem` to `0.875rem`
- All oklch values are taken directly from the CTO analysis document
- The shimmer animation (lines 93-106) is preserved unchanged

**Reference Implementation**:

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

@import "../tailwind.config.css";

/**
 * CSS Variables for ShadCN UI Theming
 *
 * These variables define the color scheme for light and dark modes.
 * They are referenced by the UI components and mapped to Tailwind
 * utilities in tailwind.config.css.
 *
 * Using oklch() for better color interpolation and consistency.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
 */
:root {
  --radius: 0.875rem;

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
  --background: oklch(0.16 0.01 82);
  --card: oklch(0.2 0.01 82);
  --foreground: oklch(0.93 0.005 82);
  --card-foreground: oklch(0.93 0.005 82);
  --popover: oklch(0.2 0.01 82);
  --popover-foreground: oklch(0.93 0.005 82);
  --primary: oklch(0.68 0.065 155);
  --primary-foreground: oklch(0.15 0.02 155);
  --secondary: oklch(0.26 0.028 155);
  --secondary-foreground: oklch(0.9 0.022 155);
  --muted: oklch(0.25 0.01 82);
  --muted-foreground: oklch(0.65 0.008 60);
  --accent: oklch(0.28 0.04 42);
  --accent-foreground: oklch(0.9 0.03 42);
  --destructive: oklch(0.68 0.12 42);
  --destructive-foreground: oklch(0.99 0 0);
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

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
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

/* AI streaming shimmer — sweeping gradient highlight */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background-size: 200% 100%;
  animation: shimmer 2.5s ease-in-out infinite;
}
```

**Dependencies**: `apps/app/package.json` (fontsource packages must be installed)
**Provides**: All CSS custom properties (warm parchment palette), font-face declarations, typography base styles, `--radius: 0.875rem`

---

### apps/app/components/layout/index.tsx [edit]

**Purpose**: Root layout wrapper. Refactor from flex-based width collapse to fixed positioning with padding offsets.
**TOTAL CHANGES**: 1 (full rewrite of component body)

**Changes**:

1. (lines 1-28) Replace entire file content with fixed-positioning layout

**Implementation Details**:

- `sidebarOpen` defaults to `false` (mobile-first; desktop sidebar forced visible via `lg:translate-x-0`)
- Add `onClose` callback for sidebar overlay dismiss
- Add `useCallback` import
- Replace flex layout with fixed elements + padding offsets
- `lg:pl-64` = 256px = sidebar width, `pt-14` = 56px = header height
- No `overflow-hidden` on outer container; scrolling is natural on `<main>`

**Reference Implementation**:

```tsx
import { useCallback, useState } from "react";
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

**Migration Pattern**:

```tsx
// BEFORE:
const [sidebarOpen, setSidebarOpen] = useState(true);
return (
  <div className="h-screen flex bg-background">
    <Sidebar isOpen={sidebarOpen} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header ... />
      <main className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  </div>
);

// AFTER:
const [sidebarOpen, setSidebarOpen] = useState(false);
const closeSidebar = useCallback(() => setSidebarOpen(false), []);
return (
  <>
    <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
    <Header isSidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
    <main className="lg:pl-64 pt-14 min-h-screen bg-background">
      <div className="h-full">{children}</div>
    </main>
  </>
);
```

**Dependencies**: `apps/app/components/layout/sidebar.tsx` (new `onClose` prop), `apps/app/components/layout/header.tsx` (updated interface)
**Provides**: Updated layout with fixed positioning, `onClose` callback passed to Sidebar

---

### apps/app/components/layout/sidebar.tsx [edit]

**Purpose**: Sidebar component. Convert from width-collapse to fixed positioning with mobile slide-out.
**TOTAL CHANGES**: 1 (full rewrite of component body)

**Changes**:

1. (lines 1-25) Replace entire file with fixed-positioning sidebar, mobile overlay, Cormorant Garamond logo, remove UserMenu

**Implementation Details**:

- Remove `import { UserMenu } from "@/components/user-menu"`
- Add `onClose` to `SidebarProps` interface
- Desktop: `fixed top-0 left-0 h-full w-64 z-40`, always visible via `lg:translate-x-0`
- Mobile: `translate-x-0` when open, `-translate-x-full` when closed (CSS transform, not width)
- Mobile overlay: `fixed inset-0 bg-black/20 z-30 lg:hidden` with `onClick={onClose}`
- Logo: Cormorant Garamond font with terracotta dot
- No more `<UserMenu />` (auth relocated to header)

**Reference Implementation**:

```tsx
import { sidebarItems } from "./constants";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40
          bg-sidebar border-r border-sidebar-border flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-7 py-6 mb-2">
          <span
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-2xl font-medium tracking-widest text-primary"
          >
            Serene
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-accent-foreground ml-0.5 align-super"
              aria-hidden="true"
            />
          </span>
        </div>

        <SidebarNav items={sidebarItems} />
      </aside>
    </>
  );
}
```

**Dependencies**: `apps/app/styles/globals.css` (CSS variables for `bg-sidebar`, `border-sidebar-border`, `text-primary`, `bg-accent-foreground`)
**Provides**: `Sidebar` component with `onClose` prop, fixed positioning, mobile slide-out

---

### apps/app/components/layout/sidebar-nav.tsx [edit]

**Purpose**: Sidebar navigation links. Update active state from rounded bg-accent to left-border style.
**TOTAL CHANGES**: 2

**Changes**:

1. (line 17) Change `<nav className="flex-1 p-4 space-y-1">` to `<nav className="flex-1 px-0 py-2">`
2. (lines 22-25) Replace Link `className` and `activeProps` with new border-l active state styling

**Implementation Details**:

- Nav padding changes from `p-4 space-y-1` to `px-0 py-2` (links handle their own horizontal padding)
- Default state: `border-l-[3px] border-transparent text-muted-foreground hover:text-foreground hover:bg-muted`
- Active state: `border-primary bg-secondary text-primary font-medium`
- Icon + label gap preserved

**Reference Implementation**:

```tsx
import type { FileRoutesByTo } from "@/lib/routeTree.gen";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  to: keyof FileRoutesByTo;
}

interface SidebarNavProps {
  items: readonly SidebarNavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <nav className="flex-1 px-0 py-2">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex items-center gap-3 px-7 py-3 text-sm border-l-[3px] border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          activeProps={{
            className: "border-primary bg-secondary text-primary font-medium",
          }}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
```

**Migration Pattern**:

```tsx
// BEFORE (line 17):
<nav className="flex-1 p-4 space-y-1">

// AFTER:
<nav className="flex-1 px-0 py-2">

// BEFORE (lines 22-25):
className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
activeProps={{
  className: "bg-accent text-accent-foreground",
}}

// AFTER:
className="flex items-center gap-3 px-7 py-3 text-sm border-l-[3px] border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
activeProps={{
  className: "border-primary bg-secondary text-primary font-medium",
}}
```

**Dependencies**: `apps/app/styles/globals.css` (CSS variables for `border-primary`, `bg-secondary`, `text-primary`)
**Provides**: Updated sidebar nav with left-border active state

---

### apps/app/components/layout/header.tsx [edit]

**Purpose**: Top header bar. Redesign with frosted glass, dark mode toggle, avatar, sign-out. Absorbs UserMenu auth logic.
**TOTAL CHANGES**: 1 (full rewrite of component body)

**Changes**:

1. (lines 1-30) Replace entire file with frosted glass header containing mobile menu toggle, dark mode toggle, sign-out button, and avatar

**Implementation Details**:

- Import `signOut` and `useSessionQuery` from `@/lib/queries/session`
- Import `useQueryClient` from `@tanstack/react-query`
- Import `DarkModeToggle` from `./dark-mode-toggle`
- Import `Menu`, `X` from `lucide-react` (already imported)
- Remove `Button` import from `@repo/ui` (using native elements for simpler styling)
- Fixed positioning: `fixed top-0 left-0 lg:left-64 right-0 h-14 z-30`
- Frosted glass: `bg-background/85 backdrop-blur-md border-b border-border/40`
- Mobile menu toggle visible only on `lg:hidden`
- Right side: DarkModeToggle, sign-out button, avatar with initials

**Reference Implementation**:

```tsx
import { signOut, useSessionQuery } from "@/lib/queries/session";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { DarkModeToggle } from "./dark-mode-toggle";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

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

**Dependencies**: `apps/app/components/layout/dark-mode-toggle.tsx` (new component), `apps/app/styles/globals.css` (CSS variables), `apps/app/lib/queries/session.ts` (signOut, useSessionQuery)
**Provides**: Updated Header with auth controls, frosted glass styling, mobile menu toggle

---

### apps/app/components/layout/dark-mode-toggle.tsx [create]

**Purpose**: Dark mode toggle button with null-init pattern to prevent flash-of-wrong-theme icon.
**TOTAL CHANGES**: 1 (new file)

**Changes**:

1. Create new file with `DarkModeToggle` component

**Implementation Details**:

- `useState<boolean | null>(null)` — starts as null, renders placeholder until theme resolved
- `useEffect` reads `localStorage.getItem("theme")` and `matchMedia("(prefers-color-scheme: dark)")` to determine initial state
- `toggle()` flips state, toggles `dark` class on `document.documentElement`, persists to localStorage
- Renders `Sun` icon when dark, `Moon` icon when light
- Placeholder: `<div className="w-8 h-8" />` while `dark === null` (prevents layout shift)

**Reference Implementation**:

```tsx
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

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

**Dependencies**: None (uses only `lucide-react` and `react` which are already project dependencies)
**Provides**: `DarkModeToggle` component exported for use in Header

---

### apps/app/components/user-menu.tsx [delete]

**Purpose**: User menu component. Delete after auth logic is absorbed by header.
**TOTAL CHANGES**: 1 (delete file)

**Changes**:

1. Delete the entire file. All auth logic (`signOut`, `useSessionQuery`, avatar) has been relocated to `apps/app/components/layout/header.tsx`.

**Implementation Details**:

- Verify no other files import from `@/components/user-menu` (confirmed: only `sidebar.tsx` line 1, which is updated to remove the import)
- The loading skeleton and error states from UserMenu are not replicated in the header (the header shows a simpler avatar + sign-out without loading/error recovery, since the auth guard in `beforeLoad` already ensures a valid session before the layout renders)

**Dependencies**: `apps/app/components/layout/sidebar.tsx` (must be updated first to remove the import), `apps/app/components/layout/header.tsx` (must absorb auth logic first)
**Provides**: Cleanup — removes dead code

---

### apps/app/components/journal/entry-card.tsx [edit]

**Purpose**: Journal entry card. Add hover effects, warm shadow, pill-shaped tags, dropdown fade.
**TOTAL CHANGES**: 3

**Changes**:

1. (line 59) Update `<Card>` className to add `group`, hover translateX, warm shadow
2. (lines 80-84) Replace `<Badge variant="secondary">` with pill-shaped `<span>`
3. (line 118) Add opacity-0/group-hover:opacity-100 to dropdown trigger wrapper

**Implementation Details**:

- Card: add `group` class, `hover:translate-x-1`, `hover:shadow-[0_4px_20px_oklch(0.22_0.003_250/6%)]`, `cursor-pointer`
- Tags: replace `<Badge>` with `<span className="px-3 py-0.5 rounded-full bg-background border border-border text-xs text-muted-foreground font-medium">`
- Dropdown: wrap in `opacity-0 group-hover:opacity-100 transition-opacity`
- Remove `Badge` from `@repo/ui` imports (if no longer used elsewhere in this file)

**Reference Implementation**:

```tsx
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { truncate } from "@/lib/utils/text";
import { MOOD_COLORS, type MoodType } from "@repo/core";
import {
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
import { AnimatePresence, motion } from "motion/react";
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
      className="relative overflow-hidden group hover:translate-x-1 hover:shadow-[0_4px_20px_oklch(0.22_0.003_250/6%)] transition-all duration-200 cursor-pointer"
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
                <span
                  key={tag}
                  className="px-3 py-0.5 rounded-full bg-background border border-border text-xs text-muted-foreground font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {entry.note && (
            <p className="text-sm text-muted-foreground">
              {truncate(entry.note, 150)}
            </p>
          )}
        </CardContent>
      </Link>

      <AnimatePresence>
        {(entry.aiResponse || isStreaming) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
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

**Migration Pattern**:

```tsx
// BEFORE (line 59):
className="relative overflow-hidden transition-shadow hover:shadow-md"

// AFTER:
className="relative overflow-hidden group hover:translate-x-1 hover:shadow-[0_4px_20px_oklch(0.22_0.003_250/6%)] transition-all duration-200 cursor-pointer"

// BEFORE (lines 80-84):
<Badge key={tag} variant="secondary" className="text-xs">
  {tag}
</Badge>

// AFTER:
<span
  key={tag}
  className="px-3 py-0.5 rounded-full bg-background border border-border text-xs text-muted-foreground font-medium"
>
  {tag}
</span>

// BEFORE (line 118):
<div className="absolute right-4 top-4">

// AFTER:
<div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
```

**Dependencies**: `apps/app/styles/globals.css` (CSS variables)
**Provides**: Updated entry card with hover effects, pill tags, dropdown fade

---

### apps/app/components/journal/mood-selector.tsx [edit]

**Purpose**: Mood selection radio group. Update card styling with rounded-[14px], hover lift, updated selected state.
**TOTAL CHANGES**: 1

**Changes**:

1. (lines 82-87) Replace the `className` template literal with new styling

**Implementation Details**:

- Change `rounded-xl p-4` to `rounded-[14px] p-5`
- Selected: replace `ring-2 ring-primary shadow-lg scale-[1.02] border-2 border-primary` with `border-primary bg-secondary` (still `border-2`)
- Unselected: replace `border border-border hover:shadow-md` with `border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md` (still `border` but now `border-2` to match selected)
- All a11y attributes (`role`, `aria-checked`, `tabIndex`, `onKeyDown`, refs) remain completely untouched
- The `style={{ backgroundColor: colors.light }}` line changes to only apply when NOT selected

**Reference Implementation**:

```tsx
// Lines 82-88 after change:
            className={`flex flex-col items-center justify-center gap-2 rounded-[14px] p-5 cursor-pointer transition-all duration-150 select-none border-2 ${
              isSelected
                ? "border-primary bg-secondary"
                : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            }`}
            style={{
              backgroundColor: isSelected ? undefined : colors.light,
            }}
```

**Migration Pattern**:

```tsx
// BEFORE (lines 82-88):
className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 cursor-pointer transition-all duration-150 select-none ${
  isSelected
    ? "ring-2 ring-primary shadow-lg scale-[1.02] border-2 border-primary"
    : "border border-border hover:shadow-md"
}`}
style={{ backgroundColor: colors.light }}

// AFTER:
className={`flex flex-col items-center justify-center gap-2 rounded-[14px] p-5 cursor-pointer transition-all duration-150 select-none border-2 ${
  isSelected
    ? "border-primary bg-secondary"
    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
}`}
style={{
  backgroundColor: isSelected ? undefined : colors.light,
}}
```

**Dependencies**: `apps/app/styles/globals.css` (CSS variables for `border-primary`, `bg-secondary`, `border-border`, `bg-card`)
**Provides**: Updated mood selector card styling

---

### apps/app/components/journal/tag-chips.tsx [edit]

**Purpose**: Tag selection chips. Update unselected state styling.
**TOTAL CHANGES**: 1

**Changes**:

1. (lines 52-56) Replace the `className` template literal with new pill styling

**Implementation Details**:

- Unselected: change `border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground` to `border border-border bg-card text-muted-foreground hover:border-primary/40`
- Selected: change `bg-primary text-primary-foreground` to `bg-primary border-2 border-primary text-primary-foreground`
- Adjust padding: `px-3 py-1.5` to `px-[18px] py-2`
- All a11y attributes (`role="group"`, `aria-pressed`) remain untouched

**Reference Implementation**:

```tsx
// Lines 47-64 after change:
return (
  <button
    key={tag}
    type="button"
    aria-pressed={isSelected}
    onClick={() => handleToggle(tag)}
    className={`inline-flex items-center gap-1.5 rounded-full px-[18px] py-2 text-sm font-medium transition-all ${
      isSelected
        ? "bg-primary border-2 border-primary text-primary-foreground"
        : "border border-border bg-card text-muted-foreground hover:border-primary/40"
    }`}
  >
    {isSelected && <Check className="h-3.5 w-3.5" />}
    {Icon && <Icon className="h-4 w-4" />}
    {tag}
  </button>
);
```

**Migration Pattern**:

```tsx
// BEFORE (lines 52-56):
className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
  isSelected
    ? "bg-primary text-primary-foreground"
    : "border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
}`}

// AFTER:
className={`inline-flex items-center gap-1.5 rounded-full px-[18px] py-2 text-sm font-medium transition-all ${
  isSelected
    ? "bg-primary border-2 border-primary text-primary-foreground"
    : "border border-border bg-card text-muted-foreground hover:border-primary/40"
}`}
```

**Dependencies**: `apps/app/styles/globals.css` (CSS variables for `border-border`, `bg-card`, `border-primary`)
**Provides**: Updated tag chip styling

---

### apps/app/components/journal/ai-response.tsx [edit]

**Purpose**: AI response display. Add bg-secondary/30 to compact variant.
**TOTAL CHANGES**: 1

**Changes**:

1. (line 79) Change compact variant padding from `"gap-2.5 p-2.5"` to `"gap-2.5 p-2.5 bg-secondary/30"`

**Implementation Details**:

- Single class addition to the existing ternary
- Preserves ALL streaming/animation logic without modification
- The `bg-secondary/30` creates a subtle sage-tinted background on the compact AI response card

**Reference Implementation**:

```tsx
// Line 79 after change:
            variant === "compact" ? "gap-2.5 p-2.5 bg-secondary/30" : "gap-3 p-4",
```

**Migration Pattern**:

```tsx
// BEFORE (line 79):
variant === "compact" ? "gap-2.5 p-2.5" : "gap-3 p-4",

// AFTER:
variant === "compact" ? "gap-2.5 p-2.5 bg-secondary/30" : "gap-3 p-4",
```

**Dependencies**: `apps/app/styles/globals.css` (CSS variable `--secondary`)
**Provides**: Updated compact AI response background

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                              | Action                                                           | Depends On                                                                        |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1     | `apps/app/package.json`                           | edit                                                             | --                                                                                |
| 2     | `apps/app/index.html`                             | edit                                                             | --                                                                                |
| 2     | `apps/app/public/_headers`                        | create                                                           | --                                                                                |
| 2     | `apps/app/components/auth/auth-form.tsx`          | edit                                                             | `apps/app/package.json`                                                           |
| 2     | `apps/app/styles/globals.css`                     | edit                                                             | `apps/app/package.json`                                                           |
| 2-V   | **VERIFICATION: Step 0**                          | `/ui-review reskin-step0-fonts.yaml`                             | Phase 2 complete                                                                  |
| 2-V   | **VERIFICATION: Step 1**                          | `/ui-review reskin-step1-palette.yaml, reskin-step0-fonts.yaml`  | Phase 2 complete                                                                  |
| 3     | `apps/app/components/layout/dark-mode-toggle.tsx` | create                                                           | --                                                                                |
| 3     | `apps/app/components/layout/sidebar-nav.tsx`      | edit                                                             | `apps/app/styles/globals.css`                                                     |
| 3     | `apps/app/components/layout/sidebar.tsx`          | edit                                                             | `apps/app/styles/globals.css`                                                     |
| 3     | `apps/app/components/layout/header.tsx`           | edit                                                             | `apps/app/components/layout/dark-mode-toggle.tsx`                                 |
| 3     | `apps/app/components/layout/index.tsx`            | edit                                                             | `apps/app/components/layout/sidebar.tsx`, `apps/app/components/layout/header.tsx` |
| 3     | `apps/app/components/user-menu.tsx`               | delete                                                           | `apps/app/components/layout/sidebar.tsx`, `apps/app/components/layout/header.tsx` |
| 3-V   | **VERIFICATION: Steps 3+4**                       | `/ui-review reskin-step3-sidebar.yaml, reskin-step4-header.yaml` | Phase 3 complete                                                                  |
| 4     | `apps/app/components/journal/entry-card.tsx`      | edit                                                             | `apps/app/styles/globals.css`                                                     |
| 4-V   | **VERIFICATION: Step 5**                          | `/ui-review reskin-step5-entry-cards.yaml`                       | entry-card.tsx complete                                                           |
| 4     | `apps/app/components/journal/mood-selector.tsx`   | edit                                                             | `apps/app/styles/globals.css`                                                     |
| 4-V   | **VERIFICATION: Step 6**                          | `/ui-review reskin-step6-mood-selector.yaml`                     | mood-selector.tsx complete                                                        |
| 4     | `apps/app/components/journal/tag-chips.tsx`       | edit                                                             | `apps/app/styles/globals.css`                                                     |
| 4-V   | **VERIFICATION: Step 7**                          | `/ui-review reskin-step7-tag-chips.yaml`                         | tag-chips.tsx complete                                                            |
| 4     | `apps/app/components/journal/ai-response.tsx`     | edit                                                             | `apps/app/styles/globals.css`                                                     |
| 4-V   | **VERIFICATION: Step 8**                          | `/ui-review reskin-step8-ai-response.yaml`                       | ai-response.tsx complete                                                          |
| 5-V   | **VERIFICATION: Final**                           | `/ui-review reskin-cross-cutting.yaml + ALL reskin-step*.yaml`   | ALL phases complete                                                               |

**Note on verification phases**: The `-V` phases are verification-only steps. They are **blocking gates** with a fix-and-recheck loop:
**Note on verification phases**: The `-V` phases are verification-only steps. They are **blocking gates** with a fix-and-recheck loop:

1. Run `/ui-review` with the specified story files.
2. If **all stories pass** → proceed to the next implementation phase.
3. If **any story fails** → analyze the failure output, fix the relevant code in the preceding phase's files, then **re-run `/ui-review`** for the same story files.
4. Repeat steps 2–3 until all stories pass. **Do not proceed to the next phase with failing stories.**

This fix-and-recheck loop applies to every `-V` gate, including the final regression pass. There is no limit on iterations — keep fixing and rechecking until the gate is green.

**Simplified dependency graph (code changes only)**:

| Phase | File                                              | Action | Depends On                                                                        |
| ----- | ------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| 1     | `apps/app/package.json`                           | edit   | --                                                                                |
| 2     | `apps/app/index.html`                             | edit   | --                                                                                |
| 2     | `apps/app/public/_headers`                        | create | --                                                                                |
| 2     | `apps/app/components/auth/auth-form.tsx`          | edit   | `apps/app/package.json`                                                           |
| 2     | `apps/app/styles/globals.css`                     | edit   | `apps/app/package.json`                                                           |
| 3     | `apps/app/components/layout/dark-mode-toggle.tsx` | create | --                                                                                |
| 3     | `apps/app/components/layout/sidebar-nav.tsx`      | edit   | `apps/app/styles/globals.css`                                                     |
| 3     | `apps/app/components/layout/sidebar.tsx`          | edit   | `apps/app/styles/globals.css`                                                     |
| 3     | `apps/app/components/layout/header.tsx`           | edit   | `apps/app/components/layout/dark-mode-toggle.tsx`                                 |
| 3     | `apps/app/components/layout/index.tsx`            | edit   | `apps/app/components/layout/sidebar.tsx`, `apps/app/components/layout/header.tsx` |
| 3     | `apps/app/components/user-menu.tsx`               | delete | `apps/app/components/layout/sidebar.tsx`, `apps/app/components/layout/header.tsx` |
| 4     | `apps/app/components/journal/entry-card.tsx`      | edit   | `apps/app/styles/globals.css`                                                     |
| 4     | `apps/app/components/journal/mood-selector.tsx`   | edit   | `apps/app/styles/globals.css`                                                     |
| 4     | `apps/app/components/journal/tag-chips.tsx`       | edit   | `apps/app/styles/globals.css`                                                     |
| 4     | `apps/app/components/journal/ai-response.tsx`     | edit   | `apps/app/styles/globals.css`                                                     |

---

## Verification Pitstop Schedule

Each verification step is a **blocking gate with a fix-and-recheck loop**. Do not proceed to the next implementation phase until all stories for the current step pass. If any story fails, fix the issue and re-run `/ui-review` until the gate is green.

| After Phase             | Verification Action          | Story Files                                                                                                                        | Exit Criteria                                                                                        | On Failure                                                                                             |
| ----------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Phase 2                 | Step 0 + Step 1 verification | `reskin-step0-fonts.yaml`, `reskin-step1-palette.yaml`                                                                             | `bun typecheck` passes, `/ui-review` passes for both story files                                     | Fix Phase 2 files (globals.css, index.html, auth-form.tsx), re-run `/ui-review` until all stories pass |
| Phase 3                 | Steps 3+4 verification       | `reskin-step3-sidebar.yaml`, `reskin-step4-header.yaml`                                                                            | `bun typecheck` passes, `/ui-review` passes for both story files, no regressions in step 0/1 stories | Fix Phase 3 files (layout/, sidebar, header), re-run `/ui-review` until all stories pass               |
| Phase 4 (per component) | Steps 5-8 verification       | `reskin-step5-entry-cards.yaml`, `reskin-step6-mood-selector.yaml`, `reskin-step7-tag-chips.yaml`, `reskin-step8-ai-response.yaml` | `bun typecheck` passes, `/ui-review` passes for each story file                                      | Fix the specific journal component that failed, re-run its `/ui-review` story until it passes          |
| All phases              | Final regression pass        | `reskin-cross-cutting.yaml` + ALL `reskin-step*.yaml` files                                                                        | All 39 stories pass, `bun typecheck` passes, `bun test --run` passes                                 | Identify which phase introduced the regression, fix it, re-run full `/ui-review` suite until all pass  |

---

## Exit Criteria

### Test Commands

```bash
bun typecheck                  # TypeScript compilation check
bun test --run                 # Vitest tests (single run, no watch)
bun lint                       # ESLint with cache
bun app:dev                    # Verify dev server starts and renders
```

### Success Conditions

- [ ] All TypeScript compilation passes (exit code 0)
- [ ] All existing tests pass (exit code 0)
- [ ] No linting errors (exit code 0)
- [ ] Dev server renders warm parchment palette in light mode
- [ ] Dev server renders dark mode correctly (toggle works)
- [ ] Zero requests to fonts.googleapis.com in browser Network tab
- [ ] Cormorant Garamond renders for headings (h1-h4)
- [ ] DM Sans renders for body text
- [ ] Sidebar is fixed 260px on desktop, slide-out on mobile
- [ ] Mobile overlay closes sidebar on click
- [ ] Header has frosted glass effect, dark mode toggle, avatar, sign-out
- [ ] Sign-out button works (calls signOut, redirects to /login)
- [ ] Entry cards have hover translateX and warm shadow
- [ ] Tag pills are rounded-full with border
- [ ] Mood selector cards have rounded-[14px] with hover lift
- [ ] AI response compact variant has bg-secondary/30 background
- [ ] All keyboard accessibility preserved (mood selector arrow keys, tag chips aria-pressed)
- [ ] All streaming/animation logic in ai-response.tsx works unchanged
- [ ] All `/ui-review` story files pass (39 total scenarios)
- [ ] All requirements from ### Requirements satisfied
- [ ] All files from ### Files implemented

### Verification Script

```bash
bun typecheck && bun test --run && bun lint
```

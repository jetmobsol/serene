# Deliverable #4: Serene Branding Update - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

Replace all "Acme Co.", "Console", "React Starter Kit", and generic template branding across the monorepo with "Serene" wellness journal branding. Update the sidebar navigation to journal-specific routes (Dashboard, Journal, Insights, Settings), apply a calm aesthetic color palette (sage green, warm ivory, lavender accents) to auth pages and the app shell, update meta tags and page titles, rebrand email templates, update the web marketing pages, and create a Bowser QA YAML for automated visual verification.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `.env`
- `apps/app/index.html`
- `apps/app/public/site.manifest`
- `apps/app/styles/globals.css`
- `apps/app/components/layout/sidebar.tsx`
- `apps/app/components/layout/constants.ts`
- `apps/app/components/layout/header.tsx`
- `apps/app/components/auth/auth-form.tsx`
- `apps/app/routes/(auth)/login.tsx`
- `apps/app/routes/(auth)/signup.tsx`
- `apps/app/routes/(app)/index.tsx`
- `apps/app/routes/(app)/about.tsx`
- `apps/api/lib/env.ts`
- `apps/api/lib/stripe.ts`
- `apps/email/components/BaseTemplate.tsx`
- `apps/email/emails/email-verification.tsx`
- `apps/email/emails/otp-password-reset.tsx`
- `apps/email/emails/otp-sign-in.tsx`
- `apps/email/emails/otp-verification.tsx`
- `apps/email/emails/password-reset.tsx`
- `apps/api/dev.ts`
- `db/scripts/generate-auth-schema.ts`
- `apps/web/styles/globals.css`
- `apps/web/layouts/BaseLayout.astro`
- `apps/web/pages/index.astro`
- `apps/web/pages/about.astro`
- `apps/web/pages/features.astro`
- `apps/web/pages/pricing.astro`

### Files to Create

- `ai_review/user_stories/branding.yaml`

---

## Code Context

### Environment Variables

- `.env:11` — `APP_NAME=Acme Co.` — This is the primary branding variable. Vite exposes it as `VITE_APP_NAME` via `apps/app/vite.config.ts:10` (the `publicEnvVars` array).
- `apps/app/global.d.ts:9` — TypeScript declares `VITE_APP_NAME: string` in `ImportMetaEnv`.
- `apps/api/lib/env.ts:11` — API env schema: `APP_NAME: z.string().default("Example")`.
- `apps/api/dev.ts:78` — Dev server fallback: `APP_NAME: process.env.APP_NAME || cf.env.APP_NAME || "Example"`.

### Sidebar Component Chain

- `apps/app/components/layout/index.tsx` — `Layout` component renders `<Sidebar isOpen={sidebarOpen} />` and `<Header>`.
- `apps/app/components/layout/sidebar.tsx:18` — Hardcoded string `"Console"` in `<h2>`.
- `apps/app/components/layout/constants.ts:1-9` — `sidebarItems` array with `Home, Activity, Users, FileText, Settings` icons and routes to `/`, `/analytics`, `/users`, `/reports`, `/settings`.
- `apps/app/components/layout/sidebar-nav.tsx` — Renders nav items from `sidebarItems`, uses `Link` from TanStack Router with `activeProps`. The `to` property is typed as `keyof FileRoutesByTo` from the auto-generated route tree.
- `apps/app/components/layout/header.tsx:26` — Hardcoded string `"Application"` in `<h1>`.

### Auth Pages

- `apps/app/routes/(auth)/login.tsx:56-64` — Login page wraps `<AuthForm mode="login">` in a centered container with `bg-muted/40`.
- `apps/app/routes/(auth)/signup.tsx:55-65` — Signup page identical layout with `mode="signup"`.
- `apps/app/components/auth/auth-form.tsx:10` — `APP_NAME = import.meta.env.VITE_APP_NAME || "your account"` used in login heading: `Log in to ${APP_NAME}`.
- `apps/app/components/auth/auth-form.tsx:92-96` — Logo section renders `logo512.png`.
- `apps/app/components/auth/auth-form.tsx:169` — Heading for login: `Log in to ${APP_NAME}`, for signup: `Create your account`.

### Meta Tags & Manifest

- `apps/app/index.html:5` — `<title>%VITE_APP_NAME%</title>`.
- `apps/app/index.html:8` — `<meta name="description" content="The web's most popular Jamstack React template">` — template text.
- `apps/app/index.html:16` — `<meta name="theme-color" content="#fafafa">`.
- `apps/app/public/site.manifest:2-3` — `"short_name": "React App"`, `"name": "React App Sample"`.

### CSS Theme Variables

- `apps/app/styles/globals.css:13-47` — Light mode `:root` CSS variables using oklch. Currently grayscale palette.
- `apps/app/styles/globals.css:49-82` — Dark mode `.dark` CSS variables.
- `apps/web/styles/globals.css` — Identical CSS variables for the web app.

### Dashboard (index route)

- `apps/app/routes/(app)/index.tsx:15-138` — Template dashboard with "Total Users", "Active Sessions", "Reports Generated", "Growth Rate" stats. Quick actions: "Generate Report", "Manage Users", "View Analytics", "Export Data". All template content.

### Template Pages to Rebrand

- `apps/app/routes/(app)/about.tsx` — "About React Starter Kit", Kriasoft references.
- `apps/app/routes/(app)/analytics.tsx` — "Total Revenue", "Active Users" — SaaS template metrics.
- `apps/app/routes/(app)/reports.tsx` — Sales reports, financial reports — SaaS template.
- `apps/app/routes/(app)/users.tsx` — User management table — SaaS template.

### Web Marketing Pages (Astro)

- `apps/web/layouts/BaseLayout.astro:11` — Title: "React Starter Kit - Modern Full-Stack Web Application".
- `apps/web/layouts/BaseLayout.astro:51` — Nav brand: "React Starter Kit".
- `apps/web/layouts/BaseLayout.astro:70-78` — GitHub and "Get Started" links to kriasoft repo.
- `apps/web/layouts/BaseLayout.astro:98` — Footer brand: "React Starter Kit".
- `apps/web/pages/index.astro:50` — Hero heading: "React Starter Kit".
- `apps/web/pages/about.astro` — Full about page referencing React Starter Kit and Kriasoft.
- `apps/web/pages/features.astro` — Features page with generic template features.
- `apps/web/pages/pricing.astro` — Pricing page referencing React Starter Kit.

### Email Templates

- `apps/email/components/BaseTemplate.tsx:39` — Default `appName = "React Starter Kit"`.
- `apps/email/emails/*.tsx` — All preview files pass `appName="React Starter Kit"`.

### API Branding

- `apps/api/lib/stripe.ts:7` — `appInfo: { name: "React Starter Kit" }`.
- `apps/api/lib/auth.ts:186` — `rpName: env.APP_NAME` — passkey relying party name uses env var.
- `apps/api/lib/email.ts:107,141,184` — `appName: env.APP_NAME` — email templates use env var.

### Route Tree (auto-generated)

- `apps/app/lib/routeTree.gen.ts` — Auto-generated by TanStack Router. Contains type mappings for `/about`, `/analytics`, `/dashboard`, `/reports`, `/settings`, `/users`, `/login`, `/signup`, `/`. **NEVER edit this file manually.** It will regenerate when route files change.

### Important Constraint

- The sidebar-nav `to` property is typed as `keyof FileRoutesByTo`. Currently valid routes include `/analytics`, `/users`, `/reports`. After sidebar nav update, the items will reference `/`, `/journal`, `/analytics`, `/settings`. Since `/journal` route does NOT exist yet (it's a future deliverable), the sidebar must only reference existing routes. For this deliverable, we use `/analytics` renamed to "Insights" in the label.

---

## External Context

### Tailwind CSS v4 oklch Color System

- The project uses oklch() color function for CSS variables (better perceptual uniformity than hex/hsl).
- oklch format: `oklch(lightness chroma hue)` where lightness is 0-1, chroma is 0-0.4, hue is 0-360 degrees.
- Sage green in oklch: `oklch(0.85 0.05 155)` (from PRD 03-feature-specs.md:15).
- Lavender accent in oklch: approximately `oklch(0.80 0.06 300)`.
- Warm ivory background: approximately `oklch(0.99 0.01 90)`.

### PRD Color Palette Reference (from `ai_docs/prd/03-feature-specs.md:15`)

- Sage green: `oklch(0.85 0.05 155)` — primary accent color.
- Warm ivory: background tone.
- Muted lavender: accent highlights.
- Typography: Large, breathable headings with generous letter-spacing, body text at 18px.

### shadcn/ui Theming

- Colors are defined as CSS custom properties in `globals.css`.
- Tailwind maps these via `tailwind.config.css` using `--color-*: var(--*)` pattern.
- The `@repo/ui` package components reference these variables.

### TanStack Router File-Based Routing

- Route files in `routes/` are auto-scanned. Adding/removing files triggers `routeTree.gen.ts` regeneration.
- Route groups `(app)/` and `(auth)/` use parentheses (don't affect URLs).
- `route.tsx` in a group defines a layout with shared `beforeLoad`.

---

## Architectural Narrative

### Task

Replace all template branding from the kriasoft/react-starter-kit boilerplate with "Serene" wellness journal branding. This includes environment variables, UI text, navigation structure, color palette, meta tags, email templates, web marketing pages, and auth page aesthetics. The result should clearly communicate "Serene -- Your AI-Powered Wellness Journal" with a calm visual aesthetic.

### Architecture

The branding touches three workers in the monorepo:

1. **App SPA** (`apps/app/`) -- React 19 + TanStack Router. The sidebar, header, auth pages, dashboard, and about page all contain template text. CSS variables in `globals.css` control the entire color system via oklch values.
2. **API** (`apps/api/`) -- Hono backend. Uses `APP_NAME` env var for passkey RP name, email templates, and Stripe app info.
3. **Web** (`apps/web/`) -- Astro edge router. Marketing pages (index, about, features, pricing) and layout all reference "React Starter Kit".
4. **Email** (`apps/email/`) -- React Email templates. BaseTemplate defaults to "React Starter Kit".

### Selected Context

All 20+ files containing "Acme", "Console", "React Starter Kit", "Application", or "Kriasoft" references need updates. The complete grep output in Code Context section maps every occurrence.

### Relationships

- `.env:APP_NAME` flows to: `vite.config.ts` (exposes as `VITE_APP_NAME`) -> `auth-form.tsx` (login heading) -> `index.html` (page title).
- `.env:APP_NAME` also flows to: `api/lib/env.ts` -> `api/lib/auth.ts` (passkey RP name) -> `api/lib/email.ts` (email appName).
- `globals.css` CSS variables flow to: `tailwind.config.css` (`--color-*` mappings) -> all `@repo/ui` components and Tailwind utilities across the app.
- `constants.ts` sidebar items flow to: `sidebar-nav.tsx` -> `sidebar.tsx` (rendered nav).

### External Context

- oklch color values from PRD: sage green `oklch(0.85 0.05 155)`, adapted for CSS variable system.
- PRD sidebar spec from `08-frontend-components.md:36-43`: Dashboard, Journal, Insights, Settings with `Home, BookHeart, BarChart3, Settings` icons.
- PRD hero section from `03-feature-specs.md:9-31`: headline, subheadline, CTAs.

### Implementation Notes

1. **Route constraint**: The PRD specifies a `/journal` route in sidebar items, but that route does NOT exist yet (future deliverable). For this branding deliverable, the sidebar must only reference routes that exist in the current route tree. Use `/` for Dashboard, `/analytics` for Insights, `/settings` for Settings. Omit `/journal` (the Journal route will be added in a later deliverable when the journal page is built).
2. **CSS variables**: The calm color palette must be applied through the existing CSS variable system in `globals.css`, NOT through inline styles or new Tailwind config. This ensures all shadcn/ui components pick up the new colors automatically.
3. **Auto-generated route tree**: `lib/routeTree.gen.ts` is auto-generated. We do NOT edit it. If route files are added/removed, Vite dev server regenerates it automatically.
4. **Email template defaults**: The `BaseTemplate.tsx` default `appName` should change to "Serene", but the API already passes `env.APP_NAME` dynamically. Changing both ensures correctness whether env var is present or not.
5. **Auth page hero section**: The login/signup pages need a branding section above the auth form card. This includes the app name, tagline, and USP messaging. The current layout is a simple centered card on `bg-muted/40` -- we enhance it with branding content and the calm color palette.

### Ambiguities

1. **Scope of web marketing pages**: The deliverable focuses on the App SPA branding. The web marketing pages (Astro) contain extensive template content that should also be rebranded, but a full marketing site rewrite is beyond scope. Decision: Update the web pages with Serene branding text and messaging, but keep the same page structure. Full marketing page redesign is a future deliverable.
2. **Font changes**: The PRD mentions "breathable headings with generous letter-spacing". The current app uses Inter font. Decision: Keep Inter but add letter-spacing to headings on auth pages via Tailwind classes. No new font imports.
3. **Dashboard content**: The current dashboard has generic SaaS stats ("Total Users", etc.). Full dashboard redesign to journal-focused content is a future deliverable. Decision: Update the dashboard with Serene-appropriate placeholder content (e.g., "Journal Entries", "Mood Check-ins", "Current Streak", "Insights Generated") to remove template references.

### Requirements

1. `APP_NAME` environment variable changed from "Acme Co." to "Serene" in `.env`.
2. Sidebar displays "Serene" branding (not "Console").
3. Sidebar navigation items: Dashboard, Insights, Settings (3 items, using only existing routes).
4. Header displays "Serene" (not "Application").
5. Page title displays "Serene" (via `VITE_APP_NAME`).
6. Meta description updated to describe Serene wellness journal.
7. Login page heading says "Log in to Serene" (or equivalent branded text).
8. Signup page displays branded messaging.
9. Auth pages have calm aesthetic: sage green, warm ivory, lavender accents via CSS variables.
10. USP clearly stated on auth pages: "Your AI-Powered Wellness Journal".
11. No visible references to "Acme", "Console", "React Starter Kit", "Kriasoft", or "Application" in the app.
12. Web manifest updated with "Serene" name.
13. Email template default appName updated to "Serene".
14. Stripe appInfo updated to "Serene".
15. Web marketing pages (Astro) updated with Serene branding.
16. Dashboard content updated with journal-appropriate placeholders.
17. About page updated with Serene information.
18. Bowser QA YAML created at `ai_review/user_stories/branding.yaml`.
19. `theme-color` meta tag updated to match new palette.
20. All tests pass (`bun test --run`), typecheck passes (`bun typecheck`), prettier passes.

### Constraints

- Must not modify `lib/routeTree.gen.ts` (auto-generated).
- Sidebar nav items must only reference routes that exist in the current route tree (`/`, `/analytics`, `/settings`, `/about`, `/reports`, `/users`, `/dashboard`).
- CSS variables must use oklch() format to match existing convention.
- File naming: kebab-case. Component naming: PascalCase. Import aliases: `@/` within app, `@repo/ui` for UI package.
- Prettier config: double quotes, semicolons, trailing commas, 80 char width.

### Selected Approach

**Approach**: CSS Variable Theming + Text Replacement + Auth Page Hero Enhancement
**Description**: Update the existing CSS custom property system in `globals.css` to use a calm color palette (sage green primary, warm ivory background, lavender accents). Replace all hardcoded template branding strings across the monorepo with "Serene" equivalents. Enhance the auth pages (login/signup) with a branding hero section that communicates the USP above the auth form card. Update sidebar navigation to journal-specific items using only existing routes.
**Rationale**: This approach works entirely within the existing theming system (CSS variables -> Tailwind mappings -> shadcn/ui components). No new dependencies, no structural changes to the component tree, and all existing components automatically pick up the new colors. The auth page enhancement is minimal -- adding a branding section above the existing auth form card rather than rebuilding the auth flow.
**Trade-offs Accepted**: The sidebar will not include a "Journal" link yet since that route doesn't exist. The dashboard will have placeholder journal stats rather than real data. The web marketing pages get rebranded text but not a full redesign.

---

## Implementation Plan

### .env [edit]

**Purpose**: Root environment defaults file. Sets `APP_NAME` used by Vite (as `VITE_APP_NAME`) and by the API service.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 11: Change `APP_NAME=Acme Co.` to `APP_NAME=Serene`.

**Implementation Details**:

- This single change propagates to: page title (`index.html` via `%VITE_APP_NAME%`), auth form heading (`auth-form.tsx` via `import.meta.env.VITE_APP_NAME`), passkey RP name (`api/lib/auth.ts` via `env.APP_NAME`), email sender name (`api/lib/email.ts` via `env.APP_NAME`).

**Reference Implementation**:

```env
# Web application settings
APP_NAME=Serene
APP_ORIGIN=http://localhost:5173
API_ORIGIN=http://localhost:8787
ENVIRONMENT=development
PORT=8787
```

**Migration Pattern**:

```env
# BEFORE (line 11):
APP_NAME=Acme Co.

# AFTER (line 11):
APP_NAME=Serene
```

**Dependencies**: None
**Provides**: `APP_NAME=Serene` environment variable consumed by `apps/app/vite.config.ts`, `apps/api/lib/env.ts`

---

### apps/app/index.html [edit]

**Purpose**: SPA entry point HTML. Contains `<title>`, meta description, theme-color, and font imports.
**TOTAL CHANGES**: 3

**Changes**:

1. Line 8: Change `<meta name="description" content="The web's most popular Jamstack React template" />` to Serene-specific description.
2. Line 16: Change `<meta name="theme-color" content="#fafafa" />` to sage green theme color.
3. Lines 23-28: Add Lora serif font import alongside Inter for headings (provides the "breathable" typography feel).

**Implementation Details**:

- The page title on line 5 uses `%VITE_APP_NAME%` which will resolve to "Serene" after the `.env` change. No edit needed for the title.
- OG meta tags (lines 12-14) are empty placeholders; populate them with Serene content.
- Theme color should match the primary sage green: `#8B9E7C` (hex equivalent of the oklch sage green).

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
    <meta name="theme-color" content="#8B9E7C" />

    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/logo192.png" />

    <link rel="manifest" href="/site.manifest" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap"
    />
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
<!-- BEFORE (line 8): -->
<meta
  name="description"
  content="The web's most popular Jamstack React template"
/>

<!-- AFTER (line 8): -->
<meta
  name="description"
  content="Serene — Your AI-powered wellness journal. Track your mood, reflect on your day, and receive personalized insights."
/>

<!-- BEFORE (lines 12-14 — empty OG tags): -->
<meta property="og:title" content="" />
<meta property="og:type" content="" />

<!-- AFTER: -->
<meta property="og:title" content="Serene — AI-Powered Wellness Journal" />
<meta property="og:type" content="website" />

<!-- BEFORE (line 16): -->
<meta name="theme-color" content="#fafafa" />

<!-- AFTER: -->
<meta name="theme-color" content="#8B9E7C" />

<!-- BEFORE (lines 25-28 — single font): -->
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
/>

<!-- AFTER (added Lora): -->
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap"
/>
```

**Dependencies**: `.env` (for `%VITE_APP_NAME%` resolution)
**Provides**: Updated HTML shell with Serene meta tags, theme color, and Lora font availability

---

### apps/app/public/site.manifest [edit]

**Purpose**: PWA web app manifest. Contains app name and theme colors.
**TOTAL CHANGES**: 4

**Changes**:

1. Line 2: Change `"short_name": "React App"` to `"short_name": "Serene"`.
2. Line 3: Change `"name": "React App Sample"` to `"name": "Serene — AI-Powered Wellness Journal"`.
3. Line 23: Change `"background_color": "#fafafa"` to `"background_color": "#FFFEF2"` (warm ivory).
4. Line 24: Change `"theme_color": "#fafafa"` to `"theme_color": "#8B9E7C"` (sage green).

**Reference Implementation**:

```json
{
  "short_name": "Serene",
  "name": "Serene — AI-Powered Wellness Journal",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/?utm_source=homescreen",
  "display": "standalone",
  "background_color": "#FFFEF2",
  "theme_color": "#8B9E7C"
}
```

**Dependencies**: None
**Provides**: Updated PWA manifest with Serene branding

---

### apps/app/styles/globals.css [edit]

**Purpose**: CSS custom property definitions for the app's light and dark mode color themes. All shadcn/ui components and Tailwind utilities derive their colors from these variables.
**TOTAL CHANGES**: 2 (light mode `:root` block and dark mode `.dark` block)

**Changes**:

1. Lines 13-47: Replace `:root` CSS variables with Serene calm palette (sage green primary, warm ivory background, lavender accents).
2. Lines 49-82: Replace `.dark` CSS variables with Serene dark mode palette (darker sage/lavender tones).

**Implementation Details**:

- `--background`: Warm ivory `oklch(0.99 0.01 90)` instead of pure white `oklch(1 0 0)`.
- `--primary`: Sage green `oklch(0.45 0.08 155)` instead of near-black `oklch(0.205 0 0)`. This is the primary interactive color for buttons, links, active states.
- `--primary-foreground`: White text on sage green: `oklch(0.985 0 0)`.
- `--accent`: Soft lavender `oklch(0.92 0.03 300)` instead of gray `oklch(0.97 0 0)`.
- `--ring`: Sage green ring: `oklch(0.55 0.08 155)`.
- `--sidebar`: Warm ivory sidebar: `oklch(0.97 0.01 90)`.
- `--sidebar-primary`: Sage green for active sidebar items.
- Keep `--destructive` unchanged (red for error states).
- Keep `--border`, `--input` similar to existing (subtle neutral).
- Dark mode: sage green becomes lighter `oklch(0.70 0.08 155)`, background becomes dark warm tone `oklch(0.16 0.01 90)`.

**Reference Implementation**:

```css
@import "../tailwind.config.css";

/**
 * CSS Variables for Serene Wellness Journal Theming
 *
 * Calm palette: sage green primary, warm ivory background, lavender accents.
 * Using oklch() for better color interpolation and consistency.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
 */
:root {
  --radius: 0.625rem;
  --background: oklch(0.99 0.01 90);
  --foreground: oklch(0.18 0.02 90);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.02 90);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.02 90);
  --primary: oklch(0.45 0.08 155);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.95 0.02 155);
  --secondary-foreground: oklch(0.25 0.04 155);
  --muted: oklch(0.96 0.01 90);
  --muted-foreground: oklch(0.5 0.02 90);
  --accent: oklch(0.92 0.03 300);
  --accent-foreground: oklch(0.3 0.05 300);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.9 0.01 90);
  --input: oklch(0.9 0.01 90);
  --ring: oklch(0.55 0.08 155);
  --chart-1: oklch(0.55 0.1 155);
  --chart-2: oklch(0.6 0.08 220);
  --chart-3: oklch(0.5 0.06 300);
  --chart-4: oklch(0.7 0.1 90);
  --chart-5: oklch(0.65 0.08 45);
  --sidebar: oklch(0.97 0.01 90);
  --sidebar-foreground: oklch(0.18 0.02 90);
  --sidebar-primary: oklch(0.45 0.08 155);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.92 0.03 155);
  --sidebar-accent-foreground: oklch(0.25 0.04 155);
  --sidebar-border: oklch(0.9 0.01 90);
  --sidebar-ring: oklch(0.55 0.08 155);
}

.dark {
  --background: oklch(0.16 0.01 90);
  --foreground: oklch(0.93 0.01 90);
  --card: oklch(0.2 0.01 90);
  --card-foreground: oklch(0.93 0.01 90);
  --popover: oklch(0.2 0.01 90);
  --popover-foreground: oklch(0.93 0.01 90);
  --primary: oklch(0.7 0.08 155);
  --primary-foreground: oklch(0.15 0.02 155);
  --secondary: oklch(0.25 0.03 155);
  --secondary-foreground: oklch(0.9 0.02 155);
  --muted: oklch(0.25 0.01 90);
  --muted-foreground: oklch(0.65 0.02 90);
  --accent: oklch(0.3 0.04 300);
  --accent-foreground: oklch(0.9 0.03 300);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.55 0.08 155);
  --chart-1: oklch(0.6 0.1 155);
  --chart-2: oklch(0.55 0.08 220);
  --chart-3: oklch(0.65 0.06 300);
  --chart-4: oklch(0.55 0.1 90);
  --chart-5: oklch(0.6 0.08 45);
  --sidebar: oklch(0.2 0.01 90);
  --sidebar-foreground: oklch(0.93 0.01 90);
  --sidebar-primary: oklch(0.65 0.08 155);
  --sidebar-primary-foreground: oklch(0.93 0.01 90);
  --sidebar-accent: oklch(0.25 0.03 155);
  --sidebar-accent-foreground: oklch(0.9 0.02 155);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.55 0.08 155);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Dependencies**: None
**Provides**: Calm color palette CSS variables consumed by all components via Tailwind

---

### apps/app/components/layout/sidebar.tsx [edit]

**Purpose**: Sidebar component rendered within the app layout. Shows brand name and navigation.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 18: Change `<h2 className="font-semibold text-lg">Console</h2>` to `<h2 className="font-semibold text-lg">Serene</h2>`.

**Reference Implementation**:

```tsx
import { UserMenu } from "@/components/user-menu";
import { sidebarItems } from "./constants";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-0"
      } transition-all duration-300 ease-in-out bg-muted/50 border-r overflow-hidden`}
    >
      <div className="h-full flex flex-col">
        <div className="h-14 flex items-center px-4 border-b">
          <h2 className="font-semibold text-lg">Serene</h2>
        </div>
        <SidebarNav items={sidebarItems} />
        <UserMenu />
      </div>
    </aside>
  );
}
```

**Migration Pattern**:

```tsx
// BEFORE (line 18):
<h2 className="font-semibold text-lg">Console</h2>

// AFTER:
<h2 className="font-semibold text-lg">Serene</h2>
```

**Dependencies**: None
**Provides**: Sidebar with "Serene" branding

---

### apps/app/components/layout/constants.ts [edit]

**Purpose**: Sidebar navigation items configuration. Defines icons, labels, and route paths.
**TOTAL CHANGES**: 1 (full file rewrite -- 9 lines)

**Changes**:

1. Lines 1-9: Replace entire file with journal-specific navigation items. Remove `Activity`, `FileText`, `Users` imports. Add `BarChart3` import. Keep only routes that exist: `/` (Dashboard), `/analytics` (Insights), `/settings` (Settings).

**Implementation Details**:

- Remove `Users` and `FileText` icon imports (no longer used).
- Remove `Activity` import, replace with `BarChart3` for the Insights item.
- The `to` property must be a valid key in `FileRoutesByTo`. `/`, `/analytics`, and `/settings` are all valid routes in the current route tree (`routeTree.gen.ts:84-93`).
- Do NOT add `/journal` -- that route does not exist yet.

**Reference Implementation**:

```typescript
import { BarChart3, Home, Settings } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;
```

**Migration Pattern**:

```typescript
// BEFORE:
import { Activity, FileText, Home, Settings, Users } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: Activity, label: "Analytics", to: "/analytics" },
  { icon: Users, label: "Users", to: "/users" },
  { icon: FileText, label: "Reports", to: "/reports" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;

// AFTER:
import { BarChart3, Home, Settings } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;
```

**Dependencies**: None
**Provides**: Updated `sidebarItems` array consumed by `sidebar-nav.tsx`

---

### apps/app/components/layout/header.tsx [edit]

**Purpose**: Top header bar with menu toggle and app title.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 26: Change `<h1 className="text-lg font-semibold">Application</h1>` to `<h1 className="text-lg font-semibold">Serene</h1>`.

**Reference Implementation**:

```tsx
import { Button } from "@repo/ui";
import { Menu, Settings, X } from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="shrink-0"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <h1 className="text-lg font-semibold">Serene</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

**Migration Pattern**:

```tsx
// BEFORE (line 26):
<h1 className="text-lg font-semibold">Application</h1>

// AFTER:
<h1 className="text-lg font-semibold">Serene</h1>
```

**Dependencies**: None
**Provides**: Header with "Serene" title

---

### apps/app/components/auth/auth-form.tsx [edit]

**Purpose**: Shared authentication form component used by both login and signup pages. Contains logo, method selection, email input, and OTP verification steps.
**TOTAL CHANGES**: 3

**Changes**:

1. Line 10: Change the fallback value in `APP_NAME` from `"your account"` to `"Serene"`.
2. Lines 92-96: Replace the logo `<img>` with a text-based Serene brand mark and tagline.
3. Line 169: Update the login heading from `` `Log in to ${APP_NAME}` `` to `"Welcome back"` for a warmer tone (the brand name is already visible in the logo section above).

**Implementation Details**:

- The logo section currently renders `<img src="/logo512.png" ... />`. Replace with a styled text brand mark: "Serene" in a serif font (Lora) with the tagline below.
- The signup heading "Create your account" stays as-is -- the brand context is provided by the logo/tagline section above it.
- Add a USP subtitle below the Serene text: "Your AI-Powered Wellness Journal".

**Reference Implementation**:

```tsx
import { Button, Input, cn } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import type { ComponentProps, FormEvent } from "react";
import { GoogleLogin } from "./google-login";
import { OtpVerification } from "./otp-verification";
import { PasskeyLogin } from "./passkey-login";
import { useAuthForm } from "./use-auth-form";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Serene";

function SignupTerms() {
  return (
    <p className="text-xs text-muted-foreground text-center text-balance">
      By signing up, you agree to our{" "}
      <a
        href="/terms"
        className="underline underline-offset-4 hover:text-primary"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="/privacy"
        className="underline underline-offset-4 hover:text-primary"
      >
        Privacy Policy
      </a>
      .
    </p>
  );
}

interface AuthFormProps extends ComponentProps<"div"> {
  /**
   * UI mode affecting copy, ToS display, and available methods.
   * Both modes use the same passwordless OTP flow that auto-creates accounts.
   */
  mode?: "login" | "signup";
  /** Called after successful auth. Awaited before UI progresses. Caller handles cache invalidation and navigation. */
  onSuccess: () => Promise<void>;
  isLoading?: boolean;
  /** Post-auth redirect destination. Must be a safe relative path (validated by caller). */
  returnTo?: string;
}

export function AuthForm({
  className,
  onSuccess,
  isLoading,
  mode = "login",
  returnTo,
  ...props
}: AuthFormProps) {
  const {
    step,
    email,
    isDisabled,
    error,
    changeEmail,
    onAuthSuccess,
    setError,
    sendOtp,
    goToEmailStep,
    goToMethodStep,
    resetToEmail,
    setChildBusy,
    mode: formMode,
  } = useAuthForm({
    onSuccess,
    isExternallyLoading: isLoading,
    mode,
  });

  // Clear error when user changes email
  const handleEmailChange = (value: string) => {
    if (error) setError(null);
    changeEmail(value);
  };

  // Voluntary back from OTP clears error; forced back (via onCancel) preserves it
  const handleOtpBack = () => {
    setError(null);
    resetToEmail();
  };

  const isSignup = formMode === "signup";

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      {/* Brand Mark */}
      <div className="flex flex-col items-center gap-1">
        <Link to="/" aria-label="Go to homepage">
          <span className="text-2xl font-semibold tracking-tight text-primary font-[Lora,serif]">
            Serene
          </span>
        </Link>
        <p className="text-xs text-muted-foreground">
          Your AI-Powered Wellness Journal
        </p>
      </div>

      {/* Error message - role="alert" ensures screen readers announce it */}
      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Step: Method Selection */}
      {step === "method" && (
        <MethodSelection
          isSignup={isSignup}
          isDisabled={isDisabled}
          onEmailClick={goToEmailStep}
          onSuccess={onAuthSuccess}
          onError={setError}
          onLoadingChange={setChildBusy}
          returnTo={returnTo}
        />
      )}

      {/* Step: Email Input */}
      {step === "email" && (
        <EmailInput
          email={email}
          isSignup={isSignup}
          isDisabled={isDisabled}
          onEmailChange={handleEmailChange}
          onSubmit={sendOtp}
          onBack={goToMethodStep}
        />
      )}

      {/* Step: OTP Verification */}
      {step === "otp" && (
        <OtpStep
          email={email}
          isDisabled={isDisabled}
          onSuccess={onAuthSuccess}
          onError={setError}
          onLoadingChange={setChildBusy}
          onBack={handleOtpBack}
          onCancel={resetToEmail}
        />
      )}
    </div>
  );
}

// Step 1: Method Selection
interface MethodSelectionProps {
  isSignup: boolean;
  isDisabled: boolean;
  onEmailClick: () => void;
  onSuccess: () => void;
  onError: (error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  returnTo?: string;
}

function MethodSelection({
  isSignup,
  isDisabled,
  onEmailClick,
  onSuccess,
  onError,
  onLoadingChange,
  returnTo,
}: MethodSelectionProps) {
  const heading = isSignup ? "Create your account" : "Welcome back";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">{heading}</h1>

      <div className="flex flex-col gap-3">
        <GoogleLogin
          onError={onError}
          isDisabled={isDisabled}
          onLoadingChange={onLoadingChange}
          returnTo={returnTo}
        />

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onEmailClick}
          disabled={isDisabled}
        >
          <Mail className="mr-2 h-4 w-4" />
          Continue with email
        </Button>

        {/* Passkey only available for login (requires existing account) */}
        {!isSignup && (
          <PasskeyLogin
            onSuccess={onSuccess}
            onError={onError}
            onLoadingChange={onLoadingChange}
            isDisabled={isDisabled}
          />
        )}
      </div>

      {isSignup && <SignupTerms />}

      {/* Account switch link */}
      <p className="text-sm text-muted-foreground text-center">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

// Step 2: Email Input
interface EmailInputProps {
  email: string;
  isSignup: boolean;
  isDisabled: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: (e?: FormEvent) => void;
  onBack: () => void;
}

function EmailInput({
  email,
  isSignup,
  isDisabled,
  onEmailChange,
  onSubmit,
  onBack,
}: EmailInputProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">
        What's your email address?
      </h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Enter your email address..."
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isDisabled}
          autoComplete="email"
          autoFocus
          required
        />
        <Button
          type="submit"
          variant="default"
          className="w-full"
          disabled={isDisabled || !email.trim()}
        >
          Continue with email
        </Button>
      </form>

      {isSignup && <SignupTerms />}

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        disabled={isDisabled}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {isSignup ? "sign up" : "login"}
      </button>
    </div>
  );
}

// Step 3: OTP Verification
interface OtpStepProps {
  email: string;
  isDisabled: boolean;
  onSuccess: () => void;
  onError: (error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onBack: () => void;
  onCancel: () => void;
}

function OtpStep({
  email,
  isDisabled,
  onSuccess,
  onError,
  onLoadingChange,
  onBack,
  onCancel,
}: OtpStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground mt-1">
          We sent a code to <strong>{email}</strong>
        </p>
      </div>

      <OtpVerification
        email={email}
        onSuccess={onSuccess}
        onError={onError}
        onLoadingChange={onLoadingChange}
        onCancel={onCancel}
        isDisabled={isDisabled}
      />

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        disabled={isDisabled}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to email
      </button>
    </div>
  );
}
```

**Migration Pattern**:

```tsx
// BEFORE (line 10):
const APP_NAME = import.meta.env.VITE_APP_NAME || "your account";

// AFTER:
const APP_NAME = import.meta.env.VITE_APP_NAME || "Serene";

// BEFORE (lines 92-96):
<div className="flex justify-center">
  <Link to="/" aria-label="Go to homepage">
    <img src="/logo512.png" alt="" className="h-10 w-10" />
  </Link>
</div>

// AFTER:
<div className="flex flex-col items-center gap-1">
  <Link to="/" aria-label="Go to homepage">
    <span className="text-2xl font-semibold tracking-tight text-primary font-[Lora,serif]">
      Serene
    </span>
  </Link>
  <p className="text-xs text-muted-foreground">
    Your AI-Powered Wellness Journal
  </p>
</div>

// BEFORE (line 169):
const heading = isSignup ? "Create your account" : `Log in to ${APP_NAME}`;

// AFTER:
const heading = isSignup ? "Create your account" : "Welcome back";
```

**Dependencies**: `apps/app/index.html` (Lora font must be loaded), `.env` (for `VITE_APP_NAME`)
**Provides**: Branded auth form with Serene identity and USP tagline

---

### apps/app/routes/(auth)/login.tsx [edit]

**Purpose**: Login page route component. Wraps `AuthForm` in a centered layout.
**TOTAL CHANGES**: 1

**Changes**:

1. Lines 56-64: Update the page container to use the Serene calm aesthetic. Add a USP subtitle above the auth card. Change `bg-muted/40` to a gradient background that uses the warm ivory and sage green palette.

**Reference Implementation**:

```tsx
import { AuthForm } from "@/components/auth";
import { getSafeRedirectUrl } from "@/lib/auth-config";
import { revalidateSession, sessionQueryOptions } from "@/lib/queries/session";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  isRedirect,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { z } from "zod";

// Sanitize returnTo at parse time - consumers get a safe value or undefined
const searchSchema = z.object({
  returnTo: z
    .string()
    .optional()
    .transform((val) => {
      const safe = getSafeRedirectUrl(val);
      return safe === "/" ? undefined : safe;
    })
    .catch(undefined),
});

export const Route = createFileRoute("/(auth)/login")({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    try {
      const session = await context.queryClient.fetchQuery(
        sessionQueryOptions(),
      );

      // Redirect authenticated users to their destination
      if (session?.user && session?.session) {
        throw redirect({ to: search.returnTo ?? "/" });
      }
    } catch (error) {
      // Re-throw redirects, show login form for fetch errors
      if (isRedirect(error)) throw error;
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  async function handleSuccess() {
    await revalidateSession(queryClient, router);
    await router.navigate({ to: search.returnTo ?? "/" });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-6 md:p-10">
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground max-w-xs">
          Track your mood, reflect on your day, and receive personalized AI
          insights.
        </p>
      </div>
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-sm ring-1 ring-border/50">
        <AuthForm
          mode="login"
          onSuccess={handleSuccess}
          returnTo={search.returnTo}
        />
      </div>
    </div>
  );
}
```

**Migration Pattern**:

```tsx
// BEFORE (lines 55-65):
return (
  <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
    <div className="w-full max-w-sm rounded-xl bg-background p-8 shadow-sm ring-1 ring-border/50">
      <AuthForm
        mode="login"
        onSuccess={handleSuccess}
        returnTo={search.returnTo}
      />
    </div>
  </div>
);

// AFTER:
return (
  <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-6 md:p-10">
    <div className="mb-6 text-center">
      <p className="text-sm text-muted-foreground max-w-xs">
        Track your mood, reflect on your day, and receive personalized AI
        insights.
      </p>
    </div>
    <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-sm ring-1 ring-border/50">
      <AuthForm
        mode="login"
        onSuccess={handleSuccess}
        returnTo={search.returnTo}
      />
    </div>
  </div>
);
```

**Dependencies**: `apps/app/styles/globals.css` (for `--secondary`, `--background`, `--card` variables)
**Provides**: Branded login page with calm aesthetic and USP messaging

---

### apps/app/routes/(auth)/signup.tsx [edit]

**Purpose**: Signup page route component. Same layout pattern as login.
**TOTAL CHANGES**: 1

**Changes**:

1. Lines 55-65: Update the page container to match the login page calm aesthetic.

**Reference Implementation**:

```tsx
import { AuthForm } from "@/components/auth";
import { getSafeRedirectUrl } from "@/lib/auth-config";
import { revalidateSession, sessionQueryOptions } from "@/lib/queries/session";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  isRedirect,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { z } from "zod";

// Sanitize returnTo at parse time - consumers get a safe value or undefined
const searchSchema = z.object({
  returnTo: z
    .string()
    .optional()
    .transform((val) => {
      const safe = getSafeRedirectUrl(val);
      return safe === "/" ? undefined : safe;
    })
    .catch(undefined),
});

export const Route = createFileRoute("/(auth)/signup")({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    try {
      const session = await context.queryClient.fetchQuery(
        sessionQueryOptions(),
      );

      // Redirect authenticated users to their destination
      if (session?.user && session?.session) {
        throw redirect({ to: search.returnTo ?? "/" });
      }
    } catch (error) {
      // Re-throw redirects, show signup form for fetch errors
      if (isRedirect(error)) throw error;
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  async function handleSuccess() {
    await revalidateSession(queryClient, router);
    await router.navigate({ to: search.returnTo ?? "/" });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-6 md:p-10">
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground max-w-xs">
          Begin your wellness journey with AI-powered mood tracking and
          personalized insights.
        </p>
      </div>
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-sm ring-1 ring-border/50">
        <AuthForm
          mode="signup"
          onSuccess={handleSuccess}
          returnTo={search.returnTo}
        />
      </div>
    </div>
  );
}
```

**Migration Pattern**:

```tsx
// BEFORE (lines 55-65):
return (
  <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
    <div className="w-full max-w-sm rounded-xl bg-background p-8 shadow-sm ring-1 ring-border/50">
      <AuthForm
        mode="signup"
        onSuccess={handleSuccess}
        returnTo={search.returnTo}
      />
    </div>
  </div>
);

// AFTER:
return (
  <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-6 md:p-10">
    <div className="mb-6 text-center">
      <p className="text-sm text-muted-foreground max-w-xs">
        Begin your wellness journey with AI-powered mood tracking and
        personalized insights.
      </p>
    </div>
    <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-sm ring-1 ring-border/50">
      <AuthForm
        mode="signup"
        onSuccess={handleSuccess}
        returnTo={search.returnTo}
      />
    </div>
  </div>
);
```

**Dependencies**: `apps/app/styles/globals.css` (for CSS variables)
**Provides**: Branded signup page with calm aesthetic and USP messaging

---

### apps/app/routes/(app)/index.tsx [edit]

**Purpose**: Main dashboard page (app index route). Currently shows template SaaS metrics.
**TOTAL CHANGES**: 1 (full component rewrite)

**Changes**:

1. Lines 1-138: Replace entire file content with Serene-branded wellness dashboard showing journal-appropriate placeholder stats and welcome messaging.

**Implementation Details**:

- Replace SaaS stats (Total Users, Active Sessions, Reports Generated, Growth Rate) with journal stats (Journal Entries, Mood Check-ins, Current Streak, Insights Generated).
- Replace "Quick Actions" (Generate Report, Manage Users) with journal actions (New Entry, View Insights).
- Replace "Recent Activity" with a welcome/getting-started section.
- Import appropriate icons from lucide-react: `BookHeart`, `Heart`, `Flame`, `Sparkles`, `PenLine`, `BarChart3`.

**Reference Implementation**:

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, BookHeart, Flame, PenLine, Sparkles } from "lucide-react";

export const Route = createFileRoute("/(app)/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = [
    {
      title: "Journal Entries",
      value: "0",
      description: "Total entries",
      icon: BookHeart,
    },
    {
      title: "Mood Check-ins",
      value: "0",
      description: "This week",
      icon: Sparkles,
    },
    {
      title: "Current Streak",
      value: "0 days",
      description: "Keep it going!",
      icon: Flame,
    },
    {
      title: "AI Insights",
      value: "0",
      description: "Personalized reflections",
      icon: BarChart3,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to Serene. Track your mood, reflect, and grow.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Your wellness journey begins here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <PenLine className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Log your mood</p>
                  <p className="text-xs text-muted-foreground">
                    Choose how you're feeling right now
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookHeart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Write a reflection</p>
                  <p className="text-xs text-muted-foreground">
                    Share your thoughts in a few sentences
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Receive AI insights</p>
                  <p className="text-xs text-muted-foreground">
                    Get personalized encouragement and support
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Serene</CardTitle>
            <CardDescription>
              Your AI-powered wellness companion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Serene helps you build a mindful journaling habit. Track your
              mood, reflect on your day, and receive personalized AI insights to
              support your emotional well-being. Your entries are private and
              secure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Dependencies**: None
**Provides**: Serene-branded dashboard page

---

### apps/app/routes/(app)/about.tsx [edit]

**Purpose**: About page. Currently contains React Starter Kit and Kriasoft content.
**TOTAL CHANGES**: 1 (full component rewrite)

**Changes**:

1. Lines 1-270: Replace entire file with Serene about page content.

**Reference Implementation**:

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/about")({
  component: About,
});

function About() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-6">About Serene</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Serene is your private AI-powered wellness journal. Track your mood,
          write reflections, and receive gentle, personalized encouragement to
          support your emotional well-being.
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Our Mission</CardTitle>
            <CardDescription>
              Making mindful self-reflection accessible to everyone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We believe that small, consistent acts of self-reflection can have
              a profound impact on emotional well-being. Serene was created to
              make journaling effortless and rewarding.
            </p>
            <p className="text-muted-foreground">
              By combining mood tracking with AI-powered insights, Serene helps
              you notice patterns, celebrate progress, and navigate difficult
              moments with greater self-awareness.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">
          How Serene Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Log Your Mood</CardTitle>
              <CardDescription>
                Choose how you're feeling from six mood options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Happy, Calm, Anxious, Sad, Overwhelmed, or Angry. Each check-in
                takes just a moment and helps build a picture of your emotional
                landscape.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Write a Reflection</CardTitle>
              <CardDescription>
                Share your thoughts in your own words
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add context with optional tags and a brief note. There's no
                right or wrong way to journal. Even a few words can be
                meaningful.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Receive Insights</CardTitle>
              <CardDescription>
                Get personalized AI encouragement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Serene's AI companion responds with gentle, contextual
                encouragement. It acknowledges your feelings and offers support
                without judgment.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Privacy Matters</CardTitle>
            <CardDescription>
              Your journal entries are private and secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Every journal entry is encrypted and accessible only to you. We
              never share your personal reflections with third parties. You can
              export or delete your data at any time.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12" />

      {/* Disclaimer */}
      <section className="text-center">
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Serene is not a substitute for professional mental health care. If you
          are in crisis, please contact the 988 Suicide and Crisis Lifeline
          (call or text 988) or the Crisis Text Line (text HOME to 741741).
        </p>
      </section>
    </div>
  );
}
```

**Dependencies**: None
**Provides**: Serene-branded about page

---

### apps/api/lib/env.ts [edit]

**Purpose**: Zod schema for API environment variable validation. Contains default value for `APP_NAME`.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 11: Change `APP_NAME: z.string().default("Example")` to `APP_NAME: z.string().default("Serene")`.

**Migration Pattern**:

```typescript
// BEFORE (line 11):
APP_NAME: z.string().default("Example"),

// AFTER:
APP_NAME: z.string().default("Serene"),
```

**Dependencies**: None
**Provides**: Updated default `APP_NAME` for API env schema

---

### apps/api/lib/stripe.ts [edit]

**Purpose**: Stripe client factory. Contains `appInfo.name`.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 7: Change `appInfo: { name: "React Starter Kit" }` to `appInfo: { name: "Serene" }`.

**Migration Pattern**:

```typescript
// BEFORE (line 7):
appInfo: { name: "React Starter Kit" },

// AFTER:
appInfo: { name: "Serene" },
```

**Dependencies**: None
**Provides**: Updated Stripe app info

---

### apps/email/components/BaseTemplate.tsx [edit]

**Purpose**: Shared email template wrapper with header, footer, logo, and colors.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 39: Change `appName = "React Starter Kit"` to `appName = "Serene"`.

**Migration Pattern**:

```typescript
// BEFORE (line 39):
appName = "React Starter Kit",

// AFTER:
appName = "Serene",
```

**Dependencies**: None
**Provides**: Updated default app name for email templates

---

### apps/email/emails/email-verification.tsx [edit]

**Purpose**: Email preview file for React Email dev server.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 8: Change `appName="React Starter Kit"` to `appName="Serene"`.

**Migration Pattern**:

```tsx
// BEFORE:
appName = "React Starter Kit";
// AFTER:
appName = "Serene";
```

**Dependencies**: None
**Provides**: Updated email preview

---

### apps/email/emails/otp-password-reset.tsx [edit]

**Purpose**: OTP password reset email preview file.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 8: Change `appName="React Starter Kit"` to `appName="Serene"`.

**Migration Pattern**:

```tsx
// BEFORE:
appName = "React Starter Kit";
// AFTER:
appName = "Serene";
```

**Dependencies**: None
**Provides**: Updated email preview

---

### apps/email/emails/otp-sign-in.tsx [edit]

**Purpose**: OTP sign-in email preview file.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 8: Change `appName="React Starter Kit"` to `appName="Serene"`.

**Migration Pattern**:

```tsx
// BEFORE:
appName = "React Starter Kit";
// AFTER:
appName = "Serene";
```

**Dependencies**: None
**Provides**: Updated email preview

---

### apps/email/emails/otp-verification.tsx [edit]

**Purpose**: OTP verification email preview file.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 8: Change `appName="React Starter Kit"` to `appName="Serene"`.

**Migration Pattern**:

```tsx
// BEFORE:
appName = "React Starter Kit";
// AFTER:
appName = "Serene";
```

**Dependencies**: None
**Provides**: Updated email preview

---

### apps/email/emails/password-reset.tsx [edit]

**Purpose**: Password reset email preview file.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 8: Change `appName="React Starter Kit"` to `appName="Serene"`.

**Migration Pattern**:

```tsx
// BEFORE:
appName = "React Starter Kit";
// AFTER:
appName = "Serene";
```

**Dependencies**: None
**Provides**: Updated email preview

---

### apps/api/dev.ts [edit]

**Purpose**: Local development server for the API. Contains a fallback `APP_NAME` value.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 78: Change `APP_NAME: process.env.APP_NAME || cf.env.APP_NAME || "Example"` to use `"Serene"` as the final fallback.

**Migration Pattern**:

```typescript
// BEFORE (line 78):
APP_NAME: process.env.APP_NAME || cf.env.APP_NAME || "Example",

// AFTER:
APP_NAME: process.env.APP_NAME || cf.env.APP_NAME || "Serene",
```

**Dependencies**: None
**Provides**: Updated dev server fallback app name

---

### db/scripts/generate-auth-schema.ts [edit]

**Purpose**: Script for generating Better Auth database schema. Contains a fallback `APP_NAME` value.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 16: Change `APP_NAME: env.APP_NAME || "React Starter Kit"` to use `"Serene"` as the fallback.

**Migration Pattern**:

```typescript
// BEFORE (line 16):
APP_NAME: env.APP_NAME || "React Starter Kit",

// AFTER:
APP_NAME: env.APP_NAME || "Serene",
```

**Dependencies**: None
**Provides**: Updated schema generation script app name

---

### apps/web/styles/globals.css [edit]

**Purpose**: CSS custom property definitions for the web marketing site. Identical structure to the app's `globals.css`. Must be updated with the same Serene calm palette.
**TOTAL CHANGES**: 2 (light mode `:root` block and dark mode `.dark` block)

**Changes**:

1. Lines 13-47: Replace `:root` CSS variables with the same Serene calm palette used in `apps/app/styles/globals.css`.
2. Lines 49-82: Replace `.dark` CSS variables with the same Serene dark mode palette.

**Implementation Details**:

- The values must be IDENTICAL to `apps/app/styles/globals.css` to ensure visual consistency between the marketing site and the app.
- Copy the exact same `:root` and `.dark` blocks from the app's `globals.css` reference implementation.

**Reference Implementation**:
Same as `apps/app/styles/globals.css` -- see that section for the complete CSS.

**Dependencies**: None
**Provides**: Calm color palette CSS variables for web marketing pages

---

### apps/web/layouts/BaseLayout.astro [edit]

**Purpose**: Astro master layout with header navigation, footer, and meta tags for web marketing pages.
**TOTAL CHANGES**: 5

**Changes**:

1. Line 11: Change default title from `'React Starter Kit - Modern Full-Stack Web Application'` to `'Serene — AI-Powered Wellness Journal'`.
2. Line 12: Change default description.
3. Line 51: Change nav brand text from `React Starter Kit` to `Serene`.
4. Lines 68-83: Update header CTA buttons from GitHub links to app signup links.
5. Lines 94-165: Update footer content with Serene branding, removing all Kriasoft/GitHub references.

**Reference Implementation**:

```astro
---
import '@/styles/globals.css';

export interface Props {
  title?: string;
  description?: string;
  image?: string;
}

const {
  title = 'Serene — AI-Powered Wellness Journal',
  description = 'Track your mood, reflect on your day, and receive personalized AI insights to support your emotional well-being.',
  image = '/og-image.png'
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="generator" content={Astro.generator} />

    <!-- Primary Meta Tags -->
    <title>{title}</title>
    <meta name="title" content={title} />
    <meta name="description" content={description} />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={new URL(Astro.url.pathname, Astro.site ?? Astro.url)} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(image, Astro.site ?? Astro.url)} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={new URL(image, Astro.site ?? Astro.url)} />
  </head>
  <body>
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center space-x-4">
              <a href="/" class="text-xl font-bold text-primary">
                Serene
              </a>
            </div>
            <nav class="hidden md:flex items-center space-x-6">
              <a href="/" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Home
              </a>
              <a href="/features" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="/pricing" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="/about" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </nav>
            <div class="flex items-center space-x-2">
              <a
                href="http://localhost:5173/login"
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3"
              >
                Log In
              </a>
              <a
                href="http://localhost:5173/signup"
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="border-t bg-background/95">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="space-y-3">
              <h3 class="font-semibold">Serene</h3>
              <p class="text-sm text-muted-foreground">
                Your AI-powered wellness journal. Track your mood, reflect,
                and grow.
              </p>
            </div>
            <div class="space-y-3">
              <h4 class="font-medium">Product</h4>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/features" class="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/pricing" class="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/about" class="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
              </ul>
            </div>
            <div class="space-y-3">
              <h4 class="font-medium">Legal</h4>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/privacy" class="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" class="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="border-t mt-6 pt-6">
            <div class="flex flex-col sm:flex-row justify-between items-center">
              <p class="text-sm text-muted-foreground">
                Serene is not a substitute for professional mental health care.
              </p>
              <p class="text-sm text-muted-foreground">
                If you are in crisis, call or text 988.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </body>
</html>
```

**Dependencies**: None
**Provides**: Updated Astro layout with Serene branding for all web pages

---

### apps/web/pages/index.astro [edit]

**Purpose**: Web marketing home page. Currently shows React Starter Kit content.
**TOTAL CHANGES**: 1 (full content rewrite within BaseLayout)

**Changes**:

1. Lines 1-162: Replace entire file with Serene-branded landing page featuring hero section with USP, "How It Works" section, features grid, and CTA.

**Reference Implementation**:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';

const features = [
  {
    title: "Mood Tracking",
    description: "Log how you feel with six intuitive mood options",
    content: "Happy, Calm, Anxious, Sad, Overwhelmed, or Angry. Quick check-ins that take seconds, not minutes."
  },
  {
    title: "AI Companion",
    description: "Receive personalized encouragement after each entry",
    content: "Serene's AI responds with warm, contextual support. It acknowledges your feelings without judgment."
  },
  {
    title: "Private Journal",
    description: "Write reflections that are yours and yours alone",
    content: "Your entries are encrypted and private. Add optional tags to categorize your thoughts."
  },
  {
    title: "Weekly Insights",
    description: "Discover patterns in your emotional well-being",
    content: "Visual mood trends and tag correlations help you understand what affects your mood."
  },
  {
    title: "Effortless Habit",
    description: "Build a journaling streak in under 60 seconds",
    content: "Designed for consistency, not perfection. Even a quick mood check-in counts."
  },
  {
    title: "Crisis Support",
    description: "Safety resources when you need them most",
    content: "If Serene detects distress, it surfaces crisis helpline information alongside its response."
  }
];
---

<BaseLayout>
  <!-- Hero Section -->
  <section class="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/20">
    <div class="container mx-auto text-center">
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
        Find Your Calm.<br />One Entry at a Time.
      </h1>
      <p class="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
        Serene is your private AI-powered wellness journal. Log your mood,
        write your thoughts, and receive gentle encouragement — all in under
        60 seconds.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <a href="http://localhost:5173/signup">
            Start Journaling
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="#how-it-works">
            Learn More
          </a>
        </Button>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section id="how-it-works" class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold tracking-tight mb-4">
          How Serene Works
        </h2>
        <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
          Three simple steps to a more mindful day
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div class="text-center space-y-3">
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span class="text-lg font-semibold text-primary">1</span>
          </div>
          <h3 class="font-semibold">Log Your Mood</h3>
          <p class="text-sm text-muted-foreground">
            Choose how you're feeling from six mood options. It takes just a tap.
          </p>
        </div>
        <div class="text-center space-y-3">
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span class="text-lg font-semibold text-primary">2</span>
          </div>
          <h3 class="font-semibold">Write a Reflection</h3>
          <p class="text-sm text-muted-foreground">
            Add a few words about your day. Tag what's on your mind.
          </p>
        </div>
        <div class="text-center space-y-3">
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span class="text-lg font-semibold text-primary">3</span>
          </div>
          <h3 class="font-semibold">Get AI Insight</h3>
          <p class="text-sm text-muted-foreground">
            Receive personalized encouragement from your AI companion.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold tracking-tight mb-4">
          Built for Your Well-Being
        </h2>
        <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need for a meaningful journaling practice
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">{feature.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="container mx-auto text-center">
      <h2 class="text-3xl font-bold tracking-tight mb-4">
        Begin Your Wellness Journey
      </h2>
      <p class="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
        Join Serene and start building a mindful journaling habit today.
        Your first entry is waiting.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <a href="http://localhost:5173/signup">
            Start Journaling Free
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/about">
            Learn More
          </a>
        </Button>
      </div>
    </div>
  </section>
</BaseLayout>
```

**Dependencies**: `apps/web/layouts/BaseLayout.astro` (for Serene-branded layout)
**Provides**: Serene-branded landing page with hero, how-it-works, features, CTA

---

### apps/web/pages/about.astro [edit]

**Purpose**: Web marketing about page. Currently references React Starter Kit and Kriasoft.
**TOTAL CHANGES**: 1 (full content rewrite)

**Changes**:

1. Replace all file content with Serene-specific about page content. Same structure as the app about page but rendered as Astro (not React route).

**Reference Implementation**:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@repo/ui';

const title = "About — Serene";
const description = "Learn about Serene, your AI-powered wellness journal for mood tracking and personalized insights.";
---

<BaseLayout title={title} description={description}>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold tracking-tight mb-6">About Serene</h1>
      <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
        Serene is your private AI-powered wellness journal. Track your mood,
        write reflections, and receive gentle, personalized encouragement to
        support your emotional well-being.
      </p>
    </div>

    <section class="mb-20">
      <Card>
        <CardHeader>
          <CardTitle class="text-2xl">Our Mission</CardTitle>
          <CardDescription>Making mindful self-reflection accessible to everyone</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-muted-foreground">
            We believe that small, consistent acts of self-reflection can have a
            profound impact on emotional well-being. Serene was created to make
            journaling effortless and rewarding.
          </p>
          <p class="text-muted-foreground">
            By combining mood tracking with AI-powered insights, Serene helps you
            notice patterns, celebrate progress, and navigate difficult moments
            with greater self-awareness.
          </p>
        </CardContent>
      </Card>
    </section>

    <section class="mb-20">
      <h2 class="text-3xl font-bold tracking-tight mb-8 text-center">
        How Serene Works
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Log Your Mood</CardTitle>
            <CardDescription>Choose how you're feeling</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Select from six mood options: Happy, Calm, Anxious, Sad,
              Overwhelmed, or Angry. Quick check-ins that take seconds.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Write a Reflection</CardTitle>
            <CardDescription>Share your thoughts</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Add context with optional tags and a brief note. There's no right
              or wrong way to journal.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>3. Receive Insights</CardTitle>
            <CardDescription>Get personalized support</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Serene's AI companion responds with gentle, contextual encouragement
              that acknowledges your feelings without judgment.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    <section class="mb-20">
      <Card>
        <CardHeader>
          <CardTitle class="text-2xl">Your Privacy Matters</CardTitle>
          <CardDescription>Your journal entries are private and secure</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">
            Every journal entry is accessible only to you. We never share your
            personal reflections with third parties. You can export or delete
            your data at any time.
          </p>
        </CardContent>
      </Card>
    </section>

    <Separator className="my-12" />

    <section class="text-center">
      <p class="text-sm text-muted-foreground max-w-2xl mx-auto">
        Serene is not a substitute for professional mental health care. If you
        are in crisis, please contact the 988 Suicide and Crisis Lifeline
        (call or text 988) or the Crisis Text Line (text HOME to 741741).
      </p>
    </section>
  </div>
</BaseLayout>
```

**Dependencies**: `apps/web/layouts/BaseLayout.astro`
**Provides**: Serene-branded web about page

---

### apps/web/pages/features.astro [edit]

**Purpose**: Web marketing features page. Currently lists generic React Starter Kit features.
**TOTAL CHANGES**: 1 (full content rewrite)

**Changes**:

1. Replace all file content with Serene wellness journal features.

**Reference Implementation**:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';

const title = "Features — Serene";
const description = "Explore Serene's features: mood tracking, AI companion, private journaling, weekly insights, and crisis support.";

const features = [
  {
    title: "Mood Tracking",
    description: "Six intuitive mood options",
    content: "Choose from Happy, Calm, Anxious, Sad, Overwhelmed, or Angry. Tag your entries with context like Work, Sleep, Relationships, or Fitness."
  },
  {
    title: "AI Companion",
    description: "Personalized encouragement after each entry",
    content: "Powered by advanced AI, Serene responds with warm, contextual support that references your specific mood and reflections."
  },
  {
    title: "Private Journaling",
    description: "Your thoughts, your space",
    content: "Write reflections in a distraction-free editor. Your entries are private and secure — only you can access them."
  },
  {
    title: "Weekly Insights",
    description: "Discover emotional patterns",
    content: "Visual mood trend charts and tag correlations help you understand what affects your well-being over time."
  },
  {
    title: "Journaling Streaks",
    description: "Build a mindful habit",
    content: "Track your journaling consistency with streaks. The entire process takes under 60 seconds."
  },
  {
    title: "Crisis Support",
    description: "Safety resources when needed",
    content: "If Serene detects signs of distress, it surfaces crisis helpline information alongside its compassionate response."
  }
];
---

<BaseLayout title={title} description={description}>
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h1 class="text-4xl font-bold tracking-tight mb-4">Features</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need for a meaningful wellness journaling practice
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">{feature.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>

  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
    <div class="container mx-auto text-center">
      <h2 class="text-3xl font-bold tracking-tight mb-4">
        Ready to start your wellness journey?
      </h2>
      <p class="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
        Join Serene today and begin building a mindful journaling habit.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <a href="http://localhost:5173/signup">
            Start Journaling Free
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/about">
            Learn More
          </a>
        </Button>
      </div>
    </div>
  </section>
</BaseLayout>
```

**Dependencies**: `apps/web/layouts/BaseLayout.astro`
**Provides**: Serene-branded features page

---

### apps/web/pages/pricing.astro [edit]

**Purpose**: Web marketing pricing page. Currently references React Starter Kit.
**TOTAL CHANGES**: 1 (full content rewrite)

**Changes**:

1. Replace all file content with Serene pricing page (free tier focus for MVP).

**Reference Implementation**:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';

const title = "Pricing — Serene";
const description = "Serene is free to use. Start your wellness journaling journey today.";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started",
    features: [
      "Unlimited journal entries",
      "Mood tracking with 6 mood options",
      "AI companion responses",
      "Weekly mood insights",
      "Tag-based entry organization",
      "Data export (GDPR compliant)",
    ],
    cta: "Start Journaling",
    href: "http://localhost:5173/signup",
    primary: true,
  },
];
---

<BaseLayout title={title} description={description}>
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h1 class="text-4xl font-bold tracking-tight mb-4">Pricing</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Serene is free to use. Your emotional well-being shouldn't have a
          price tag.
        </p>
      </div>

      <div class="max-w-md mx-auto">
        {plans.map((plan) => (
          <Card>
            <CardHeader class="text-center">
              <CardTitle class="text-2xl">{plan.name}</CardTitle>
              <div class="mt-4">
                <span class="text-4xl font-bold">{plan.price}</span>
                <span class="text-muted-foreground ml-1">/{plan.period}</span>
              </div>
              <CardDescription class="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul class="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li class="flex items-center gap-2 text-sm">
                    <svg class="h-4 w-4 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button class="w-full" size="lg" asChild>
                <a href={plan.href}>{plan.cta}</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>

  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
    <div class="container mx-auto text-center">
      <h2 class="text-3xl font-bold tracking-tight mb-4">
        Questions?
      </h2>
      <p class="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
        Serene is in early access. We'd love to hear from you.
      </p>
    </div>
  </section>
</BaseLayout>
```

**Dependencies**: `apps/web/layouts/BaseLayout.astro`
**Provides**: Serene-branded pricing page

---

### ai_review/user_stories/branding.yaml [create]

**Purpose**: Bowser QA user stories for automated visual verification of branding.
**TOTAL CHANGES**: N/A (new file)

**Implementation Details**:

- Two stories as specified in the deliverable scope.
- Story 1: Verify login page shows Serene branding, no Acme/Console references.
- Story 2: Verify authenticated app shows Serene sidebar navigation.

**Reference Implementation**:

```yaml
stories:
  - name: "App shows Serene branding"
    url: "http://localhost:5173/login"
    workflow: |
      Navigate to http://localhost:5173/login
      Verify the page title or heading contains "Serene"
      Verify there is no reference to "Acme" or "Console" visible on the page

  - name: "Sidebar shows Serene navigation after login"
    url: "http://localhost:5173/"
    workflow: |
      Navigate to http://localhost:5173/
      Verify the sidebar or navigation area contains "Serene" branding
      Verify navigation items include "Dashboard" or "Insights"
      Verify there are no references to "Reports" or "Users" from the old template
```

**Dependencies**: None
**Provides**: Bowser QA test specifications for branding verification

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                       | Action | Depends On                                                              |
| ----- | ------------------------------------------ | ------ | ----------------------------------------------------------------------- |
| 1     | `.env`                                     | edit   | --                                                                      |
| 1     | `apps/app/public/site.manifest`            | edit   | --                                                                      |
| 1     | `apps/app/styles/globals.css`              | edit   | --                                                                      |
| 1     | `apps/app/components/layout/sidebar.tsx`   | edit   | --                                                                      |
| 1     | `apps/app/components/layout/constants.ts`  | edit   | --                                                                      |
| 1     | `apps/app/components/layout/header.tsx`    | edit   | --                                                                      |
| 1     | `apps/api/lib/env.ts`                      | edit   | --                                                                      |
| 1     | `apps/api/lib/stripe.ts`                   | edit   | --                                                                      |
| 1     | `apps/email/components/BaseTemplate.tsx`   | edit   | --                                                                      |
| 1     | `apps/email/emails/email-verification.tsx` | edit   | --                                                                      |
| 1     | `apps/email/emails/otp-password-reset.tsx` | edit   | --                                                                      |
| 1     | `apps/email/emails/otp-sign-in.tsx`        | edit   | --                                                                      |
| 1     | `apps/email/emails/otp-verification.tsx`   | edit   | --                                                                      |
| 1     | `apps/email/emails/password-reset.tsx`     | edit   | --                                                                      |
| 1     | `apps/api/dev.ts`                          | edit   | --                                                                      |
| 1     | `db/scripts/generate-auth-schema.ts`       | edit   | --                                                                      |
| 1     | `apps/web/styles/globals.css`              | edit   | --                                                                      |
| 1     | `apps/app/routes/(app)/about.tsx`          | edit   | --                                                                      |
| 1     | `apps/app/routes/(app)/index.tsx`          | edit   | --                                                                      |
| 1     | `ai_review/user_stories/branding.yaml`     | create | --                                                                      |
| 2     | `apps/app/index.html`                      | edit   | `.env`                                                                  |
| 2     | `apps/app/components/auth/auth-form.tsx`   | edit   | `.env`                                                                  |
| 2     | `apps/web/layouts/BaseLayout.astro`        | edit   | --                                                                      |
| 3     | `apps/app/routes/(auth)/login.tsx`         | edit   | `apps/app/components/auth/auth-form.tsx`, `apps/app/styles/globals.css` |
| 3     | `apps/app/routes/(auth)/signup.tsx`        | edit   | `apps/app/components/auth/auth-form.tsx`, `apps/app/styles/globals.css` |
| 3     | `apps/web/pages/index.astro`               | edit   | `apps/web/layouts/BaseLayout.astro`                                     |
| 3     | `apps/web/pages/about.astro`               | edit   | `apps/web/layouts/BaseLayout.astro`                                     |
| 3     | `apps/web/pages/features.astro`            | edit   | `apps/web/layouts/BaseLayout.astro`                                     |
| 3     | `apps/web/pages/pricing.astro`             | edit   | `apps/web/layouts/BaseLayout.astro`                                     |

---

## Exit Criteria

### Test Commands

```bash
bun test --run             # Vitest (all workspaces)
bun lint                   # ESLint with cache
bun typecheck              # tsc --build
bun prettier --check .     # Prettier format check
```

### Success Conditions

- [ ] All tests pass (`bun test --run` exit code 0)
- [ ] No linting errors (`bun lint` exit code 0)
- [ ] No type errors (`bun typecheck` exit code 0)
- [ ] Prettier check passes (`bun prettier --check .` exit code 0)
- [ ] "Serene" appears in page title, sidebar, header, and auth forms
- [ ] No visible references to "Acme", "Console", "React Starter Kit", "Kriasoft", or "Application"
- [ ] Login page displays calm aesthetic with sage green primary color
- [ ] USP messaging ("AI-Powered Wellness Journal") visible on auth pages
- [ ] Sidebar navigation shows: Dashboard, Insights, Settings (no Users, Reports)
- [ ] Dashboard shows journal-appropriate content (no SaaS metrics)
- [ ] Bowser QA YAML exists at `ai_review/user_stories/branding.yaml`
- [ ] `/ui-review branding` -- ALL stories PASS
- [ ] Web manifest shows "Serene" name
- [ ] Email template default appName is "Serene"
- [ ] Web marketing pages show Serene content

### Verification Script

```bash
bun test --run && bun lint && bun typecheck && bun prettier --check .
```

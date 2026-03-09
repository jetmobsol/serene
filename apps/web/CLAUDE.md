# Web (Edge Router)

Astro + Hono edge worker that routes traffic between the app SPA and the API service.

## Quick Navigation

- [Root Project](../../CLAUDE.md)
- [API Service](../api/CLAUDE.md)
- [App (SPA)](../app/CLAUDE.md)
- [Email Templates](../email/CLAUDE.md)

> **Conventions**: Shared monorepo rules live in the root `CLAUDE.md` and `AGENTS.md`. This file covers web-specific context only.

@AGENTS.md

## Overview

The web worker is the public-facing edge router:

- Routes `/api/*` requests to the API worker via service binding
- Routes app routes to the App worker via service binding
- Serves static marketing/landing pages via Astro
- Handles CORS, caching headers, and request routing
- Does NOT have `nodejs_compat` — keep dependencies lightweight

**Port (dev):** 4321 (Astro default)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro |
| Server | Hono (middleware) |
| Deployment | Cloudflare Workers |
| Assets | Cloudflare Assets (static) |

## Project Structure

```
apps/web/
├── worker.ts              # Hono edge router (main entry point)
├── astro.config.mjs       # Astro configuration
├── wrangler.jsonc          # CF Worker config (service bindings to app + api)
├── layouts/
│   └── BaseLayout.astro   # Master layout (header, nav, footer)
├── pages/                 # Astro pages (marketing/landing)
│   ├── index.astro        # Home page
│   ├── about.astro
│   ├── features.astro
│   └── pricing.astro
├── styles/
│   └── globals.css        # Global styles + CSS variables (oklch)
├── public/                # Static assets (favicon, OG image)
├── _headers               # Cloudflare HTTP headers config
└── package.json
```

## Key Patterns

### Routing

The web worker coordinates all three workers:
```
Client Request
  ├── /api/*                      → API worker (service binding)
  ├── /_app/*, /login*, /signup*,
  │   /settings*, /analytics*,
  │   /reports*                   → App worker (service binding)
  ├── / (with auth cookie)        → App worker (authenticated user)
  ├── / (no auth cookie)          → Static assets (marketing)
  └── /*                          → Static assets (Astro pages)
```

Home page (`/`) uses **auth-hint cookie** to decide between marketing site and app dashboard. See `docs/adr/001-auth-hint-cookie.md`.

Cache control on `/`: `Cache-Control: private, no-store` + `Vary: Cookie`.

`run_worker_first: ["/"]` in `wrangler.jsonc` forces worker execution for `/`.

### Service Bindings

Configured in `wrangler.jsonc`:
- `APP_SERVICE` — binds to the app worker
- `API_SERVICE` — binds to the api worker
- No public cross-worker URLs — all internal via service bindings
- Environment-specific names (e.g., `-staging`, `-preview` suffixes)

### Constraints

- **No `nodejs_compat`** — cannot use Node.js built-ins
- Keep this worker minimal — it's primarily a router
- Heavy logic belongs in the API worker, not here
- Astro `output: "static"` — all marketing pages pre-rendered to `dist/`

## Development Commands

```bash
bun web:dev                # Start Astro dev server
bun web:build              # Production build
bun web:deploy             # Deploy to Cloudflare
```

## When Working Here

1. **Adding marketing pages**: Create `.astro` files in `pages/`
2. **Changing routing**: Edit the Hono middleware in `worker.ts`
3. **Adding service bindings**: Update `wrangler.jsonc` and `infra/` Terraform
4. **Keep it light**: No heavy dependencies — this worker must be fast at the edge
5. **CORS/headers**: Configure in the Hono middleware stack

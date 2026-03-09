## Routing

- Web worker is the public entry point (deployed to Cloudflare edge).
- Routes `/api/*` → **API worker** (service binding)
- Routes app routes → **App worker** (service binding)
- Serves static assets and Astro pages locally.
- **No `nodejs_compat`** — keep dependencies lightweight.

## Service Bindings

Configured in `wrangler.jsonc`:

- `APP` — binds to the app worker
- `API` — binds to the api worker

## Middleware Stack

- Custom Hono middleware in `src/worker.ts`
- Handles request routing, CORS, caching headers
- No heavy logic — just traffic coordination

## Astro Pages

- Marketing and public landing pages in `src/pages/`
- Built as static assets
- **Never require database or server-side logic**

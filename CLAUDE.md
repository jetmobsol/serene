@AGENTS.md

## Service Guidelines (Progressive Disclosure)

- **[API Service](apps/api/CLAUDE.md)** — Hono + tRPC + Better Auth backend (Cloudflare Worker)
- **[App (SPA)](apps/app/CLAUDE.md)** — React 19 + TanStack Router frontend
- **[Web (Edge Router)](apps/web/CLAUDE.md)** — Astro + Hono traffic router
- **[Email Templates](apps/email/CLAUDE.md)** — React Email templates (`@repo/email`)

Read the service-specific CLAUDE.md before making changes in that app.

## Setup

```bash
bun install                    # Install all workspace dependencies
cp .env .env.local             # Create local env overrides (git-ignored)
# Edit .env.local with real credentials (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
bun db:push                    # Push schema to local database
bun db:seed                    # Seed development data
bun dev                        # Start all workers (web + api + app)
```

### Quick Start (Recommended)

```bash
just start                     # DB in Docker + native dev servers (runs bun install --force)
just stop                      # Stop everything
just docker-start              # Full Docker stack (all services containerized)
```

### Local Ports

| Port | Service                     | URL                   |
| ---- | --------------------------- | --------------------- |
| 5173 | App (SPA) — Vite dev server | http://localhost:5173 |
| 8787 | API — Hono server           | http://localhost:8787 |
| 4321 | Web — Astro edge router     | http://localhost:4321 |
| 5434 | PostgreSQL (Docker)         | —                     |

### Dev Auth (Auto-Login)

In development mode, email OTP login is fully automatic — no manual code entry needed:

- The API returns the OTP in the response body (`devOtp` field) and logs it to the server console.
- The frontend auto-fills and auto-submits the OTP code.
- **For browser automation (Playwright, Chrome MCP, bowser QA):** after clicking "Continue with email" and submitting an email address, wait a few seconds for the auto-login to complete. The OTP screen will appear briefly then auto-submit and redirect to the dashboard. Do not try to manually enter an OTP code — it happens automatically.
- Any email address works (e.g., `test@test.com`) — the email OTP flow auto-creates accounts for unknown addresses.
- Email delivery is not required (Resend errors are swallowed in dev).

### Gotchas

- If dev fails with missing native binaries (rollup, workerd): run `bun install --force`.
- Local PostgreSQL runs on port **5434** (not 5432) to avoid conflicts with other projects.

## Git Workflow

- Pre-commit hook runs `lint-staged` (ESLint + Prettier) via Husky.
- Upstream template is the `seed` remote (`kriasoft/react-starter-kit`). Pull updates with `git fetch seed && git merge seed/main`.
- `origin` is the project's private repo.

## Code Style

- Prettier: double quotes, semicolons, trailing commas, 80 char width.
- ESLint: flat config (`eslint.config.ts`), TypeScript + React rules, Prettier last.
- Imports: use workspace aliases (`@repo/ui`, `@repo/core`, `@repo/email`). Path aliases within apps (e.g., `~/lib/...` in app).
- File naming: kebab-case for files, PascalCase for React components, camelCase for utilities.
- Database columns: camelCase in TypeScript, auto-mapped to snake_case via Drizzle `casing`.

## Environment Variables

- `.env` — shared defaults, committed (no real secrets).
- `.env.local` — real credentials, git-ignored, overrides `.env`.
- `.env.{environment}.local` — environment-specific overrides (highest priority).
- Frontend vars must be prefixed with `VITE_` to be exposed to the client.

## Claude-Specific Guidance

- Use `/plan` for multi-file or architectural changes.
- Prefer slash commands from `.claude/commands/` when available: `review-better-auth`, `review-terraform`, `validate-auth-schema`, `migrate-to-d1`.
- ADRs live in `docs/adr/` — check existing decisions before proposing architectural changes.
- Auto-generated files (never edit manually): `apps/app/lib/routeTree.gen.ts`.

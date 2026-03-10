# API Service

Hono + tRPC + Better Auth API server running as a Cloudflare Worker.

## Quick Navigation

- [Root Project](../../CLAUDE.md)
- [App (SPA)](../app/CLAUDE.md)
- [Web (Edge Router)](../web/CLAUDE.md)
- [Email Templates](../email/CLAUDE.md)
- [Database Schema](../../db/AGENTS.md)

> **Conventions**: Shared monorepo rules live in the root `CLAUDE.md` and `AGENTS.md`. This file covers api-specific context only.

@AGENTS.md

## Overview

The API service is the backend for the entire application:

- Handles authentication (Better Auth: email OTP, Google OAuth)
- Exposes tRPC routes consumed by the app SPA
- Manages database access via Drizzle ORM + Cloudflare Hyperdrive
- Sends transactional email via Resend
- Runs as a Cloudflare Worker with `nodejs_compat`

**Port (dev):** 8787 (Wrangler default)

## Tech Stack

| Layer     | Technology                                          |
| --------- | --------------------------------------------------- |
| Framework | Hono                                                |
| RPC       | tRPC 11                                             |
| Auth      | Better Auth (email OTP, Google OAuth)               |
| Database  | Drizzle ORM, Neon PostgreSQL, Cloudflare Hyperdrive |
| Email     | React Email + Resend                                |
| AI        | Anthropic (via `@anthropic-ai/sdk`)                 |
| Runtime   | Cloudflare Workers (`nodejs_compat`)                |

## Project Structure

```
apps/api/
├── worker.ts              # CF Worker entrypoint (Hono middleware stack)
├── wrangler.jsonc          # Wrangler config (bindings, Hyperdrive, service bindings)
├── index.ts               # Public API exports (Hono app, tRPC router, utilities)
├── dev.ts                 # Development server (Bun)
├── lib/
│   ├── app.ts             # Hono routes + tRPC wiring (slim orchestrator)
│   ├── auth.ts            # Better Auth server config (plugins: email-otp)
│   ├── trpc.ts            # tRPC init (publicProcedure, protectedProcedure, error formatting)
│   ├── context.ts         # TRPCContext & AppContext types
│   ├── env.ts             # Zod env validation
│   ├── loaders.ts         # DataLoader pattern (request-scoped cache)
│   ├── db.ts              # Drizzle client setup (db + dbDirect)
│   ├── middleware.ts      # Error handler, 404 handler, request ID generator
│   ├── email.ts           # Email service (Resend wrapper)
│   └── ai/                # AI vibe check module
│       ├── service.ts     # Shared pipeline (generateVibeCheck, preCheck, finalize)
│       ├── stream-handler.ts # SSE streaming endpoint
│       ├── anthropic.ts   # Anthropic client, constants, persistAiResponse
│       ├── prompts.ts     # Prompt builder
│       ├── safety.ts      # Crisis detection, gibberish check
│       └── rate-limit.ts  # Per-user rate limiting via KV
├── routers/               # tRPC routers (ai, analytics, journal, user)
├── Dockerfile             # Container build (Bun runtime)
└── package.json
```

## Middleware Stack (worker.ts)

`secureHeaders` → `requestId` (CF-Ray or UUID) → `logger` → context init (Drizzle + auth instances).

## API Routes

- `/` → redirect to `/api`
- `/api` → API info endpoint
- `/health` → health check
- `/api/auth/*` → Better Auth handler
- `/api/trpc/*` → tRPC endpoint (batching enabled)

## Development Commands

```bash
bun api:dev                # Start dev server (Wrangler)
bun api:build              # Build for production
bun api:deploy             # Deploy to Cloudflare
bun api:test               # Run tests
```

## Environment

- Zod schema validates env vars in `lib/env.ts`
- Bun reads `Bun.env`; Workers get bindings via Hono context
- `nodejs_compat` flag required — web and app workers do NOT have it

## Service Bindings

Configured in `wrangler.jsonc`:

- Receives requests from **web** worker via service binding
- Connects to Neon PostgreSQL via **Hyperdrive**

## When Working Here

1. **Adding a new route**: Create router in `routers/`, add to `lib/app.ts`
2. **Adding auth**: Use `protectedProcedure`, access `ctx.user` and `ctx.session`
3. **Database changes**: Edit schema in `db/`, run `bun db:push` or `bun db:generate`
4. **Sending email**: Use `@repo/email` templates, render to HTML+text, send via Resend
5. **Never edit**: Auto-generated types from tRPC are consumed by `apps/app`

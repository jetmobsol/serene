# Serene PRD — Index (Progressive Disclosure)

**Product:** Serene — AI-Powered Mental Wellness Journal
**Version:** 1.0 | **Date:** 2026-03-09 | **Status:** Draft

> **How to use:** Read this index first. Open subfiles only when working on the relevant domain. Each file is self-contained with all context needed for implementation.

## Quick Reference

| File                                                       | Domain                                                            | When to Read                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| [`01-overview.md`](./01-overview.md)                       | Vision, USP, personas, success metrics                            | Starting the project, onboarding, stakeholder reviews   |
| [`02-user-stories.md`](./02-user-stories.md)               | 24 user stories with acceptance criteria                          | Writing tests (TDD), validating features, QA            |
| [`03-feature-specs.md`](./03-feature-specs.md)             | Detailed feature specs (landing, journal, AI, analytics)          | Implementing features, design decisions                 |
| [`04-architecture.md`](./04-architecture.md)               | Monorepo modules, file trees, dependencies                        | Creating new files, understanding code organization     |
| [`05-database.md`](./05-database.md)                       | Schema (journal_entry, ai_response), relations, migrations        | Database work, Drizzle schema changes                   |
| [`06-api-design.md`](./06-api-design.md)                   | tRPC routers (journal, ai, analytics), SSE endpoint               | Backend implementation, API contracts                   |
| [`07-ai-integration.md`](./07-ai-integration.md)           | Anthropic client, system prompt, streaming, safety, cost          | AI vibe check feature, `/claude-api` skill usage        |
| [`08-frontend-components.md`](./08-frontend-components.md) | Route structure, component specs, props, shadcn/ui                | Frontend implementation, `/frontend-design` skill usage |
| [`09-testing.md`](./09-testing.md)                         | TDD methodology, test categories, fixtures, coverage targets      | Writing tests, CI setup                                 |
| [`10-tooling.md`](./10-tooling.md)                         | Context7 MCP tools, `/claude-api`, `/frontend-design`, browser QA | Before any implementation (tool lookup reference)       |
| [`11-devops.md`](./11-devops.md)                           | Docker, `.env.example`, seed data, health checks                  | DevOps setup, Docker changes                            |
| [`12-nonfunctional.md`](./12-nonfunctional.md)             | Performance, security, accessibility, privacy                     | Quality gates, audits, compliance                       |
| [`13-phases.md`](./13-phases.md)                           | 7 implementation phases, Definition of Done                       | Sprint planning, progress tracking                      |
| [`14-readme.md`](./14-readme.md)                           | README.md rewrite requirements                                    | Documentation phase (Phase 6)                           |
| [`15-deployment.md`](./15-deployment.md)                   | Cloudflare infrastructure, Terraform, Wrangler, deployment docs   | Deployment phase (Phase 6), infra setup                 |
| [`16-appendices.md`](./16-appendices.md)                   | Mood constants, crisis keywords, env vars reference               | Copy-paste reference during implementation              |

## Architecture at a Glance

```
Browser → Web Worker (Astro) → App Worker (React SPA)
                              → API Worker (Hono + tRPC)
                                    ├→ PostgreSQL (Neon/Docker)
                                    └→ Anthropic Claude API
```

## Key Decisions

- **AI Provider:** Anthropic Claude — replaces existing OpenAI integration (`apps/api/lib/ai.ts` to be removed in Phase 1) — see `07-ai-integration.md`
- **Streaming:** SSE via Hono route (not tRPC) — tRPC lacks native SSE mutation support
- **Deletion:** Hard delete for privacy — see `06-api-design.md`
- **Testing:** TDD mandatory — tests before code — see `09-testing.md`
- **Tooling:** Context7 MCP mandatory for all library lookups — see `10-tooling.md`

## New Database Tables

- `journal_entry` (prefix: `jrn`) — mood, tags, note, userId
- `ai_response` (prefix: `air`) — response text, entryId, crisisFlag

## New tRPC Routers

- `journal` — CRUD for entries (5 procedures)
- `ai` — vibe check generation (1 mutation + 1 SSE endpoint)
- `analytics` — mood distribution, trends, tag correlation (3 queries)

## Implementation Order

1. Foundation (DB schema + shared types)
2. Journal CRUD API
3. AI Vibe Check API
4. Journal Frontend
5. Analytics Frontend
6. Landing Page + Documentation + Deployment
7. Integration Testing + QA

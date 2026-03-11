# Serene -- AI-Powered Mental Wellness Journal

A private, AI-powered wellness journal that helps you track your mood, reflect on your day, and receive gentle encouragement -- all in under 60 seconds.

## Features

- **Mood journaling** -- Log how you feel with six intuitive mood options and contextual tags
- **AI Vibe Check** -- Receive warm, empathetic responses powered by Claude after each entry
- **Weekly analytics** -- Visual mood trends, distributions, and tag correlation insights
- **Privacy-first** -- Your journal entries are yours; no data shared with third parties
- **Calm aesthetic** -- Sage green and warm ivory palette designed for daily wellbeing
- **Crisis support** -- Automatic detection surfaces helpline resources when needed

## Tech Stack

| Layer        | Technologies                                                   |
| ------------ | -------------------------------------------------------------- |
| **Runtime**  | Bun, Cloudflare Workers, TypeScript 5.9                        |
| **Frontend** | React 19, TanStack Router, Tailwind CSS v4, shadcn/ui, Jotai   |
| **Backend**  | Hono, tRPC, Better Auth (email/password, Google OAuth)         |
| **Database** | Drizzle ORM, Neon PostgreSQL, Cloudflare Hyperdrive            |
| **AI**       | Anthropic Claude (via AI SDK) for empathetic journal responses |
| **Email**    | React Email, Resend                                            |
| **Deploy**   | Cloudflare Workers, Terraform                                  |

## Architecture

```
                        Internet
                           |
                    +------+------+
                    | serene-web  |  Astro edge router
                    | (Cloudflare)|  Routes traffic via
                    +--+-------+--+  service bindings
                       |       |
              +--------+       +--------+
              v                         v
      +-------+------+         +-------+------+
      |  serene-app  |         |  serene-api  |
      | React 19 SPA |         | Hono + tRPC  |
      | (static)     |         | Better Auth  |
      +--------------+         +------+-------+
                                     |
                              +------+------+
                              |  Hyperdrive |
                              | (conn pool) |
                              +------+------+
                                     |
                              +------+------+
                              |    Neon     |
                              | PostgreSQL  |
                              +-------------+
```

Three Cloudflare Workers connected via service bindings. The web worker is the public-facing edge router that directs `/api/*` requests to the API worker and app routes to the App worker. No cross-worker public URLs are needed.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.3+
- [Docker](https://www.docker.com/) (for local PostgreSQL)
- [Anthropic API key](https://console.anthropic.com/) (for AI vibe check responses)

### Local Development

```bash
# Clone and install
git clone <your-repo-url>
cd serene
bun install

# Configure environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and any other credentials

# Start everything (Docker DB + dev servers)
just start

# Or start manually:
bun db:push     # Push schema to database
bun db:seed     # Seed development data
bun dev         # Start all dev servers
```

### Docker (Full Stack)

```bash
docker-compose up
```

### Local Ports

| Port | Service                  | URL                   |
| ---- | ------------------------ | --------------------- |
| 5173 | App (SPA) -- Vite dev    | http://localhost:5173 |
| 8787 | API -- Hono server       | http://localhost:8787 |
| 4321 | Web -- Astro edge router | http://localhost:4321 |
| 5434 | PostgreSQL (Docker)      | --                    |

### Dev Auth (Auto-Login)

In development mode, email OTP login is fully automatic — no manual code entry needed:

- The API returns the OTP in the response body (`devOtp` field) and logs it to the server console.
- The frontend auto-fills and auto-submits the OTP code.
- **For browser automation (Playwright, Chrome MCP, bowser QA):** after clicking "Continue with email" and submitting an email address, wait a few seconds for the auto-login to complete. The OTP screen will appear briefly then auto-submit and redirect to the dashboard. Do not try to manually enter an OTP code — it happens automatically.
- Any email address works (e.g., `test@test.com`) — the email OTP flow auto-creates accounts for unknown addresses.
- Email delivery is not required (Resend errors are swallowed in dev).

**Note:** Auto-login is a dev-only convenience feature. Production deployments require users to manually enter OTP codes.

## Environment Variables

| Variable               | Required | Description                                                                      |
| ---------------------- | -------- | -------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`    | Yes      | Anthropic API key for AI vibe check responses                                    |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                                                     |
| `BETTER_AUTH_SECRET`   | Yes      | Secret for session signing (generate with `bunx @better-auth/cli@latest secret`) |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth client ID                                                           |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth client secret                                                       |
| `RESEND_API_KEY`       | No       | Resend API key for transactional emails                                          |

Copy `.env.example` to `.env` and fill in real credentials.

## Development

```bash
bun dev                # Start all dev servers concurrently
bun test               # Run tests (watch mode)
bun test --run         # Run tests once
bun lint               # ESLint with cache
bun typecheck          # TypeScript type checking
bun db:push            # Push schema to database
bun db:seed            # Seed development data
bun db:studio          # Open Drizzle Studio (database GUI)
bun ui:add <component> # Add shadcn/ui component
```

## Deployment

Serene deploys as three Cloudflare Workers backed by Neon PostgreSQL. See the [deployment guide](docs/deployment/serene-deployment-guide.md) for step-by-step instructions and the [infrastructure reference](docs/deployment/serene-infrastructure-reference.md) for Terraform and Cloudflare configuration details.

## Project Structure

```
serene/
+-- apps/
|   +-- web/           Astro edge router (public entry point, service bindings)
|   +-- app/           React 19 SPA (TanStack Router, Tailwind, shadcn/ui)
|   +-- api/           Hono + tRPC API (Better Auth, Drizzle, AI vibe check)
|   +-- email/         React Email templates
+-- packages/
|   +-- ui/            shadcn/ui components (new-york style)
|   +-- core/          Shared types and utilities
+-- db/                Drizzle ORM schemas, migrations, seed data
+-- infra/             Terraform (Cloudflare Workers, Hyperdrive, DNS)
+-- docs/              Documentation and architecture decision records
+-- ai_review/         Bowser QA test definitions
```

## License

This source code is licensed under the MIT license found in the [LICENSE](LICENSE) file.

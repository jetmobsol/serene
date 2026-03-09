# 16. README.md Rewrite Requirements

> **Context:** The current README is the unmodified React Starter Kit template. It must be completely replaced. Reference during Phase 6.

---

## 16.1 Mandate

The current `README.md` is the unmodified React Starter Kit template README. It references `kriasoft/react-starter-kit`, sponsor badges, ChatGPT/Gemini assistant links, and other template-specific content. **This MUST be completely rewritten** to represent the Serene product.

## 16.2 Current State (to be replaced entirely)

The existing README contains:
- React Starter Kit branding, badges, and sponsor images
- Generic template "Highlights" section
- Links to `reactstarter.com` documentation
- Sponsor/backer/contributor image grids
- ChatGPT and Gemini assistant links
- Template contributing guide reference

**None of the above should remain in the final README.**

## 16.3 Required README Structure

```markdown
# Serene — AI-Powered Mental Wellness Journal

[Badges: Build Status, License, Live Demo link]

Brief 2-3 sentence description of Serene and its core value proposition.

## Features
- Mood journaling with visual mood selector and contextual tags
- AI-powered "Vibe Check" — empathetic responses via Claude API
- Weekly mood analytics and trend visualization
- Privacy-first: your data stays yours
- Calm, accessible UI designed for daily wellbeing

## Tech Stack
[Table: Runtime, Frontend, Backend, Database, AI, Deployment layers]

## Architecture
[ASCII diagram of the 3-worker model: web → app/api, service bindings]
Brief explanation of monorepo structure.

## Quick Start

### Prerequisites
- Bun v1.3+
- Docker & Docker Compose (for local DB)
- Anthropic API key (https://console.anthropic.com/)

### Local Development
  cp .env .env.local
  # Edit .env.local with real credentials
  just start           # DB + dev servers
  # or: bun install && bun dev

### Docker (Full Stack)
  docker-compose up    # Everything including DB

### Environment Variables
Table of required variables with descriptions.
Reference to .env.example for full list.

## Development
- bun dev / bun test / bun lint / bun typecheck
- bun db:push / bun db:seed / bun db:studio

## Deployment
Brief overview pointing to docs/deployment/ for detailed guides.
- Cloudflare Workers (edge deployment)
- Terraform for infrastructure provisioning
- Neon PostgreSQL with Hyperdrive connection pooling

## Project Structure
Annotated tree of apps/, packages/, db/, infra/, docs/

## License
[Project license]
```

## 16.4 Acceptance Criteria

- [ ] AC-1: No references to "React Starter Kit", "kriasoft", sponsor badges, or template-specific content remain.
- [ ] AC-2: Product name "Serene" and its value proposition are prominently displayed.
- [ ] AC-3: Quick Start section enables a new developer to run the project within 5 minutes.
- [ ] AC-4: Both local development and Docker setup paths are documented.
- [ ] AC-5: All required environment variables are listed with descriptions.
- [ ] AC-6: `ANTHROPIC_API_KEY` is documented as required with a link to the Anthropic console.
- [ ] AC-7: Architecture section includes the 3-worker model explanation.
- [ ] AC-8: Deployment section references `docs/deployment/cloudflare.md` for detailed instructions.
- [ ] AC-9: Project structure tree matches actual directory layout.
- [ ] AC-10: README renders correctly on GitHub (no broken links, proper markdown formatting).

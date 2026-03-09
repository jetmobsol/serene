# 17. Cloudflare Infrastructure Deployment Guide

> **Context:** Leverages existing Terraform + Wrangler infrastructure. New Serene-specific deployment docs to be created in `docs/deployment/`. Reference during Phase 6.

---

## 17.1 Mandate

The project template includes a complete Cloudflare deployment pipeline (Terraform modules, Wrangler configs, multi-environment support). The existing `docs/deployment/cloudflare.md` documents the generic template setup. **New Serene-specific deployment documentation MUST be created** to guide deployment of the complete Serene application including the AI features.

## 17.2 Existing Infrastructure Assets

The following are already in place and must be leveraged (not rebuilt):

| Asset                        | Location                                      | Purpose                                                         |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| **Terraform edge stack**     | `infra/stacks/edge/main.tf`                   | Provisions 3 Workers (web, app, api) + Hyperdrive + DNS         |
| **Terraform modules**        | `infra/modules/cloudflare/`                   | Atomic resources: `worker`, `hyperdrive`, `dns`, `r2-bucket`    |
| **Environment configs**      | `infra/envs/{dev,preview,staging,prod}/edge/` | Per-environment Terraform roots with `terraform.tfvars.example` |
| **Wrangler configs**         | `apps/{web,app,api}/wrangler.jsonc`           | Per-worker deployment config with service bindings              |
| **Existing deployment docs** | `docs/deployment/cloudflare.md`               | Template-level Cloudflare deployment guide                      |
| **Production database docs** | `docs/deployment/production-database.md`      | Neon + Hyperdrive setup guide                                   |
| **CI/CD docs**               | `docs/deployment/ci-cd.md`                    | CI/CD pipeline documentation                                    |

## 17.3 New Documentation Requirements

### Document 1: `docs/deployment/serene-deployment-guide.md`

**Purpose:** End-to-end guide for deploying Serene to Cloudflare Workers with all Serene-specific configuration.

**Required Sections:**

1. **Prerequisites**
   - Cloudflare account (free tier sufficient for MVP)
   - Neon PostgreSQL account and database
   - Anthropic API key
   - Bun v1.3+ installed locally
   - Terraform >= 1.12 installed
   - Domain name (optional but recommended)

2. **Infrastructure Provisioning (Terraform)**

   ```bash
   # Step 1: Configure environment variables
   cp infra/envs/prod/edge/terraform.tfvars.example infra/envs/prod/edge/terraform.tfvars
   # Edit with: cloudflare_api_token, cloudflare_account_id, project_slug="serene",
   #            environment="prod", neon_database_url, cloudflare_zone_id, hostname

   # Step 2: Initialize and apply
   terraform -chdir=infra/envs/prod/edge init
   terraform -chdir=infra/envs/prod/edge plan    # Review changes
   terraform -chdir=infra/envs/prod/edge apply

   # Step 3: Retrieve Hyperdrive IDs
   terraform -chdir=infra/envs/prod/edge output hyperdrive_id
   # Copy the ID into apps/api/wrangler.jsonc for the prod environment
   ```

3. **Worker Secrets Configuration**

   ```bash
   # Required secrets for the API worker
   cd apps/api

   # Auth
   openssl rand -hex 32 | wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET

   # AI (Serene-specific)
   wrangler secret put ANTHROPIC_API_KEY

   # Email
   wrangler secret put RESEND_API_KEY

   # Stripe (optional — only if billing is enabled)
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   wrangler secret put STRIPE_STARTER_PRICE_ID
   wrangler secret put STRIPE_PRO_PRICE_ID
   ```

4. **Wrangler Configuration Updates for Serene**
   - Update `apps/web/wrangler.jsonc`: set `name` to `serene-web`, route patterns to custom domain
   - Update `apps/api/wrangler.jsonc`: set `name` to `serene-api`, add Hyperdrive IDs from Terraform output, add `ANTHROPIC_API_KEY` to secret bindings
   - Update `apps/app/wrangler.jsonc`: set `name` to `serene-app`
   - Update service binding names in web worker to match renamed workers
   - Update `APP_NAME` to "Serene", `APP_ORIGIN` to production URL
   - Update `ALLOWED_ORIGINS` to include production domain

5. **Database Migration**

   ```bash
   # Generate migrations for Serene schema (journal_entry, ai_response tables)
   bun db:generate

   # Review generated SQL in db/migrations/
   # Then apply to production
   bun db:migrate:prod
   ```

6. **Build and Deploy**

   ```bash
   # Build in dependency order
   bun email:build    # Email templates
   bun web:build      # Marketing/landing page
   bun app:build      # React SPA
   # API worker is deployed from source (no build step)

   # Deploy all workers
   bun api:deploy
   bun app:deploy
   bun web:deploy     # Deploy last (routes traffic to others)
   ```

7. **Post-Deployment Verification**
   - Verify health endpoint: `curl https://yourdomain.com/api/health`
   - Verify landing page loads at root URL
   - Verify auth flow: sign up, email OTP, login
   - Verify journal entry creation triggers AI vibe check
   - Verify SSE streaming works (check browser DevTools Network tab for EventSource)
   - Check Cloudflare dashboard: Workers analytics, request counts, error rates

8. **Custom Domain Setup**
   - Add domain to Cloudflare, update nameservers
   - Set SSL/TLS to Full (strict)
   - Enable Always Use HTTPS
   - Update `wrangler.jsonc` route patterns
   - Redeploy web worker

9. **Multi-Environment Strategy**

   ```
   infra/envs/
     dev/edge/       → serene-{web,app,api}-dev       (local/preview)
     staging/edge/   → serene-{web,app,api}-staging    (pre-production)
     prod/edge/      → serene-{web,app,api}            (production)
   ```

   - Each environment has isolated Terraform state
   - Staging mirrors prod config but with test API keys
   - Preview environments auto-created per PR (if CI/CD configured)

10. **Cost Estimation (Cloudflare + Neon + Anthropic)**

    | Service                  | Free Tier                              | Estimated Monthly (100 DAU)                    |
    | ------------------------ | -------------------------------------- | ---------------------------------------------- |
    | Cloudflare Workers       | 100K requests/day free                 | $0 (well within free tier)                     |
    | Cloudflare Hyperdrive    | Included with Workers                  | $0                                             |
    | Neon PostgreSQL          | 0.5 GB storage, 190 compute hours free | $0-19 (Free or Launch tier)                    |
    | Anthropic Claude API     | Pay per token                          | $7-12 (see `07-ai-integration.md` Section 8.6) |
    | Custom domain (optional) | N/A                                    | $10-15/year                                    |
    | **Total**                |                                        | **$7-31/month**                                |

11. **Troubleshooting**
    - Worker not found: verify Terraform applied and worker names match `wrangler.jsonc`
    - Hyperdrive connection refused: verify `neon_database_url` in Terraform vars and Hyperdrive IDs in `wrangler.jsonc`
    - AI vibe check fails: verify `ANTHROPIC_API_KEY` secret is set on the API worker
    - CORS errors: verify `ALLOWED_ORIGINS` includes the production domain
    - Service binding errors: verify all three workers are deployed and binding names match

### Document 2: `docs/deployment/serene-infrastructure-reference.md`

**Purpose:** Technical reference for the Serene-specific Terraform and Wrangler configuration.

**Required Sections:**

1. **Architecture Diagram**

   ```
   ┌─────────────────────────────────────────────────────┐
   │                    Cloudflare Edge                    │
   │                                                       │
   │  ┌──────────┐    service    ┌──────────┐              │
   │  │          │───binding───▶│          │              │
   │  │   Web    │              │   App    │              │
   │  │ (Astro)  │              │  (React) │              │
   │  │          │    service    │          │              │
   │  │  Landing │───binding───▶│          │              │
   │  │  /about  │              ├──────────┤              │
   │  │  /feat.  │              │          │              │
   │  │  /price  │    service    │   API    │              │
   │  │          │───binding───▶│  (Hono)  │              │
   │  │  /api/*  │              │  tRPC    │              │
   │  │  /*      │              │  Auth    │              │
   │  └──────────┘              │  AI SSE  │              │
   │                            └────┬─────┘              │
   │                                 │                     │
   │                          ┌──────┴──────┐              │
   │                          │ Hyperdrive  │              │
   │                          │ (conn pool) │              │
   │                          └──────┬──────┘              │
   └─────────────────────────────────┼─────────────────────┘
                                     │
                              ┌──────┴──────┐
                              │    Neon     │
                              │ PostgreSQL  │
                              └─────────────┘
   ```

2. **Terraform Variable Reference**

   | Variable                | Required | Description                                         |
   | ----------------------- | -------- | --------------------------------------------------- |
   | `cloudflare_api_token`  | Yes      | Cloudflare API token with Workers + DNS permissions |
   | `cloudflare_account_id` | Yes      | Cloudflare account ID                               |
   | `project_slug`          | Yes      | Base name for workers (use `serene`)                |
   | `environment`           | Yes      | `dev`, `staging`, or `prod`                         |
   | `neon_database_url`     | Yes      | Neon PostgreSQL connection string                   |
   | `cloudflare_zone_id`    | No       | Required for custom domain                          |
   | `hostname`              | No       | Custom domain hostname                              |

3. **Cloudflare API Token Permissions**
   - Terraform token: Zone:DNS:Edit, Zone:Zone:Read, Account:Workers Scripts:Edit, Account:Cloudflare Hyperdrive:Edit
   - Wrangler token: Zone:Workers Routes:Edit, Account:Workers Scripts:Edit

4. **Worker Naming Convention**

   ```
   Production:  serene-web, serene-app, serene-api
   Staging:     serene-web-staging, serene-app-staging, serene-api-staging
   Dev:         serene-web-dev, serene-app-dev, serene-api-dev
   ```

5. **Wrangler Environment Variable Reference (API Worker)**

   | Variable               | Type   | Per-Env | Description                              |
   | ---------------------- | ------ | ------- | ---------------------------------------- |
   | `ENVIRONMENT`          | var    | Yes     | `development` / `staging` / `production` |
   | `APP_NAME`             | var    | No      | `Serene`                                 |
   | `APP_ORIGIN`           | var    | Yes     | Full origin URL                          |
   | `ALLOWED_ORIGINS`      | var    | Yes     | Comma-separated CORS origins             |
   | `RESEND_EMAIL_FROM`    | var    | Yes     | Sender email address                     |
   | `BETTER_AUTH_SECRET`   | secret | Yes     | Auth session signing key                 |
   | `ANTHROPIC_API_KEY`    | secret | Yes     | Claude API key for vibe check            |
   | `GOOGLE_CLIENT_ID`     | secret | Yes     | Google OAuth client ID                   |
   | `GOOGLE_CLIENT_SECRET` | secret | Yes     | Google OAuth client secret               |
   | `RESEND_API_KEY`       | secret | Yes     | Resend email service key                 |

6. **Remote State Configuration**
   - R2 backend for Terraform state (recommended for team use)
   - Instructions to copy `infra/templates/backend-r2.example.hcl`
   - State isolation: one state file per environment per stack

## 17.4 Updates to Existing Documentation

### Update `docs/deployment/cloudflare.md`

Add a notice at the top linking to Serene-specific guide.

### Update `docs/deployment/index.md`

Add navigation links to the new Serene-specific guides.

## 17.5 Acceptance Criteria

- [ ] AC-1: `docs/deployment/serene-deployment-guide.md` exists with all 11 sections.
- [ ] AC-2: `docs/deployment/serene-infrastructure-reference.md` exists with architecture diagram and all reference tables.
- [ ] AC-3: A developer with a Cloudflare account and Neon database can follow the guide to deploy Serene from scratch.
- [ ] AC-4: All `terraform.tfvars.example` files have `project_slug` defaulted to `serene`.
- [ ] AC-5: Wrangler configs in all three apps use `serene-{web,app,api}` naming.
- [ ] AC-6: `ANTHROPIC_API_KEY` is documented in both the deployment guide and the Wrangler secret setup.
- [ ] AC-7: Cost estimation table includes all services (Cloudflare, Neon, Anthropic).
- [ ] AC-8: Architecture diagram accurately reflects the 3-worker + Hyperdrive + Neon topology.
- [ ] AC-9: Troubleshooting section covers the 5 most common deployment failures.
- [ ] AC-10: Existing `docs/deployment/cloudflare.md` links to the new Serene-specific guide.
- [ ] AC-11: Multi-environment strategy (dev/staging/prod) is documented with worker naming conventions.
- [ ] AC-12: The `/review-terraform` slash command can be used to validate infrastructure changes.

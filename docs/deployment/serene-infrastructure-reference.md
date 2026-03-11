# Serene Infrastructure Reference

Technical reference for Terraform, Cloudflare, and worker infrastructure configuration.

## 1. Architecture Diagram

```
                          Internet
                             |
                      +------+------+
                      | Cloudflare  |
                      |    Edge     |
                      +------+------+
                             |
                    +--------+--------+
                    |  serene-web     |
                    |  (Astro router) |
                    +---+--------+---+
                        |        |
           service      |        |      service
           binding      |        |      binding
                        v        v
              +---------+--+ +--+---------+
              | serene-app | | serene-api |
              | (React SPA)| | (Hono/tRPC)|
              +------------+ +-----+------+
                                   |
                            +------+------+
                            | Hyperdrive  |
                            | (cached)    |
                            | (direct)    |
                            +------+------+
                                   |
                            +------+------+
                            |    Neon     |
                            | PostgreSQL  |
                            +-------------+
```

## 2. Terraform Variable Reference

Variables defined in `infra/envs/{env}/edge/variables.tf`:

| Variable                | Type   | Required | Description                                           |
| ----------------------- | ------ | -------- | ----------------------------------------------------- |
| `cloudflare_api_token`  | string | Yes      | API token with Workers + DNS permissions (sensitive)  |
| `cloudflare_account_id` | string | Yes      | Cloudflare account ID                                 |
| `cloudflare_zone_id`    | string | No       | Zone ID for DNS records (empty if no custom domain)   |
| `hostname`              | string | No       | Custom domain hostname (empty for workers.dev)        |
| `project_slug`          | string | Yes      | Resource naming prefix (default: `serene`)            |
| `environment`           | string | Yes      | Environment name: `dev`, `staging`, `preview`, `prod` |
| `neon_database_url`     | string | Yes      | Neon PostgreSQL connection string (sensitive)         |

## 3. Cloudflare API Token Permissions

Create a custom API token at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) with:

| Permission                | Access | Scope   |
| ------------------------- | ------ | ------- |
| Account > Workers Scripts | Edit   | Account |
| Zone > Workers Routes     | Edit   | Zone    |
| Zone > DNS                | Edit   | Zone    |
| Account > Hyperdrive      | Edit   | Account |

## 4. Worker Naming Convention

Workers are named using the pattern `{project_slug}-{service}[-{environment}]`:

| Environment | Web Worker           | App Worker           | API Worker           |
| ----------- | -------------------- | -------------------- | -------------------- |
| Production  | `serene-web`         | `serene-app`         | `serene-api`         |
| Staging     | `serene-web-staging` | `serene-app-staging` | `serene-api-staging` |
| Preview     | `serene-web-preview` | `serene-app-preview` | `serene-api-preview` |

Production workers have no environment suffix. This convention is enforced by the Terraform stack module and must match the `name` field in each `wrangler.jsonc`.

## 5. Terraform Automation Gaps

The following resources are **not** managed by Terraform and require manual setup:

| Resource                       | Manual Step                                      | Why                                                           |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------- |
| KV namespace (`AI_RATE_LIMIT`) | `bun wrangler kv namespace create AI_RATE_LIMIT` | No `cloudflare_workers_kv_namespace` resource in stack        |
| Worker secrets                 | `bun wrangler secret put <NAME>`                 | By design — Terraform handles infra, Wrangler handles secrets |
| SSL/TLS zone settings          | Cloudflare dashboard                             | Not managed by Terraform provider                             |
| Second Hyperdrive config       | Use same ID for both bindings                    | Stack creates 1 config; `wrangler.jsonc` expects 2 IDs        |

::: info
The edge stack creates one Hyperdrive config with caching disabled. The API worker expects two bindings (`HYPERDRIVE_CACHED` and `HYPERDRIVE_DIRECT`). Using the same Hyperdrive ID for both is safe — both function identically when caching is disabled. To enable read caching later, add a second `cloudflare_hyperdrive_config` resource with `caching.disabled = false`.
:::

## 6. Wrangler Environment Variable Reference

Variables configured in `wrangler.jsonc` `vars` sections:

### All Workers

| Variable      | Description                                          |
| ------------- | ---------------------------------------------------- |
| `ENVIRONMENT` | `development`, `preview`, `staging`, or `production` |

### API Worker (`apps/api/wrangler.jsonc`)

| Variable            | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `APP_NAME`          | Display name used in emails (`Serene`)               |
| `APP_ORIGIN`        | Full origin URL (e.g., `https://serene.example.com`) |
| `ALLOWED_ORIGINS`   | Comma-separated CORS origins                         |
| `RESEND_EMAIL_FROM` | Sender address for transactional emails              |

### API Worker Secrets (set via `wrangler secret put`)

| Secret                 | Required | Description                         |
| ---------------------- | -------- | ----------------------------------- |
| `BETTER_AUTH_SECRET`   | Yes      | Session signing secret              |
| `ANTHROPIC_API_KEY`    | Yes      | Anthropic API key for AI vibe check |
| `RESEND_API_KEY`       | Yes      | Resend API key for email delivery   |
| `GOOGLE_CLIENT_ID`     | Yes\*    | Google OAuth client ID              |
| `GOOGLE_CLIENT_SECRET` | Yes\*    | Google OAuth client secret          |

\* Required by `apps/api/lib/env.ts` Zod schema (non-optional `z.string()`). The API worker will crash on startup without them. To make Google OAuth optional, change the schema to use `.optional()`.

### API Worker Bindings

| Binding             | Type       | Description                               |
| ------------------- | ---------- | ----------------------------------------- |
| `HYPERDRIVE_CACHED` | Hyperdrive | Cached connection pool for read queries   |
| `HYPERDRIVE_DIRECT` | Hyperdrive | Direct connection for writes/transactions |
| `AI_RATE_LIMIT`     | KV         | Per-user AI request rate limiting         |

### App Worker (`apps/app/wrangler.jsonc`)

| Variable          | Description          |
| ----------------- | -------------------- |
| `ALLOWED_ORIGINS` | CORS allowed origins |

### Web Worker (`apps/web/wrangler.jsonc`)

| Binding       | Type    | Description               |
| ------------- | ------- | ------------------------- |
| `APP_SERVICE` | Service | Binding to the app worker |
| `API_SERVICE` | Service | Binding to the API worker |
| `ASSETS`      | Assets  | Static asset serving      |

## 7. Remote State Configuration

For team collaboration, configure Terraform remote state:

```hcl
# infra/envs/prod/edge/providers.tf
terraform {
  backend "s3" {
    bucket = "serene-terraform-state"
    key    = "prod/edge/terraform.tfstate"
    region = "us-east-1"
  }
}
```

Alternatively, use [Terraform Cloud](https://app.terraform.io/) (free for up to 5 users):

```hcl
terraform {
  cloud {
    organization = "your-org"
    workspaces {
      name = "serene-prod-edge"
    }
  }
}
```

Each environment maintains its own state file to prevent cross-environment conflicts.

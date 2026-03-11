# Serene Deployment Guide

Step-by-step guide to deploying Serene to Cloudflare Workers with Neon PostgreSQL.

## 1. Prerequisites

Before deploying, ensure you have:

- **Cloudflare account** with Workers enabled ([sign up](https://dash.cloudflare.com/sign-up))
- **Neon account** for PostgreSQL hosting ([sign up](https://neon.tech/))
- **Anthropic API key** for AI vibe check responses ([console](https://console.anthropic.com/))
- **Bun** v1.3+ installed ([install](https://bun.sh/))
- **Terraform** installed ([download](https://developer.hashicorp.com/terraform/install))
- **Domain** added to Cloudflare DNS (optional for initial setup)

## 2. Infrastructure Provisioning

Terraform creates worker metadata, Hyperdrive connection pools, and DNS records. Worker code is deployed separately via Wrangler.

```bash
# Navigate to the target environment
cd infra/envs/prod/edge

# Copy and fill in terraform variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Cloudflare credentials, Neon database URL, etc.

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply
```

Repeat for each environment (`dev`, `staging`, `preview`, `prod`) as needed.

## 3. Worker Secrets Configuration

Set secrets for the API worker. Run from the repository root:

```bash
# Required secrets
bun wrangler secret put BETTER_AUTH_SECRET --config apps/api/wrangler.jsonc
bun wrangler secret put ANTHROPIC_API_KEY --config apps/api/wrangler.jsonc
bun wrangler secret put RESEND_API_KEY --config apps/api/wrangler.jsonc

# Google OAuth (if using Google sign-in)
bun wrangler secret put GOOGLE_CLIENT_ID --config apps/api/wrangler.jsonc
bun wrangler secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.jsonc
```

For non-production environments, append `--env staging` or `--env preview`.

## 4. Wrangler Configuration

Update `apps/*/wrangler.jsonc` files with your deployment specifics:

- **`apps/web/wrangler.jsonc`** -- Update route patterns with your domain (replace `serene.example.com`)
- **`apps/api/wrangler.jsonc`** -- Update `APP_ORIGIN`, `ALLOWED_ORIGINS` with your domain. Replace Hyperdrive and KV namespace IDs with values from Terraform output.
- **`apps/app/wrangler.jsonc`** -- Update `ALLOWED_ORIGINS` with your domain

Worker names (`serene-web`, `serene-app`, `serene-api`) should match what Terraform provisioned via `project_slug = "serene"`.

## 5. Database Migration

Apply the schema to your production Neon database:

```bash
# Set production database URL
export DATABASE_URL="your-neon-production-connection-string"

# Push schema (for initial setup)
bun db:push

# Or apply migrations (for subsequent updates)
bun db:migrate

# Optionally seed with demo data
bun db:seed
```

## 6. Build and Deploy

Build order matters -- email templates must compile before the API worker bundles them:

```bash
# Build all workspaces in dependency order
bun build    # email -> web -> api -> app

# Deploy each worker
bun api:deploy
bun app:deploy
bun web:deploy
```

For specific environments:

```bash
bun wrangler deploy --config apps/api/wrangler.jsonc --env staging
bun wrangler deploy --config apps/app/wrangler.jsonc --env staging
bun wrangler deploy --config apps/web/wrangler.jsonc --env staging
```

## 7. Post-Deployment Verification

After deploying, verify each component:

```bash
# Health check
curl https://your-domain.com/health

# API info
curl https://your-domain.com/api

# Verify the landing page loads
open https://your-domain.com
```

Check the Cloudflare dashboard for:

- Worker execution logs (Workers & Pages > serene-web > Logs)
- Error rates and latency
- Hyperdrive connection metrics

## 8. Custom Domain Setup

1. Add your domain to Cloudflare and update nameservers at your registrar
2. Update `routes` in `apps/web/wrangler.jsonc` with your domain:
   ```jsonc
   "routes": [
     { "pattern": "yourdomain.com/*", "zone_name": "yourdomain.com" }
   ]
   ```
3. Set SSL/TLS encryption mode to **Full (strict)** in the Cloudflare dashboard
4. Enable **Always Use HTTPS**
5. Update `APP_ORIGIN` and `ALLOWED_ORIGINS` in `apps/api/wrangler.jsonc` and `apps/app/wrangler.jsonc`

## 9. Multi-Environment Strategy

| Environment | Trigger         | Worker suffix | URL pattern              |
| ----------- | --------------- | ------------- | ------------------------ |
| Development | `bun dev`       | (local)       | `localhost:5173`         |
| Preview     | PR deployment   | `-preview`    | `preview.yourdomain.com` |
| Staging     | Push to `main`  | `-staging`    | `staging.yourdomain.com` |
| Production  | Manual dispatch | (none)        | `yourdomain.com`         |

Each environment has its own:

- Wrangler config section (`env.staging`, `env.preview`)
- Terraform state (`infra/envs/{env}/edge/`)
- Hyperdrive bindings
- Database (recommended: separate Neon branches per environment)

## 10. Cost Estimation

| Resource              | Free Tier                  | Estimated Cost (beyond free) |
| --------------------- | -------------------------- | ---------------------------- |
| Cloudflare Workers    | 100K requests/day          | $5/mo (Workers Paid plan)    |
| Neon PostgreSQL       | 0.5 GB storage, 1 branch   | From $19/mo (Scale plan)     |
| Anthropic Claude API  | Pay-per-use                | ~$0.003 per vibe check       |
| Resend Email          | 3,000 emails/mo            | From $20/mo                  |
| Cloudflare Hyperdrive | Included with Workers Paid | --                           |
| Terraform Cloud       | Free tier (5 users)        | --                           |

## 11. Troubleshooting

**Workers not connecting via service bindings:**

- Verify worker names in `wrangler.jsonc` match deployed worker names exactly
- Service bindings are non-inheritable -- each environment needs its own `services` array
- Check Cloudflare dashboard > Workers & Pages for deployed worker names

**Hyperdrive connection errors:**

- Verify Hyperdrive IDs in `wrangler.jsonc` match Terraform outputs
- Check Neon database is accessible (not paused due to inactivity)
- Ensure `prepare: false` is set in Drizzle config (required for connection pooling)

**AI vibe check not working:**

- Verify `ANTHROPIC_API_KEY` secret is set: `bun wrangler secret list --config apps/api/wrangler.jsonc`
- Check API worker logs for Anthropic API errors
- Verify KV namespace binding `AI_RATE_LIMIT` is configured

**Build failures:**

- Run `bun install --force` to rebuild native binaries (rollup, workerd)
- Ensure email templates build first: `bun email:build` before `bun api:build`

**Auth not working after deploy:**

- Verify `BETTER_AUTH_SECRET` is identical across all environments where sessions should be shared
- Check `APP_ORIGIN` matches the actual URL users access
- Verify `ALLOWED_ORIGINS` includes the correct domain for CORS

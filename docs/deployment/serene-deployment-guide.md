# Serene Production Deployment Guide

Step-by-step guide to deploying Serene to Cloudflare Workers with Neon PostgreSQL.

**Target domain:** `serene.linktalentsbot.work`

---

## Prerequisites

Install these tools before starting:

- **Bun** v1.3+ ([install](https://bun.sh/))
- **Terraform** v1.12+ — must install from HashiCorp tap (Homebrew default is outdated):
  ```bash
  brew install hashicorp/tap/terraform
  ```
  If you have an old version installed: `brew uninstall terraform && brew install hashicorp/tap/terraform`
- **Wrangler** — installed via bun as a project dependency (`bun wrangler`)

---

## Phase 1: Third-Party Account Setup

Complete these registrations and configurations **before** touching any code or infrastructure.

### 1.1 Cloudflare Account & Domain

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) if you don't have an account
2. Add `linktalentsbot.work` as a zone (if not already added):
   - Go to **Websites > Add a site** and enter `linktalentsbot.work`
   - Point your domain registrar's nameservers to the Cloudflare nameservers shown
3. **Purchase Workers Paid plan ($5/mo)** — required for Hyperdrive:
   - Go to **Workers & Pages** in the left sidebar
   - Find the plans/pricing page (or check the promotional banner at the top)
   - Click **"Purchase Workers Paid"**
4. Note these values from the dashboard:
   - **Account ID** → Go to **Workers & Pages**, find it under "Account Details" on the right side
   - **Zone ID** → Click into `linktalentsbot.work` domain, find it on the Overview page right sidebar
5. Configure SSL/TLS (under the zone's SSL/TLS settings):
   - Encryption mode: **Full (strict)**
   - Enable **Always Use HTTPS**
   - Enable **Automatic HTTPS Rewrites**
6. Create an **API Token** at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens):
   - Click **"Create Token"** → **"Create Custom Token"** → **"Get started"**
   - Token name: `Serene Deployment`
   - Add these permissions:

   | Permission                | Access | Scope        |
   | ------------------------- | ------ | ------------ |
   | Account > Workers Scripts | Edit   | All accounts |
   | Zone > DNS                | Edit   | All zones    |
   | Zone > Zone               | Read   | All zones    |
   | Zone > Workers Routes     | Edit   | All zones    |
   - Click **"Continue to summary"** → **"Create Token"**
   - Copy the token immediately — it's shown only once

::: warning Hyperdrive Permission
The "Cloudflare Hyperdrive" permission is **not available** in the API token creation UI. Terraform will fail to create Hyperdrive configs with this token. This is expected — Hyperdrive is created manually via Wrangler CLI instead (see Phase 2).
:::

### 1.2 Neon PostgreSQL

1. Create a project at [console.neon.tech](https://console.neon.tech/)
2. Project name: `serene-prod`
3. Postgres version: 17
4. Region: choose one close to your users (e.g., `AWS Europe Central 1 (Frankfurt)`)
5. Leave **Neon Auth** disabled (the project uses Better Auth)
6. After creation, click **"Connect"** button → toggle **"Connection pooling" OFF**
7. Copy the **direct (non-pooled)** connection string

::: danger Neon Connection String — Critical Details
The connection string from Neon requires adjustments for Hyperdrive:

1. **Use the direct URL** (pooling OFF) — hostname must NOT contain `-pooler`
2. **Include the full hostname** — Neon hostnames may include a cluster segment like `.c-2` (e.g., `ep-silent-water-agdge5wq.c-2.eu-central-1.aws.neon.tech`). Do not remove it.
3. **Add port `:5432`** — Neon omits it from the displayed URL, but Hyperdrive requires it
4. **Remove query parameters** — strip `?sslmode=require&channel_binding=require` when passing to Hyperdrive (it handles SSL automatically)

Example transformation:

```
# From Neon (what you copy):
postgresql://neondb_owner:pass@ep-xxx.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# For Hyperdrive (what you use):
postgresql://neondb_owner:pass@ep-xxx.c-2.eu-central-1.aws.neon.tech:5432/neondb

# For Terraform/db:push (keep sslmode):
postgresql://neondb_owner:pass@ep-xxx.c-2.eu-central-1.aws.neon.tech:5432/neondb?sslmode=require
```

**Test your connection** before proceeding — use DBeaver, psql, or any DB client to verify you can connect with the direct hostname.
:::

### 1.3 Google OAuth Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Go to **Google Auth Platform** (or APIs & Services > Credentials)
4. If prompted, **configure the consent screen** first:
   - Click **"Get started"** on the Branding page
   - App name: `Serene`
   - User support email: your email
   - Audience: **External**
   - Save
5. Go to **Clients** in the left sidebar → **"Create OAuth client"**
6. Application type: **Web application**
7. Name: `Serene Production`
8. **Authorized JavaScript origins:**
   ```
   https://serene.linktalentsbot.work
   ```
9. **Authorized redirect URIs:**
   ```
   https://serene.linktalentsbot.work/api/auth/callback/google
   ```
10. Click **Create** and save the **Client ID** and **Client Secret**

::: info
The domain `serene.linktalentsbot.work` does not need to exist yet — Google just saves the URLs as configuration. They will be used when users click "Sign in with Google" on the live site.
:::

::: warning
The `env.ts` Zod schema requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as non-optional strings. The API worker will fail on startup if they are not set. You must configure Google OAuth or update `apps/api/lib/env.ts` to make them optional.
:::

### 1.4 Resend Email Service

1. Sign up at [resend.com](https://resend.com/)
2. Go to **Domains** → click **"Add Domain"**
3. Enter `linktalentsbot.work`, select a region (e.g., Ireland / eu-west-1)
4. Click **"+ Add domain"**
5. For DNS setup — if your domain is on Cloudflare, try **"Auto configure"** first:
   - Resend will detect Cloudflare as the provider and add DNS records automatically
   - The verification pipeline: Created → Checking DNS → Records Validated → Internal Verification → **Verified**
   - This typically completes in 2–3 minutes
6. If auto-configure doesn't work, click **"Manual setup"** and add the SPF/DKIM/DMARC records to Cloudflare DNS manually
7. Go to **API Keys** → create a key (name: `SERENE PROD API KEY`, Full access, All Domains) → copy it immediately

Your production sender address: `noreply@linktalentsbot.work`

### 1.5 Anthropic API Key

Required for the AI vibe check feature. The app works without it (the feature is disabled).

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an API key (starts with `sk-ant-`)

### 1.6 Generate Auth Secret

Generate a cryptographically secure 32+ character secret for Better Auth session signing:

```bash
openssl rand -hex 32
```

Save this value securely — you'll need it in Phase 3.

### 1.7 Credentials Checklist

Before proceeding, confirm you have all of these saved:

- [ ] Cloudflare Account ID
- [ ] Cloudflare Zone ID (for `linktalentsbot.work`)
- [ ] Cloudflare API Token (custom token with Workers/DNS/Zone/Routes permissions)
- [ ] Neon direct connection string (with `.c-2` hostname segment, `:5432` port)
- [ ] Google OAuth Client ID
- [ ] Google OAuth Client Secret
- [ ] Resend API Key
- [ ] Resend domain verified
- [ ] Anthropic API Key (optional)
- [ ] Better Auth Secret (64-char hex from `openssl rand -hex 32`)

---

## Phase 2: Infrastructure Provisioning

### 2.1 What Terraform Creates

| Resource         | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| 3 Worker scripts | `serene-web`, `serene-app`, `serene-api` (metadata only — code deployed separately) |
| 1 DNS record     | `serene.linktalentsbot.work` → AAAA `100::` (proxied, enables Workers routing)      |

::: warning Hyperdrive Not Created by Terraform
Terraform will fail to create Hyperdrive due to missing API token permissions (the "Cloudflare Hyperdrive" permission is not available in the token creation UI). Hyperdrive is created manually via Wrangler CLI in Step 2.4 instead. This is expected — run `terraform apply` and ignore the Hyperdrive error.
:::

### 2.2 What Must Be Created Manually

| Item                           | Tool                               | Step     |
| ------------------------------ | ---------------------------------- | -------- |
| Hyperdrive config              | `bun wrangler hyperdrive create`   | Step 2.4 |
| KV namespace (`AI_RATE_LIMIT`) | `bun wrangler kv namespace create` | Step 2.5 |
| Worker secrets                 | `bun wrangler secret put`          | Phase 3  |

### 2.3 Configure and Run Terraform

```bash
# Create terraform variables file
cp infra/envs/prod/edge/terraform.tfvars.example infra/envs/prod/edge/terraform.tfvars
```

Edit `infra/envs/prod/edge/terraform.tfvars`:

```hcl
cloudflare_api_token  = "<your-api-token>"
cloudflare_account_id = "<your-cloudflare-account-id>"
cloudflare_zone_id    = "<zone-id-for-linktalentsbot.work>"
hostname              = "serene.linktalentsbot.work"
project_slug          = "serene"
environment           = "prod"
neon_database_url     = "postgresql://<user>:<pass>@<host>:5432/<db>?sslmode=require"
```

`terraform.tfvars` is git-ignored via `infra/.gitignore`.

```bash
# Initialize, plan, and apply
terraform -chdir=infra/envs/prod/edge init
terraform -chdir=infra/envs/prod/edge plan
terraform -chdir=infra/envs/prod/edge apply
# Type "yes" when prompted
```

**Expected result:** 4 resources created (3 workers + 1 DNS record), 1 Hyperdrive error (403 Authentication error). This is normal — proceed to the next step.

::: tip Remote State
By default, Terraform uses local state. For team collaboration or durability, configure a remote backend (R2, S3, or Terraform Cloud) before the first `apply`. See [Infrastructure Reference](./serene-infrastructure-reference.md#7-remote-state-configuration).
:::

### 2.4 Create Hyperdrive (Manual)

Since the API token lacks Hyperdrive permissions, create it via Wrangler CLI. Wrangler authenticates via browser OAuth which has full permissions:

```bash
bun wrangler hyperdrive create serene-prod --connection-string="postgresql://<user>:<pass>@<host>:5432/<db>"
```

::: danger Connection String for Hyperdrive
Use the Neon direct connection string **without query parameters** (no `?sslmode=require`). Hyperdrive handles SSL automatically. Include the full hostname with any cluster segments (e.g., `.c-2`) and the `:5432` port. See [Section 1.2](#_1-2-neon-postgresql) for details.
:::

Copy the **Hyperdrive ID** from the output (a UUID like `a1b2c3d4-...`).

### 2.5 Create KV Namespace

```bash
bun wrangler kv namespace create AI_RATE_LIMIT
```

Copy the **namespace ID** from the output.

---

## Phase 3: Worker Configuration

### 3.1 Update Wrangler Configs

The wrangler configs have already been updated with the `serene.linktalentsbot.work` domain. You only need to fill in the Hyperdrive and KV IDs.

**`apps/api/wrangler.jsonc`** — Replace the placeholder IDs:

```jsonc
"hyperdrive": [
  { "binding": "HYPERDRIVE_CACHED", "id": "<hyperdrive-id-from-step-2.4>" },
  { "binding": "HYPERDRIVE_DIRECT", "id": "<hyperdrive-id-from-step-2.4>" }
],
"kv_namespaces": [
  { "binding": "AI_RATE_LIMIT", "id": "<kv-namespace-id-from-step-2.5>" }
]
```

Use the **same Hyperdrive ID** for both bindings — both function identically when Hyperdrive caching is disabled (default). To enable read caching later, create a second Hyperdrive config.

::: info Safe to Commit
Hyperdrive IDs and KV namespace IDs are **resource identifiers, not secrets**. They are safe to commit to a public repository. Anyone with the ID alone cannot access your data without Cloudflare account credentials.
:::

### 3.2 Set Worker Secrets

All secrets are set on the API worker. Run from the repository root.

::: tip Multi-Environment Warning
Wrangler warns about multiple environments when no `--env` flag is specified. Add `--env=""` to explicitly target the top-level (production) environment and suppress the warning.
:::

```bash
echo "<your-better-auth-secret>" | bun wrangler secret put BETTER_AUTH_SECRET --config apps/api/wrangler.jsonc --env=""
echo "<your-resend-api-key>" | bun wrangler secret put RESEND_API_KEY --config apps/api/wrangler.jsonc --env=""
echo "<your-google-client-id>" | bun wrangler secret put GOOGLE_CLIENT_ID --config apps/api/wrangler.jsonc --env=""
echo "<your-google-client-secret>" | bun wrangler secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.jsonc --env=""
echo "<your-anthropic-api-key>" | bun wrangler secret put ANTHROPIC_API_KEY --config apps/api/wrangler.jsonc --env=""
```

::: info Worker Auto-Creation
If the worker hasn't been deployed yet, Wrangler may prompt to create it. This is normal — Terraform creates worker metadata but Wrangler may not recognize it until code is deployed. The secret will be uploaded successfully.
:::

For non-production environments, use `--env staging` or `--env preview`.

---

## Phase 4: Database Setup

Push the Drizzle schema to your production Neon database. Use the **full connection string with `?sslmode=require`** (unlike Hyperdrive, the DB client needs SSL mode specified):

```bash
DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>?sslmode=require" bun db:push
```

Seeding is **not needed** for a fresh production database — real users will create their own data.

For subsequent schema updates, use migrations instead of `db:push`:

```bash
DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>?sslmode=require" bun db:migrate
```

::: warning
Always review generated SQL before applying migrations to production. `db:push` is destructive and should only be used for initial setup — use `db:migrate` for ongoing schema changes.
:::

---

## Phase 5: Build & Deploy

### 5.1 Install Dependencies

```bash
bun install --force
```

### 5.2 Build All Workspaces

Build order matters — email templates must compile before the API worker bundles them:

```bash
bun run build    # email → web → api → app
```

::: danger `bun build` vs `bun run build`
`bun build` invokes Bun's native bundler (requires entrypoints). `bun run build` runs the workspace `build` script from `package.json`, which builds all workspaces in the correct order. Always use `bun run build`.
:::

### 5.3 Deploy Workers

Deploy order matters — `api` and `app` must exist before `web` (service bindings):

```bash
bun run api:deploy    # Deploy API worker first
bun run app:deploy    # Then App worker
bun run web:deploy    # Web last (references the other two via service bindings)
```

::: tip `bun run` vs `bun`
Always use `bun run <script>` for package.json scripts. `bun <script>` without `run` may invoke Bun built-in commands instead of your workspace scripts.
:::

For specific environments:

```bash
bun wrangler deploy --config apps/api/wrangler.jsonc --env staging
bun wrangler deploy --config apps/app/wrangler.jsonc --env staging
bun wrangler deploy --config apps/web/wrangler.jsonc --env staging
```

---

## Phase 6: Post-Deployment Verification

### 6.1 Health Checks

```bash
# API info (verifies API worker + service binding)
curl -i https://serene.linktalentsbot.work/api
# Expected: 200 OK with JSON

# Landing page (verifies web worker + static assets)
curl -i https://serene.linktalentsbot.work/
# Expected: 200 OK with HTML
```

::: warning No `/health` at the Edge
The `/health` endpoint exists on the API worker but is **not exposed** through the web router. The web worker only proxies `/api/*` to the API service. Use `/api` as the health check endpoint instead.
:::

### 6.2 Auth Flow

1. Navigate to `https://serene.linktalentsbot.work/login`
2. Enter an email address and submit
3. Check that you receive an OTP email from Resend
4. Enter the OTP to complete sign-in
5. Verify you land on the journal/dashboard page

### 6.3 Google OAuth

1. Click "Continue with Google" on the login page
2. Complete the Google sign-in flow
3. Verify redirect back to `https://serene.linktalentsbot.work` and successful session

### 6.4 Live Logs

```bash
bun wrangler tail --config apps/web/wrangler.jsonc
bun wrangler tail --config apps/api/wrangler.jsonc
bun wrangler tail --config apps/app/wrangler.jsonc
```

### 6.5 Dashboard Checks

- **Workers & Pages > serene-web:** Verify requests are processing, check error rate
- **Workers & Pages > serene-api:** Verify API requests, check Hyperdrive metrics
- **Hyperdrive:** Verify connection pool is active and queries succeeding
- **DNS:** Verify `serene.linktalentsbot.work` AAAA record exists and is proxied

---

## Configuration Reference

Quick reference for all values specific to `serene.linktalentsbot.work`:

| Config File                             | Field                    | Value                                   |
| --------------------------------------- | ------------------------ | --------------------------------------- |
| `infra/envs/prod/edge/terraform.tfvars` | `hostname`               | `serene.linktalentsbot.work`            |
| `infra/envs/prod/edge/terraform.tfvars` | `cloudflare_zone_id`     | Zone ID for `linktalentsbot.work`       |
| `apps/web/wrangler.jsonc`               | `routes[0].pattern`      | `serene.linktalentsbot.work/*`          |
| `apps/web/wrangler.jsonc`               | `routes[0].zone_name`    | `linktalentsbot.work`                   |
| `apps/api/wrangler.jsonc`               | `vars.APP_ORIGIN`        | `https://serene.linktalentsbot.work`    |
| `apps/api/wrangler.jsonc`               | `vars.ALLOWED_ORIGINS`   | `https://serene.linktalentsbot.work`    |
| `apps/api/wrangler.jsonc`               | `vars.RESEND_EMAIL_FROM` | `noreply@linktalentsbot.work`           |
| `apps/api/wrangler.jsonc`               | `hyperdrive[*].id`       | From `bun wrangler hyperdrive create`   |
| `apps/api/wrangler.jsonc`               | `kv_namespaces[0].id`    | From `bun wrangler kv namespace create` |
| `apps/app/wrangler.jsonc`               | `vars.ALLOWED_ORIGINS`   | `https://serene.linktalentsbot.work`    |

### Worker Secrets (API Worker)

| Secret                 | Source                 | Required                            |
| ---------------------- | ---------------------- | ----------------------------------- |
| `BETTER_AUTH_SECRET`   | `openssl rand -hex 32` | Yes                                 |
| `RESEND_API_KEY`       | Resend dashboard       | Yes                                 |
| `GOOGLE_CLIENT_ID`     | Google Cloud Console   | Yes (see env.ts note)               |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console   | Yes (see env.ts note)               |
| `ANTHROPIC_API_KEY`    | Anthropic console      | No (AI feature disabled without it) |

---

## Cost Estimation

| Service               | Free Tier                    | Paid Tier                                      |
| --------------------- | ---------------------------- | ---------------------------------------------- |
| Cloudflare Workers    | 100K requests/day            | $5/mo (Workers Paid — required for Hyperdrive) |
| Neon PostgreSQL       | 0.5 GB storage, auto-suspend | From $19/mo (Scale)                            |
| Resend                | 100 emails/day (3K/mo)       | From $20/mo                                    |
| Anthropic API         | Pay-per-use                  | ~$5–50/mo depending on traffic                 |
| Cloudflare Hyperdrive | Included with Workers Paid   | —                                              |

Neon free tier auto-suspends compute after inactivity. First request after suspension has ~1s cold start. Upgrade to Scale plan to avoid this.

---

## Multi-Environment Strategy

| Environment | Trigger         | Worker Suffix | URL Pattern                   |
| ----------- | --------------- | ------------- | ----------------------------- |
| Development | `bun dev`       | (local)       | `localhost:5173`              |
| Preview     | PR deployment   | `-preview`    | `preview.linktalentsbot.work` |
| Staging     | Push to `main`  | `-staging`    | `staging.linktalentsbot.work` |
| Production  | Manual dispatch | (none)        | `serene.linktalentsbot.work`  |

Each environment has its own Terraform state (`infra/envs/{env}/edge/`), Hyperdrive bindings, and Wrangler config section. Use separate Neon branches per environment.

---

## Troubleshooting

**Terraform: "Unsupported Terraform Core version":**

- The project requires Terraform >= 1.12. Homebrew's default `terraform` formula is outdated (v1.5.x)
- Install from HashiCorp tap: `brew uninstall terraform && brew install hashicorp/tap/terraform`

**Terraform: Hyperdrive 403 Authentication error:**

- This is expected — the "Cloudflare Hyperdrive" permission is not available in the API token UI
- Create Hyperdrive manually: `bun wrangler hyperdrive create serene-prod --connection-string="..."`
- Wrangler authenticates via browser OAuth which has full account permissions

**Hyperdrive: "Failed to connect to the provided database" (code 2015):**

- Verify you're using the **direct** Neon URL (no `-pooler` in hostname)
- Include the **full hostname** with cluster segment (e.g., `.c-2.eu-central-1.aws.neon.tech`)
- Add `:5432` port to the URL
- **Remove query parameters** (`?sslmode=require&channel_binding=require`) — Hyperdrive handles SSL
- Test connectivity from a local DB client (DBeaver, psql) first to rule out credential issues

**Workers not connecting via service bindings:**

- Verify worker names in `wrangler.jsonc` match deployed worker names exactly
- Service bindings are non-inheritable — each environment needs its own `services` array
- Deploy `api` and `app` before `web`

**Hyperdrive connection errors (after deployment):**

- Verify Hyperdrive IDs in `wrangler.jsonc` match the output from `wrangler hyperdrive create`
- Check Neon database is accessible (not paused due to inactivity on free tier)
- Ensure `prepare: false` is set in Drizzle config (required for connection pooling)

**AI vibe check not working:**

- Verify `ANTHROPIC_API_KEY` secret is set: `bun wrangler secret list --config apps/api/wrangler.jsonc`
- Check API worker logs for Anthropic API errors
- Verify KV namespace binding `AI_RATE_LIMIT` is configured with the correct ID

**Build failures:**

- Run `bun install --force` to rebuild native binaries (rollup, workerd)
- Ensure email templates build first: `bun email:build` before `bun api:build`

**Auth not working after deploy:**

- Verify `BETTER_AUTH_SECRET` is set and identical across environments where sessions should be shared
- Check `APP_ORIGIN` matches the actual URL users access (no trailing slash)
- Verify `ALLOWED_ORIGINS` includes the correct domain for CORS
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are required by `env.ts` — the worker crashes without them

**Emails not delivering:**

- Verify Resend domain is verified (SPF, DKIM, DMARC records in Cloudflare DNS)
- Update `RESEND_EMAIL_FROM` from `onboarding@resend.dev` to your verified sender
- Check Resend dashboard for delivery logs and bounces

---

## Known Gaps & Future Improvements

1. **CI/CD deploy steps are commented out** in `.github/workflows/deploy.yml` — uncomment and set `CLOUDFLARE_API_TOKEN` as a GitHub Actions secret to enable automated deployments
2. **KV namespace not in Terraform** — should add a `cloudflare_workers_kv_namespace` resource to the edge stack for infrastructure-as-code consistency
3. **Hyperdrive not in Terraform** — the Cloudflare API token permission for Hyperdrive is not available in the UI; Hyperdrive must be created via Wrangler CLI
4. **Single Hyperdrive config** — both `HYPERDRIVE_CACHED` and `HYPERDRIVE_DIRECT` use the same ID; add a second config with caching enabled for read optimization
5. **No rollback automation** — consider adding a post-deploy health check in CI that auto-rolls back on failure (`wrangler rollback`)
6. **No WAF/rate limiting at edge** — enable Cloudflare's free WAF rules and consider rate limiting on `/api/auth/*` endpoints

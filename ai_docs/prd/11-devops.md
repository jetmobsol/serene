# 12. Docker and DevOps Requirements

> **Context:** Docker Compose updates, environment variables, seed data, health checks. Reference when modifying DevOps config.

---

## 12.1 Docker Compose Updates

The existing `docker-compose.yml` already provides the full stack (db, setup, web, api, app). The following changes are needed:

**Environment Variable Additions for API Service:**

```yaml
api:
  environment:
    <<: *shared-env
    # ... existing vars ...
    ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-sk-ant-placeholder}
```

**Requirement:** `docker-compose up` MUST start the full environment including database, run schema migrations (via the `setup` service), and start all three workers. The only prerequisite is a valid `.env.local` file with the `ANTHROPIC_API_KEY`.

## 12.2 `.env.example` Updates

Add to `.env.example`:

```
# Anthropic Claude API (required for AI Vibe Check feature)
# https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## 12.3 Seed Script Updates

**File:** `db/seed.ts` (extend existing)

Add journal entry seed data for the development user:

- 15-20 sample entries across the past 14 days.
- Mix of all mood types and tag combinations.
- Notes of varying lengths (some < 50 chars, some > 50 chars).
- Pre-generated AI responses for entries with notes >= 50 chars.

## 12.4 Health Check Extension

Update `apps/api/lib/app.ts` health endpoint to include Anthropic API connectivity check:

```typescript
app.get("/health", async (c) => {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "ok", // existing
      anthropic: "ok", // new: ping Anthropic API
    },
  };
  return c.json(checks);
});
```

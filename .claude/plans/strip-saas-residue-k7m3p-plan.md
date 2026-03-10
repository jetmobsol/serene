# Strip SaaS Starter-Kit Residue - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-10

## Summary

Remove all non-PRD SaaS starter-kit features (organizations, Stripe billing, passkeys, admin panels, extra marketing pages) from the Serene codebase. Fix broken navigation, dead links, and non-functional UI elements. Update `.env.example` and `README.md` to reflect the stripped-down, PRD-only feature set. This is a deletion-heavy cleanup with surgical edits to ~15 files and deletion of ~20 files.

**Pre-condition**: The `ai_review/user_stories/e2e-full.yaml` file has been updated with comprehensive UI test coverage for ALL post-cleanup screens and functionality. After all implementation is complete, run `/ui-review` to validate the entire UI end-to-end.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Delete

- `apps/app/routes/(app)/dashboard.tsx`
- `apps/app/routes/(app)/users.tsx`
- `apps/app/routes/(app)/reports.tsx`
- `apps/app/routes/(app)/about.tsx`
- `apps/app/routes/(app)/settings.tsx`
- `apps/web/pages/pricing.astro`
- `apps/web/pages/features.astro`
- `apps/api/routers/organization.ts`
- `apps/api/routers/billing.ts`
- `apps/api/routers/billing.test.ts`
- `apps/api/lib/billing/plans.ts`
- `apps/api/lib/billing/stripe.ts`
- `db/schema/organization.ts`
- `db/schema/invitation.ts`
- `db/schema/subscription.ts`
- `db/schema/passkey.ts`
- `apps/app/lib/queries/billing.ts`
- `apps/app/lib/queries/billing.test.ts`
- `apps/app/components/analytics/mood-trend-chart.tsx`
- `apps/app/components/analytics/mood-trend-chart.test.tsx`
- `apps/app/components/analytics/tag-correlation.tsx`
- `apps/app/components/analytics/tag-correlation.test.tsx`
- `apps/app/components/auth/passkey-login.tsx`

### Files to Edit

- `ai_review/user_stories/e2e-full.yaml`
- `apps/api/lib/app.ts`
- `apps/api/lib/auth.ts`
- `apps/api/lib/env.ts`
- `apps/api/routers/analytics.ts`
- `apps/api/routers/analytics.test.ts`
- `apps/api/routers/user.ts`
- `apps/api/routers/user.test.ts`
- `apps/api/routers/ai.test.ts`
- `apps/api/routers/journal.test.ts`
- `db/schema/index.ts`
- `db/schema/user.ts`
- `apps/app/components/layout/constants.ts`
- `apps/app/components/layout/header.tsx`
- `apps/app/routes/(app)/analytics.tsx`
- `apps/web/layouts/BaseLayout.astro`
- `apps/app/components/auth/auth-form.tsx`
- `apps/app/components/auth/auth-form.test.tsx`
- `apps/app/components/auth/index.ts`
- `apps/app/lib/auth.ts`
- `apps/app/lib/auth-config.ts`
- `apps/app/lib/queries/analytics.ts`
- `apps/web/worker.ts`
- `.env.example`
- `README.md`

---

## Code Context

### API Layer

- `apps/api/lib/app.ts` (lines 14, 16, 21-27): Imports and registers `billingRouter` and `organizationRouter` in the tRPC appRouter.
- `apps/api/lib/auth.ts` (lines 1-16, 48-98, 130-131, 140-148, 180-204): Imports passkey, stripe, anonymous, organization plugins. `stripePlugin()` function on lines 48-98. Plugin registrations on lines 180-204. Schema mappings include organization/invitation/passkey/subscription on lines 140-148. AuthEnv type includes Stripe fields on lines 37-42.
- `apps/api/lib/env.ts` (lines 21-25): Stripe env var definitions in envSchema.
- `apps/api/routers/analytics.ts` (lines 42-151): `moodTrend` and `tagCorrelation` procedures to remove. Keep `weeklyMoodDistribution` (lines 8-40).
- `apps/api/routers/user.ts` (lines 31-44): `list` stub procedure to remove.
- `apps/api/routers/analytics.test.ts` (lines 106-186): Test suites for `moodTrend` and `tagCorrelation` to remove.
- `apps/api/routers/user.test.ts` (line 23, 32): Test context includes `activeOrganizationId` and `isAnonymous` fields.
- `apps/api/routers/ai.test.ts` (line 54, 63): Test context includes `activeOrganizationId` and `isAnonymous` fields.
- `apps/api/routers/journal.test.ts` (line 30, 39): Test context includes `activeOrganizationId` and `isAnonymous` fields.

### Database Layer

- `db/schema/index.ts` (lines 3, 5-7): Exports organization, invitation, passkey, subscription schemas.
- `db/schema/user.ts` (lines 41-42, 79): `isAnonymous` and `stripeCustomerId` fields on user table. `activeOrganizationId` on session table (line 79) with index (line 83).

### Frontend Layer

- `apps/app/components/layout/constants.ts` (lines 1-8): sidebarItems includes Dashboard and Settings entries.
- `apps/app/components/layout/header.tsx` (lines 2, 29-33): Settings icon import and button.
- `apps/app/routes/(app)/analytics.tsx` (lines 1-43): Imports MoodTrendChart and TagCorrelation; renders 3-tab Tabs component.
- `apps/app/components/auth/auth-form.tsx` (line 8, 374-379): Imports and renders PasskeyLogin.
- `apps/app/components/auth/auth-form.test.tsx` (lines 33, 46-48, 188-195): Passkey mock and test.
- `apps/app/components/auth/index.ts` (line 5): Exports PasskeyLogin.
- `apps/app/lib/auth.ts` (lines 8-9, 26-27, 29-30): passkeyClient, stripeClient, anonymousClient, organizationClient imports and usage.
- `apps/app/lib/auth-config.ts` (lines 8-11, 40-42): passkey config and error messages.
- `apps/app/lib/queries/analytics.ts` (lines 8-10, 21-33): moodTrend and tagCorrelation query keys and hooks.

### Web Layer

- `apps/web/layouts/BaseLayout.astro` (lines 62-66, 108-123, 140-153): Nav links to /features and /pricing. Footer links to /features, /pricing, /privacy, /terms.
- `apps/web/worker.ts` (lines 29, 31): Routes for /settings* and /reports* in edge worker.

### Existing Files

- `.env.example`: Exists but uses starter-kit defaults (Acme Co., port 5433, Stripe vars).
- `README.md`: Exists with good content but references passkey and Stripe.

---

## External Context

No external documentation research needed. This is a deletion/cleanup task using only existing codebase patterns.

---

## Architectural Narrative

### Task

Strip the Serene codebase of all SaaS starter-kit residue that was inherited from `kriasoft/react-starter-kit`. The PRD specifies a mood journaling app with: mood selector, tags, reflective notes, timeline, CRUD, weekly bar chart, AI vibe check with streaming, safety guardrails, email/password + Google OAuth, data isolation, and Docker deployment. Everything beyond this scope must be removed.

### Architecture

Three-worker Cloudflare architecture (web edge router, app SPA, api backend) connected via service bindings. Database is Neon PostgreSQL via Drizzle ORM. Auth is Better Auth with plugins. The architecture itself is correct; only the feature surface area needs trimming.

### Selected Context

All files listed in `## Files` above. The key integration points are:

- tRPC router registration in `apps/api/lib/app.ts`
- Better Auth plugin configuration in `apps/api/lib/auth.ts`
- Database schema exports in `db/schema/index.ts`
- Auth client plugins in `apps/app/lib/auth.ts`
- Navigation constants in `apps/app/components/layout/constants.ts`
- Route tree auto-generation from files in `apps/app/routes/`
- Edge routing in `apps/web/worker.ts`

### Relationships

- Deleting route files triggers TanStack Router route tree regeneration automatically
- Removing tRPC routers from `app.ts` changes the `AppRouter` type, which propagates to the frontend tRPC client
- Removing schema files from `db/schema/index.ts` changes `DatabaseSchema` type
- Removing Better Auth plugins changes the `Auth` type and `AuthUser`/`AuthSession` inferred types
- Test files mock context objects that include fields from removed schemas (`activeOrganizationId`, `isAnonymous`)

### External Context

N/A - pure codebase cleanup.

### Implementation Notes

1. **Route tree regeneration**: After deleting route files in `apps/app/routes/(app)/`, running the dev server or `bun app:build` will regenerate `apps/app/lib/routeTree.gen.ts`. This file must never be edited manually.
2. **Better Auth schema mappings**: When removing plugins from `auth.ts`, the corresponding schema table mappings in the `database.schema` config must also be removed, or Better Auth will error trying to access non-existent tables.
3. **Test context mocks**: Multiple test files mock `ctx.session` with `activeOrganizationId` and `ctx.user` with `isAnonymous`. After removing these fields from the DB schema, the test mocks must be updated to remove these fields or the TypeScript compiler will reject them.
4. **Database migration**: After schema changes, `bun db:generate` creates a migration. The migration will DROP tables (organization, member, invitation, passkey, subscription) and DROP columns (user.isAnonymous, user.stripeCustomerId, session.activeOrganizationId). This is destructive and irreversible.
5. **Edge worker cleanup**: Remove `/settings*` and `/reports*` routes from `apps/web/worker.ts` since those app routes no longer exist.

### Ambiguities

- The `anonymous()` plugin in Better Auth enables anonymous/guest authentication. The PRD does not mention anonymous users. Removing it is correct.
- The `emailOTP` plugin is used for dev auto-login flow and must be kept.
- The `SignupTerms` component in auth-form.tsx links to /terms and /privacy which are dead links. Since the PRD does not require terms/privacy pages, these links will be removed along with the footer dead links. The SignupTerms component will be removed from the signup form.
- `use-auth-form.ts` line 51 has a comment mentioning "passkey conditional UI" but the actual code is generic concurrency guard logic. The comment should be updated but the code logic is fine.

### Requirements

1. All 23 extra files are deleted
2. All modified files compile without errors (`bun typecheck` passes)
3. Navigation sidebar shows only Journal and Insights (2 items)
4. No broken links in marketing site header or footer
5. Auth form works with email/password + Google OAuth (no passkey button)
6. Analytics page shows only weekly MoodBarChart (no tabs)
7. `README.md` updated to remove passkey/Stripe references
8. `.env.example` updated for Serene-specific values
9. `bun test --run` passes
10. Route tree auto-regenerates correctly after route deletions
11. Edge worker no longer routes /settings* or /reports*

### Constraints

- Must not break any existing PRD features
- Must not modify auto-generated `routeTree.gen.ts` (it regenerates from route files)
- Database migration must be generated (not manually written)
- `emailOTP` plugin must be preserved (used by dev auto-login)
- Better Auth `emailAndPassword` and Google OAuth `socialProviders` must be preserved

### Selected Approach

**Approach**: Bottom-up deletion with type-safety verification
**Description**: Start with leaf files (database schemas, standalone routes, billing modules), then edit integration points (app.ts, auth.ts, index.ts), then fix UI components, then update documentation. This order ensures each phase's deletions do not break the next phase's edits.
**Rationale**: Bottom-up prevents dangling import errors during implementation. Deleting leaf files first means the integration-point edits only need to remove references to already-deleted code. The TypeScript compiler acts as verification at each step.
**Trade-offs Accepted**: Multiple phases of file changes means the codebase is temporarily broken between phases. This is acceptable since all changes are committed together.

---

## Implementation Plan

### ai_review/user_stories/e2e-full.yaml [edit]

**Purpose**: Update comprehensive E2E user stories to cover ALL post-cleanup UI screens and functionality. This file is the test harness for `/ui-review` validation.
**TOTAL CHANGES**: 1

**Changes**:

1. **Replace entire file** with comprehensive user stories covering:
   - Landing page hero section and CTA (verify no Pricing/Features/About nav links, no broken footer links)
   - Auth signup page (email/password + Google OAuth, NO passkey button)
   - Auth login page (email/password + Google OAuth, NO passkey button)
   - Dev auto-login flow (OTP auto-fills)
   - Sidebar navigation (only Journal + Insights, NO Dashboard/Settings/Reports/Users)
   - Header (NO non-functional settings gear icon)
   - Journal mood selector UI (visual icons/cards for moods)
   - Journal contextual tags (multi-select chips)
   - Journal reflective note (50-char threshold)
   - Journal full CRUD: create entry, view detail, edit, delete
   - Timeline with date grouping and color-coded mood cards
   - AI vibe check appears after 50+ char entry
   - Analytics page shows ONLY weekly mood bar chart (NO Trend/Tags tabs)
   - Removed pages return 404: /settings, /reports, /users, /pricing
   - Responsive design on mobile (375px) and tablet (768px)

**Dependencies**: none (must be done FIRST before any code changes)
**Provides**: Test harness for final `/ui-review` validation

---

### apps/app/routes/(app)/dashboard.tsx [delete]

**Purpose**: Dead route that double-redirects /dashboard -> / -> /journal
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/routes/(app)/users.tsx [delete]

**Purpose**: Fake admin user management with hardcoded data
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/routes/(app)/reports.tsx [delete]

**Purpose**: "Monthly Sales Report" page, completely off-brand for a journal app
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/routes/(app)/about.tsx [delete]

**Purpose**: Duplicate of marketing about page
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/routes/(app)/settings.tsx [delete]

**Purpose**: 5 non-functional settings cards including billing, not in PRD
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/web/pages/pricing.astro [delete]

**Purpose**: Pricing page for non-existent billing model
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/web/pages/features.astro [delete]

**Purpose**: Features page listing non-existent features
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/api/routers/organization.ts [delete]

**Purpose**: Multi-tenant organization management router
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/api/routers/billing.ts [delete]

**Purpose**: Stripe billing router
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/api/routers/billing.test.ts [delete]

**Purpose**: Tests for removed billing router
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/api/lib/billing/plans.ts [delete]

**Purpose**: Plan limits configuration for Stripe billing
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/api/lib/billing/stripe.ts [delete]

**Purpose**: Stripe client helper
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### db/schema/organization.ts [delete]

**Purpose**: Organization and member tables for multi-tenant support
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### db/schema/invitation.ts [delete]

**Purpose**: Organization invitation table
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### db/schema/subscription.ts [delete]

**Purpose**: Stripe subscription table
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### db/schema/passkey.ts [delete]

**Purpose**: WebAuthn passkey credential table
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/lib/queries/billing.ts [delete]

**Purpose**: Billing subscription query hooks
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/lib/queries/billing.test.ts [delete]

**Purpose**: Tests for billing query hooks
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/components/analytics/mood-trend-chart.tsx [delete]

**Purpose**: Mood trend area chart (not in PRD, PRD only requires weekly bar chart)
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/components/analytics/mood-trend-chart.test.tsx [delete]

**Purpose**: Tests for mood trend chart
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/components/analytics/tag-correlation.tsx [delete]

**Purpose**: Tag correlation insights component (not in PRD)
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/components/analytics/tag-correlation.test.tsx [delete]

**Purpose**: Tests for tag correlation component
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### apps/app/components/auth/passkey-login.tsx [delete]

**Purpose**: WebAuthn passkey login component
**TOTAL CHANGES**: 1

**Changes**:

1. Delete entire file

**Dependencies**: none
**Provides**: none (removal only)

---

### db/schema/index.ts [edit]

**Purpose**: Central schema exports barrel file
**TOTAL CHANGES**: 1

**Changes**:

1. Remove lines 3, 5, 6, 7: the export statements for `invitation`, `organization`, `passkey`, `subscription`

**Implementation Details**:

- Keep exports for: `ai-response`, `id`, `journal`, `user`
- These 4 removed exports correspond to the 4 deleted schema files

**Reference Implementation**:

```typescript
export * from "./ai-response";
export * from "./id";
export * from "./journal";
export * from "./user";
```

**Migration Pattern**:

```typescript
// BEFORE (lines 1-8):
export * from "./ai-response";
export * from "./id";
export * from "./invitation";
export * from "./journal";
export * from "./organization";
export * from "./passkey";
export * from "./subscription";
export * from "./user";

// AFTER:
export * from "./ai-response";
export * from "./id";
export * from "./journal";
export * from "./user";
```

**Dependencies**: none (this is edited in Phase 1, no plan-file dependencies)
**Provides**: Updated `DatabaseSchema` type (no longer includes organization, invitation, passkey, subscription tables)

---

### db/schema/user.ts [edit]

**Purpose**: User and session table definitions
**TOTAL CHANGES**: 3

**Changes**:

1. Remove `isAnonymous` field from `user` table (line 41)
2. Remove `stripeCustomerId` field from `user` table (line 42)
3. Remove `activeOrganizationId` field from `session` table (line 79) and its index (line 83)

**Implementation Details**:

- The `user` table keeps: id, name, email, emailVerified, image, createdAt, updatedAt
- The `session` table keeps: id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId
- Remove the `session_active_org_id_idx` index entirely
- The `boolean` import on line 19 is still needed for `emailVerified`

**Reference Implementation**:

```typescript
/**
 * Database schema for Better Auth authentication system.
 *
 * This schema is designed to be fully compatible with Better Auth's database
 * requirements as documented at https://www.better-auth.com/docs/concepts/database
 *
 * Tables defined:
 * - `user`: Core user accounts with profile information
 * - `session`: Active user sessions for authentication state
 * - `identity`: OAuth provider accounts (renamed from Better Auth's `account`)
 * - `verification`: Tokens for email verification and password resets
 *
 * @see https://www.better-auth.com/docs/concepts/database
 * @see https://www.better-auth.com/docs/adapters/drizzle
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { generateAuthId } from "./id";
import { journalEntry } from "./journal";

/**
 * User accounts table.
 * Matches to the `user` table in Better Auth.
 */
export const user = pgTable("user", {
  id: text()
    .primaryKey()
    .$defaultFn(() => generateAuthId("user")),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

/**
 * Stores user session data for authentication.
 * Matches to the `session` table in Better Auth.
 */
export const session = pgTable(
  "session",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateAuthId("session")),
    expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

/**
 * Stores OAuth provider account information.
 * Matches to the `account` table in Better Auth.
 */
export const identity = pgTable(
  "identity",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateAuthId("account")),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true, mode: "date" }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: "date" }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("identity_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("identity_user_id_idx").on(table.userId),
  ],
);

export type Identity = typeof identity.$inferSelect;
export type NewIdentity = typeof identity.$inferInsert;

/**
 * Stores verification tokens (email verification, password reset, etc.)
 * Matches to the `verification` table in Better Auth.
 */
export const verification = pgTable(
  "verification",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateAuthId("verification")),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("verification_identifier_value_unique").on(
      table.identifier,
      table.value,
    ),
    index("verification_identifier_idx").on(table.identifier),
    index("verification_value_idx").on(table.value),
    index("verification_expires_at_idx").on(table.expiresAt),
  ],
);

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

// Relations for better query experience

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  identities: many(identity),
  journalEntries: many(journalEntry),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const identityRelations = relations(identity, ({ one }) => ({
  user: one(user, {
    fields: [identity.userId],
    references: [user.id],
  }),
}));
```

**Dependencies**: none
**Provides**: Updated `user` table (no `isAnonymous`, `stripeCustomerId`), updated `session` table (no `activeOrganizationId`)

---

### apps/api/lib/app.ts [edit]

**Purpose**: Hono app construction and tRPC router initialization
**TOTAL CHANGES**: 2

**Changes**:

1. Remove import statements for `billingRouter` (line 14) and `organizationRouter` (line 16)
2. Remove `billing: billingRouter` (line 23) and `organization: organizationRouter` (line 26) from the `appRouter` definition

**Implementation Details**:

- Keep imports for: aiRouter, analyticsRouter, journalRouter, userRouter
- The `AppRouter` type export on line 119 automatically narrows since it's `typeof appRouter`

**Reference Implementation**:

```typescript
/**
 * @file Hono app construction and tRPC router initialization.
 *
 * Combines authentication, tRPC, and health check endpoints into a single HTTP router.
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import type { AppContext } from "./context.js";
import { router } from "./trpc.js";
import { registerAiStreamRoute } from "./ai/stream-handler.js";
import { aiRouter } from "../routers/ai.js";
import { analyticsRouter } from "../routers/analytics.js";
import { journalRouter } from "../routers/journal.js";
import { userRouter } from "../routers/user.js";

// tRPC API router
const appRouter = router({
  ai: aiRouter,
  analytics: analyticsRouter,
  journal: journalRouter,
  user: userRouter,
});

// ... rest of file unchanged from line 29 onward ...
```

**Migration Pattern**:

```typescript
// BEFORE (lines 12-27):
import { aiRouter } from "../routers/ai.js";
import { analyticsRouter } from "../routers/analytics.js";
import { billingRouter } from "../routers/billing.js";
import { journalRouter } from "../routers/journal.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

const appRouter = router({
  ai: aiRouter,
  analytics: analyticsRouter,
  billing: billingRouter,
  journal: journalRouter,
  user: userRouter,
  organization: organizationRouter,
});

// AFTER:
import { aiRouter } from "../routers/ai.js";
import { analyticsRouter } from "../routers/analytics.js";
import { journalRouter } from "../routers/journal.js";
import { userRouter } from "../routers/user.js";

const appRouter = router({
  ai: aiRouter,
  analytics: analyticsRouter,
  journal: journalRouter,
  user: userRouter,
});
```

**Dependencies**: none (deleted routers are removed, not depended upon)
**Provides**: Updated `AppRouter` type (no billing or organization namespaces)

---

### apps/api/lib/auth.ts [edit]

**Purpose**: Better Auth server configuration with plugins
**TOTAL CHANGES**: 5

**Changes**:

1. Remove imports: `passkey` from `@better-auth/passkey` (line 1), `type {}` from `@simplewebauthn/server` (line 3), `stripe` from `@better-auth/stripe` (line 4), `anonymous` and `organization` from `better-auth/plugins` (line 10 -- keep emailOTP import on line 11), `planLimits` from `./billing/plans.js` (line 15), `createStripeClient` from `./billing/stripe.js` (line 16)
2. Remove the entire `stripePlugin` function (lines 48-98)
3. Remove Stripe fields from `AuthEnv` type (lines 37-41): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`
4. Remove rpID extraction and passkey-related setup (lines 129-131). Remove schema mappings for `invitation`, `member`, `organization`, `passkey`, `subscription` from the database config (lines 142-146). Remove `anonymous()`, `organization(...)`, `passkey(...)`, and `...stripePlugin(db, env)` from the plugins array (lines 181-204). Keep only `emailOTP(...)`.
5. Update the JSDoc comment (lines 100-122) to remove references to organizations, anonymous auth, and multi-tenant SaaS.

**Implementation Details**:

- The `and`, `eq` imports from `drizzle-orm` (line 12) are only used inside `stripePlugin`. Remove them.
- The `schema as Db` import (line 5) is only used inside `stripePlugin` (references `Db.member`). After removing stripePlugin, `schema as Db` is unused. Change to just `{ generateAuthId, type AuthModel }` import.
- Keep: `betterAuth`, `drizzleAdapter`, `createAuthMiddleware`, `emailOTP`, `sendOTP`, `sendPasswordReset`, `sendVerificationEmail`, `Env` type

**Reference Implementation**:

```typescript
import { generateAuthId, type AuthModel } from "@repo/db";
import { betterAuth } from "better-auth";
import type { DB } from "better-auth/adapters/drizzle";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { emailOTP } from "better-auth/plugins/email-otp";
import { sendOTP, sendPasswordReset, sendVerificationEmail } from "./email";
import type { Env } from "./env";

// Auth hint cookie for edge routing (see docs/adr/001-auth-hint-cookie.md)
// NOT a security boundary - false positives are acceptable (causes one redirect)
// __Host- prefix requires Secure; use plain name in HTTP dev
const AUTH_HINT_VALUE = "1";

/**
 * Environment variables required for authentication configuration.
 */
type AuthEnv = Pick<
  Env,
  | "ENVIRONMENT"
  | "APP_NAME"
  | "APP_ORIGIN"
  | "BETTER_AUTH_SECRET"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "RESEND_API_KEY"
  | "RESEND_EMAIL_FROM"
>;

/**
 * Creates a Better Auth instance configured for the Serene journal app.
 *
 * Key behaviors:
 * - Uses custom 'identity' table instead of default 'account' model for OAuth accounts
 * - Generates prefixed CUID2 IDs at application level (e.g. usr_..., ses_...)
 * - Supports email/password and Google OAuth authentication
 * - Email OTP for passwordless login (also used by dev auto-login flow)
 *
 * @param db Drizzle database instance
 * @param env Environment variables containing auth secrets and OAuth credentials
 * @returns Configured Better Auth instance
 */
export function createAuth(db: DB, env: AuthEnv) {
  const isDev = env.ENVIRONMENT === "development";
  let lastDevOtp: string | undefined;

  return betterAuth({
    baseURL: `${env.APP_ORIGIN}/api/auth`,
    trustedOrigins: [env.APP_ORIGIN],
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: {
        identity: (await import("@repo/db")).identity,
        session: (await import("@repo/db")).session,
        user: (await import("@repo/db")).user,
        verification: (await import("@repo/db")).verification,
      },
    }),

    account: {
      modelName: "identity",
    },

    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordReset(env, { user, url });
      },
    },

    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(env, { user, url });
      },
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (isDev) lastDevOtp = otp;
          await sendOTP(env, { email, otp, type });
        },
        otpLength: 6,
        expiresIn: 300,
        allowedAttempts: 3,
      }),
    ],

    advanced: {
      database: {
        generateId: ({ model }) => generateAuthId(model as AuthModel),
      },
    },

    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (
          isDev &&
          ctx.path === "/email-otp/send-verification-otp" &&
          lastDevOtp
        ) {
          const otp = lastDevOtp;
          lastDevOtp = undefined;
          return ctx.json({ success: true, devOtp: otp });
        }

        const isSecure = new URL(env.APP_ORIGIN).protocol === "https:";
        const cookieName = isSecure ? "__Host-auth" : "auth";
        const cookieOpts = {
          path: "/",
          secure: isSecure,
          httpOnly: true,
          sameSite: "lax" as const,
        };

        if (ctx.context.newSession) {
          ctx.setCookie(cookieName, AUTH_HINT_VALUE, cookieOpts);
          return;
        }

        if (ctx.path.startsWith("/sign-out")) {
          ctx.setCookie(cookieName, "", { ...cookieOpts, maxAge: 0 });
          return;
        }

        if (ctx.path === "/get-session" && !ctx.context.session) {
          const cookies = ctx.request?.headers.get("cookie") ?? "";
          const hasHintCookie = cookies
            .split(";")
            .some((c) => c.trim().startsWith(`${cookieName}=`));
          if (hasHintCookie) {
            ctx.setCookie(cookieName, "", { ...cookieOpts, maxAge: 0 });
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

type SessionResponse = Auth["$Infer"]["Session"];
export type AuthUser = SessionResponse["user"];
export type AuthSession = SessionResponse["session"];
```

**IMPORTANT NOTE**: The schema references in the `database` config must NOT use dynamic imports. The original code uses `Db.identity` etc. via the `schema as Db` import. Since we are removing the `Db` alias (it was also used by stripePlugin), we need to import the specific tables directly:

**Corrected schema section**:

```typescript
import {
  generateAuthId,
  identity,
  session as sessionTable,
  user as userTable,
  verification as verificationTable,
  type AuthModel,
} from "@repo/db";
```

Then in the database config:

```typescript
schema: {
  identity,
  session: sessionTable,
  user: userTable,
  verification: verificationTable,
},
```

**Dependencies**: `db/schema/index.ts` (for updated schema exports), `db/schema/user.ts` (for updated user/session tables)
**Provides**: Updated `createAuth()` function, updated `AuthEnv` type (no Stripe fields), updated `AuthUser` and `AuthSession` types (no organization/passkey/anonymous/stripe extensions)

---

### apps/api/lib/env.ts [edit]

**Purpose**: Zod environment variable validation schema
**TOTAL CHANGES**: 1

**Changes**:

1. Remove Stripe env vars from envSchema (lines 21-25): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID` and their comment on line 20

**Reference Implementation**:

```typescript
import { z } from "zod";

export const envSchema = z.object({
  ENVIRONMENT: z.enum(["production", "staging", "preview", "development"]),
  APP_NAME: z.string().default("Serene"),
  APP_ORIGIN: z.url(),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),
  RESEND_API_KEY: z.string(),
  RESEND_EMAIL_FROM: z.email(),
  // Cloudflare KV namespace for AI rate limiting (injected by Workers runtime)
  AI_RATE_LIMIT: z.custom<KVNamespace>().optional(),
});

export const env =
  typeof Bun === "undefined" ? ({} as Env) : envSchema.parse(Bun.env);

export type Env = z.infer<typeof envSchema>;
```

**Migration Pattern**:

```typescript
// BEFORE (lines 20-25):
  // Stripe billing (optional — app works without these, billing features disabled)
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_STARTER_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),

// AFTER:
  // (removed — Stripe billing not in PRD)
```

**Dependencies**: none
**Provides**: Updated `Env` type (no Stripe fields)

---

### apps/api/routers/analytics.ts [edit]

**Purpose**: Analytics tRPC router
**TOTAL CHANGES**: 2

**Changes**:

1. Remove `moodTrend` procedure (lines 42-101)
2. Remove `tagCorrelation` procedure (lines 103-151)
3. Remove unused imports: `MOODS`, `MOOD_SCORES`, `type MoodType` from `@repo/core` (line 1 -- only keep what `weeklyMoodDistribution` needs, which is nothing from `@repo/core`). Remove `lt` from `drizzle-orm` (line 4 -- wait, `lt` IS used by weeklyMoodDistribution on line 29). Actually, review the imports: `MOODS` is only used by tagCorrelation. `MOOD_SCORES` is only used by moodTrend and tagCorrelation. `MoodType` is only used with MOOD_SCORES. `sql` is used by weeklyMoodDistribution. `gte` is used by weeklyMoodDistribution. `lt` is used by weeklyMoodDistribution. `and` is used by weeklyMoodDistribution. `eq` is used by weeklyMoodDistribution. So remove only: `MOODS`, `MOOD_SCORES`, `type MoodType` from line 1.

**Reference Implementation**:

```typescript
import { journalEntry } from "@repo/db/schema/journal.js";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc.js";

export const analyticsRouter = router({
  weeklyMoodDistribution: protectedProcedure
    .input(
      z.object({
        weekStart: z.string().date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const weekStartDate = new Date(input.weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);

      const rows = await ctx.db
        .select({
          mood: journalEntry.mood,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(journalEntry)
        .where(
          and(
            eq(journalEntry.userId, ctx.user.id),
            gte(journalEntry.createdAt, weekStartDate),
            lt(journalEntry.createdAt, weekEndDate),
          ),
        )
        .groupBy(journalEntry.mood);

      const totalEntries = rows.reduce((sum, row) => sum + row.count, 0);

      return {
        distribution: rows,
        totalEntries,
      };
    }),
});
```

**Dependencies**: none
**Provides**: Updated `analyticsRouter` (only `weeklyMoodDistribution` procedure)

---

### apps/api/routers/analytics.test.ts [edit]

**Purpose**: Analytics router tests
**TOTAL CHANGES**: 3

**Changes**:

1. Remove `analytics.moodTrend` test suite (lines 106-145)
2. Remove `analytics.tagCorrelation` test suite (lines 147-186)
3. Remove `activeOrganizationId` from test context session mock (line 42) and `isAnonymous` from test context user mock (line 51)

**Implementation Details**:

- The `executeResult` parameter in `testCtx` (line 11) is only used by tagCorrelation. Remove it and the `execute` mock (line 56).
- The `having` and `orderBy` mocks in `createThenable` (lines 15-16) are only used by moodTrend/tagCorrelation chain. They can stay since they're part of the generic mock chain, but `orderBy` on the selectChain (line 27) is only used by moodTrend. For simplicity, keep the existing mock structure minus the execute mock and just remove the two test describe blocks.

**Reference Implementation**:

```typescript
import { describe, expect, it, vi } from "vitest";
import type { TRPCContext } from "../lib/context";
import { createCallerFactory } from "../lib/trpc";
import { analyticsRouter } from "./analytics";

const createCaller = createCallerFactory(analyticsRouter);

function testCtx({
  userId = "usr_test-user-1",
  selectResult = [] as unknown[],
} = {}) {
  const createThenable = () => ({
    having: vi.fn().mockResolvedValue(selectResult),
    orderBy: vi.fn().mockResolvedValue(selectResult),
    then: vi.fn((onFulfilled) =>
      Promise.resolve(selectResult).then(onFulfilled),
    ),
  });

  const selectChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockReturnValue(createThenable()),
        orderBy: vi.fn().mockResolvedValue(selectResult),
      }),
      groupBy: vi.fn().mockReturnValue(createThenable()),
    }),
  };

  const ctx: TRPCContext = {
    req: new Request("http://localhost"),
    info: {} as TRPCContext["info"],
    session: {
      id: "ses_test-session",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      token: "token",
    },
    user: {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: "test@example.com",
      emailVerified: true,
      name: "Test User",
    },
    db: {
      select: vi.fn().mockReturnValue(selectChain),
    } as unknown as TRPCContext["db"],
    dbDirect: {} as unknown as TRPCContext["dbDirect"],
    cache: new Map(),
    env: {} as TRPCContext["env"],
  };

  return ctx;
}

describe("analytics.weeklyMoodDistribution", () => {
  it("returns empty distribution when no entries exist", async () => {
    const ctx = testCtx({ selectResult: [] });

    const result = await createCaller(ctx).weeklyMoodDistribution({
      weekStart: "2026-03-09",
    });

    expect(result.distribution).toEqual([]);
    expect(result.totalEntries).toBe(0);
  });

  it("returns mood counts for a given week", async () => {
    const ctx = testCtx({
      selectResult: [
        { mood: "Happy", count: 3 },
        { mood: "Calm", count: 2 },
        { mood: "Anxious", count: 1 },
      ],
    });

    const result = await createCaller(ctx).weeklyMoodDistribution({
      weekStart: "2026-03-09",
    });

    expect(result.distribution).toHaveLength(3);
    expect(result.totalEntries).toBe(6);
    expect(result.distribution[0]).toEqual({ mood: "Happy", count: 3 });
  });

  it("rejects invalid date format for weekStart", async () => {
    const ctx = testCtx();

    await expect(
      createCaller(ctx).weeklyMoodDistribution({
        weekStart: "not-a-date",
      }),
    ).rejects.toThrow();
  });
});
```

**Dependencies**: `db/schema/user.ts` (for updated session/user types without activeOrganizationId/isAnonymous)
**Provides**: Updated test file matching new analytics router

---

### apps/api/routers/user.ts [edit]

**Purpose**: User tRPC router
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `list` procedure (lines 31-44)

**Implementation Details**:

- Remove the `z` import usage for list input, but `z` is still needed by `updateProfile`
- Keep: `me`, `updateProfile`, `exportData`, `deleteAccount`
- The `eq` import on line 1 and `userTable` import on line 3 are used by `deleteAccount`

**Reference Implementation**:

```typescript
import { eq } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@repo/db/schema/user.js";
import { protectedProcedure, router } from "../lib/trpc.js";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.email({ error: "Invalid email address" }).optional(),
      }),
    )
    .mutation(({ input, ctx }) => {
      // TODO: Implement user profile update logic
      return {
        id: ctx.user.id,
        ...input,
      };
    }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.db.query.journalEntry.findMany({
      where: (table, { eq: whereEq }) => whereEq(table.userId, ctx.user.id),
      with: {
        aiResponse: true,
      },
      orderBy: (table, { desc: orderDesc }) => orderDesc(table.createdAt),
    });

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
      },
      entries: entries.map((entry) => ({
        id: entry.id,
        mood: entry.mood,
        tags: entry.tags,
        note: entry.note,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        aiResponse: entry.aiResponse
          ? {
              response: entry.aiResponse.response,
              hasCrisisContent: entry.aiResponse.hasCrisisContent,
              createdAt: entry.aiResponse.createdAt,
            }
          : null,
      })),
      exportedAt: new Date().toISOString(),
    };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.dbDirect.delete(userTable).where(eq(userTable.id, ctx.user.id));

    return { success: true as const };
  }),
});
```

**Dependencies**: none
**Provides**: Updated `userRouter` (no `list` procedure)

---

### apps/api/routers/user.test.ts [edit]

**Purpose**: User router tests
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `activeOrganizationId: undefined` from session mock (line 23) and `isAnonymous: false` from user mock (line 32)

**Migration Pattern**:

```typescript
// BEFORE (lines 19-33):
    session: {
      id: "ses_test-session",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      token: "token",
      activeOrganizationId: undefined,
    },
    user: {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: "test@example.com",
      emailVerified: true,
      name: "Test User",
      isAnonymous: false,
    },

// AFTER:
    session: {
      id: "ses_test-session",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      token: "token",
    },
    user: {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: "test@example.com",
      emailVerified: true,
      name: "Test User",
    },
```

**Dependencies**: `db/schema/user.ts` (for updated types)
**Provides**: Updated test context matching new schema

---

### apps/api/routers/ai.test.ts [edit]

**Purpose**: AI router tests
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `activeOrganizationId: undefined` from session mock (line 54) and `isAnonymous: false` from user mock (line 63)

**Migration Pattern**: Same pattern as user.test.ts above.

**Dependencies**: `db/schema/user.ts` (for updated types)
**Provides**: Updated test context matching new schema

---

### apps/api/routers/journal.test.ts [edit]

**Purpose**: Journal router tests
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `activeOrganizationId: undefined` from session mock (line 30) and `isAnonymous: false` from user mock (line 39)

**Migration Pattern**: Same pattern as user.test.ts above.

**Dependencies**: `db/schema/user.ts` (for updated types)
**Provides**: Updated test context matching new schema

---

### apps/app/components/layout/constants.ts [edit]

**Purpose**: Sidebar navigation items
**TOTAL CHANGES**: 1

**Changes**:

1. Replace entire sidebarItems array to contain only Journal and Insights. Remove `Home` and `Settings` imports from lucide-react.

**Reference Implementation**:

```typescript
import { BarChart3, BookHeart } from "lucide-react";

export const sidebarItems = [
  { icon: BookHeart, label: "Journal", to: "/journal" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
] as const;
```

**Dependencies**: none
**Provides**: Updated `sidebarItems` array (2 items: Journal, Insights)

---

### apps/app/components/layout/header.tsx [edit]

**Purpose**: App header component
**TOTAL CHANGES**: 1

**Changes**:

1. Remove the Settings icon button (lines 29-33) and the `Settings` import from lucide-react (line 2). Remove the wrapping `<div>` for the right-side icon group (lines 28-34) entirely since it only contained the Settings button.

**Reference Implementation**:

```typescript
import { Button } from "@repo/ui";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="shrink-0"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <h1 className="text-lg font-semibold">Serene</h1>
      </div>
    </header>
  );
}
```

**Dependencies**: none
**Provides**: Updated `Header` component (no Settings button)

---

### apps/app/routes/(app)/analytics.tsx [edit]

**Purpose**: Insights/analytics page
**TOTAL CHANGES**: 1

**Changes**:

1. Remove Tabs UI entirely. Remove imports for `MoodTrendChart`, `TagCorrelation`, `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`. Render `MoodBarChart` directly without tabs.

**Reference Implementation**:

```typescript
import { MoodBarChart } from "@/components/analytics/mood-bar-chart";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/analytics")({
  component: Analytics,
});

function Analytics() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Insights</h2>
        <p className="text-muted-foreground">
          Understand your mood patterns and discover what impacts your
          well-being.
        </p>
      </div>

      <MoodBarChart />
    </div>
  );
}
```

**Dependencies**: none (MoodBarChart is kept, not part of this plan's changes)
**Provides**: Simplified analytics page (no tabs, single chart)

---

### apps/web/layouts/BaseLayout.astro [edit]

**Purpose**: Marketing site layout (header, nav, footer)
**TOTAL CHANGES**: 3

**Changes**:

1. Remove "Features" and "Pricing" nav links from header (lines 62-66)
2. Remove "Resources" footer column (lines 105-123) which links to /features, /pricing, /about
3. Remove "Legal" footer column (lines 140-153) which links to /privacy, /terms (dead links)

**Implementation Details**:

- Keep: Home and About links in nav header
- Keep: "Support" footer column (Log In, Sign Up links)
- Keep: Serene description column
- Adjust grid from 4 columns to 2 columns: `grid-cols-1 md:grid-cols-2`

**Reference Implementation**:

```astro
---
import '@/styles/globals.css';

export interface Props {
  title?: string;
  description?: string;
  image?: string;
}

const {
  title = 'Serene — AI-Powered Wellness Journal',
  description = 'Track your mood, reflect on your day, and receive personalized AI insights to support your emotional well-being.',
  image = '/og-image.png'
} = Astro.props;

const app = import.meta.env.DEV ? 'http://localhost:5173' : '';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="generator" content={Astro.generator} />

    <!-- Primary Meta Tags -->
    <title>{title}</title>
    <meta name="title" content={title} />
    <meta name="description" content={description} />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={new URL(Astro.url.pathname, Astro.site ?? Astro.url)} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(image, Astro.site ?? Astro.url)} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={new URL(image, Astro.site ?? Astro.url)} />
  </head>
  <body>
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center space-x-4">
              <a href="/" class="text-xl font-bold text-primary">
                Serene
              </a>
            </div>
            <nav class="hidden md:flex items-center space-x-6">
              <a href="/" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Home
              </a>
              <a href="/about" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </nav>
            <div class="flex items-center space-x-2">
              <a
                href={`${app}/login`}
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3"
              >
                Log In
              </a>
              <a
                href={`${app}/signup`}
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="border-t bg-background/95">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-3">
              <h3 class="font-semibold">Serene</h3>
              <p class="text-sm text-muted-foreground">
                Your AI-powered wellness journal. Track your mood, reflect, and grow.
              </p>
            </div>
            <div class="space-y-3">
              <h4 class="font-medium">Account</h4>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href={`${app}/login`} class="hover:text-foreground transition-colors">
                    Log In
                  </a>
                </li>
                <li>
                  <a href={`${app}/signup`} class="hover:text-foreground transition-colors">
                    Sign Up
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="border-t mt-6 pt-6">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-2">
              <p class="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Serene. All rights reserved.
              </p>
              <p class="text-sm text-muted-foreground">
                Serene is not a substitute for professional mental health care.
              </p>
              <p class="text-sm text-muted-foreground">
                If you are in crisis, call or text 988.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </body>
</html>
```

**Dependencies**: none
**Provides**: Updated layout with no dead links

---

### apps/app/components/auth/auth-form.tsx [edit]

**Purpose**: Authentication form component
**TOTAL CHANGES**: 3

**Changes**:

1. Remove `PasskeyLogin` import (line 8)
2. Remove `PasskeyLogin` component usage from PasswordForm (lines 374-379)
3. Remove `onPasskeySuccess` prop from PasswordForm interface (line 237) and component destructuring (line 255), and remove it from the PasswordForm call in AuthForm (line 189)
4. Remove `SignupTerms` component (lines 34-53) and its usage (line 384), since it links to dead /terms and /privacy pages

**Implementation Details**:

- The PasswordForm component's `onPasskeySuccess` prop is only used to pass to PasskeyLogin. Remove it entirely.
- Keep: GoogleLogin, OtpVerification, PasswordInput, useAuthForm, BackLink, Divider
- The "or continue with" divider stays since Google OAuth and OTP are still alternatives

**Reference Implementation** (PasswordForm function only, showing the changes):

```typescript
// Step 1: Password Form (primary auth method)
interface PasswordFormProps {
  isSignup: boolean;
  email: string;
  password: string;
  name: string;
  isDisabled: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onNameChange: (name: string) => void;
  onSubmit: (e?: FormEvent) => void;
  onForgotPassword: () => void;
  onOtpClick: () => void;
  onError: (error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
  returnTo?: string;
}

function PasswordForm({
  isSignup,
  email,
  password,
  name,
  isDisabled,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onSubmit,
  onForgotPassword,
  onOtpClick,
  onError,
  onLoadingChange,
  returnTo,
}: PasswordFormProps) {
  const heading = isSignup ? "Create your account" : "Welcome back";
  const [passwordTouched, setPasswordTouched] = useState(false);
  const showPasswordError =
    passwordTouched && password.length > 0 && password.length < 8;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">{heading}</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Name field (signup only) */}
        {isSignup && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-name">Name</Label>
            <Input
              id="auth-name"
              name="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={isDisabled}
              autoComplete="name"
            />
          </div>
        )}

        {/* Email field */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isDisabled}
            autoComplete="email"
            required
          />
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="auth-password">Password</Label>
            {!isSignup && (
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={isDisabled}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <PasswordInput
            id="auth-password"
            name="password"
            placeholder={isSignup ? "Min. 8 characters" : "Enter your password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            disabled={isDisabled}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={8}
          />
          {showPasswordError && (
            <p className="text-xs text-destructive">
              Password must be at least 8 characters
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="default"
          className="w-full"
          disabled={isDisabled || !email.trim() || password.length < 8}
        >
          {isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      {/* Divider */}
      <Divider text="or continue with" />

      {/* Alternative auth methods */}
      <div className="flex flex-col gap-3">
        <GoogleLogin
          onError={onError}
          isDisabled={isDisabled}
          onLoadingChange={onLoadingChange}
          returnTo={returnTo}
        />

        {/* OTP alternative (login only) */}
        {!isSignup && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onOtpClick}
            disabled={isDisabled}
          >
            <Mail className="mr-2 h-4 w-4" />
            Use email code instead
          </Button>
        )}
      </div>

      {/* Account switch link */}
      <p className="text-sm text-muted-foreground text-center">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
```

And the AuthForm component's PasswordForm call changes:

```typescript
// BEFORE (lines 177-194):
      <PasswordForm
        isSignup={isSignup}
        email={email}
        password={password}
        name={name}
        isDisabled={isDisabled}
        onEmailChange={handleEmailChange}
        onPasswordChange={handlePasswordChange}
        onNameChange={handleNameChange}
        onSubmit={isSignup ? signUpWithPassword : signInWithPassword}
        onForgotPassword={handleForgotPassword}
        onOtpClick={goToOtpFlow}
        onPasskeySuccess={onAuthSuccess}
        onError={setError}
        onLoadingChange={setChildBusy}
        returnTo={returnTo}
      />

// AFTER:
      <PasswordForm
        isSignup={isSignup}
        email={email}
        password={password}
        name={name}
        isDisabled={isDisabled}
        onEmailChange={handleEmailChange}
        onPasswordChange={handlePasswordChange}
        onNameChange={handleNameChange}
        onSubmit={isSignup ? signUpWithPassword : signInWithPassword}
        onForgotPassword={handleForgotPassword}
        onOtpClick={goToOtpFlow}
        onError={setError}
        onLoadingChange={setChildBusy}
        returnTo={returnTo}
      />
```

Also remove `{isSignup && <SignupTerms />}` (line 384).

**Dependencies**: none
**Provides**: Updated auth form (no passkey button, no terms links)

---

### apps/app/components/auth/auth-form.test.tsx [edit]

**Purpose**: Auth form tests
**TOTAL CHANGES**: 2

**Changes**:

1. Remove passkey mock from auth mock (line 33): `passkey: vi.fn().mockResolvedValue({ data: null, error: null }),`
2. Remove passkey-related mock config (lines 46-48): `passkey: { enableConditionalUI: false }` and `passkeyNotSupported: "Passkeys not supported"`
3. Remove "renders passkey login button" test (lines 188-195)

**Migration Pattern**:

```typescript
// BEFORE auth mock (lines 26-41):
vi.mock("@/lib/auth", () => ({
  auth: {
    signUp: {
      email: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    signIn: {
      email: vi.fn().mockResolvedValue({ data: null, error: null }),
      social: vi.fn().mockResolvedValue({ data: null, error: null }),
      passkey: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    emailOtp: {
      sendVerificationOtp: vi
        .fn()
        .mockResolvedValue({ data: null, error: null }),
    },
  },
}));

// AFTER:
vi.mock("@/lib/auth", () => ({
  auth: {
    signUp: {
      email: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    signIn: {
      email: vi.fn().mockResolvedValue({ data: null, error: null }),
      social: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    emailOtp: {
      sendVerificationOtp: vi
        .fn()
        .mockResolvedValue({ data: null, error: null }),
    },
  },
}));

// BEFORE auth-config mock (lines 44-54):
vi.mock("@/lib/auth-config", () => ({
  authConfig: {
    passkey: { enableConditionalUI: false },
    errors: {
      passkeyNotSupported: "Passkeys not supported",
      networkError: "Network error",
      genericError: "Something went wrong",
    },
  },
  getSafeRedirectUrl: (url: string) => url || "/",
}));

// AFTER:
vi.mock("@/lib/auth-config", () => ({
  authConfig: {
    errors: {
      networkError: "Network error",
      genericError: "Something went wrong",
    },
  },
  getSafeRedirectUrl: (url: string) => url || "/",
}));
```

Remove the passkey test (lines 188-195):

```typescript
// DELETE:
  it("renders passkey login button", () => {
    render(<AuthForm mode="login" onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /passkey/i }),
    ).toBeInTheDocument();
  });
```

**Dependencies**: none
**Provides**: Updated test file matching new auth form

---

### apps/app/components/auth/index.ts [edit]

**Purpose**: Auth component barrel exports
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `export { PasskeyLogin } from "./passkey-login";` (line 5)

**Reference Implementation**:

```typescript
export { AppErrorBoundary, AuthErrorBoundary } from "./auth-error-boundary";
export { AuthForm } from "./auth-form";
export { LoginDialog, useLoginDialog } from "./login-dialog";
export { OtpVerification } from "./otp-verification";
export { GoogleLogin } from "./google-login";
export { useAuthForm, type AuthStep } from "./use-auth-form";
```

**Dependencies**: none
**Provides**: Updated exports (no PasskeyLogin)

---

### apps/app/lib/auth.ts [edit]

**Purpose**: Better Auth client instance
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `passkeyClient` import (line 8), `stripeClient` import (line 9), `anonymousClient` and `organizationClient` imports (line 13). Remove these 4 plugins from the `plugins` array (lines 26-30). Keep only `emailOTPClient()`.

**Reference Implementation**:

```typescript
/**
 * @file Better Auth client instance.
 *
 * Do not use auth.useSession() directly - use TanStack Query wrappers
 * from lib/queries/session.ts to ensure proper caching and consistency.
 */

import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { authConfig } from "./auth-config";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173";

export const auth = createAuthClient({
  baseURL: baseURL + authConfig.api.basePath,
  plugins: [emailOTPClient()],
});

export type AuthClient = typeof auth;

type SessionResponse = typeof auth.$Infer.Session;
export type User = SessionResponse["user"];
export type Session = SessionResponse["session"];
```

**Dependencies**: none
**Provides**: Updated `auth` client (no passkey/stripe/anonymous/organization plugins), updated `User` and `Session` types

---

### apps/app/lib/auth-config.ts [edit]

**Purpose**: Auth configuration constants
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `passkey` config block (lines 8-11) and passkey error messages (lines 40-42)

**Reference Implementation**:

```typescript
// All durations in milliseconds. Providers must match server-side config.
// Changing api.basePath requires updating server routing.
export const authConfig = {
  oauth: {
    providers: ["google"] as const,
  },

  security: {
    csrfTokenHeader: "x-csrf-token",
    sessionCookieName: "better-auth.session",
  },

  api: {
    basePath: "/api/auth",
    requestTimeout: import.meta.env.DEV ? 60_000 : 30_000,
  },

  retry: {
    attempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },

  session: {
    checkInterval: 5 * 60 * 1000,
    refreshThreshold: 10 * 60 * 1000,
  },

  errors: {
    sessionExpired: "Your session has expired. Please sign in again.",
    unauthorized: "You need to sign in to access this page.",
    networkError: "Network error. Please check your connection and try again.",
    genericError: "Something went wrong. Please try again.",
  },
} as const;

export function isValidRedirectUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

export function getSafeRedirectUrl(url: unknown): string {
  if (typeof url !== "string" || !url) {
    return "/";
  }

  return isValidRedirectUrl(url) ? url : "/";
}

export function shouldRefreshSession(
  expiresAt: Date | string | undefined,
): boolean {
  if (!expiresAt) return false;

  const expiryTime =
    typeof expiresAt === "string"
      ? new Date(expiresAt).getTime()
      : expiresAt.getTime();

  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;

  return (
    timeUntilExpiry > 0 && timeUntilExpiry < authConfig.session.refreshThreshold
  );
}
```

**Dependencies**: none
**Provides**: Updated `authConfig` (no passkey config)

---

### apps/app/lib/queries/analytics.ts [edit]

**Purpose**: Analytics query hooks for frontend
**TOTAL CHANGES**: 1

**Changes**:

1. Remove `moodTrend` and `tagCorrelation` query keys (lines 8-10) and their hooks `useMoodTrendQuery` (lines 21-25) and `useTagCorrelationQuery` (lines 28-33)

**Reference Implementation**:

```typescript
import { trpcClient } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  weeklyMood: (weekStart: string) =>
    [...analyticsQueryKeys.all, "weeklyMood", weekStart] as const,
};

export function useWeeklyMoodQuery(weekStart: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.weeklyMood(weekStart),
    queryFn: () =>
      trpcClient.analytics.weeklyMoodDistribution.query({ weekStart }),
  });
}
```

**Dependencies**: `apps/api/routers/analytics.ts` (for updated router type without moodTrend/tagCorrelation)
**Provides**: Updated analytics query hooks (only weeklyMood)

---

### apps/web/worker.ts [edit]

**Purpose**: Edge worker routing
**TOTAL CHANGES**: 1

**Changes**:

1. Remove route for `/settings*` (line 29) and `/reports*` (line 31) since those app routes no longer exist

**Reference Implementation**:

```typescript
/**
 * Edge router for the marketing site.
 *
 * Routes "/" based on auth-hint cookie presence:
 * - Cookie present: proxy to app (session validated there)
 * - No cookie: serve marketing site
 *
 * See docs/adr/001-auth-hint-cookie.md
 */

import { Hono } from "hono";
import { getCookie } from "hono/cookie";

interface Env {
  ASSETS: Fetcher;
  APP_SERVICE: Fetcher;
  API_SERVICE: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

// API proxy
app.all("/api/*", (c) => c.env.API_SERVICE.fetch(c.req.raw));

// App routes
app.all("/_app/*", (c) => c.env.APP_SERVICE.fetch(c.req.raw));
app.all("/login*", (c) => c.env.APP_SERVICE.fetch(c.req.raw));
app.all("/signup*", (c) => c.env.APP_SERVICE.fetch(c.req.raw));
app.all("/analytics*", (c) => c.env.APP_SERVICE.fetch(c.req.raw));

// Home page: route based on auth-hint cookie presence
app.on(["GET", "HEAD"], "/", async (c) => {
  const hasAuthHint =
    getCookie(c, "__Host-auth") === "1" || getCookie(c, "auth") === "1";

  const upstream = await (hasAuthHint ? c.env.APP_SERVICE : c.env.ASSETS).fetch(
    c.req.raw,
  );

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Vary", "Cookie");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
});

// Marketing pages
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
```

**Dependencies**: none
**Provides**: Updated edge routing (no /settings* or /reports* routes)

---

### .env.example [edit]

**Purpose**: Environment variable template
**TOTAL CHANGES**: 1

**Changes**:

1. Update to Serene-specific values: APP_NAME=Serene, correct port 5434, remove Stripe vars, remove Algolia vars, remove Google Cloud project vars, add ANTHROPIC_API_KEY description

**Reference Implementation**:

```bash
# Serene environment configuration template.
# Copy to .env.local and fill in real credentials (git-ignored).
# https://vite.dev/guide/env-and-mode#env-files

# Anthropic (AI vibe check responses)
# https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Web application settings
APP_NAME=Serene
APP_ORIGIN=http://localhost:5173
API_ORIGIN=http://localhost:8787
ENVIRONMENT=development
PORT=8787

# Database (Docker Compose runs on port 5434)
# https://neon.tech/ (production)
DATABASE_URL=postgres://postgres:postgres@localhost:5434/serene

# Cloudflare Hyperdrive for local development
# https://developers.cloudflare.com/hyperdrive/
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_CACHED=postgres://postgres:postgres@localhost:5434/serene
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_DIRECT=postgres://postgres:postgres@localhost:5434/serene

# Better Auth (session signing secret)
# Generate with: bunx @better-auth/cli@latest secret
BETTER_AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google OAuth 2.0
# https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# Cloudflare (deployment)
# https://dash.cloudflare.com/
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_API_TOKEN=

# Resend (transactional email)
# https://resend.com/api-keys
RESEND_API_KEY=xxxxx
RESEND_EMAIL_FROM=onboarding@resend.dev
```

**Dependencies**: none
**Provides**: Updated .env.example for Serene

---

### README.md [edit]

**Purpose**: Project documentation
**TOTAL CHANGES**: 2

**Changes**:

1. Remove "passkey" from the Backend tech stack row (line 20): change `Better Auth (email OTP, passkey, Google OAuth)` to `Better Auth (email/password, Google OAuth)`
2. Remove `STRIPE_SECRET_KEY` row from the Environment Variables table (line 111)

**Migration Pattern**:

```markdown
// BEFORE (line 20):
| **Backend** | Hono, tRPC, Better Auth (email OTP, passkey, Google OAuth) |

// AFTER:
| **Backend** | Hono, tRPC, Better Auth (email/password, Google OAuth) |

// BEFORE (line 111):
| `STRIPE_SECRET_KEY` | No | Stripe key (billing features, optional) |

// AFTER:
(row removed)
```

Also update line 113: `Copy .env to .env.local and fill in real credentials. See .env.example for all available variables.` -- this is fine as-is since .env.example will be updated.

**Dependencies**: none
**Provides**: Updated README

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                                      | Action | Depends On                                                                                                                                              |
| ----- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | `ai_review/user_stories/e2e-full.yaml`                    | edit   | -- (FIRST: update E2E test harness before any code changes)                                                                                             |
| 1     | `apps/app/routes/(app)/dashboard.tsx`                     | delete | --                                                                                                                                                      |
| 1     | `apps/app/routes/(app)/users.tsx`                         | delete | --                                                                                                                                                      |
| 1     | `apps/app/routes/(app)/reports.tsx`                       | delete | --                                                                                                                                                      |
| 1     | `apps/app/routes/(app)/about.tsx`                         | delete | --                                                                                                                                                      |
| 1     | `apps/app/routes/(app)/settings.tsx`                      | delete | --                                                                                                                                                      |
| 1     | `apps/web/pages/pricing.astro`                            | delete | --                                                                                                                                                      |
| 1     | `apps/web/pages/features.astro`                           | delete | --                                                                                                                                                      |
| 1     | `apps/api/routers/organization.ts`                        | delete | --                                                                                                                                                      |
| 1     | `apps/api/routers/billing.ts`                             | delete | --                                                                                                                                                      |
| 1     | `apps/api/routers/billing.test.ts`                        | delete | --                                                                                                                                                      |
| 1     | `apps/api/lib/billing/plans.ts`                           | delete | --                                                                                                                                                      |
| 1     | `apps/api/lib/billing/stripe.ts`                          | delete | --                                                                                                                                                      |
| 1     | `db/schema/organization.ts`                               | delete | --                                                                                                                                                      |
| 1     | `db/schema/invitation.ts`                                 | delete | --                                                                                                                                                      |
| 1     | `db/schema/subscription.ts`                               | delete | --                                                                                                                                                      |
| 1     | `db/schema/passkey.ts`                                    | delete | --                                                                                                                                                      |
| 1     | `apps/app/lib/queries/billing.ts`                         | delete | --                                                                                                                                                      |
| 1     | `apps/app/lib/queries/billing.test.ts`                    | delete | --                                                                                                                                                      |
| 1     | `apps/app/components/analytics/mood-trend-chart.tsx`      | delete | --                                                                                                                                                      |
| 1     | `apps/app/components/analytics/mood-trend-chart.test.tsx` | delete | --                                                                                                                                                      |
| 1     | `apps/app/components/analytics/tag-correlation.tsx`       | delete | --                                                                                                                                                      |
| 1     | `apps/app/components/analytics/tag-correlation.test.tsx`  | delete | --                                                                                                                                                      |
| 1     | `apps/app/components/auth/passkey-login.tsx`              | delete | --                                                                                                                                                      |
| 1     | `db/schema/index.ts`                                      | edit   | --                                                                                                                                                      |
| 1     | `db/schema/user.ts`                                       | edit   | --                                                                                                                                                      |
| 1     | `apps/api/lib/env.ts`                                     | edit   | --                                                                                                                                                      |
| 1     | `apps/api/routers/user.ts`                                | edit   | --                                                                                                                                                      |
| 1     | `apps/app/components/layout/constants.ts`                 | edit   | --                                                                                                                                                      |
| 1     | `apps/app/components/layout/header.tsx`                   | edit   | --                                                                                                                                                      |
| 1     | `apps/app/components/auth/index.ts`                       | edit   | --                                                                                                                                                      |
| 1     | `apps/app/lib/auth-config.ts`                             | edit   | --                                                                                                                                                      |
| 1     | `apps/web/layouts/BaseLayout.astro`                       | edit   | --                                                                                                                                                      |
| 1     | `apps/web/worker.ts`                                      | edit   | --                                                                                                                                                      |
| 1     | `.env.example`                                            | edit   | --                                                                                                                                                      |
| 1     | `README.md`                                               | edit   | --                                                                                                                                                      |
| 2     | `apps/api/lib/app.ts`                                     | edit   | `apps/api/routers/organization.ts` (deleted), `apps/api/routers/billing.ts` (deleted)                                                                   |
| 2     | `apps/api/lib/auth.ts`                                    | edit   | `db/schema/index.ts`, `db/schema/user.ts`, `apps/api/lib/env.ts`, `apps/api/lib/billing/plans.ts` (deleted), `apps/api/lib/billing/stripe.ts` (deleted) |
| 2     | `apps/api/routers/analytics.ts`                           | edit   | --                                                                                                                                                      |
| 2     | `apps/api/routers/analytics.test.ts`                      | edit   | `db/schema/user.ts`, `apps/api/routers/analytics.ts`                                                                                                    |
| 2     | `apps/api/routers/user.test.ts`                           | edit   | `db/schema/user.ts`                                                                                                                                     |
| 2     | `apps/api/routers/ai.test.ts`                             | edit   | `db/schema/user.ts`                                                                                                                                     |
| 2     | `apps/api/routers/journal.test.ts`                        | edit   | `db/schema/user.ts`                                                                                                                                     |
| 2     | `apps/app/lib/auth.ts`                                    | edit   | --                                                                                                                                                      |
| 2     | `apps/app/components/auth/auth-form.tsx`                  | edit   | `apps/app/components/auth/passkey-login.tsx` (deleted)                                                                                                  |
| 2     | `apps/app/components/auth/auth-form.test.tsx`             | edit   | `apps/app/components/auth/passkey-login.tsx` (deleted)                                                                                                  |
| 2     | `apps/app/routes/(app)/analytics.tsx`                     | edit   | `apps/app/components/analytics/mood-trend-chart.tsx` (deleted), `apps/app/components/analytics/tag-correlation.tsx` (deleted)                           |
| 2     | `apps/app/lib/queries/analytics.ts`                       | edit   | `apps/api/routers/analytics.ts`                                                                                                                         |

---

## Exit Criteria

### Test Commands

```bash
bun test --run              # Run all Vitest tests
bun lint                    # ESLint with cache
bun typecheck               # tsc --build across all workspaces
```

### Success Conditions

- [ ] `ai_review/user_stories/e2e-full.yaml` updated with comprehensive post-cleanup UI test coverage
- [ ] All 23 files deleted
- [ ] All 24 files edited successfully
- [ ] `bun typecheck` passes (exit code 0)
- [ ] `bun test --run` passes (exit code 0)
- [ ] `bun lint` passes (exit code 0)
- [ ] Navigation sidebar shows only Journal and Insights (2 items)
- [ ] No broken links in marketing site header or footer
- [ ] Auth form renders email/password + Google OAuth (no passkey button)
- [ ] Analytics page shows only weekly MoodBarChart (no tabs)
- [ ] README.md has no passkey/Stripe references
- [ ] .env.example uses Serene-specific values (port 5434, APP_NAME=Serene)
- [ ] Route tree auto-regenerates after route deletions (verified by typecheck)
- [ ] `/ui-review` passes against `ai_review/user_stories/e2e-full.yaml` — all 20 user stories pass

### Verification Script

```bash
bun typecheck && bun test --run && bun lint
```

### Post-Implementation: UI Validation

After all code changes pass typecheck/test/lint and dev servers are running (`bun dev`), run the comprehensive UI validation:

```bash
/ui-review
```

This executes all 20 user stories in `ai_review/user_stories/e2e-full.yaml` against the running app, covering:

- Landing page, auth forms, sidebar nav, journal CRUD, mood selector, tags, AI vibe check, analytics chart, removed pages return 404, responsive design.

All stories must pass before considering the cleanup complete.

---

### Post-Implementation: Database Migration

After all code changes pass typecheck/test/lint, generate the database migration:

```bash
bun db:generate
```

This creates a migration that drops: organization, member, invitation, passkey, subscription tables and removes: user.isAnonymous, user.stripeCustomerId, session.activeOrganizationId columns plus the session_active_org_id_idx index. Review the generated SQL before applying.

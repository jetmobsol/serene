# 14. Implementation Phases and Milestones + 15. Definition of Done

> **Context:** Sprint planning, progress tracking, and completion criteria. Reference when planning work or validating feature completion.

---

## Phase 1: Foundation (Days 1-3)

**Goal:** Database schema, shared types, and core API infrastructure.

**Tasks:**

1. Create `db/schema/journal.ts` and `db/schema/ai-response.ts`.
2. Update `db/schema/index.ts` with new exports.
3. Create `packages/core/src/journal.ts` with mood types, tag types, mood scores, and color mappings.
4. Write unit tests for shared types and utilities.
5. Run `bun db:push` to sync schema.
6. Update `.env.example` with `ANTHROPIC_API_KEY`.
7. Update `docker-compose.yml` with new environment variable.
8. Remove existing OpenAI integration: delete `apps/api/lib/ai.ts`, uninstall `@ai-sdk/openai`.

**Definition of Done for Phase 1:**

- [ ] Database tables `journal_entry` and `ai_response` exist and accept inserts.
- [ ] Shared types compile and pass unit tests.
- [ ] `bun db:push` succeeds.
- [ ] `docker-compose up` runs without errors.

---

## Phase 2: Journal CRUD API (Days 4-7)

**Goal:** Complete tRPC journal router with full test coverage.

**Tasks:**

1. Write failing tests for `journal.create`, `journal.list`, `journal.getById`, `journal.update`, `journal.delete`.
2. Implement `apps/api/routers/journal.ts`.
3. Register journal router in `apps/api/lib/app.ts`.
4. Write integration tests verifying ownership enforcement.
5. Write tests for pagination (cursor-based).
6. Write tests for input validation (invalid moods, oversized notes).
7. Implement `user.exportData` procedure — exports all journal entries + AI responses as JSON (GDPR Article 20).
8. Implement `user.deleteAccount` procedure — deletes user account with cascade to all journal data (GDPR Article 17).
9. Add explicit consent checkbox to signup flow (data storage + Anthropic API processing consent).

**Definition of Done for Phase 2:**

- [ ] All 5 journal CRUD procedures pass tests.
- [ ] Ownership enforcement tested (user A cannot read user B's entries).
- [ ] Cursor pagination tested with 50+ fixture entries.
- [ ] Input validation rejects invalid moods, tags, and notes > 5000 chars.
- [ ] Data export returns complete JSON of user's entries + AI responses.
- [ ] Account deletion cascades to all journal data (verified in tests).

---

## Phase 3: AI Vibe Check API (Days 8-11)

**Goal:** Anthropic integration with streaming and safety guardrails.

**Tasks:**

1. Create `apps/api/lib/anthropic.ts` (request-scoped client).
2. Create `apps/api/lib/safety.ts` (crisis detection, gibberish detection).
3. Write tests for safety module.
4. Create `apps/api/lib/prompts.ts` (system prompt builder).
5. Write tests for prompt construction.
6. Implement `apps/api/routers/ai.ts` (non-streaming mutation).
7. Implement SSE streaming endpoint in `apps/api/lib/app.ts`.
8. Write integration tests for AI router (mocking Anthropic API).
9. Implement rate limiting via Cloudflare KV (`AI_RATE_LIMIT` namespace binding).
10. Add `AI_RATE_LIMIT` KV namespace to `apps/api/wrangler.jsonc`.
11. Implement SSE timeout handling (10s abort) and client disconnect detection.

**Definition of Done for Phase 3:**

- [ ] AI vibe check generates appropriate responses for test fixtures.
- [ ] Crisis content detection catches all defined keywords.
- [ ] Gibberish detection returns generic response for nonsensical input.
- [ ] Streaming endpoint sends SSE events correctly.
- [ ] Rate limiting via Cloudflare KV returns 429 after 20 requests/hour.
- [ ] SSE streaming aborts after 10s timeout with user-friendly error event.
- [ ] Anthropic API errors are handled gracefully (retry, fallback message).

---

## Phase 4: Journal Frontend (Days 12-17)

**Goal:** Complete journal UI with entry form, timeline, and AI response display.

**Tasks:**

1. Add new shadcn/ui components: `badge`, `toast`, `dropdown-menu`, `alert-dialog`.
2. Write component tests for `MoodSelector`, `TagChips`, `NoteEditor`.
3. Implement `MoodSelector`, `TagChips`, `NoteEditor` components.
4. Write component tests for `EntryForm`.
5. Implement `EntryForm` component.
6. Write component tests for `EntryCard`, `Timeline`.
7. Implement `EntryCard`, `Timeline` components.
8. Write component tests for `AiResponse`, `SafetyBanner`.
9. Implement `AiResponse` (with SSE streaming consumer), `SafetyBanner`.
10. Create journal route pages (`/journal`, `/journal/$entryId`).
11. Update sidebar navigation.
12. Create TanStack Query hooks in `apps/app/lib/queries/journal.ts`.

**Definition of Done for Phase 4:**

- [ ] User can create a journal entry with mood, tags, and note.
- [ ] Timeline displays entries grouped by date with color-coded cards.
- [ ] AI response streams into the entry card after save.
- [ ] Edit and delete operations work with optimistic updates.
- [ ] All component tests pass.
- [ ] Keyboard navigation works throughout the journal flow.

---

## Phase 5: Analytics Frontend (Days 18-21)

**Goal:** Mood analytics charts and insights page.

**Tasks:**

1. Implement `apps/api/routers/analytics.ts` (write tests first).
2. Install `recharts` in `apps/app`.
3. Write component tests for chart components.
4. Implement `MoodBarChart`, `MoodTrendChart`, `TagCorrelation` components.
5. Create analytics route page with tab navigation.
6. Create TanStack Query hooks in `apps/app/lib/queries/analytics.ts`.

**Definition of Done for Phase 5:**

- [ ] Weekly mood distribution bar chart renders with correct data.
- [ ] 30-day mood trend line chart renders with daily averages.
- [ ] Tag correlation table shows correct average mood scores.
- [ ] Week navigation works (previous/next week).
- [ ] Empty states display appropriate messages.
- [ ] All chart component tests pass.

---

## Phase 6: Landing Page, Documentation, and Polish (Days 22-27)

**Goal:** Calm landing page, Serene README, Cloudflare deployment docs, branding updates, and final polish.

**Tasks:**

1. Replace `apps/web/pages/index.astro` content with Serene landing page.
2. Update `apps/web/pages/features.astro` with Serene features.
3. Update `apps/web/pages/pricing.astro` (or remove if not applicable).
4. Update CSS variables in `apps/web/styles/globals.css` and `apps/app/styles/globals.css` for calm theme.
5. Update branding (APP_NAME, sidebar title, meta tags).
6. Update seed data with realistic journal entries.
7. Write seed script additions for journal data.
8. **Rewrite `README.md`** — completely replace the React Starter Kit template README with Serene-specific content (see `14-readme.md`).
9. **Create `docs/deployment/serene-deployment-guide.md`** — end-to-end Cloudflare deployment guide (see `15-deployment.md`).
10. **Create `docs/deployment/serene-infrastructure-reference.md`** — technical reference with architecture diagram (see `15-deployment.md`).
11. **Update `docs/deployment/cloudflare.md`** and `docs/deployment/index.md` with links to new Serene-specific guides.
12. **Update `terraform.tfvars.example`** files — set `project_slug` default to `serene` in all environments.
13. **Update Wrangler configs** — rename workers to `serene-web`, `serene-app`, `serene-api`.
14. Final accessibility audit.
15. Final cross-browser testing.

**Definition of Done for Phase 6:**

- [ ] Landing page achieves Lighthouse performance score >= 90.
- [ ] Landing page achieves Lighthouse accessibility score >= 95.
- [ ] Calm aesthetic is consistent across landing page and app.
- [ ] `docker-compose up` from a clean clone runs the full application.
- [ ] README.md is fully rewritten for Serene — zero references to React Starter Kit or template content.
- [ ] README.md Quick Start section enables a new developer to run the project within 5 minutes.
- [ ] `docs/deployment/serene-deployment-guide.md` exists with all 11 required sections.
- [ ] `docs/deployment/serene-infrastructure-reference.md` exists with architecture diagram and reference tables.
- [ ] All `terraform.tfvars.example` files default `project_slug` to `serene`.
- [ ] All Wrangler configs use `serene-{web,app,api}` naming convention.
- [ ] Seed data includes realistic journal entries.

---

## Phase 7: Integration Testing and QA (Days 28-30)

**Goal:** End-to-end validation and bug fixes.

**Tasks:**

1. Full user flow walkthrough: sign up, create entries, view timeline, view analytics.
2. Cross-browser testing (Chrome, Firefox, Safari).
3. Mobile responsive testing (375px, 768px, 1024px, 1440px).
4. Performance profiling and optimization.
5. Security review (OWASP Top 10 checklist for relevant items).
6. Fix all identified issues.

**Definition of Done for Phase 7:**

- [ ] Complete user flow works without errors.
- [ ] No console errors in production build.
- [ ] All tests pass (`bun test --run`).
- [ ] `bun typecheck` passes with no errors.
- [ ] `bun lint` passes with no warnings.

---

# 15. Global Definition of Done

A feature is considered DONE when ALL of the following criteria are met:

### Code Quality

- [ ] `/simplify` has been run on all changed code (after implementation, before tests/QA).
- [ ] Code follows project style guide (Prettier, ESLint — zero warnings).
- [ ] TypeScript strict mode passes with no errors (`bun typecheck`).
- [ ] No `any` types (use precise types or generics).
- [ ] File naming follows kebab-case convention.
- [ ] Imports use workspace aliases (`@repo/ui`, `@repo/core`, `~/lib/...`).

### Testing

- [ ] Unit tests written BEFORE implementation (TDD).
- [ ] All tests pass (`bun test --run`).
- [ ] Unit test coverage >= 90% for utility modules.
- [ ] Integration test coverage >= 80% for tRPC routers.
- [ ] Component test coverage >= 80% for React components.
- [ ] Edge cases tested (empty states, error states, boundary values).

### Functionality

- [ ] Feature works as described in acceptance criteria.
- [ ] Data isolation enforced (users can only access their own data).
- [ ] Error states are handled gracefully (toast notifications, error boundaries).
- [ ] Loading states are present during async operations.
- [ ] Optimistic updates are used where appropriate (create, delete).

### Accessibility

- [ ] Keyboard navigation works for all interactive elements.
- [ ] Screen reader announces relevant state changes.
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for normal text).
- [ ] Focus indicators are visible.
- [ ] `prefers-reduced-motion` is respected.

### Performance

- [ ] No unnecessary re-renders (React DevTools Profiler).
- [ ] Images and assets are optimized.
- [ ] Bundle size impact is reasonable (< 50KB gzipped for new feature code).
- [ ] Database queries use appropriate indexes.

### Documentation

- [ ] Complex logic has explanatory comments (why, not what).
- [ ] New environment variables are documented in `.env.example`.
- [ ] API changes are reflected in tRPC type exports.
- [ ] ADR created for significant architectural decisions.

### DevOps

- [ ] `docker-compose up` starts clean and runs all services.
- [ ] Seed script includes relevant test data.
- [ ] No hardcoded secrets or environment-specific values in code.

### Documentation (Phase 6 specific)

- [ ] README.md is fully rewritten for Serene (no template references remain).
- [ ] Cloudflare deployment guide exists in `docs/deployment/`.
- [ ] Infrastructure setup guide exists in `docs/deployment/`.
- [ ] All environment variables documented in `.env.example` with comments.

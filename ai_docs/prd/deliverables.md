# Serene — Deliverables Execution Plan

> **Purpose:** Break the full PRD into 12 micro-deliverables with automated Bowser QA gates and manual pitstops. Each deliverable is scoped for 1-3 days. Use `/essentials:plan-creator` for deliverables #1-3, #5-12.
>
> **Prerequisites:** Bowser tooling from commit `7bdb3fd8` must be available. Dev servers running via `just start` on ports 5173 (app), 8787 (api), 4321 (web).

---

## Pipeline Per Deliverable

```
┌─────────────┐   ┌────────────┐   ┌───────────┐   ┌────────────┐   ┌────────────┐   ┌───────────┐   ┌─────────┐
│ /plan-creator│──>│ Implement  │──>│ /simplify │──>│  Prettier  │──>│  Write     │──>│ /ui-review │──>│ Manual  │
│ (this scope) │   │ (TDD first)│   │ (cleanup) │   │  (format)  │   │  YAML      │   │ (bowser)   │   │ Review  │
└─────────────┘   └────────────┘   └───────────┘   └────────────┘   │  stories   │   └────────────┘   └─────────┘
                                                                     └────────────┘         │
                                                                                            ▼ FAIL?
                                                                                      Fix & re-run
```

### Steps for EVERY deliverable:

1. **Plan** — Run `/essentials:plan-creator` with the deliverable scope below
2. **Implement** — TDD: write failing tests first, then implementation. `bun test --run` must pass.
3. **Simplify** — Run `/simplify` to review changed code for reuse, quality, and efficiency. Fix any issues found. `bun test --run` must still pass after simplification.
4. **Format** — Run `bun prettier --write .` to fix formatting, then `bun prettier --check .` to verify all files pass CI style checks.
5. **Write Bowser YAML** — Create `ai_review/user_stories/<filename>.yaml` with stories covering ALL acceptance criteria
6. **Bowser QA Gate** — Run `/ui-review <filename>` — ALL stories MUST PASS
7. **Fix & Re-run** — If any bowser story FAILS, fix and re-run until green
8. **Manual Pitstop** — You (human) visually review the running app at `http://localhost:5173`
9. **Commit** — Only after all gates pass. Move to next deliverable.

> **`/simplify` placement:** Runs AFTER implementation but BEFORE tests/QA. For backend-only deliverables (no Bowser), `/simplify` runs after implementation and before `bun test --run` verification. For UI deliverables, `/simplify` runs after implementation and before writing Bowser YAML stories. This ensures code quality is addressed before any test execution validates the final state.

---

## CRITICAL: Bowser QA Gate Rules (NON-NEGOTIABLE)

> **Every deliverable that produces visible UI MUST have a Bowser QA gate.**
>
> 1. Translate ALL acceptance criteria from the user stories into bowser workflow steps
> 2. Save YAML to `ai_review/user_stories/<deliverable>.yaml`
> 3. Run `/ui-review <deliverable>` — automated pass/fail with screenshots
> 4. Screenshots saved to `screenshots/bowser-qa/` for audit trail
> 5. **DO NOT proceed to the next deliverable with ANY failing bowser test**
> 6. After bowser passes → manual human review → commit → next deliverable

---

## Deliverable #1: Foundation (DB Schema + Shared Types)

**Phase:** 1 | **Bowser QA:** None (backend only) | **Plan-Creator:** Yes

**Scope:**

- Create `db/schema/journal.ts` — `journalEntry` table with relations
- Create `db/schema/ai-response.ts` — `aiResponse` table with relations
- Update `db/schema/index.ts` with new exports
- Register ID prefixes: `jrn` (journal entry), `air` (AI response)
- Create `packages/core/src/journal.ts` — mood types, tag types, mood scores, color mappings as TypeScript constants
- Unit tests for shared types and utilities
- Update `.env.example` with `ANTHROPIC_API_KEY`
- Remove existing OpenAI integration: delete `apps/api/lib/ai.ts`, uninstall `@ai-sdk/openai`
- `bun db:push` to sync schema

**PRD References:** `05-database.md` (full schema), `03-feature-specs.md` §4B.1 (mood/tag constants), `16-appendices.md` (mood constants reference)

**Definition of Done:**

- [ ] `journalEntry` and `aiResponse` tables exist and accept inserts
- [ ] Shared types compile and pass unit tests
- [ ] `bun db:push` succeeds without errors
- [ ] `bun typecheck` passes

**Verification (no bowser):**

- `bun test --run` — all new tests pass
- `bun db:studio` — verify tables visible in Drizzle Studio

---

## Deliverable #2: Journal CRUD API

**Phase:** 2 | **Bowser QA:** None (backend only) | **Plan-Creator:** Yes

**Scope:**

- Implement `apps/api/routers/journal.ts` — 5 tRPC procedures: `create`, `list`, `getById`, `update`, `delete`
- Register journal router in `apps/api/lib/app.ts`
- TDD: Write failing tests first for all 5 procedures
- Integration tests: ownership enforcement (user A ≠ user B), cursor pagination, input validation
- Zod schemas for input validation (mood enum, tag enum, note max 5000 chars)
- Implement `user.exportData` procedure — exports all journal entries + AI responses as JSON (GDPR Article 20)
- Implement `user.deleteAccount` procedure — deletes user account with cascade to all journal data (GDPR Article 17)
- Add explicit consent checkbox to signup flow (data storage + Anthropic API processing consent)

**PRD References:** `06-api-design.md` §7.1 (full API contracts), `09-testing.md` §10.3 (integration test approach), `12-nonfunctional.md` §13.5 (GDPR requirements)

**User Stories Covered:** US-MJ-004 (save), US-MJ-005 (list), US-MJ-006 (getById), US-MJ-007 (update), US-MJ-008 (delete) — backend portion only

**Definition of Done:**

- [ ] All 5 journal CRUD procedures pass tests
- [ ] Ownership enforcement tested (user A cannot access user B's entries)
- [ ] Cursor pagination tested with 50+ fixture entries
- [ ] Input validation rejects invalid moods, tags, notes > 5000 chars
- [ ] Data export returns complete JSON of user's entries + AI responses
- [ ] Account deletion cascades to all journal data (verified in tests)
- [ ] `bun test --run` passes

**Verification (no bowser):**

- `bun api:test` — all journal router tests green

---

## Deliverable #3: AI Vibe Check API

**Phase:** 3 | **Bowser QA:** None (backend only) | **Plan-Creator:** Yes

**Scope:**

- Create `apps/api/lib/anthropic.ts` — request-scoped Anthropic client
- Create `apps/api/lib/safety.ts` — dual-layer crisis detection (keyword pre-screen + AI context detection via `[CRISIS_DETECTED]` marker) + gibberish detection
- Create `apps/api/lib/prompts.ts` — system prompt builder
- Implement `apps/api/routers/ai.ts` — `generateVibeCheck` mutation
- Implement SSE streaming endpoint `GET /api/ai/stream/:entryId` in `apps/api/lib/app.ts`
- Rate limiting via Cloudflare KV (20 requests/hour) — add `AI_RATE_LIMIT` KV namespace to `wrangler.jsonc`
- SSE timeout handling (10s abort via `AbortController`) and client disconnect detection
- TDD: Unit tests for safety module, prompt builder. Integration tests for AI router (mock Anthropic API).

**PRD References:** `07-ai-integration.md` (full spec), `06-api-design.md` §7.2 (API contracts), `03-feature-specs.md` §4C (safety guardrails)

**User Stories Covered:** US-AI-001, US-AI-002 — backend portion only

**Definition of Done:**

- [ ] AI vibe check generates appropriate responses for test fixtures
- [ ] Crisis keyword detection (Layer 1) catches all defined keywords
- [ ] AI crisis detection (Layer 2) correctly parses `[CRISIS_DETECTED]` marker from AI response
- [ ] Gibberish detection returns generic response for nonsensical input
- [ ] SSE endpoint sends events in correct format (`token`, `done`, `error`)
- [ ] Rate limiting via Cloudflare KV returns 429 after threshold
- [ ] SSE streaming aborts after 10s timeout with error event
- [ ] Anthropic API errors handled gracefully
- [ ] `bun test --run` passes

**Verification (no bowser):**

- `bun api:test` — all AI router + safety + prompts tests green

---

## Deliverable #4: Branding Update

**Phase:** 6 (subset) | **Bowser QA:** Yes | **Plan-Creator:** No (too small — do directly)

**Scope:**

- Update `APP_NAME` from "Acme Co." to "Serene" in environment variables
- Update sidebar branding from "Console" to "Serene" in `apps/app/components/layout/sidebar.tsx`
- Update sidebar navigation items to journal-specific routes (Dashboard, Journal, Insights, Settings)
- Update meta tags / page titles

**Bowser YAML:** `ai_review/user_stories/branding.yaml`

```yaml
stories:
  - name: "App shows Serene branding"
    url: "http://localhost:5173/login"
    workflow: |
      Navigate to http://localhost:5173/login
      Verify the page title or heading contains "Serene"
      Verify there is no reference to "Acme" or "Console" visible on the page

  - name: "Sidebar shows Serene navigation after login"
    url: "http://localhost:5173/"
    workflow: |
      Navigate to http://localhost:5173/
      Verify the sidebar or navigation area contains "Serene" branding
      Verify navigation items include "Journal" or "Insights"
      Verify there are no references to "Reports" or "Users" from the old template
```

**Definition of Done:**

- [ ] "Serene" appears in page titles and sidebar
- [ ] No "Acme", "Console", or template references visible
- [ ] Bowser QA: `/ui-review branding` — ALL PASS
- [ ] Manual review: visual confirmation

---

## Deliverable #5: Entry Form Components (Mood + Tags + Note)

**Phase:** 4 (subset) | **Bowser QA:** Yes | **Plan-Creator:** Yes

**Scope:**

- Add shadcn/ui components: `badge`, `toast`/`sonner`, `progress`
- Implement `MoodSelector` component (`apps/app/components/journal/mood-selector.tsx`)
- Implement `TagChips` component (`apps/app/components/journal/tag-chips.tsx`)
- Implement `NoteEditor` component (`apps/app/components/journal/note-editor.tsx`)
- Component tests for all three (TDD)
- Create stub journal route page `apps/app/routes/(app)/journal/index.tsx` that renders all three components (form not yet wired to API)
- Create `packages/core/src/journal.ts` constants if not done in #1

**PRD References:** `08-frontend-components.md` §9.3 (MoodSelector, TagChips, NoteEditor specs), `03-feature-specs.md` §4B.1 (mood/tag metadata)

**User Stories Covered:** US-MJ-001, US-MJ-002, US-MJ-003

**CRITICAL NOTE:** After implementation, `/frontend-design` MUST be invoked for mood card visual design per PRD requirement.

**Bowser YAML:** `ai_review/user_stories/entry-form-parts.yaml`

```yaml
stories:
  - name: "Mood selector displays 6 moods"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the journal page loads successfully
      Verify exactly 6 mood options are visible: Happy, Calm, Anxious, Sad, Overwhelmed, Angry
      Verify each mood option has an icon and label
      Click the "Happy" mood option
      Verify the Happy option shows a selected/active visual state
      Click the "Sad" mood option
      Verify Sad is now selected and Happy is deselected

  - name: "Tag chips allow multi-select"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify tag chips are visible with labels: Work, Sleep, Relationships, Fitness, Hobbies, Health, Social, Nature
      Click the "Work" tag chip
      Verify "Work" shows a selected/active visual state
      Click the "Fitness" tag chip
      Verify both "Work" and "Fitness" are selected (multi-select)
      Click "Work" again
      Verify "Work" is deselected and "Fitness" remains selected

  - name: "Note editor shows character count"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify a text area is visible with placeholder text mentioning 50 characters
      Verify a character count indicator is visible
      Type "Short note" into the text area
      Verify the character count updates (should show approximately 10 characters)
      Type a longer note with at least 50 characters: "This is a longer reflective note about my day and how I am feeling right now today"
      Verify a visual indicator confirms AI insight will be generated (green checkmark or text change)
```

**Definition of Done:**

- [ ] MoodSelector renders 6 moods, single-select works, keyboard navigation works
- [ ] TagChips renders 8 tags, multi-select toggle works
- [ ] NoteEditor shows character count, 50-char threshold indicator works
- [ ] All component tests pass (`bun app:test`)
- [ ] Bowser QA: `/ui-review entry-form-parts` — ALL PASS
- [ ] Manual review: visual quality of mood cards, tag chips, note editor

---

## Deliverable #6: Entry Save + Timeline

**Phase:** 4 (subset) | **Bowser QA:** Yes | **Plan-Creator:** Yes

**Scope:**

- Implement `EntryForm` composite component (composes MoodSelector + TagChips + NoteEditor + Save button)
- Create TanStack Query hooks: `apps/app/lib/queries/journal.ts` (create mutation, list infinite query, getById query)
- Wire EntryForm to `journal.create` mutation
- Implement `EntryCard` component
- Implement `Timeline` component with date grouping (Today/Yesterday/This Week/Earlier)
- Create date grouping utility `apps/app/lib/utils/date-groups.ts` + tests
- Implement infinite scroll / "Load More" pagination
- Update journal route page to show form + timeline
- Create entry detail route `apps/app/routes/(app)/journal/$entryId.tsx`
- Add shadcn/ui: `dropdown-menu`, `alert-dialog`

**PRD References:** `08-frontend-components.md` §9.3 (EntryForm, EntryCard, Timeline specs), `03-feature-specs.md` §4B.2 (timeline grouping)

**User Stories Covered:** US-MJ-004 (save), US-MJ-005 (timeline), US-MJ-006 (detail view)

**Bowser YAML:** `ai_review/user_stories/entry-save-timeline.yaml`

```yaml
stories:
  - name: "Create and save a journal entry"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the journal page loads
      Click the "Happy" mood
      Verify Happy is selected
      Click the "Work" tag
      Click the "Fitness" tag
      Type in the note field: "Had a wonderful day at the office and hit the gym after. Feeling accomplished and energized about the progress we made on the project."
      Click the "Save Entry" button
      Verify a success notification appears (toast)
      Verify the saved entry appears in the timeline below the form

  - name: "Timeline displays entries grouped by date"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the timeline section is visible
      Verify entries are grouped under date headings (e.g., "Today", "Yesterday", "This Week", or "Earlier")
      Verify each entry card shows: mood icon/label, tags, note preview, and timestamp

  - name: "Entry detail view shows full content"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the timeline has at least one entry
      Click on the first entry card in the timeline
      Verify the detail view opens showing the full note text (not truncated)
      Verify Edit and Delete action buttons are visible

  - name: "Empty state shows encouraging message"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      If no entries exist in the timeline, verify an empty state message is displayed
      Verify the message encourages the user to start journaling
```

**Definition of Done:**

- [ ] User can create entry (mood + tags + note), success toast appears
- [ ] Entry appears at top of timeline immediately after save (optimistic update)
- [ ] Timeline groups entries by date (Today/Yesterday/This Week/Earlier)
- [ ] Entry cards show mood icon, tags, note preview, timestamp
- [ ] Clicking entry opens detail view with full note and action buttons
- [ ] Empty state message displayed when no entries
- [ ] Infinite scroll / Load More pagination works
- [ ] All component + unit tests pass
- [ ] Bowser QA: `/ui-review entry-save-timeline` — ALL PASS
- [ ] Manual review: create an entry end-to-end, verify timeline

---

## Deliverable #7: Edit + Delete Entry

**Phase:** 4 (subset) | **Bowser QA:** Yes | **Plan-Creator:** Yes

**Scope:**

- Wire edit action: opens EntryForm pre-filled with existing data
- Wire `journal.update` mutation with optimistic update
- Wire delete action: confirmation dialog + `journal.delete` mutation with optimistic update
- Error handling: revert optimistic update on failure, show error toast

**PRD References:** `02-user-stories.md` US-MJ-007/008, `06-api-design.md` §7.1 (update/delete contracts)

**User Stories Covered:** US-MJ-007 (edit), US-MJ-008 (delete)

**Bowser YAML:** `ai_review/user_stories/entry-crud.yaml`

```yaml
stories:
  - name: "Edit an existing journal entry"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the timeline has at least one entry
      Click the edit action on the first entry (pencil icon or Edit button)
      Verify the entry form opens pre-filled with the existing mood, tags, and note
      Change the mood selection to a different mood
      Click Save
      Verify a success notification appears
      Verify the entry in the timeline reflects the updated mood

  - name: "Delete a journal entry with confirmation"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the timeline has at least one entry
      Note the number of entries visible
      Click the delete action on the first entry (trash icon or Delete button)
      Verify a confirmation dialog appears asking "Are you sure?"
      Click the confirm/delete button in the dialog
      Verify the entry is removed from the timeline
      Verify a success notification appears or the entry count decreased by one
```

**Definition of Done:**

- [ ] Edit opens form pre-filled with existing data
- [ ] Saving edits updates the timeline immediately (optimistic)
- [ ] `updatedAt` changes, `createdAt` stays the same
- [ ] Delete shows confirmation dialog
- [ ] Confirmed delete removes entry from timeline immediately (optimistic)
- [ ] Network errors revert optimistic updates and show error toast
- [ ] All tests pass
- [ ] Bowser QA: `/ui-review entry-crud` — ALL PASS
- [ ] Manual review: edit an entry, delete an entry

---

## Deliverable #8: AI Response Display (Streaming + History)

**Phase:** 4 (subset) | **Bowser QA:** Yes | **Plan-Creator:** Yes

**Scope:**

- Implement `AiResponse` component with SSE streaming consumer
- Implement `SafetyBanner` component (crisis resource display)
- Wire entry save → AI vibe check trigger (for notes >= 50 chars)
- SSE client: connect to `GET /api/ai/stream/:entryId`, render tokens as they arrive
- Show pulsing dots while waiting for first token
- Display completed AI response in entry cards (timeline + detail view)
- AI response visually distinguished (different background, AI icon, italic)

**PRD References:** `08-frontend-components.md` §9.3 (AiResponse, SafetyBanner specs), `07-ai-integration.md` (streaming), `06-api-design.md` §7.2 (SSE format)

**User Stories Covered:** US-AI-001 (receive vibe check), US-AI-002 (safety guardrails UI), US-AI-003 (view history)

**CRITICAL NOTE:** Requires `ANTHROPIC_API_KEY` in `.env.local` for real AI responses. Bowser tests should verify the UI behavior (loading state, response display area) even if API key is not available — test with existing entries that already have AI responses.

**Bowser YAML:** `ai_review/user_stories/ai-response.yaml`

```yaml
stories:
  - name: "AI response appears after saving entry with 50+ char note"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Select the "Calm" mood
      Click the "Nature" tag
      Type a note with at least 50 characters: "Spent the morning in the park reading a book. The fresh air and birdsong really helped me feel centered and peaceful today."
      Click "Save Entry"
      Verify the entry is saved successfully
      Verify a loading indicator appears (pulsing dots or shimmer) for the AI response
      Wait up to 15 seconds for the AI response to appear
      Verify an AI response text appears below the entry, visually distinct from the user's note

  - name: "Entries without long notes show no AI section"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Select the "Happy" mood
      Type a short note under 50 characters: "Good day"
      Click "Save Entry"
      Verify the entry is saved
      Verify no AI response section or loading indicator appears for this entry

  - name: "AI response history visible on timeline entries"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the timeline has entries
      Look for entries that have AI response sections
      Verify AI responses are visually distinguished from user notes (different background, icon, or styling)

  - name: "Safety banner appears for crisis content"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Select any mood
      Type a note containing crisis language (at least 50 chars): "I have been feeling really hopeless lately and sometimes I think about wanting to end my life and I dont know what to do anymore"
      Click "Save Entry"
      Verify a safety/crisis banner appears with crisis helpline information
      Verify the banner mentions 988 or a crisis lifeline number
      Verify the banner is not dismissible
      Verify an AI response still appears after the safety banner
```

**Definition of Done:**

- [ ] Saving entry with note >= 50 chars triggers AI vibe check
- [ ] Loading indicator (pulsing dots) shown while waiting for AI
- [ ] AI response streams in and displays below the entry
- [ ] Completed AI response persisted and visible on page reload
- [ ] Entries with short notes show no AI section
- [ ] Safety banner appears when crisis keywords detected
- [ ] Safety banner shows 988 Lifeline and Crisis Text Line info
- [ ] AI responses visually distinct from user content
- [ ] All component tests pass
- [ ] Bowser QA: `/ui-review ai-response` — ALL PASS
- [ ] Manual review: create entry, watch streaming, verify safety banner

---

## Deliverable #9: Analytics Dashboard

**Phase:** 5 | **Bowser QA:** Yes | **Plan-Creator:** Yes

**Scope:**

- Implement `apps/api/routers/analytics.ts` — 3 queries: `weeklyMoodDistribution`, `moodTrend`, `tagCorrelation`
- Register analytics router in `apps/api/lib/app.ts`
- Install `recharts` in `apps/app`
- Implement `MoodBarChart` component (weekly mood distribution)
- Implement `MoodTrendChart` component (30-day trend line)
- Implement `TagCorrelation` component (tag-mood correlation table)
- Create analytics route page with tab navigation
- Create TanStack Query hooks: `apps/app/lib/queries/analytics.ts`
- Add shadcn/ui: `tabs`, `tooltip`
- Week navigation (prev/next arrows)
- Empty states for each chart

**PRD References:** `06-api-design.md` §7.3 (analytics API), `08-frontend-components.md` §9.3 (chart specs), `03-feature-specs.md` §4B.3 (chart library + design)

**User Stories Covered:** US-AN-001, US-AN-002, US-AN-003

**Bowser YAML:** `ai_review/user_stories/analytics.yaml`

```yaml
stories:
  - name: "Analytics page loads with weekly mood chart"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      Verify the analytics/insights page loads successfully
      Verify a weekly mood distribution chart is visible (bar chart)
      Verify mood labels are displayed (Happy, Calm, Anxious, etc.)
      Verify week navigation arrows are present (previous/next week)

  - name: "30-day mood trend chart renders"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      Find and click the tab or section for mood trends
      Verify a line or area chart is visible showing mood trend over time
      Verify the chart has date labels on the X axis

  - name: "Tag correlation insights display"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      Find and click the tab or section for tag correlation/insights
      Verify a table or list of tags with their average mood scores is visible
      Verify tags are sorted or have visual indicators (green/amber/red)

  - name: "Analytics empty state when no data"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      If no journal entries exist, verify appropriate empty state messages are displayed
      Verify the messages encourage the user to start journaling
```

**Definition of Done:**

- [ ] Weekly mood bar chart renders with correct data, color-coded by mood
- [ ] Week navigation works (prev/next week)
- [ ] 30-day mood trend line chart renders with daily averages
- [ ] Tag correlation table shows tags sorted by average mood score
- [ ] Empty states display appropriate messages
- [ ] All API tests + component tests pass
- [ ] Bowser QA: `/ui-review analytics` — ALL PASS
- [ ] Manual review: create several entries across days, verify charts reflect data

---

## Deliverable #10: Landing Page

**Phase:** 6 (subset) | **Bowser QA:** Yes | **Plan-Creator:** Yes

**Scope:**

- Replace `apps/web/pages/index.astro` with Serene landing page
- Hero section: headline, subheadline, "Start Journaling" CTA → `/signup`
- "How It Works" section: 3-step visual flow
- "Features" section: 3 feature cards
- CTA repeat at bottom
- Footer with links
- Calm color palette (sage green, warm ivory, lavender accents)
- Responsive: 375px, 768px, 1440px
- CSS-only fade-in animations

**PRD References:** `03-feature-specs.md` §4A.1 (hero section full spec), `02-user-stories.md` US-LP-001

**User Stories Covered:** US-LP-001

**CRITICAL NOTE:** `/frontend-design` MUST be invoked for all visual design decisions per PRD requirement.

**Bowser YAML:** `ai_review/user_stories/landing.yaml`

```yaml
stories:
  - name: "Landing page loads with hero section"
    url: "http://localhost:4321/"
    workflow: |
      Navigate to http://localhost:4321/
      Verify the page loads successfully
      Verify a hero section is visible with a headline about Serene or wellness journaling
      Verify a prominent CTA button exists (e.g., "Start Journaling" or "Get Started")
      Verify the CTA button links to /signup

  - name: "Landing page has How It Works section"
    url: "http://localhost:4321/"
    workflow: |
      Navigate to http://localhost:4321/
      Scroll down to find a "How It Works" section
      Verify 3 steps are displayed (Log Mood, Write Reflection, Get AI Insight or similar)

  - name: "Landing page has Features section"
    url: "http://localhost:4321/"
    workflow: |
      Navigate to http://localhost:4321/
      Scroll down to find a Features section
      Verify at least 3 feature cards are displayed
      Verify features mention mood tracking, AI companion/vibe check, and insights/analytics

  - name: "Landing page is responsive"
    url: "http://localhost:4321/"
    workflow: |
      Navigate to http://localhost:4321/
      Verify the page renders without horizontal scrollbar at 1440px width
      Resize the viewport to 768px width
      Verify the layout adapts (stacked or adjusted for tablet)
      Resize the viewport to 375px width
      Verify the layout adapts for mobile (single column, readable text)

  - name: "Landing page footer has required links"
    url: "http://localhost:4321/"
    workflow: |
      Navigate to http://localhost:4321/
      Scroll to the bottom of the page
      Verify a footer section exists
      Verify the footer contains links for privacy policy, terms, and contact
```

**Definition of Done:**

- [ ] Hero section with headline, subheadline, CTA
- [ ] "How It Works" 3-step section
- [ ] "Features" 3-card section
- [ ] CTA repeat at bottom
- [ ] Footer with privacy/terms/contact links
- [ ] Responsive across 375px, 768px, 1440px
- [ ] Lighthouse performance >= 90, accessibility >= 95
- [ ] Bowser QA: `/ui-review landing` — ALL PASS
- [ ] Manual review: visual quality of calm aesthetic, color palette, typography

---

## Deliverable #11: Auth Flow Polish

**Phase:** 6 (subset) | **Bowser QA:** Yes | **Plan-Creator:** Yes

**Scope:**

- Polish signup page: ensure form accepts name, email, password (min 8 chars)
- Polish login page: email/password, Google OAuth button, email OTP, passkey
- Error messages: inline validation, no account existence leakage
- Password show/hide toggle
- Post-auth redirect to journal dashboard
- Link between login ↔ signup

**PRD References:** `02-user-stories.md` US-LP-002/003, `03-feature-specs.md` §4A.2

**User Stories Covered:** US-LP-002 (signup), US-LP-003 (login)

**NOTE:** Existing Better Auth infrastructure handles most auth logic. This deliverable is primarily polish and UX verification.

**Bowser YAML:** `ai_review/user_stories/auth-flow.yaml`

```yaml
stories:
  - name: "Signup form validates inputs"
    url: "http://localhost:5173/signup"
    workflow: |
      Navigate to http://localhost:5173/signup
      Verify the signup form is visible
      Verify an email input field exists
      Verify a password input field exists
      Verify a submit button exists
      Verify a Google OAuth or social login button is present
      Try to submit the form with empty fields
      Verify validation errors are displayed

  - name: "Login form has all auth methods"
    url: "http://localhost:5173/login"
    workflow: |
      Navigate to http://localhost:5173/login
      Verify the login form is visible
      Verify an email input field exists
      Verify a password input field exists
      Verify a Google OAuth login button is present
      Verify a submit button exists

  - name: "Login and signup pages link to each other"
    url: "http://localhost:5173/login"
    workflow: |
      Navigate to http://localhost:5173/login
      Verify a link to the signup page exists
      Click the link to signup
      Verify the URL changes to /signup
      Verify the signup form is visible
      Verify a link to the login page exists on the signup page
      Click the link to login
      Verify the URL changes to /login

  - name: "Unauthenticated user redirected to login"
    url: "http://localhost:5173/"
    workflow: |
      Navigate to http://localhost:5173/
      Verify the page redirects to the login page
      Verify the URL contains /login
```

**Definition of Done:**

- [ ] Signup form: email, password, Google OAuth, validation errors
- [ ] Login form: email/password, Google OAuth, OTP, passkey
- [ ] Password show/hide toggle present
- [ ] Login ↔ signup links work
- [ ] Unauthenticated users redirected to login
- [ ] Post-login redirect to journal dashboard
- [ ] Bowser QA: `/ui-review auth-flow` — ALL PASS
- [ ] Manual review: attempt real signup/login flow

---

## Deliverable #12: Docs + Deployment + Final E2E QA

**Phase:** 6 remainder + 7 | **Bowser QA:** Yes (full E2E) | **Plan-Creator:** Yes

**Scope:**

- Rewrite `README.md` for Serene (zero template references)
- Create `docs/deployment/serene-deployment-guide.md`
- Create `docs/deployment/serene-infrastructure-reference.md`
- Update `terraform.tfvars.example` files with `project_slug = "serene"`
- Update Wrangler configs: `serene-web`, `serene-app`, `serene-api`
- Update seed data with realistic journal entries
- CSS theme finalization (calm palette in both web and app)
- Final accessibility audit
- Cross-browser testing
- Full user flow walkthrough

**PRD References:** `14-readme.md`, `15-deployment.md`, `13-phases.md` Phase 6 + 7

**User Stories Covered:** Final integration of all 24 user stories

**Bowser YAML:** `ai_review/user_stories/e2e-full.yaml` — Run ALL existing YAML files together

```yaml
stories:
  - name: "Full E2E: Landing to Journal to Analytics"
    url: "http://localhost:4321/"
    workflow: |
      Navigate to http://localhost:4321/
      Verify the Serene landing page loads with hero section
      Click the "Start Journaling" or "Get Started" CTA button
      Verify navigation to the signup or login page
      Navigate to http://localhost:5173/journal (assuming authenticated session)
      Verify the journal page loads with entry form and timeline
      Select "Happy" mood
      Click "Work" and "Nature" tags
      Type a note with 50+ characters: "Final end-to-end test entry. Everything is working great and the calm aesthetic feels perfect for a wellness journal application."
      Click "Save Entry"
      Verify success toast and entry appears in timeline
      Wait for AI response to appear (up to 15 seconds)
      Navigate to http://localhost:5173/analytics
      Verify the analytics page loads with charts
      Verify at least one chart shows data

  - name: "Full E2E: Edit and Delete flow"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify entries exist in the timeline
      Click edit on the first entry
      Change the mood to "Calm"
      Save the edit
      Verify the entry updates in the timeline
      Click delete on any entry
      Verify confirmation dialog appears
      Confirm deletion
      Verify the entry is removed

  - name: "Full E2E: Responsive check"
    url: "http://localhost:5173/journal"
    workflow: |
      Navigate to http://localhost:5173/journal
      Verify the page renders correctly at 1440px width
      Resize to 768px
      Verify the layout adapts for tablet
      Resize to 375px
      Verify the layout adapts for mobile
      Verify all interactive elements are still usable
```

**Definition of Done:**

- [ ] README.md fully rewritten — zero template references
- [ ] Deployment guides exist in `docs/deployment/`
- [ ] `terraform.tfvars.example` defaults to `serene`
- [ ] Wrangler configs use `serene-{web,app,api}`
- [ ] Seed data includes realistic journal entries
- [ ] Complete user flow works without errors
- [ ] No console errors in production build
- [ ] `bun test --run` — all tests pass
- [ ] `bun typecheck` — no errors
- [ ] `bun lint` — no warnings
- [ ] Bowser QA: `/ui-review` (ALL yaml files) — ALL PASS
- [ ] Manual review: full walkthrough of signup → journal → AI → analytics → landing

---

## Execution Summary

| #   | Deliverable             | Plan-Creator? | Bowser QA? | Stories                    |
| --- | ----------------------- | :-----------: | :--------: | -------------------------- |
| 1   | Foundation (DB + Types) |      Yes      |     No     | —                          |
| 2   | Journal CRUD API        |      Yes      |     No     | —                          |
| 3   | AI Vibe Check API       |      Yes      |     No     | —                          |
| 4   | Branding Update         |      No       |    Yes     | `branding.yaml`            |
| 5   | Entry Form Components   |      Yes      |    Yes     | `entry-form-parts.yaml`    |
| 6   | Entry Save + Timeline   |      Yes      |    Yes     | `entry-save-timeline.yaml` |
| 7   | Edit + Delete           |      Yes      |    Yes     | `entry-crud.yaml`          |
| 8   | AI Response Display     |      Yes      |    Yes     | `ai-response.yaml`         |
| 9   | Analytics Dashboard     |      Yes      |    Yes     | `analytics.yaml`           |
| 10  | Landing Page            |      Yes      |    Yes     | `landing.yaml`             |
| 11  | Auth Flow Polish        |      Yes      |    Yes     | `auth-flow.yaml`           |
| 12  | Docs + Final E2E        |      Yes      |    Yes     | `e2e-full.yaml` + all      |

**Total plan-creator runs: 11** (deliverable #4 is too small, do directly)

**Total bowser YAML files to create: 9** (deliverables #4-12, each with their own YAML)

### How to Start Each Deliverable

```
/essentials:plan-creator

Scope: Deliverable #N from ai_docs/prd/deliverables.md
PRD references: [listed in deliverable section]
User stories: [listed in deliverable section]

CRITICAL: After implementation, write bowser YAML stories per the template
in deliverables.md and run /ui-review to validate. ALL stories must pass.
```

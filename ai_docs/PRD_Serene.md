# Product Requirements Document: Serene -- AI-Powered Mental Wellness Journal

**Document Version:** 1.0
**Date:** 2026-03-09
**Author:** Product Management
**Status:** Draft -- Pending Stakeholder Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision and Core Value Proposition](#2-product-vision-and-core-value-proposition)
3. [User Stories and Acceptance Criteria](#3-user-stories-and-acceptance-criteria)
4. [Feature Specifications](#4-feature-specifications)
5. [Technical Architecture](#5-technical-architecture)
6. [Database Schema Design](#6-database-schema-design)
7. [API Design](#7-api-design)
8. [AI Integration Specification](#8-ai-integration-specification)
9. [Frontend Component Architecture](#9-frontend-component-architecture)
10. [Testing Strategy](#10-testing-strategy)
11. [Tooling and Skills Requirements](#11-tooling-and-skills-requirements)
12. [Docker and DevOps Requirements](#12-docker-and-devops-requirements)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Implementation Phases and Milestones](#14-implementation-phases-and-milestones)
15. [Definition of Done](#15-definition-of-done)
16. [README.md Rewrite Requirements](#16-readmemd-rewrite-requirements)
17. [Cloudflare Infrastructure Deployment Guide](#17-cloudflare-infrastructure-deployment-guide)

---

## 1. Executive Summary

Serene is an AI-powered mental wellness journal that transforms the existing Bun monorepo starter kit into a purposeful product. Users log their mood, tag relevant life activities, and write reflective notes. Upon saving an entry, the Anthropic Claude API provides a supportive, non-clinical "vibe check" -- a brief empathetic response that acknowledges the user's emotional state and offers encouragement. A visual analytics dashboard shows mood patterns over time, helping users gain self-awareness.

**Key Business Objectives:**

- Provide a private, secure space for emotional reflection with zero friction.
- Differentiate through AI-powered empathetic analysis that feels genuinely supportive, not robotic.
- Deliver measurable user engagement via daily journaling streaks and return visits.
- Demonstrate a production-grade application built on modern web technologies.

**Scope:** This PRD covers the transformation of the existing codebase (auth, Docker, UI components, routing) into the Serene product. It introduces three new feature domains: mood journaling, AI vibe check, and visual analytics. The landing page, onboarding, and authentication flows are adapted from existing infrastructure.

---

## 2. Product Vision and Core Value Proposition

### 2.1 Vision Statement

Serene empowers individuals to build emotional self-awareness through guided journaling, contextual mood tracking, and AI-driven empathetic feedback -- all within a calm, private digital environment.

### 2.2 Unique Selling Proposition (USP)

"Your private AI companion for daily emotional check-ins. Log how you feel, understand why, and receive gentle encouragement -- all in under 60 seconds."

### 2.3 Target Users

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **Mindful Professional** | Ages 25-40, high-stress career, limited time for self-care | Quick daily emotional check-in with actionable patterns |
| **Wellness Seeker** | Ages 18-35, actively interested in mental health practices | Structured journaling with AI-powered reflection |
| **Therapy Companion** | Any age, currently in or considering therapy | Track moods between sessions, identify triggers |

### 2.4 Business Goals and Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| **Daily Active Users (DAU)** | 100 within 30 days of launch | Analytics event tracking |
| **7-Day Retention Rate** | >= 40% | Cohort analysis (users who return within 7 days) |
| **Entries Per Active User** | >= 3/week average | Database query: entries / active users / week |
| **AI Vibe Check Engagement** | >= 80% of entries trigger AI response | Ratio of entries with >= 50 char notes to total entries |
| **Average Session Duration** | >= 2 minutes | Analytics timing events |
| **User Satisfaction (NPS)** | >= 50 | In-app survey (post-onboarding, day 7, day 30) |

---

## 3. User Stories and Acceptance Criteria

### 3.1 Landing Page and Onboarding

#### US-LP-001: View Landing Page

**As a** visitor,
**I want to** see a calm, inviting landing page that clearly communicates Serene's value,
**so that** I understand what the product does and feel motivated to sign up.

**Acceptance Criteria:**
- [ ] AC-1: Landing page loads in under 2 seconds on 3G connection (Lighthouse performance >= 90).
- [ ] AC-2: Hero section displays tagline, USP description, and a prominent "Get Started" CTA button.
- [ ] AC-3: Visual design uses a calm color palette (muted blues, greens, soft whites) with ample whitespace.
- [ ] AC-4: Page includes a "How It Works" section with 3 steps: Log Mood, Write Reflection, Get AI Insight.
- [ ] AC-5: Page includes a "Features" section showcasing mood tracking, AI vibe check, and weekly insights.
- [ ] AC-6: Page includes a social proof or testimonial section (placeholder content acceptable for MVP).
- [ ] AC-7: Footer includes links to privacy policy, terms, and contact information.
- [ ] AC-8: Page is fully responsive across mobile (375px), tablet (768px), and desktop (1440px) viewports.
- [ ] AC-9: "Get Started" button navigates to `/signup`.
- [ ] AC-10: Authenticated users visiting `/` are redirected to the app dashboard (existing auth-hint cookie behavior).

#### US-LP-002: Sign Up for Account

**As a** visitor,
**I want to** create an account using email/password or Google OAuth,
**so that** I can access my private journal.

**Acceptance Criteria:**
- [ ] AC-1: Sign-up form accepts name, email, and password (minimum 8 characters).
- [ ] AC-2: Google OAuth sign-up button is available and functional.
- [ ] AC-3: Email OTP verification is sent after email/password sign-up.
- [ ] AC-4: Upon successful sign-up, user is redirected to the journal dashboard.
- [ ] AC-5: Duplicate email addresses produce a clear error message.
- [ ] AC-6: Form validation errors are displayed inline next to relevant fields.
- [ ] AC-7: Password field includes show/hide toggle.

**NOTE:** This story leverages the existing `apps/app/routes/(auth)/signup.tsx` and Better Auth configuration. No new auth infrastructure is required.

#### US-LP-003: Log In to Existing Account

**As a** registered user,
**I want to** log in using my chosen authentication method,
**so that** I can access my journal entries.

**Acceptance Criteria:**
- [ ] AC-1: Login form accepts email and password.
- [ ] AC-2: Google OAuth login button is available.
- [ ] AC-3: Email OTP login is available.
- [ ] AC-4: Passkey authentication is available.
- [ ] AC-5: Failed login attempts produce clear error messages without revealing account existence.
- [ ] AC-6: After login, user is redirected to `returnTo` parameter or journal dashboard.
- [ ] AC-7: "Forgot password" link sends password reset email.

**NOTE:** Fully handled by existing Better Auth + AuthForm component infrastructure.

---

### 3.2 Mood Journaling

#### US-MJ-001: Create Mood Entry via Mood Selector

**As a** logged-in user,
**I want to** select my current mood from visual icons/cards,
**so that** I can quickly log how I feel without typing.

**Acceptance Criteria:**
- [ ] AC-1: Mood selector displays exactly 6 mood options as visual cards with icons and labels: Happy, Calm, Anxious, Sad, Overwhelmed, Angry.
- [ ] AC-2: Each mood card has a distinct color and icon.
- [ ] AC-3: Exactly one mood can be selected at a time; selecting a new mood deselects the previous.
- [ ] AC-4: Selected mood card shows a clear visual active state (border highlight, scale, or background change).
- [ ] AC-5: Mood selector is accessible via keyboard navigation (arrow keys, Enter to select).
- [ ] AC-6: Mood selection is required before the entry can be saved.

#### US-MJ-002: Add Contextual Tags to Entry

**As a** logged-in user,
**I want to** tag my mood entry with relevant life activities,
**so that** I can correlate my mood with specific contexts over time.

**Acceptance Criteria:**
- [ ] AC-1: Tag chips are displayed for at least 8 predefined categories: Work, Sleep, Relationships, Fitness, Hobbies, Health, Social, Nature.
- [ ] AC-2: User can select zero or more tags (multi-select).
- [ ] AC-3: Selected chips show a filled/active visual state; unselected show an outlined state.
- [ ] AC-4: Tags are optional -- entry can be saved without selecting any tags.
- [ ] AC-5: Tag chips are accessible via keyboard (Tab to navigate, Space/Enter to toggle).

#### US-MJ-003: Write Reflective Note

**As a** logged-in user,
**I want to** write a free-form text reflection about my mood,
**so that** I can process my thoughts and trigger the AI vibe check.

**Acceptance Criteria:**
- [ ] AC-1: Text area is displayed below the tags section with placeholder text: "What's on your mind? Write at least 50 characters to receive an AI insight..."
- [ ] AC-2: Character count is displayed below the text area (e.g., "42 / 50 characters").
- [ ] AC-3: When character count reaches 50, a visual indicator confirms AI insight will be generated.
- [ ] AC-4: Note field is optional -- entry can be saved without a note.
- [ ] AC-5: Notes with fewer than 50 characters are saved but do not trigger AI analysis.
- [ ] AC-6: Maximum note length is 5,000 characters, enforced by both client-side validation and server-side validation.
- [ ] AC-7: Text area auto-expands as user types (up to a maximum height).

#### US-MJ-004: Save Journal Entry

**As a** logged-in user,
**I want to** save my complete mood entry (mood + tags + note),
**so that** it is persisted and available in my timeline.

**Acceptance Criteria:**
- [ ] AC-1: "Save Entry" button is enabled only when a mood is selected.
- [ ] AC-2: Saving shows a loading state on the button.
- [ ] AC-3: Successful save displays a success toast notification.
- [ ] AC-4: Entry appears immediately at the top of the timeline after save (optimistic update).
- [ ] AC-5: If the note has >= 50 characters, AI vibe check processing begins after save.
- [ ] AC-6: Entry is saved with server-generated timestamp (not client clock).
- [ ] AC-7: Save button is disabled during submission to prevent duplicate entries.
- [ ] AC-8: Network errors during save display an error toast with a retry option.

#### US-MJ-005: View Journal Timeline

**As a** logged-in user,
**I want to** see my past journal entries in a chronological feed,
**so that** I can review my emotional history.

**Acceptance Criteria:**
- [ ] AC-1: Timeline displays entries grouped by date sections: "Today", "Yesterday", "This Week", "Earlier".
- [ ] AC-2: Each entry card shows: mood icon + label, selected tags as chips, note preview (truncated at 150 characters), AI vibe check response (if generated), timestamp.
- [ ] AC-3: Entry cards are color-coded by mood (e.g., Happy = green tint, Anxious = amber tint, Sad = blue tint).
- [ ] AC-4: Timeline loads with infinite scroll or "Load More" pagination (20 entries per page).
- [ ] AC-5: Empty state shows encouraging message: "Start your wellness journey -- log your first mood entry."
- [ ] AC-6: Most recent entries appear at the top.
- [ ] AC-7: Entries belong only to the authenticated user; no cross-user data leakage.
- [ ] AC-8: Timeline updates in real-time after creating, editing, or deleting entries.

#### US-MJ-006: View Full Entry Detail

**As a** logged-in user,
**I want to** click on a timeline entry to see its full details,
**so that** I can read the complete note and AI response.

**Acceptance Criteria:**
- [ ] AC-1: Clicking an entry card expands it or navigates to a detail view.
- [ ] AC-2: Detail view shows full note text (not truncated).
- [ ] AC-3: Detail view shows the complete AI vibe check response.
- [ ] AC-4: Detail view includes Edit and Delete action buttons.
- [ ] AC-5: Back navigation returns to the same scroll position in the timeline.

#### US-MJ-007: Edit Existing Entry

**As a** logged-in user,
**I want to** edit a previously saved journal entry,
**so that** I can correct or update my reflection.

**Acceptance Criteria:**
- [ ] AC-1: Edit action opens the entry form pre-filled with existing mood, tags, and note.
- [ ] AC-2: User can modify mood, tags, and note independently.
- [ ] AC-3: Saving edits updates the entry in the timeline immediately.
- [ ] AC-4: If note text changes and meets the 50-character threshold, a new AI vibe check is optionally re-triggered.
- [ ] AC-5: `updatedAt` timestamp is updated on the entry; `createdAt` remains unchanged.
- [ ] AC-6: User can only edit their own entries (server-enforced).

#### US-MJ-008: Delete Entry

**As a** logged-in user,
**I want to** delete a journal entry,
**so that** I can remove entries I no longer want.

**Acceptance Criteria:**
- [ ] AC-1: Delete action shows a confirmation dialog: "Are you sure you want to delete this entry? This action cannot be undone."
- [ ] AC-2: Confirmed deletion removes the entry from the timeline immediately (optimistic update).
- [ ] AC-3: Deletion is a hard delete (not soft delete) for privacy reasons.
- [ ] AC-4: Associated AI vibe check response is also deleted.
- [ ] AC-5: User can only delete their own entries (server-enforced).
- [ ] AC-6: Deletion failure (network error) reverts the optimistic update and shows an error toast.

---

### 3.3 AI Vibe Check

#### US-AI-001: Receive AI Vibe Check After Saving Entry

**As a** logged-in user,
**I want to** receive a brief, empathetic AI response after saving a qualifying entry,
**so that** I feel acknowledged and supported.

**Acceptance Criteria:**
- [ ] AC-1: AI response is generated only when the note contains >= 50 characters.
- [ ] AC-2: AI response is 1-2 sentences long, empathetic in tone, and non-clinical.
- [ ] AC-3: AI response takes into account the selected mood, tags, and note content.
- [ ] AC-4: Response streams into the UI in real-time (word by word or chunk by chunk).
- [ ] AC-5: A loading indicator (pulsing dots or shimmer) is shown while waiting for the first token.
- [ ] AC-6: Completed AI response is persisted alongside the journal entry.
- [ ] AC-7: AI response generation does not block the entry save operation -- the entry is saved first, then AI generates asynchronously.

#### US-AI-002: AI Safety Guardrails

**As a** user in distress,
**I want to** see appropriate resources if I express highly sensitive content,
**so that** I am directed toward professional help when needed.

**Acceptance Criteria:**
- [ ] AC-1: If note text contains crisis-related keywords (e.g., "suicide", "self-harm", "end my life"), the AI response is prepended with a standard safety disclaimer.
- [ ] AC-2: Safety disclaimer text: "If you're in crisis, please reach out to the 988 Suicide and Crisis Lifeline by calling or texting 988, or contact the Crisis Text Line by texting HOME to 741741. You're not alone."
- [ ] AC-3: The disclaimer is displayed in a visually distinct format (warning-style card with a phone icon).
- [ ] AC-4: The AI still provides an empathetic response after the disclaimer -- it does not refuse to respond.
- [ ] AC-5: Empty notes or notes with fewer than 50 characters do not trigger AI analysis (no error, just no response).
- [ ] AC-6: Gibberish or nonsensical input receives a generic encouraging response: "Thanks for checking in today. Even showing up to journal is a positive step."

#### US-AI-003: View AI Response History

**As a** logged-in user,
**I want to** see past AI vibe check responses on my timeline entries,
**so that** I can revisit the AI's encouragement.

**Acceptance Criteria:**
- [ ] AC-1: Each timeline entry card that has an AI response shows it below the note text.
- [ ] AC-2: AI response is visually distinguished from user-written content (e.g., different background, AI icon, italic text).
- [ ] AC-3: Entries without AI responses (note < 50 chars or no note) show no AI section.

---

### 3.4 Visual Insights and Analytics

#### US-AN-001: View Weekly Mood Summary

**As a** logged-in user,
**I want to** see a weekly visual summary of my mood distribution,
**so that** I can identify emotional patterns.

**Acceptance Criteria:**
- [ ] AC-1: A bar chart displays mood distribution for the current week (Monday-Sunday).
- [ ] AC-2: Each bar represents a mood type, with height proportional to the number of entries.
- [ ] AC-3: Bars are color-coded to match the mood colors used in timeline cards.
- [ ] AC-4: Chart includes axis labels (mood names on X, count on Y).
- [ ] AC-5: Week navigation allows viewing previous weeks (left/right arrows or date picker).
- [ ] AC-6: Empty weeks display a message: "No entries this week. Start journaling to see your mood patterns."
- [ ] AC-7: Chart data is derived from the authenticated user's entries only.

#### US-AN-002: View Mood Trend Over Time

**As a** logged-in user,
**I want to** see how my overall mood has trended over the past 30 days,
**so that** I can understand my emotional trajectory.

**Acceptance Criteria:**
- [ ] AC-1: A line or area chart shows average mood score per day for the past 30 days.
- [ ] AC-2: Moods are mapped to numerical scores for averaging: Happy=5, Calm=4, Anxious=2, Sad=2, Overwhelmed=1, Angry=1.
- [ ] AC-3: Days without entries are shown as gaps in the line (not interpolated).
- [ ] AC-4: Chart includes a horizontal reference line at the "neutral" score (3).
- [ ] AC-5: Hovering over a data point shows the date, mood count breakdown, and average score.

#### US-AN-003: View Tag Correlation Insights

**As a** logged-in user,
**I want to** see which activities correlate with my moods,
**so that** I can make informed lifestyle choices.

**Acceptance Criteria:**
- [ ] AC-1: A summary section shows each tag's average mood score based on all entries with that tag.
- [ ] AC-2: Tags are sorted by average mood score (highest to lowest).
- [ ] AC-3: Each tag row shows: tag name, number of entries with this tag, average mood score, a visual indicator (green for positive, amber for neutral, red for negative).
- [ ] AC-4: Only tags that appear in >= 3 entries are included (insufficient data message for others).

---

## 4. Feature Specifications

### 4A. Landing Page and Onboarding

#### 4A.1 Hero Section

**Location:** `apps/web/pages/index.astro` (replace existing starter kit content)

**Design Requirements:**
- Color palette: Soft sage green (`oklch(0.85 0.05 155)`), warm ivory background, muted lavender accents.
- Typography: Large, breathable headings with generous letter-spacing. Body text at comfortable reading size (18px).
- Hero image or illustration: Abstract, calming graphic (waves, gradients, or minimalist nature motifs). No photographs of people.
- Whitespace: Minimum 80px vertical padding between sections.
- Animation: Subtle fade-in on scroll (CSS-only, no heavy JS animation libraries).

**Content Structure:**
1. **Headline:** "Find Your Calm. One Entry at a Time."
2. **Subheadline:** "Serene is your private AI-powered wellness journal. Log your mood, write your thoughts, and receive gentle encouragement -- all in under 60 seconds."
3. **Primary CTA:** "Start Journaling" (links to `/signup`)
4. **Secondary CTA:** "Learn More" (scrolls to How It Works section)
5. **How It Works:** Three-step visual flow (Log Mood -> Write Reflection -> Get AI Insight)
6. **Features Grid:** 3 cards (Private Journaling, AI Companion, Mood Insights)
7. **CTA Repeat:** "Begin Your Wellness Journey" (links to `/signup`)

**Implementation Skill:** `/frontend-design` MUST be invoked for all visual design decisions on this page.

#### 4A.2 Authentication

**Existing Infrastructure (no new development needed):**
- Better Auth server config in `apps/api/lib/auth.ts`
- Email/password with OTP verification
- Google OAuth
- Passkey support
- Auth forms in `apps/app/components/auth/`
- Protected route guard in `apps/app/routes/(app)/route.tsx`
- Auth-hint cookie for edge routing (ADR-001)

**Adaptation Required:**
- Update `APP_NAME` from "Acme Co." to "Serene" in environment variables.
- Update sidebar branding from "Console" to "Serene" in `apps/app/components/layout/sidebar.tsx`.
- Update sidebar navigation items to reflect journal-specific routes.

#### 4A.3 Privacy Enforcement

- All journal tRPC procedures use `protectedProcedure` (enforces `ctx.user` and `ctx.session` non-null).
- Every database query on `journalEntry` filters by `WHERE userId = ctx.user.id`.
- Server-side ownership validation on all mutating operations (update, delete).
- No admin or cross-user entry access endpoints.

---

### 4B. Mood Journaling and Analytics

#### 4B.1 Interactive Mood Entry

**Mood Values and Metadata:**

| Mood | Score | Color (light) | Color (dark) | Icon (lucide-react) |
|------|-------|----------------|--------------|---------------------|
| Happy | 5 | `oklch(0.85 0.15 145)` (green) | `oklch(0.45 0.15 145)` | `Smile` |
| Calm | 4 | `oklch(0.85 0.10 220)` (blue) | `oklch(0.45 0.10 220)` | `CloudSun` |
| Anxious | 2 | `oklch(0.85 0.15 75)` (amber) | `oklch(0.45 0.15 75)` | `Zap` |
| Sad | 2 | `oklch(0.85 0.10 260)` (indigo) | `oklch(0.45 0.10 260)` | `CloudRain` |
| Overwhelmed | 1 | `oklch(0.85 0.15 30)` (orange) | `oklch(0.45 0.15 30)` | `Waves` |
| Angry | 1 | `oklch(0.85 0.18 25)` (red) | `oklch(0.45 0.18 25)` | `Flame` |

**Tag Values:**

| Tag | Icon (lucide-react) |
|-----|---------------------|
| Work | `Briefcase` |
| Sleep | `Moon` |
| Relationships | `Heart` |
| Fitness | `Dumbbell` |
| Hobbies | `Palette` |
| Health | `Stethoscope` |
| Social | `Users` |
| Nature | `TreePine` |

These values are defined as TypeScript constants in `packages/core/` and shared between API validation (Zod enums) and frontend rendering.

#### 4B.2 Dynamic Timeline

**Grouping Logic:**
- "Today": entries where `createdAt` is today in user's local timezone.
- "Yesterday": entries where `createdAt` is yesterday.
- "This Week": entries from the current Monday-Sunday period (excluding today/yesterday).
- "Earlier": all remaining entries.

**NOTE:** Date grouping is performed client-side using the entry's UTC `createdAt` timestamp converted to the user's local timezone via `Intl.DateTimeFormat`. The server provides entries in reverse chronological order; the client groups them.

**Pagination:**
- Cursor-based pagination using `createdAt` + `id` as cursor.
- Page size: 20 entries.
- TanStack Query infinite query pattern with `getNextPageParam`.

#### 4B.3 Visual Insights

**Chart Library:** Recharts (React-native charting, already compatible with the stack).

**Charts:**
1. **Weekly Mood Distribution Bar Chart** (US-AN-001): Horizontal bar chart grouped by mood type.
2. **30-Day Mood Trend Line Chart** (US-AN-002): Area chart with daily average mood scores.
3. **Tag Correlation Summary** (US-AN-003): Simple table/list view (no chart library dependency).

---

### 4C. AI Vibe Check

#### 4C.1 System Prompt

```
You are Serene's AI companion -- a warm, supportive, and non-judgmental presence.
Your role is to acknowledge the user's emotional state and offer brief encouragement.

Rules:
1. Respond in 1-2 sentences only. Be concise but genuine.
2. Reference the user's specific mood, tags, and note content. Do not give generic advice.
3. Use a warm, conversational tone. Avoid clinical language (no "therapy", "diagnosis", "treatment").
4. Never claim to be a therapist or mental health professional.
5. Focus on validation and gentle encouragement, not problem-solving.
6. If the user expresses a positive mood, celebrate with them.
7. If the user expresses a negative mood, acknowledge the difficulty and normalize the feeling.
8. Do not ask questions. Your response is a statement of support, not a conversation opener.

Context provided:
- Mood: {mood}
- Tags: {tags}
- Note: {note}
```

#### 4C.2 API Integration

- **Provider:** Anthropic Claude API (NOT the existing OpenAI integration).
- **Model:** `claude-sonnet-4-20250514` (cost-effective for short responses).
- **Max Tokens:** 150 (enforces brevity).
- **Temperature:** 0.7 (warm but not erratic).
- **Streaming:** Server-Sent Events (SSE) via tRPC subscription or direct Hono SSE endpoint.

#### 4C.3 Safety Guardrails Implementation

**Trigger Word Detection (server-side, pre-AI-call):**

```typescript
const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill myself", "end my life",
  "self-harm", "self harm", "cutting myself", "hurt myself",
  "want to die", "don't want to live", "no reason to live",
];
```

**Logic:**
1. Normalize note text (lowercase, trim).
2. Check for any crisis keyword match.
3. If matched, set `hasCrisisContent: true` flag on the AI response record.
4. Prepend safety disclaimer to the AI response before sending to client.
5. Still send the note to the AI for an empathetic response (do not refuse).

**Gibberish Detection:**
- If note text has fewer than 3 dictionary words (simple heuristic: words > 2 chars), return a generic response without calling the AI.
- Generic response: "Thanks for checking in today. Even showing up to journal is a positive step."

---

## 5. Technical Architecture

### 5.1 Architecture Overview

Serene builds on the existing three-worker architecture:

```
[Browser] --> [Web Worker (Astro)] --> [App Worker (React SPA)]
                                  --> [API Worker (Hono + tRPC)]
                                         |
                                         +--> [PostgreSQL (Neon/Docker)]
                                         +--> [Anthropic Claude API]
```

No architectural changes to the worker topology or service binding pattern. New features are additive modules within existing workers.

### 5.2 Monorepo Module Mapping

| Feature Domain | API Module | App Module | Shared Types |
|----------------|-----------|------------|--------------|
| Mood Journaling | `apps/api/routers/journal.ts` | `apps/app/routes/(app)/journal/` | `packages/core/src/journal.ts` |
| AI Vibe Check | `apps/api/routers/ai.ts` | (consumed via journal components) | `packages/core/src/ai.ts` |
| Visual Analytics | `apps/api/routers/analytics.ts` | `apps/app/routes/(app)/analytics.tsx` | `packages/core/src/analytics.ts` |
| Landing Page | N/A | N/A | N/A (Astro pages in `apps/web/`) |

### 5.3 New Dependencies

| Package | Purpose | Install Location |
|---------|---------|-----------------|
| `@anthropic-ai/sdk` | Claude API client | `apps/api` |
| `recharts` | Chart visualization | `apps/app` |
| `date-fns` | Date manipulation and formatting | `packages/core` |

### 5.4 API Module Structure (Detailed)

```
apps/api/
  routers/
    journal.ts            # tRPC router: CRUD for journal entries
    journal.test.ts       # Tests for journal router
    ai.ts                 # tRPC router: AI vibe check generation
    ai.test.ts            # Tests for AI router
    analytics.ts          # tRPC router: mood analytics queries
    analytics.test.ts     # Tests for analytics router
  lib/
    anthropic.ts          # Request-scoped Anthropic client (replaces ai.ts pattern)
    safety.ts             # Crisis keyword detection + gibberish detection
    safety.test.ts        # Tests for safety module
```

### 5.5 App Module Structure (Detailed)

```
apps/app/
  routes/(app)/
    journal/
      index.tsx           # Journal page (entry form + timeline)
      $entryId.tsx        # Entry detail view (dynamic route)
    analytics.tsx          # Analytics page (charts + insights)
  components/
    journal/
      mood-selector.tsx    # Mood card grid
      mood-selector.test.tsx
      tag-chips.tsx        # Multi-select tag chips
      tag-chips.test.tsx
      note-editor.tsx      # Textarea with character counter
      note-editor.test.tsx
      entry-form.tsx       # Composite form (mood + tags + note + save)
      entry-form.test.tsx
      timeline.tsx         # Grouped entry list with infinite scroll
      timeline.test.tsx
      entry-card.tsx       # Individual entry in timeline
      entry-card.test.tsx
      ai-response.tsx      # AI vibe check display with streaming
      ai-response.test.tsx
      safety-banner.tsx    # Crisis resource banner
      safety-banner.test.tsx
    analytics/
      mood-bar-chart.tsx   # Weekly mood distribution chart
      mood-bar-chart.test.tsx
      mood-trend-chart.tsx # 30-day trend line chart
      mood-trend-chart.test.tsx
      tag-correlation.tsx  # Tag-mood correlation table
      tag-correlation.test.tsx
  lib/
    queries/
      journal.ts           # TanStack Query hooks for journal entries
      analytics.ts         # TanStack Query hooks for analytics data
```

---

## 6. Database Schema Design

### 6.1 New Tables

#### `journal_entry` Table

```typescript
// db/schema/journal.ts

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "./id";
import { user } from "./user";

export const journalEntry = pgTable(
  "journal_entry",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId("jrn")),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mood: text().notNull(),
    // Stored as JSON array string: '["Work","Sleep"]'
    tags: text().notNull().default("[]"),
    note: text().default(""),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("journal_entry_user_id_idx").on(table.userId),
    index("journal_entry_created_at_idx").on(table.createdAt),
    index("journal_entry_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export type JournalEntry = typeof journalEntry.$inferSelect;
export type NewJournalEntry = typeof journalEntry.$inferInsert;
```

#### `ai_response` Table

```typescript
// db/schema/ai-response.ts

import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "./id";
import { journalEntry } from "./journal";

export const aiResponse = pgTable(
  "ai_response",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId("air")),
    entryId: text()
      .notNull()
      .unique()
      .references(() => journalEntry.id, { onDelete: "cascade" }),
    response: text().notNull(),
    hasCrisisContent: boolean().default(false).notNull(),
    model: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_response_entry_id_idx").on(table.entryId),
  ],
);

export type AiResponse = typeof aiResponse.$inferSelect;
export type NewAiResponse = typeof aiResponse.$inferInsert;
```

### 6.2 ID Prefix Registration

Add to `db/schema/id.ts` `AUTH_PREFIX` map or use `generateId()` directly:

- `jrn` -- journal entry
- `air` -- AI response

These use `generateId(prefix)` (non-auth ID generator) since they are not Better Auth models.

### 6.3 Relations

```typescript
// In db/schema/journal.ts
export const journalEntryRelations = relations(journalEntry, ({ one }) => ({
  user: one(user, {
    fields: [journalEntry.userId],
    references: [user.id],
  }),
  aiResponse: one(aiResponse),
}));

export const aiResponseRelations = relations(aiResponse, ({ one }) => ({
  entry: one(journalEntry, {
    fields: [aiResponse.entryId],
    references: [journalEntry.id],
  }),
}));
```

### 6.4 Schema Export

Update `db/schema/index.ts`:
```typescript
export * from "./journal";
export * from "./ai-response";
```

### 6.5 Migration Strategy

- Use `bun db:push` for development (schema sync without migration files).
- Generate migration with `bun db:generate` before staging/production deployment.
- Seed script should create sample journal entries for development.

---

## 7. API Design

### 7.1 tRPC Router: `journal`

All procedures use `protectedProcedure`. All queries filter by `ctx.user.id`.

#### `journal.create`

**Type:** Mutation
**Input:**
```typescript
z.object({
  mood: z.enum(["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"]),
  tags: z.array(
    z.enum(["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"])
  ).default([]),
  note: z.string().max(5000).default(""),
})
```
**Output:**
```typescript
{
  id: string;
  mood: string;
  tags: string[];
  note: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Behavior:**
1. Validate input.
2. Insert entry into `journalEntry` table with `userId = ctx.user.id`.
3. Return the created entry.
4. AI vibe check is triggered separately (not part of this mutation).

#### `journal.list`

**Type:** Query
**Input:**
```typescript
z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
})
```
**Output:**
```typescript
{
  entries: Array<{
    id: string;
    mood: string;
    tags: string[];
    note: string;
    createdAt: Date;
    updatedAt: Date;
    aiResponse: {
      response: string;
      hasCrisisContent: boolean;
    } | null;
  }>;
  nextCursor: string | null;
}
```
**Behavior:**
1. Query `journalEntry` with `userId = ctx.user.id`, ordered by `createdAt DESC`.
2. Include related `aiResponse` via Drizzle relations.
3. Apply cursor-based pagination using the composite of `createdAt` and `id`.
4. Parse `tags` from JSON string to array before returning.

#### `journal.getById`

**Type:** Query
**Input:**
```typescript
z.object({
  id: z.string(),
})
```
**Output:** Single entry with AI response (same shape as list item), or throws `NOT_FOUND`.
**Behavior:**
1. Query by `id` AND `userId = ctx.user.id`.
2. If not found, throw `TRPCError({ code: "NOT_FOUND" })`.

#### `journal.update`

**Type:** Mutation
**Input:**
```typescript
z.object({
  id: z.string(),
  mood: z.enum(["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"]).optional(),
  tags: z.array(
    z.enum(["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"])
  ).optional(),
  note: z.string().max(5000).optional(),
})
```
**Output:** Updated entry object.
**Behavior:**
1. Verify entry exists and belongs to `ctx.user.id`.
2. Update only provided fields.
3. If note changed and has >= 50 characters, mark for AI re-analysis (client decides whether to call AI endpoint).

#### `journal.delete`

**Type:** Mutation
**Input:**
```typescript
z.object({
  id: z.string(),
})
```
**Output:** `{ success: true }`
**Behavior:**
1. Verify entry exists and belongs to `ctx.user.id`.
2. Hard delete the entry (cascades to `aiResponse`).
3. If not found or not owned, throw `TRPCError({ code: "NOT_FOUND" })`.

### 7.2 tRPC Router: `ai`

#### `ai.generateVibeCheck`

**Type:** Mutation
**Input:**
```typescript
z.object({
  entryId: z.string(),
})
```
**Output:**
```typescript
{
  response: string;
  hasCrisisContent: boolean;
}
```
**Behavior:**
1. Fetch the journal entry by `id` AND `ctx.user.id`.
2. If entry not found, throw `NOT_FOUND`.
3. If note is empty or < 50 characters, return generic response.
4. Run crisis keyword detection on note text.
5. Call Anthropic Claude API with system prompt, mood, tags, and note.
6. Upsert AI response into `aiResponse` table (replace previous if re-analyzing).
7. If crisis content detected, prepend safety disclaimer.
8. Return the response.

#### `ai.streamVibeCheck` (SSE Endpoint)

**Type:** Non-tRPC Hono route (SSE streaming is not natively supported in tRPC mutations)
**Route:** `GET /api/ai/stream/:entryId`
**Authentication:** Validate session from request headers using Better Auth.
**Behavior:**
1. Authenticate the request.
2. Fetch entry, validate ownership.
3. If note < 50 chars, send single SSE event with generic response and close.
4. Run crisis detection.
5. Stream Anthropic response via SSE.
6. On stream completion, persist the full response to `aiResponse` table.
7. If crisis content detected, send disclaimer as first SSE event.

**SSE Event Format:**
```
event: token
data: {"text": "partial response text"}

event: done
data: {"response": "full response", "hasCrisisContent": false}

event: error
data: {"message": "error description"}
```

### 7.3 tRPC Router: `analytics`

#### `analytics.weeklyMoodDistribution`

**Type:** Query
**Input:**
```typescript
z.object({
  // ISO date string for the Monday of the week to query
  weekStart: z.string().date(),
})
```
**Output:**
```typescript
{
  distribution: Array<{
    mood: string;
    count: number;
  }>;
  totalEntries: number;
}
```
**Behavior:** Aggregate `COUNT(*)` grouped by `mood` for entries in the given week, filtered by `ctx.user.id`.

#### `analytics.moodTrend`

**Type:** Query
**Input:**
```typescript
z.object({
  days: z.number().min(7).max(90).default(30),
})
```
**Output:**
```typescript
{
  trend: Array<{
    date: string;       // ISO date
    averageScore: number;
    entryCount: number;
    moods: Record<string, number>; // mood name -> count
  }>;
}
```
**Behavior:** Aggregate daily mood entries for the past N days, calculate average mood score per day.

#### `analytics.tagCorrelation`

**Type:** Query
**Input:** None (uses all user entries).
**Output:**
```typescript
{
  correlations: Array<{
    tag: string;
    entryCount: number;
    averageMoodScore: number;
  }>;
}
```
**Behavior:** Parse tags from all entries, calculate average mood score per tag. Filter to tags with >= 3 entries.

### 7.4 Router Registration

Update `apps/api/lib/app.ts`:

```typescript
import { journalRouter } from "../routers/journal.js";
import { aiRouter } from "../routers/ai.js";
import { analyticsRouter } from "../routers/analytics.js";

const appRouter = router({
  billing: billingRouter,
  user: userRouter,
  organization: organizationRouter,
  journal: journalRouter,
  ai: aiRouter,
  analytics: analyticsRouter,
});
```

Add SSE route in `apps/api/lib/app.ts` (before the tRPC handler):
```typescript
app.get("/api/ai/stream/:entryId", streamVibeCheckHandler);
```

---

## 8. AI Integration Specification

### 8.1 Anthropic Client Setup

**File:** `apps/api/lib/anthropic.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { TRPCContext } from "./context";

type AnthropicContext = Pick<TRPCContext, "env" | "cache">;

const ANTHROPIC_CLIENT = Symbol("anthropicClient");

export function getAnthropic(ctx: AnthropicContext): Anthropic {
  if (ctx.cache.has(ANTHROPIC_CLIENT)) {
    return ctx.cache.get(ANTHROPIC_CLIENT) as Anthropic;
  }

  const client = new Anthropic({
    apiKey: ctx.env.ANTHROPIC_API_KEY,
  });

  ctx.cache.set(ANTHROPIC_CLIENT, client);
  return client;
}
```

This follows the exact same request-scoped caching pattern as the existing `apps/api/lib/ai.ts` (OpenAI provider).

### 8.2 Environment Variable Addition

Add to `apps/api/lib/env.ts` envSchema:
```typescript
ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
```

Add to `.env.example`:
```
# Anthropic Claude API
# https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 8.3 System Prompt Construction

**File:** `apps/api/lib/prompts.ts`

```typescript
export function buildVibeCheckPrompt(
  mood: string,
  tags: string[],
  note: string,
): { system: string; user: string } {
  const system = `You are Serene's AI companion -- a warm, supportive, and non-judgmental presence.
Your role is to acknowledge the user's emotional state and offer brief encouragement.

Rules:
1. Respond in 1-2 sentences only. Be concise but genuine.
2. Reference the user's specific mood, tags, and note content. Do not give generic advice.
3. Use a warm, conversational tone. Avoid clinical language (no "therapy", "diagnosis", "treatment").
4. Never claim to be a therapist or mental health professional.
5. Focus on validation and gentle encouragement, not problem-solving.
6. If the user expresses a positive mood, celebrate with them.
7. If the user expresses a negative mood, acknowledge the difficulty and normalize the feeling.
8. Do not ask questions. Your response is a statement of support, not a conversation opener.`;

  const tagList = tags.length > 0 ? tags.join(", ") : "none selected";
  const user = `Mood: ${mood}\nContext Tags: ${tagList}\nJournal Note: ${note}`;

  return { system, user };
}
```

### 8.4 Streaming Implementation

The streaming vibe check uses the Anthropic SDK's native streaming support:

```typescript
const stream = await anthropic.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 150,
  temperature: 0.7,
  system: prompt.system,
  messages: [{ role: "user", content: prompt.user }],
});
```

The Hono handler converts this to SSE:
```typescript
app.get("/api/ai/stream/:entryId", async (c) => {
  // ... auth + entry validation ...
  return c.newResponse(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (event.type === "content_block_delta" &&
              event.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${JSON.stringify({
                text: event.delta.text
              })}\n\n`)
            );
          }
        }
        // ... persist response, send done event ...
        controller.close();
      }
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    }
  );
});
```

### 8.5 Rate Limiting

- Maximum 20 AI vibe check requests per user per hour.
- Implemented via a simple in-memory counter per user ID (acceptable for single-worker deployment).
- Returns `429 Too Many Requests` with retry-after header when exceeded.

### 8.6 Cost Estimation

- Average input: ~200 tokens (system prompt + mood + tags + note).
- Average output: ~50 tokens (1-2 sentences).
- Claude Sonnet cost: ~$3/M input tokens, ~$15/M output tokens.
- At 100 DAU with 3 entries/day = 300 requests/day = ~9,000/month.
- Estimated monthly cost: ~$7-12 (well within hobby-tier budget).

---

## 9. Frontend Component Architecture

### 9.1 Route Structure Updates

**Remove (replace with journal-focused routes):**
- `apps/app/routes/(app)/analytics.tsx` -- replace with new analytics content
- `apps/app/routes/(app)/reports.tsx` -- remove (not applicable)
- `apps/app/routes/(app)/users.tsx` -- remove (not applicable)
- `apps/app/routes/(app)/about.tsx` -- remove (not applicable)

**Add:**
- `apps/app/routes/(app)/journal/index.tsx` -- Main journal page (entry form + timeline)
- `apps/app/routes/(app)/journal/$entryId.tsx` -- Entry detail/edit view

**Modify:**
- `apps/app/routes/(app)/index.tsx` -- Redirect to `/journal` or serve as journal page
- `apps/app/routes/(app)/analytics.tsx` -- Replace with mood analytics charts

**Keep:**
- `apps/app/routes/(app)/settings.tsx` -- User settings
- `apps/app/routes/(app)/route.tsx` -- Auth guard layout (unchanged)

### 9.2 Sidebar Navigation Update

**File:** `apps/app/components/layout/constants.ts`

```typescript
import { BarChart3, BookHeart, Home, Settings } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: BookHeart, label: "Journal", to: "/journal" },
  { icon: BarChart3, label: "Insights", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;
```

### 9.3 Component Specifications

#### MoodSelector Component

**File:** `apps/app/components/journal/mood-selector.tsx`
**Props:**
```typescript
interface MoodSelectorProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
}
```
**Behavior:**
- Renders a 3x2 grid of mood cards (2 columns on mobile, 3 on tablet+).
- Each card: icon (48px), label text, colored background.
- Selected card: elevated shadow, thicker border, slight scale transform.
- Keyboard: arrow keys navigate between cards, Enter/Space selects.
- ARIA: `role="radiogroup"` with `role="radio"` on each card.

**Implementation Skill:** `/frontend-design` MUST be invoked for the mood card visual design.

#### TagChips Component

**File:** `apps/app/components/journal/tag-chips.tsx`
**Props:**
```typescript
interface TagChipsProps {
  value: TagType[];
  onChange: (tags: TagType[]) => void;
}
```
**Behavior:**
- Renders a flex-wrap row of chip buttons.
- Unselected: outlined border, muted text.
- Selected: filled background (using tag's associated color), white text, check icon.
- Toggle behavior: clicking a selected chip deselects it, clicking unselected selects it.
- ARIA: Each chip is a `button` with `aria-pressed`.

#### NoteEditor Component

**File:** `apps/app/components/journal/note-editor.tsx`
**Props:**
```typescript
interface NoteEditorProps {
  value: string;
  onChange: (note: string) => void;
  maxLength?: number;
}
```
**Behavior:**
- Renders a `Textarea` (from `@repo/ui`) with auto-expand.
- Below the textarea: character count display ("42 / 50 min for AI insight").
- When count >= 50: green checkmark icon next to count, text changes to "AI insight will be generated".
- When count exceeds `maxLength`: count turns red, prevents further input.
- Debounced `onChange` (300ms) to avoid excessive re-renders.

#### EntryForm Component

**File:** `apps/app/components/journal/entry-form.tsx`
**Composition:**
```
EntryForm
  MoodSelector
  TagChips
  NoteEditor
  Button ("Save Entry")
```
**State Management:** Local React state for form values. On save, calls `journal.create` mutation.

#### Timeline Component

**File:** `apps/app/components/journal/timeline.tsx`
**Data Source:** `journal.list` infinite query via TanStack Query.
**Rendering:**
```
Timeline
  DateGroup ("Today")
    EntryCard
    EntryCard
  DateGroup ("Yesterday")
    EntryCard
  DateGroup ("This Week")
    EntryCard
    EntryCard
  LoadMoreButton / InfiniteScrollTrigger
```

#### EntryCard Component

**File:** `apps/app/components/journal/entry-card.tsx`
**Props:**
```typescript
interface EntryCardProps {
  entry: JournalEntryWithAiResponse;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```
**Rendering:**
- Uses `Card` from `@repo/ui`.
- Left colored border based on mood.
- Header: mood icon + label, timestamp (relative: "2 hours ago").
- Body: tag chips (read-only, small), note preview (truncated at 150 chars).
- Footer: AI response (if present) in a distinct visual block.
- Actions: Edit (pencil icon), Delete (trash icon) -- visible on hover or always visible on mobile.

#### AiResponse Component

**File:** `apps/app/components/journal/ai-response.tsx`
**Props:**
```typescript
interface AiResponseProps {
  entryId: string;
  response: string | null;
  isStreaming: boolean;
  streamedText: string;
  hasCrisisContent: boolean;
}
```
**Rendering:**
- If streaming: show pulsing dots, then render text character by character as it arrives.
- If complete: show full response with a small AI icon.
- If crisis content: show `SafetyBanner` above the response.
- Visual: slightly different background color (muted), italic text, small AI sparkle icon.

#### SafetyBanner Component

**File:** `apps/app/components/journal/safety-banner.tsx`
**Props:** None (static content).
**Rendering:**
- Warning-style card with phone icon.
- Text: crisis lifeline numbers (988 Suicide and Crisis Lifeline, Crisis Text Line).
- Always displayed when `hasCrisisContent` is true.
- Not dismissible.

### 9.4 New shadcn/ui Components Needed

The following components should be added to `packages/ui/` via `bun ui:add`:

| Component | Purpose |
|-----------|---------|
| `badge` | Tag chips display |
| `toast` / `sonner` | Save success/error notifications |
| `tooltip` | Hover info on charts and icons |
| `dropdown-menu` | Entry card actions (edit/delete) |
| `alert-dialog` | Delete confirmation |
| `tabs` | Analytics page tab navigation |
| `progress` | Character count visual indicator |

---

## 10. Testing Strategy

### 10.1 TDD Methodology

ALL feature implementation MUST follow Test-Driven Development:

1. **Red:** Write a failing test that describes the expected behavior.
2. **Green:** Write the minimum code to make the test pass.
3. **Refactor:** Improve the code while keeping tests green.

Tests are written BEFORE implementation code. Pull requests that add features without corresponding tests will be rejected.

### 10.2 Test Framework and Configuration

- **Runner:** Vitest 4.x (workspace-level config)
- **DOM Environment:** Happy DOM (for component tests)
- **Assertion Library:** Vitest built-in `expect` + `@testing-library/react`
- **Mocking:** Vitest `vi.mock()`, `vi.fn()`, `vi.spyOn()`

### 10.3 Test Categories and Coverage Targets

#### Unit Tests (Target: >= 90% coverage)

| Module | File | Tests Cover |
|--------|------|-------------|
| Safety module | `apps/api/lib/safety.test.ts` | Crisis keyword detection, gibberish detection, edge cases |
| Prompt builder | `apps/api/lib/prompts.test.ts` | System prompt construction, variable interpolation |
| Shared types | `packages/core/src/journal.test.ts` | Mood scores, tag values, type guards |
| Date grouping | `apps/app/lib/utils/date-groups.test.ts` | Timeline date grouping logic |

#### Integration Tests (Target: >= 80% coverage)

| Module | File | Tests Cover |
|--------|------|-------------|
| Journal router | `apps/api/routers/journal.test.ts` | CRUD operations, ownership validation, pagination, input validation |
| AI router | `apps/api/routers/ai.test.ts` | Vibe check generation, crisis detection, rate limiting, error handling |
| Analytics router | `apps/api/routers/analytics.test.ts` | Aggregation queries, empty states, date range handling |

**Integration Test Approach for tRPC Routers:**
```typescript
import { createCallerFactory } from "../lib/trpc";
import { journalRouter } from "./journal";

const createCaller = createCallerFactory(journalRouter);

describe("journal.create", () => {
  it("should create a journal entry for authenticated user", async () => {
    const caller = createCaller({
      db: testDb,
      dbDirect: testDb,
      user: mockUser,
      session: mockSession,
      cache: new Map(),
      env: mockEnv,
      // ... other context fields
    });

    const result = await caller.create({
      mood: "Happy",
      tags: ["Work", "Fitness"],
      note: "Had a great day at the office and hit the gym after.",
    });

    expect(result.mood).toBe("Happy");
    expect(result.tags).toEqual(["Work", "Fitness"]);
    expect(result.id).toMatch(/^jrn_/);
  });
});
```

#### Component Tests (Target: >= 80% coverage)

| Component | File | Tests Cover |
|-----------|------|-------------|
| MoodSelector | `mood-selector.test.tsx` | Selection, deselection, keyboard nav, ARIA attributes |
| TagChips | `tag-chips.test.tsx` | Multi-select toggle, visual states, accessibility |
| NoteEditor | `note-editor.test.tsx` | Character counting, threshold indicator, max length enforcement |
| EntryForm | `entry-form.test.tsx` | Form submission, validation, loading states, error states |
| Timeline | `timeline.test.tsx` | Date grouping, infinite scroll trigger, empty state |
| EntryCard | `entry-card.test.tsx` | Mood color coding, note truncation, action buttons |
| AiResponse | `ai-response.test.tsx` | Streaming display, completion state, crisis banner |
| MoodBarChart | `mood-bar-chart.test.tsx` | Data rendering, empty state, color coding |
| MoodTrendChart | `mood-trend-chart.test.tsx` | Trend line rendering, tooltip, date range |
| SafetyBanner | `safety-banner.test.tsx` | Content presence, non-dismissibility |

**Component Test Approach:**
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { MoodSelector } from "./mood-selector";

describe("MoodSelector", () => {
  it("should call onChange with selected mood", () => {
    const onChange = vi.fn();
    render(<MoodSelector value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: /happy/i }));

    expect(onChange).toHaveBeenCalledWith("Happy");
  });

  it("should show active state for selected mood", () => {
    render(<MoodSelector value="Calm" onChange={vi.fn()} />);

    const calmCard = screen.getByRole("radio", { name: /calm/i });
    expect(calmCard).toHaveAttribute("aria-checked", "true");
  });
});
```

### 10.4 Database Test Fixtures

**File:** `db/test-fixtures/journal.ts`

```typescript
export const testUser = {
  id: "usr_test1234567890",
  name: "Test User",
  email: "test@serene.app",
  emailVerified: true,
  isAnonymous: false,
};

export const testEntries = [
  {
    id: "jrn_test0000000001",
    userId: testUser.id,
    mood: "Happy",
    tags: '["Work","Fitness"]',
    note: "Had a wonderful day. Everything went smoothly at work and I had a great workout after.",
    createdAt: new Date("2026-03-09T10:00:00Z"),
  },
  {
    id: "jrn_test0000000002",
    userId: testUser.id,
    mood: "Anxious",
    tags: '["Work","Relationships"]',
    note: "Feeling worried about the upcoming presentation. Also had a difficult conversation with a friend.",
    createdAt: new Date("2026-03-08T15:30:00Z"),
  },
  // ... more fixtures for various moods, tags, and dates
];
```

### 10.5 Test Commands

```bash
bun test                  # Run all tests in watch mode
bun test --run            # Run all tests once (CI)
bun api:test              # Run API tests only
bun app:test              # Run app tests only
bun test --coverage       # Run with coverage report
```

---

## 11. Tooling and Skills Requirements

### 11.1 Context7 MCP Tools (MANDATORY)

All library documentation lookups during implementation MUST use Context7 MCP tools. These tools ensure up-to-date documentation is consulted rather than relying on potentially outdated training data.

**Tool: `mcp__plugin_context7_context7__resolve-library-id`**
- **Purpose:** Resolve a library name to a Context7-compatible library ID before fetching documentation.
- **When to Use:** Before any `query-docs` call, resolve the library name first.
- **Example Libraries to Resolve:**
  - `tanstack-router` for route file conventions and `createFileRoute` API
  - `tanstack-query` for `useInfiniteQuery`, `useMutation`, query invalidation
  - `drizzle-orm` for schema definition, relations, query builder, aggregations
  - `hono` for middleware, SSE streaming, context variables
  - `trpc` for router definition, procedure types, error handling
  - `better-auth` for session management, plugins, middleware
  - `shadcn-ui` for component API, styling conventions
  - `tailwindcss` for v4 utility syntax, theme configuration
  - `recharts` for BarChart, LineChart, ResponsiveContainer API
  - `anthropic-sdk` for messages API, streaming, error handling
  - `react-email` for email template components
  - `vitest` for test configuration, mocking, coverage
  - `jotai` for atom definition, provider setup
  - `zod` for schema validation, enum definition, transform

**Tool: `mcp__plugin_context7_context7__query-docs`**
- **Purpose:** Fetch current documentation and code examples for a resolved library.
- **When to Use:** When implementing any feature that uses an external library, to verify API signatures, configuration options, and best practices.
- **Mandatory Lookups by Feature:**

| Feature | Libraries to Query |
|---------|-------------------|
| Database schema | `drizzle-orm` (pgTable, relations, indexes) |
| tRPC routers | `trpc` (router, procedure, error codes), `zod` (validation) |
| Journal page routing | `tanstack-router` (createFileRoute, dynamic routes) |
| Timeline infinite scroll | `tanstack-query` (useInfiniteQuery, getNextPageParam) |
| AI streaming | `anthropic-sdk` (messages.stream, events) |
| SSE endpoint | `hono` (streaming response, SSE) |
| Charts | `recharts` (BarChart, LineChart, ResponsiveContainer) |
| UI components | `shadcn-ui` (Badge, Toast, AlertDialog) |
| Mood selector a11y | MDN ARIA radiogroup pattern (web search) |

### 11.2 Claude API Skill (`/claude-api`)

The `/claude-api` skill MUST be invoked for the following implementation tasks:

1. **Server-side Anthropic SDK integration:**
   - Installing and configuring `@anthropic-ai/sdk` in the API worker.
   - Creating the request-scoped Anthropic client (`apps/api/lib/anthropic.ts`).
   - Handling API key authentication and error responses.

2. **Streaming responses:**
   - Implementing `anthropic.messages.stream()` for real-time token delivery.
   - Converting Anthropic stream events to SSE format for the Hono endpoint.
   - Handling stream interruptions, timeouts, and reconnection.

3. **System prompt engineering:**
   - Crafting the supportive companion persona system prompt.
   - Testing prompt variations for appropriate tone and brevity.
   - Ensuring the model respects the 1-2 sentence constraint.

4. **Safety guardrails:**
   - Implementing pre-call crisis keyword detection.
   - Configuring the system prompt to handle sensitive content appropriately.
   - Testing edge cases (multilingual crisis expressions, indirect references).

### 11.3 Frontend Design Skill (`/frontend-design`)

The `/frontend-design` skill MUST be invoked for the following implementation tasks:

1. **Landing page hero section:**
   - Calm color palette selection (oklch values for sage, ivory, lavender).
   - Typography scale and spacing for the "breathable" aesthetic.
   - Hero illustration/graphic style direction.
   - CTA button styling (rounded, soft shadows, calm hover states).

2. **Mood selector visual UI:**
   - Card layout, sizing, and responsive breakpoints.
   - Icon selection and sizing within cards.
   - Color assignment per mood (ensuring accessibility contrast ratios).
   - Active/selected state animation (scale, shadow, border).
   - Transition timing and easing functions.

3. **Contextual tag chips:**
   - Chip sizing, border-radius, and spacing.
   - Selected vs. unselected visual states.
   - Color coordination with the overall calm aesthetic.

4. **Dynamic timeline with color-coded cards:**
   - Card layout with left-border mood color indicator.
   - Date group header styling.
   - Card hover and focus states.
   - Responsive layout (single column on mobile, comfortable width on desktop).

5. **Weekly insights chart visualization:**
   - Chart color scheme matching mood colors.
   - Axis label styling, grid line treatment.
   - Tooltip design for data points.
   - Empty state illustration.

6. **Overall calm design system:**
   - CSS custom property definitions for the Serene theme.
   - Light/dark mode adaptations that maintain the "calm" feel.
   - Animation timing (subtle, never jarring -- 200-300ms transitions).
   - Border radius, shadow depth, and spacing scale.

### 11.4 Browser Automation Tools (Visual QA)

**Available MCP Tools:**
- `mcp__claude-in-chrome__*` -- Browser automation tools for end-to-end testing and visual quality assurance.

**Use Cases:**
- Visual regression testing of the calm UI aesthetic across viewport sizes.
- Verifying mood selector interaction states in a real browser.
- Testing SSE streaming UI behavior end-to-end.
- Checking chart rendering with actual data.
- Accessibility audit via browser DevTools integration.

---

## 12. Docker and DevOps Requirements

### 12.1 Docker Compose Updates

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

### 12.2 `.env.example` Updates

Add to `.env.example`:
```
# Anthropic Claude API (required for AI Vibe Check feature)
# https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 12.3 Seed Script Updates

**File:** `db/seed.ts` (extend existing)

Add journal entry seed data for the development user:
- 15-20 sample entries across the past 14 days.
- Mix of all mood types and tag combinations.
- Notes of varying lengths (some < 50 chars, some > 50 chars).
- Pre-generated AI responses for entries with notes >= 50 chars.

### 12.4 Health Check Extension

Update `apps/api/lib/app.ts` health endpoint to include Anthropic API connectivity check:

```typescript
app.get("/health", async (c) => {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "ok",    // existing
      anthropic: "ok",   // new: ping Anthropic API
    },
  };
  return c.json(checks);
});
```

---

## 13. Non-Functional Requirements

### 13.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Landing page LCP | < 2.0s | Lighthouse audit |
| Journal page TTI | < 3.0s | Lighthouse audit |
| Entry save latency | < 500ms (P95) | Server-side timing |
| AI first token latency | < 2.0s (P95) | SSE first event timing |
| AI complete response time | < 5.0s (P95) | SSE done event timing |
| Timeline page load (20 entries) | < 800ms (P95) | tRPC query timing |
| Analytics query (30-day trend) | < 1.0s (P95) | tRPC query timing |

### 13.2 Security

| Requirement | Implementation |
|-------------|---------------|
| Data isolation | All DB queries filter by `ctx.user.id`; no cross-user data access |
| Input sanitization | Zod validation on all tRPC inputs; max lengths enforced |
| XSS prevention | React's built-in escaping; no `dangerouslySetInnerHTML` |
| CSRF protection | Better Auth's built-in CSRF tokens |
| Rate limiting | 20 AI requests/user/hour; standard auth rate limits via Better Auth |
| Secure headers | Hono `secureHeaders()` middleware (CSP, X-Frame-Options, etc.) |
| API key protection | `ANTHROPIC_API_KEY` server-side only; never exposed to client |
| Session security | HTTP-only, secure, same-site cookies via Better Auth |
| SQL injection | Drizzle ORM parameterized queries; no raw SQL |
| Content storage | Journal notes stored as plain text; no executable content |

### 13.3 Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements focusable and operable via keyboard |
| Screen reader support | ARIA roles, labels, and live regions for dynamic content |
| Color contrast | All text meets 4.5:1 contrast ratio (normal text), 3:1 (large text) |
| Focus indicators | Visible focus rings on all interactive elements |
| Reduced motion | Respect `prefers-reduced-motion` media query |
| Form labels | All inputs have associated labels (explicit or aria-label) |
| Error announcements | Form errors announced via `aria-live="polite"` |
| Chart accessibility | Charts include text-based data tables as alternatives |

### 13.4 Scalability Considerations

- **Database:** Composite index on `(userId, createdAt)` supports efficient pagination.
- **AI rate limiting:** Per-user rate limiting prevents runaway API costs.
- **Pagination:** Cursor-based pagination avoids `OFFSET` performance degradation.
- **Caching:** TanStack Query client-side caching reduces redundant API calls (2-minute stale time).
- **Worker cold starts:** Cloudflare Workers cold start is typically < 50ms; no special optimization needed.

### 13.5 Data Privacy

- No journal data is shared with third parties except the Anthropic API for AI analysis.
- Anthropic API calls use the note text, mood, and tags only -- no user identification is sent.
- Users can delete individual entries (hard delete, including AI responses).
- Future consideration: full account data export and account deletion (GDPR compliance).

---

## 14. Implementation Phases and Milestones

### Phase 1: Foundation (Days 1-3)

**Goal:** Database schema, shared types, and core API infrastructure.

**Tasks:**
1. Create `db/schema/journal.ts` and `db/schema/ai-response.ts`.
2. Update `db/schema/index.ts` with new exports.
3. Create `packages/core/src/journal.ts` with mood types, tag types, mood scores, and color mappings.
4. Write unit tests for shared types and utilities.
5. Run `bun db:push` to sync schema.
6. Update `.env.example` with `ANTHROPIC_API_KEY`.
7. Update `docker-compose.yml` with new environment variable.

**Definition of Done for Phase 1:**
- [ ] Database tables `journal_entry` and `ai_response` exist and accept inserts.
- [ ] Shared types compile and pass unit tests.
- [ ] `bun db:push` succeeds.
- [ ] `docker-compose up` runs without errors.

### Phase 2: Journal CRUD API (Days 4-7)

**Goal:** Complete tRPC journal router with full test coverage.

**Tasks:**
1. Write failing tests for `journal.create`, `journal.list`, `journal.getById`, `journal.update`, `journal.delete`.
2. Implement `apps/api/routers/journal.ts`.
3. Register journal router in `apps/api/lib/app.ts`.
4. Write integration tests verifying ownership enforcement.
5. Write tests for pagination (cursor-based).
6. Write tests for input validation (invalid moods, oversized notes).

**Definition of Done for Phase 2:**
- [ ] All 5 journal CRUD procedures pass tests.
- [ ] Ownership enforcement tested (user A cannot read user B's entries).
- [ ] Cursor pagination tested with 50+ fixture entries.
- [ ] Input validation rejects invalid moods, tags, and notes > 5000 chars.

### Phase 3: AI Vibe Check API (Days 8-11)

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
9. Implement rate limiting.

**Definition of Done for Phase 3:**
- [ ] AI vibe check generates appropriate responses for test fixtures.
- [ ] Crisis content detection catches all defined keywords.
- [ ] Gibberish detection returns generic response for nonsensical input.
- [ ] Streaming endpoint sends SSE events correctly.
- [ ] Rate limiting returns 429 after 20 requests/hour.
- [ ] Anthropic API errors are handled gracefully (retry, fallback message).

### Phase 4: Journal Frontend (Days 12-17)

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

### Phase 5: Analytics Frontend (Days 18-21)

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

### Phase 6: Landing Page, Documentation, and Polish (Days 22-27)

**Goal:** Calm landing page, Serene README, Cloudflare deployment docs, branding updates, and final polish.

**Tasks:**
1. Replace `apps/web/pages/index.astro` content with Serene landing page.
2. Update `apps/web/pages/features.astro` with Serene features.
3. Update `apps/web/pages/pricing.astro` (or remove if not applicable).
4. Update CSS variables in `apps/web/styles/globals.css` and `apps/app/styles/globals.css` for calm theme.
5. Update branding (APP_NAME, sidebar title, meta tags).
6. Update seed data with realistic journal entries.
7. Write seed script additions for journal data.
8. **Rewrite `README.md`** — completely replace the React Starter Kit template README with Serene-specific content (see Section 16 for full requirements). Remove all template branding, sponsor badges, and third-party assistant links.
9. **Create `docs/deployment/serene-deployment-guide.md`** — end-to-end Cloudflare deployment guide covering Terraform provisioning, Wrangler secrets (including `ANTHROPIC_API_KEY`), build/deploy commands, post-deployment verification, and multi-environment strategy (see Section 17.3).
10. **Create `docs/deployment/serene-infrastructure-reference.md`** — technical reference with architecture diagram, Terraform variable reference, worker naming conventions, and Wrangler environment variable tables (see Section 17.3).
11. **Update `docs/deployment/cloudflare.md`** and `docs/deployment/index.md` with links to new Serene-specific guides.
12. **Update `terraform.tfvars.example`** files — set `project_slug` default to `serene` in all environments.
13. **Update Wrangler configs** — rename workers to `serene-web`, `serene-app`, `serene-api` in all three `wrangler.jsonc` files. Update `APP_NAME` to "Serene".
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

### Phase 7: Integration Testing and QA (Days 28-30)

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

## 15. Definition of Done

A feature is considered DONE when ALL of the following criteria are met:

### Code Quality
- [ ] Code follows project style guide (Prettier, ESLint -- zero warnings).
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

### Documentation
- [ ] README.md is fully rewritten for Serene (no template references remain).
- [ ] Cloudflare deployment guide exists in `docs/deployment/`.
- [ ] Infrastructure setup guide exists in `docs/deployment/`.
- [ ] All environment variables documented in `.env.example` with comments.

---

## 16. README.md Rewrite Requirements

### 16.1 Mandate

The current `README.md` is the unmodified React Starter Kit template README. It references `kriasoft/react-starter-kit`, sponsor badges, ChatGPT/Gemini assistant links, and other template-specific content. **This MUST be completely rewritten** to represent the Serene product.

### 16.2 Current State (to be replaced entirely)

The existing README contains:
- React Starter Kit branding, badges, and sponsor images
- Generic template "Highlights" section
- Links to `reactstarter.com` documentation
- Sponsor/backer/contributor image grids
- ChatGPT and Gemini assistant links
- Template contributing guide reference

**None of the above should remain in the final README.**

### 16.3 Required README Structure

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

### 16.4 Acceptance Criteria for README

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

---

## 17. Cloudflare Infrastructure Deployment Guide

### 17.1 Mandate

The project template includes a complete Cloudflare deployment pipeline (Terraform modules, Wrangler configs, multi-environment support). The existing `docs/deployment/cloudflare.md` documents the generic template setup. **New Serene-specific deployment documentation MUST be created** to guide deployment of the complete Serene application including the AI features.

### 17.2 Existing Infrastructure Assets

The following are already in place and must be leveraged (not rebuilt):

| Asset | Location | Purpose |
|-------|----------|---------|
| **Terraform edge stack** | `infra/stacks/edge/main.tf` | Provisions 3 Workers (web, app, api) + Hyperdrive + DNS |
| **Terraform modules** | `infra/modules/cloudflare/` | Atomic resources: `worker`, `hyperdrive`, `dns`, `r2-bucket` |
| **Environment configs** | `infra/envs/{dev,preview,staging,prod}/edge/` | Per-environment Terraform roots with `terraform.tfvars.example` |
| **Wrangler configs** | `apps/{web,app,api}/wrangler.jsonc` | Per-worker deployment config with service bindings |
| **Existing deployment docs** | `docs/deployment/cloudflare.md` | Template-level Cloudflare deployment guide |
| **Production database docs** | `docs/deployment/production-database.md` | Neon + Hyperdrive setup guide |
| **CI/CD docs** | `docs/deployment/ci-cd.md` | CI/CD pipeline documentation |

### 17.3 New Documentation Requirements

#### Document 1: `docs/deployment/serene-deployment-guide.md`

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

    | Service | Free Tier | Estimated Monthly (100 DAU) |
    |---------|-----------|----------------------------|
    | Cloudflare Workers | 100K requests/day free | $0 (well within free tier) |
    | Cloudflare Hyperdrive | Included with Workers | $0 |
    | Neon PostgreSQL | 0.5 GB storage, 190 compute hours free | $0-19 (Free or Launch tier) |
    | Anthropic Claude API | Pay per token | $7-12 (see Section 8.6) |
    | Custom domain (optional) | N/A | $10-15/year |
    | **Total** | | **$7-31/month** |

11. **Troubleshooting**
    - Worker not found: verify Terraform applied and worker names match `wrangler.jsonc`
    - Hyperdrive connection refused: verify `neon_database_url` in Terraform vars and Hyperdrive IDs in `wrangler.jsonc`
    - AI vibe check fails: verify `ANTHROPIC_API_KEY` secret is set on the API worker
    - CORS errors: verify `ALLOWED_ORIGINS` includes the production domain
    - Service binding errors: verify all three workers are deployed and binding names match

#### Document 2: `docs/deployment/serene-infrastructure-reference.md`

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

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `cloudflare_api_token` | Yes | Cloudflare API token with Workers + DNS permissions |
   | `cloudflare_account_id` | Yes | Cloudflare account ID |
   | `project_slug` | Yes | Base name for workers (use `serene`) |
   | `environment` | Yes | `dev`, `staging`, or `prod` |
   | `neon_database_url` | Yes | Neon PostgreSQL connection string |
   | `cloudflare_zone_id` | No | Required for custom domain |
   | `hostname` | No | Custom domain hostname |

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

   | Variable | Type | Per-Env | Description |
   |----------|------|---------|-------------|
   | `ENVIRONMENT` | var | Yes | `development` / `staging` / `production` |
   | `APP_NAME` | var | No | `Serene` |
   | `APP_ORIGIN` | var | Yes | Full origin URL |
   | `ALLOWED_ORIGINS` | var | Yes | Comma-separated CORS origins |
   | `RESEND_EMAIL_FROM` | var | Yes | Sender email address |
   | `BETTER_AUTH_SECRET` | secret | Yes | Auth session signing key |
   | `ANTHROPIC_API_KEY` | secret | Yes | Claude API key for vibe check |
   | `GOOGLE_CLIENT_ID` | secret | Yes | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | secret | Yes | Google OAuth client secret |
   | `RESEND_API_KEY` | secret | Yes | Resend email service key |

6. **Remote State Configuration**
   - R2 backend for Terraform state (recommended for team use)
   - Instructions to copy `infra/templates/backend-r2.example.hcl`
   - State isolation: one state file per environment per stack

### 17.4 Updates to Existing Documentation

#### Update `docs/deployment/cloudflare.md`

Add a notice at the top:

```markdown
::: tip Serene-Specific Guide
For the complete Serene deployment walkthrough including AI configuration,
see [Serene Deployment Guide](./serene-deployment-guide.md).
:::
```

#### Update `docs/deployment/index.md`

Add navigation links to the new Serene-specific guides:

```markdown
## Serene Deployment
- [Serene Deployment Guide](./serene-deployment-guide.md) — End-to-end production deployment
- [Serene Infrastructure Reference](./serene-infrastructure-reference.md) — Terraform and Wrangler technical reference
```

### 17.5 Acceptance Criteria

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

---

## Appendix A: Mood Type Constants (Shared)

**File:** `packages/core/src/journal.ts`

```typescript
export const MOODS = [
  "Happy",
  "Calm",
  "Anxious",
  "Sad",
  "Overwhelmed",
  "Angry",
] as const;

export type MoodType = (typeof MOODS)[number];

export const MOOD_SCORES: Record<MoodType, number> = {
  Happy: 5,
  Calm: 4,
  Anxious: 2,
  Sad: 2,
  Overwhelmed: 1,
  Angry: 1,
};

export const MOOD_COLORS: Record<MoodType, { light: string; dark: string }> = {
  Happy: { light: "oklch(0.85 0.15 145)", dark: "oklch(0.45 0.15 145)" },
  Calm: { light: "oklch(0.85 0.10 220)", dark: "oklch(0.45 0.10 220)" },
  Anxious: { light: "oklch(0.85 0.15 75)", dark: "oklch(0.45 0.15 75)" },
  Sad: { light: "oklch(0.85 0.10 260)", dark: "oklch(0.45 0.10 260)" },
  Overwhelmed: { light: "oklch(0.85 0.15 30)", dark: "oklch(0.45 0.15 30)" },
  Angry: { light: "oklch(0.85 0.18 25)", dark: "oklch(0.45 0.18 25)" },
};

export const MOOD_ICONS: Record<MoodType, string> = {
  Happy: "Smile",
  Calm: "CloudSun",
  Anxious: "Zap",
  Sad: "CloudRain",
  Overwhelmed: "Waves",
  Angry: "Flame",
};

export const TAGS = [
  "Work",
  "Sleep",
  "Relationships",
  "Fitness",
  "Hobbies",
  "Health",
  "Social",
  "Nature",
] as const;

export type TagType = (typeof TAGS)[number];

export const TAG_ICONS: Record<TagType, string> = {
  Work: "Briefcase",
  Sleep: "Moon",
  Relationships: "Heart",
  Fitness: "Dumbbell",
  Hobbies: "Palette",
  Health: "Stethoscope",
  Social: "Users",
  Nature: "TreePine",
};
```

## Appendix B: Crisis Keywords List

**File:** `apps/api/lib/safety.ts`

```typescript
export const CRISIS_KEYWORDS = [
  "suicide",
  "suicidal",
  "kill myself",
  "end my life",
  "self-harm",
  "self harm",
  "cutting myself",
  "hurt myself",
  "want to die",
  "don't want to live",
  "no reason to live",
  "end it all",
  "better off dead",
  "can't go on",
  "not worth living",
] as const;

export const SAFETY_DISCLAIMER =
  "If you're in crisis, please reach out to the 988 Suicide and Crisis Lifeline " +
  "by calling or texting 988, or contact the Crisis Text Line by texting HOME to " +
  "741741. You're not alone.";

export const GENERIC_RESPONSE =
  "Thanks for checking in today. Even showing up to journal is a positive step.";

export function detectCrisisContent(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return CRISIS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isGibberish(text: string): boolean {
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  return words.length < 3;
}
```

## Appendix C: Environment Variable Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | (none) | Anthropic Claude API key for AI vibe check |
| `APP_NAME` | Yes | "Serene" | Application display name |
| All existing env vars | Yes | (unchanged) | See `.env.example` for full list |

---

**End of Document**

*This PRD is a living document. Updates should be versioned and reviewed by stakeholders before implementation begins.*

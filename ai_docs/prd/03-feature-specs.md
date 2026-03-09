# 4. Feature Specifications

> **Context:** Detailed specs for each feature domain. References user stories from `02-user-stories.md`. Implementation skills (`/frontend-design`, `/claude-api`) noted inline.

---

## 4A. Landing Page and Onboarding

### 4A.1 Hero Section

**Location:** `apps/web/pages/index.astro` (replace existing starter kit content)

**Design Requirements:**

- Color palette: Soft sage green (`oklch(0.85 0.05 155)`), warm ivory background, muted lavender accents.
- Typography: Large, breathable headings with generous letter-spacing. Body text at comfortable reading size (18px).
- Hero image or illustration: Abstract, calming graphic (waves, gradients, or minimalist nature motifs). No photographs of people.
- Whitespace: Minimum 80px vertical padding between sections.
- Animation: Subtle fade-in on scroll (CSS-only, no heavy JS animation libraries).

**Content Structure:**

1. **Headline:** "Find Your Calm. One Entry at a Time."
2. **Subheadline:** "Serene is your private AI-powered wellness journal. Log your mood, write your thoughts, and receive gentle encouragement — all in under 60 seconds."
3. **Primary CTA:** "Start Journaling" (links to `/signup`)
4. **Secondary CTA:** "Learn More" (scrolls to How It Works section)
5. **How It Works:** Three-step visual flow (Log Mood -> Write Reflection -> Get AI Insight)
6. **Features Grid:** 3 cards (Private Journaling, AI Companion, Mood Insights)
7. **CTA Repeat:** "Begin Your Wellness Journey" (links to `/signup`)

**Implementation Skill:** `/frontend-design` MUST be invoked for all visual design decisions on this page.

### 4A.2 Authentication

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

### 4A.3 Privacy Enforcement

- All journal tRPC procedures use `protectedProcedure` (enforces `ctx.user` and `ctx.session` non-null).
- Every database query on `journalEntry` filters by `WHERE userId = ctx.user.id`.
- Server-side ownership validation on all mutating operations (update, delete).
- No admin or cross-user entry access endpoints.

---

## 4B. Mood Journaling and Analytics

### 4B.1 Interactive Mood Entry

**Mood Values and Metadata:**

| Mood        | Score | Color (light)                   | Color (dark)           | Icon (lucide-react) |
| ----------- | ----- | ------------------------------- | ---------------------- | ------------------- |
| Happy       | 5     | `oklch(0.85 0.15 145)` (green)  | `oklch(0.45 0.15 145)` | `Smile`             |
| Calm        | 4     | `oklch(0.85 0.10 220)` (blue)   | `oklch(0.45 0.10 220)` | `CloudSun`          |
| Anxious     | 2     | `oklch(0.85 0.15 75)` (amber)   | `oklch(0.45 0.15 75)`  | `Zap`               |
| Sad         | 2     | `oklch(0.85 0.10 260)` (indigo) | `oklch(0.45 0.10 260)` | `CloudRain`         |
| Overwhelmed | 1     | `oklch(0.85 0.15 30)` (orange)  | `oklch(0.45 0.15 30)`  | `Waves`             |
| Angry       | 1     | `oklch(0.85 0.18 25)` (red)     | `oklch(0.45 0.18 25)`  | `Flame`             |

**Tag Values:**

| Tag           | Icon (lucide-react) |
| ------------- | ------------------- |
| Work          | `Briefcase`         |
| Sleep         | `Moon`              |
| Relationships | `Heart`             |
| Fitness       | `Dumbbell`          |
| Hobbies       | `Palette`           |
| Health        | `Stethoscope`       |
| Social        | `Users`             |
| Nature        | `TreePine`          |

These values are defined as TypeScript constants in `packages/core/src/journal.ts` and shared between API validation (Zod enums) and frontend rendering.

### 4B.2 Dynamic Timeline

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

### 4B.3 Visual Insights

**Chart Library:** Recharts (React-native charting, already compatible with the stack).

**Charts:**

1. **Weekly Mood Distribution Bar Chart** (US-AN-001): Horizontal bar chart grouped by mood type.
2. **30-Day Mood Trend Line Chart** (US-AN-002): Area chart with daily average mood scores.
3. **Tag Correlation Summary** (US-AN-003): Simple table/list view (no chart library dependency).

---

## 4C. AI Vibe Check

### 4C.1 System Prompt

```
You are Serene's AI companion — a warm, supportive, and non-judgmental presence.
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
9. If the user's note expresses genuine suicidal ideation, self-harm intent, or a desire to end their life, begin your response with the exact marker [CRISIS_DETECTED]. Only flag genuine distress — do not flag casual expressions like "that killed me" or "I'm dying of laughter."

Context provided:
- Mood: {mood}
- Tags: {tags}
- Note: {note}
```

### 4C.2 API Integration

- **Provider:** Anthropic Claude API (NOT the existing OpenAI integration).
- **Model:** `claude-sonnet-4-20250514` (cost-effective for short responses).
- **Max Tokens:** 150 (enforces brevity).
- **Temperature:** 0.7 (warm but not erratic).
- **Streaming:** Server-Sent Events (SSE) via direct Hono SSE endpoint.

### 4C.3 Safety Guardrails Implementation

**Dual-Layer Crisis Detection:**

Crisis detection uses two complementary layers to minimize both false negatives (missing real crises) and false positives (flagging benign content):

**Layer 1: Keyword Pre-Screen (server-side, pre-AI-call)**

A fast keyword check flags _potential_ crisis content before calling the AI. This layer errs on the side of caution — false positives are refined by Layer 2.

```typescript
const CRISIS_KEYWORDS = [
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
  "kms",
  "kys",
];
```

**Layer 2: AI Context Detection (via Claude system prompt)**

The system prompt includes an instruction to assess crisis content contextually:

> Rule 9: If the user's note expresses genuine suicidal ideation, self-harm intent, or a desire to end their life, begin your response with the exact marker `[CRISIS_DETECTED]`. Only flag genuine distress — do not flag casual expressions like "that killed me" or "I'm dying of laughter."

The server parses the AI response for the `[CRISIS_DETECTED]` marker, strips it before displaying, and sets `hasCrisisContent: true` on the AI response record.

**Combined Logic:**

1. Normalize note text (lowercase, trim).
2. Run keyword pre-screen (Layer 1).
3. Send note to Claude API with crisis detection instruction (Layer 2).
4. Parse AI response for `[CRISIS_DETECTED]` marker.
5. Final `hasCrisisContent = keywordCrisisFlag || aiCrisisFlag`.
6. If `hasCrisisContent`, prepend safety disclaimer to the AI response.
7. Still deliver the empathetic response — never refuse to respond.

**Prominent Disclaimer:**
A persistent, non-dismissible notice is displayed on first use of the journal feature: "Serene is not a substitute for professional mental health care. If you are in crisis, please contact the 988 Suicide and Crisis Lifeline." This disclaimer also appears in the app footer.

**Gibberish Detection:**

- If note text has fewer than 3 dictionary words (simple heuristic: words > 2 chars), return a generic response without calling the AI.
- Generic response: "Thanks for checking in today. Even showing up to journal is a positive step."

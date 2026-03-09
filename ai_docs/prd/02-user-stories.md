# 3. User Stories and Acceptance Criteria

> **Context:** 24 user stories organized by domain. Each has testable acceptance criteria (checkboxes). Use these when writing TDD tests and validating features.

---

## 3.1 Landing Page and Onboarding

### US-LP-001: View Landing Page

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

### US-LP-002: Sign Up for Account

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

**NOTE:** Leverages existing `apps/app/routes/(auth)/signup.tsx` and Better Auth configuration. No new auth infrastructure required.

### US-LP-003: Log In to Existing Account

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

## 3.2 Mood Journaling

### US-MJ-001: Create Mood Entry via Mood Selector

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

### US-MJ-002: Add Contextual Tags to Entry

**As a** logged-in user,
**I want to** tag my mood entry with relevant life activities,
**so that** I can correlate my mood with specific contexts over time.

**Acceptance Criteria:**

- [ ] AC-1: Tag chips are displayed for at least 8 predefined categories: Work, Sleep, Relationships, Fitness, Hobbies, Health, Social, Nature.
- [ ] AC-2: User can select zero or more tags (multi-select).
- [ ] AC-3: Selected chips show a filled/active visual state; unselected show an outlined state.
- [ ] AC-4: Tags are optional — entry can be saved without selecting any tags.
- [ ] AC-5: Tag chips are accessible via keyboard (Tab to navigate, Space/Enter to toggle).

### US-MJ-003: Write Reflective Note

**As a** logged-in user,
**I want to** write a free-form text reflection about my mood,
**so that** I can process my thoughts and trigger the AI vibe check.

**Acceptance Criteria:**

- [ ] AC-1: Text area is displayed below the tags section with placeholder text: "What's on your mind? Write at least 50 characters to receive an AI insight..."
- [ ] AC-2: Character count is displayed below the text area (e.g., "42 / 50 characters").
- [ ] AC-3: When character count reaches 50, a visual indicator confirms AI insight will be generated.
- [ ] AC-4: Note field is optional — entry can be saved without a note.
- [ ] AC-5: Notes with fewer than 50 characters are saved but do not trigger AI analysis.
- [ ] AC-6: Maximum note length is 5,000 characters, enforced by both client-side validation and server-side validation.
- [ ] AC-7: Text area auto-expands as user types (up to a maximum height).

### US-MJ-004: Save Journal Entry

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

### US-MJ-005: View Journal Timeline

**As a** logged-in user,
**I want to** see my past journal entries in a chronological feed,
**so that** I can review my emotional history.

**Acceptance Criteria:**

- [ ] AC-1: Timeline displays entries grouped by date sections: "Today", "Yesterday", "This Week", "Earlier".
- [ ] AC-2: Each entry card shows: mood icon + label, selected tags as chips, note preview (truncated at 150 characters), AI vibe check response (if generated), timestamp.
- [ ] AC-3: Entry cards are color-coded by mood (e.g., Happy = green tint, Anxious = amber tint, Sad = blue tint).
- [ ] AC-4: Timeline loads with infinite scroll or "Load More" pagination (20 entries per page).
- [ ] AC-5: Empty state shows encouraging message: "Start your wellness journey — log your first mood entry."
- [ ] AC-6: Most recent entries appear at the top.
- [ ] AC-7: Entries belong only to the authenticated user; no cross-user data leakage.
- [ ] AC-8: Timeline updates in real-time after creating, editing, or deleting entries.

### US-MJ-006: View Full Entry Detail

**As a** logged-in user,
**I want to** click on a timeline entry to see its full details,
**so that** I can read the complete note and AI response.

**Acceptance Criteria:**

- [ ] AC-1: Clicking an entry card expands it or navigates to a detail view.
- [ ] AC-2: Detail view shows full note text (not truncated).
- [ ] AC-3: Detail view shows the complete AI vibe check response.
- [ ] AC-4: Detail view includes Edit and Delete action buttons.
- [ ] AC-5: Back navigation returns to the same scroll position in the timeline.

### US-MJ-007: Edit Existing Entry

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

### US-MJ-008: Delete Entry

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

## 3.3 AI Vibe Check

### US-AI-001: Receive AI Vibe Check After Saving Entry

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
- [ ] AC-7: AI response generation does not block the entry save operation — the entry is saved first, then AI generates asynchronously.

### US-AI-002: AI Safety Guardrails

**As a** user in distress,
**I want to** see appropriate resources if I express highly sensitive content,
**so that** I am directed toward professional help when needed.

**Acceptance Criteria:**

- [ ] AC-1: If note text contains crisis-related keywords (e.g., "suicide", "self-harm", "end my life"), the AI response is prepended with a standard safety disclaimer.
- [ ] AC-2: Safety disclaimer text: "If you're in crisis, please reach out to the 988 Suicide and Crisis Lifeline by calling or texting 988, or contact the Crisis Text Line by texting HOME to 741741. You're not alone."
- [ ] AC-3: The disclaimer is displayed in a visually distinct format (warning-style card with a phone icon).
- [ ] AC-4: The AI still provides an empathetic response after the disclaimer — it does not refuse to respond.
- [ ] AC-5: Empty notes or notes with fewer than 50 characters do not trigger AI analysis (no error, just no response).
- [ ] AC-6: Gibberish or nonsensical input receives a generic encouraging response: "Thanks for checking in today. Even showing up to journal is a positive step."

### US-AI-003: View AI Response History

**As a** logged-in user,
**I want to** see past AI vibe check responses on my timeline entries,
**so that** I can revisit the AI's encouragement.

**Acceptance Criteria:**

- [ ] AC-1: Each timeline entry card that has an AI response shows it below the note text.
- [ ] AC-2: AI response is visually distinguished from user-written content (e.g., different background, AI icon, italic text).
- [ ] AC-3: Entries without AI responses (note < 50 chars or no note) show no AI section.

---

## 3.4 Visual Insights and Analytics

### US-AN-001: View Weekly Mood Summary

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

### US-AN-002: View Mood Trend Over Time

**As a** logged-in user,
**I want to** see how my overall mood has trended over the past 30 days,
**so that** I can understand my emotional trajectory.

**Acceptance Criteria:**

- [ ] AC-1: A line or area chart shows average mood score per day for the past 30 days.
- [ ] AC-2: Moods are mapped to numerical scores for averaging: Happy=5, Calm=4, Anxious=2, Sad=2, Overwhelmed=1, Angry=1.
- [ ] AC-3: Days without entries are shown as gaps in the line (not interpolated).
- [ ] AC-4: Chart includes a horizontal reference line at the "neutral" score (3).
- [ ] AC-5: Hovering over a data point shows the date, mood count breakdown, and average score.

### US-AN-003: View Tag Correlation Insights

**As a** logged-in user,
**I want to** see which activities correlate with my moods,
**so that** I can make informed lifestyle choices.

**Acceptance Criteria:**

- [ ] AC-1: A summary section shows each tag's average mood score based on all entries with that tag.
- [ ] AC-2: Tags are sorted by average mood score (highest to lowest).
- [ ] AC-3: Each tag row shows: tag name, number of entries with this tag, average mood score, a visual indicator (green for positive, amber for neutral, red for negative).
- [ ] AC-4: Only tags that appear in >= 3 entries are included (insufficient data message for others).

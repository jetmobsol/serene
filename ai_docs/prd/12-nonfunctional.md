# 13. Non-Functional Requirements

> **Context:** Performance targets, security requirements, accessibility standards, privacy. Reference during quality audits and reviews.

---

## 13.1 Performance

| Metric                          | Target        | Measurement            |
| ------------------------------- | ------------- | ---------------------- |
| Landing page LCP                | < 2.0s        | Lighthouse audit       |
| Journal page TTI                | < 3.0s        | Lighthouse audit       |
| Entry save latency              | < 500ms (P95) | Server-side timing     |
| AI first token latency          | < 2.0s (P95)  | SSE first event timing |
| AI complete response time       | < 5.0s (P95)  | SSE done event timing  |
| Timeline page load (20 entries) | < 800ms (P95) | tRPC query timing      |
| Analytics query (30-day trend)  | < 1.0s (P95)  | tRPC query timing      |

## 13.2 Security

| Requirement        | Implementation                                                      |
| ------------------ | ------------------------------------------------------------------- |
| Data isolation     | All DB queries filter by `ctx.user.id`; no cross-user data access   |
| Input sanitization | Zod validation on all tRPC inputs; max lengths enforced             |
| XSS prevention     | React's built-in escaping; no `dangerouslySetInnerHTML`             |
| CSRF protection    | Better Auth's built-in CSRF tokens                                  |
| Rate limiting      | 20 AI requests/user/hour; standard auth rate limits via Better Auth |
| Secure headers     | Hono `secureHeaders()` middleware (CSP, X-Frame-Options, etc.)      |
| API key protection | `ANTHROPIC_API_KEY` server-side only; never exposed to client       |
| Session security   | HTTP-only, secure, same-site cookies via Better Auth                |
| SQL injection      | Drizzle ORM parameterized queries; no raw SQL                       |
| Content storage    | Journal notes stored as plain text; no executable content           |

## 13.3 Accessibility (WCAG 2.1 AA)

| Requirement           | Implementation                                                      |
| --------------------- | ------------------------------------------------------------------- |
| Keyboard navigation   | All interactive elements focusable and operable via keyboard        |
| Screen reader support | ARIA roles, labels, and live regions for dynamic content            |
| Color contrast        | All text meets 4.5:1 contrast ratio (normal text), 3:1 (large text) |
| Focus indicators      | Visible focus rings on all interactive elements                     |
| Reduced motion        | Respect `prefers-reduced-motion` media query                        |
| Form labels           | All inputs have associated labels (explicit or aria-label)          |
| Error announcements   | Form errors announced via `aria-live="polite"`                      |
| Chart accessibility   | Charts include text-based data tables as alternatives               |

## 13.4 Scalability Considerations

- **Database:** Composite index on `(userId, createdAt)` supports efficient pagination.
- **AI rate limiting:** Per-user rate limiting prevents runaway API costs.
- **Pagination:** Cursor-based pagination avoids `OFFSET` performance degradation.
- **Caching:** TanStack Query client-side caching reduces redundant API calls (2-minute stale time).
- **Worker cold starts:** Cloudflare Workers cold start is typically < 50ms; no special optimization needed.

## 13.5 Data Privacy and GDPR Compliance

- No journal data is shared with third parties except the Anthropic API for AI analysis.
- Anthropic API calls use the note text, mood, and tags only — no user identification is sent.
- Users can delete individual entries (hard delete, including AI responses).
- **Account deletion (required):** Users can delete their entire account via Settings. Cascading foreign keys (`ON DELETE CASCADE`) ensure all journal entries and AI responses are permanently removed. Satisfies GDPR Article 17 (right to erasure).
- **Data export (required):** Users can export all their data (entries + AI responses) as a JSON file via Settings. Satisfies GDPR Article 20 (right to data portability).
- **Consent at signup:** The signup flow includes explicit consent for: (1) storing journal data, (2) sending note content to Anthropic's Claude API for AI analysis. Consent text links to the privacy policy.
- **Privacy policy page:** Must exist at `/privacy` on the web worker, clearly stating data processing practices, third-party data sharing (Anthropic), and user rights (deletion, export).

> **Note:** Mental health data is classified as "special category data" under GDPR Article 9. These requirements are non-negotiable for launch — not future considerations.

# 11. Tooling and Skills Requirements

> **Context:** Mandatory tools and skills for implementation. Read this BEFORE starting any feature work.

---

## 11.1 Context7 MCP Tools (MANDATORY)

All library documentation lookups during implementation MUST use Context7 MCP tools. These tools ensure up-to-date documentation is consulted rather than relying on potentially outdated training data.

### Tool: `mcp__plugin_context7_context7__resolve-library-id`

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

### Tool: `mcp__plugin_context7_context7__query-docs`

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

## 11.2 Claude API Skill (`/claude-api`)

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

## 11.3 Frontend Design Skill (`/frontend-design`)

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
   - Animation timing (subtle, never jarring — 200-300ms transitions).
   - Border radius, shadow depth, and spacing scale.

## 11.4 Browser Automation Tools (Visual QA)

**Available MCP Tools:**
- `mcp__claude-in-chrome__*` — Browser automation tools for end-to-end testing and visual quality assurance.

**Use Cases:**
- Visual regression testing of the calm UI aesthetic across viewport sizes.
- Verifying mood selector interaction states in a real browser.
- Testing SSE streaming UI behavior end-to-end.
- Checking chart rendering with actual data.
- Accessibility audit via browser DevTools integration.

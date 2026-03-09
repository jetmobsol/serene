# Email Templates

React Email templates built as a workspace package and consumed by the API service.

## Quick Navigation

- [Root Project](../../CLAUDE.md)
- [API Service](../api/CLAUDE.md) (consumes these templates)
- [App (SPA)](../app/CLAUDE.md)
- [Web (Edge Router)](../web/CLAUDE.md)

> **Conventions**: Shared monorepo rules live in the root `CLAUDE.md` and `AGENTS.md`. This file covers email-specific context only.

@AGENTS.md

## Overview

The email app contains transactional email templates:

- Built with React Email for type-safe, component-based email authoring
- Templates are rendered to HTML + plain text by the API service
- Sent via Resend from the API worker
- Must be built before the API dev server starts (build order enforced in root `package.json`)

## Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Templates | React Email                                   |
| Rendering | `renderEmailToHtml()` + `renderEmailToText()` |
| Delivery  | Resend (from API service)                     |
| Package   | `@repo/email` workspace package               |

## Project Structure

```
apps/email/
├── index.ts               # Main exports (3 templates + render fns)
├── templates/             # Published email templates
│   ├── email-verification.tsx
│   ├── password-reset.tsx
│   └── otp-email.tsx
├── components/
│   └── BaseTemplate.tsx   # Shared wrapper (header, footer, logo, colors)
├── emails/                # Preview files for React Email dev server
│   ├── email-verification.tsx
│   ├── password-reset.tsx
│   ├── otp-verification.tsx
│   ├── otp-sign-in.tsx
│   └── otp-password-reset.tsx
├── utils/
│   └── render.ts          # Async: renderEmailToHtml(), renderEmailToText()
├── assets/
│   └── logo.svg           # App logo
└── package.json           # @repo/email workspace package
```

## Key Patterns

### Template Authoring

```tsx
// emails/otp.tsx
import { Html, Head, Body, Text } from "@react-email/components";

export function OtpEmail({ code }: { code: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Your verification code is: {code}</Text>
      </Body>
    </Html>
  );
}
```

### Consuming in API

```typescript
// In API routers
import { OtpEmail, renderEmailToHtml, renderEmailToText } from "@repo/email";

const html = renderEmailToHtml(OtpEmail({ code: "123456" }));
const text = renderEmailToText(OtpEmail({ code: "123456" }));

await resend.emails.send({ html, text, to, subject });
```

### Build Order

Email templates must be built before the API service:

```
email (build) → api (dev/build)
```

This is enforced in the root `package.json` build script.

## Development Commands

```bash
bun email:dev              # Preview emails in browser (React Email dev server)
bun email:build            # Build templates for consumption by API
```

## When Working Here

1. **Adding a template**: Create component in `templates/`, add preview in `emails/`, export from `index.ts`
2. **Both formats required**: Every email must render to both HTML and plain text
3. **Test visually**: Use `bun email:dev` to preview in browser
4. **Validate recipients**: API validates with Zod before sending — keep templates focused on rendering
5. **No side effects**: Templates are pure React components — no API calls, no state

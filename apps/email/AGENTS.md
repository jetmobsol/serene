## Template Components

- Email templates are pure React components in `emails/`.
- No side effects: no API calls, no state, no external dependencies.
- Each template is a function that returns JSX.

## Rendering

- Templates render to two formats: **HTML** and **plain text**.
- Use `renderEmailToHtml()` and `renderEmailToText()` helpers from `index.ts`.
- Both formats must be provided to Resend for full compatibility.

## Build Order

- Email templates must be built before API service starts.
- Enforced in root `package.json` build script.
- This ensures `@repo/email` exports are available when API service builds.

## Exports

- All templates and render helpers exported from `index.ts` (workspace package entry point).
- Import in API routers as `import { TemplateComponent, renderEmailToHtml, renderEmailToText } from "@repo/email"`.

## Testing

- Visually preview templates with `bun email:dev` (React Email dev server).
- Validate recipients in API layer before sending (use Zod schema).

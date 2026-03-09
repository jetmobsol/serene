# Browser Automation (Bowser)

Serene integrates [Bowser](https://github.com/disler/bowser) for automated UI testing via Claude Code. It provides two browser automation modes and a QA framework for validating user stories against the running app.

## Prerequisites

```bash
npm install -g @playwright/cli@latest   # Headless automation
playwright-cli --version                # Verify installation
```

For observable (Chrome) mode, start Claude Code with `--chrome`:

```bash
claude --chrome
```

## Available Skills

| Skill                | Mode                | Parallel | Use When                       |
| -------------------- | ------------------- | -------- | ------------------------------ |
| `/playwright-bowser` | Headless            | Yes      | CI, batch testing, screenshots |
| `/claude-bowser`     | Chrome (observable) | No       | Debugging, visual inspection   |

## Available Commands

| Command                           | Purpose                          |
| --------------------------------- | -------------------------------- |
| `/ui-review`                      | Run all user stories in parallel |
| `/ui-review headed`               | Run stories with visible browser |
| `/ui-review headed auth`          | Run only auth stories, visible   |
| `/bowser:hop-automate <workflow>` | Run a saved workflow             |

## Quick Start

1. Start the dev servers:

```bash
just start
```

2. Run a quick headless test:

```
/playwright-bowser open http://localhost:5173/login and take a screenshot
```

3. Run all user stories:

```
/ui-review
```

## Local Service Ports

| Port | Service     | URL                   |
| ---- | ----------- | --------------------- |
| 5173 | App (SPA)   | http://localhost:5173 |
| 8787 | API         | http://localhost:8787 |
| 4321 | Web (Astro) | http://localhost:4321 |
| 5434 | PostgreSQL  | —                     |

## User Stories

User stories live in `ai_review/user_stories/*.yaml`. The `/ui-review` command discovers them automatically.

### Story Format

```yaml
stories:
  - name: "Login page loads correctly"
    url: "http://localhost:5173/login"
    workflow: |
      Navigate to http://localhost:5173/login
      Verify the login page loads successfully
      Verify an email input field is visible
      Verify a submit/continue button exists
```

### Included Stories

| File              | Stories                                                       |
| ----------------- | ------------------------------------------------------------- |
| `auth.yaml`       | Login page loads, signup page loads, unauthenticated redirect |
| `navigation.yaml` | Login-to-signup navigation, signup-to-login navigation        |

### Adding Stories

Create a new `.yaml` file in `ai_review/user_stories/`. It will be picked up automatically by `/ui-review`.

Stories support multiple formats: simple sentences, step-by-step, BDD (Given/When/Then), narrative with assertions, or checklists. See `.claude/agents/bowser-qa-agent.md` for all formats.

## Justfile Recipes

```bash
just ui-review              # Run all stories headless
just ui-review-headed       # Run all stories with visible browser
```

## Screenshots

QA screenshots are saved to `screenshots/bowser-qa/` (git-ignored), organized by run timestamp:

```
screenshots/bowser-qa/
└── 20260309_143022_a1b2c3/
    ├── auth/
    │   ├── login-page-loads/
    │   │   ├── 00_navigate.png
    │   │   └── 01_verify-email-input.png
    │   └── signup-page-loads/
    └── navigation/
```

## Agents

| Agent                     | Purpose                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `bowser-qa-agent`         | Executes a single user story, screenshots each step, reports pass/fail |
| `playwright-bowser-agent` | Thin wrapper for ad-hoc headless browser tasks                         |

## Saved Workflows

Create reusable workflows in `.claude/commands/bowser/<name>.md` and run them with:

```
/bowser:hop-automate <name>
/bowser:hop-automate <name> headed vision
```

## Troubleshooting

- **`playwright-cli` not found** — Run `npm install -g @playwright/cli@latest`
- **Chrome tools not available** — Restart Claude Code with `claude --chrome`
- **Port conflict** — Kill stale processes: `lsof -i :5173` then `kill <PID>`
- **Screenshots missing** — Check `screenshots/bowser-qa/` exists (created automatically on first run)

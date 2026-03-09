# Ruflo Setup Guide for Serene

> **Purpose:** Step-by-step installation, configuration, and verification of Ruflo (Claude Flow v3) in the Serene project. Includes GLM (z.ai) integration and automated workflow execution.
>
> **Last Updated:** 2026-03-09

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Configuration Files](#3-configuration-files)
4. [MCP Server Setup](#4-mcp-server-setup)
5. [Verification & Doctor](#5-verification--doctor)
6. [GLM Integration (z.ai Models)](#6-glm-integration-zai-models)
7. [Workflow Automation](#7-workflow-automation)
8. [Worktrees for Parallel Execution](#8-worktrees-for-parallel-execution)
9. [Model & CLI Configuration](#9-model--cli-configuration)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before installing Ruflo, verify these are available:

```bash
node --version    # Must be >= 20
npm --version     # Must be >= 9
git --version     # Any recent version
bun --version     # Required for Serene (>= 1.3.0)

# Optional (for GLM integration)
which glm         # z.ai GLM CLI wrapper (at /usr/local/bin/glm)
```

API keys needed:

- `ANTHROPIC_API_KEY` — for Claude AI vibe check feature (required for Serene)
- `GLM_API_KEY` — for z.ai GLM models (optional, for dual-model workflows)

---

## 2. Installation

### Option A: Full Install Script (Recommended)

Run from the Serene project root:

```bash
cd /Users/garden/projects/PinkElephant/serene
curl -fsSL https://cdn.jsdelivr.net/gh/ruvnet/claude-flow@main/scripts/install.sh | bash -s -- --full
```

The `--full` flag:

- Installs `ruflo` globally via npm
- Adds the MCP server to Claude Code
- Runs `npx ruflo doctor` to verify health
- Runs `npx ruflo init` to create config files

### Option B: npx Init Wizard (Interactive)

```bash
cd /Users/garden/projects/PinkElephant/serene
npx ruflo@latest init --wizard
```

Choose:

- Topology: **hierarchical** (anti-drift)
- Max Agents: **8**
- Strategy: **specialized**
- Memory Backend: **hybrid**

### Option C: Manual Step-by-Step

```bash
cd /Users/garden/projects/PinkElephant/serene

# 1. Install CLI globally
npm install -g ruflo@latest

# 2. Initialize config
npx ruflo@latest init

# 3. Add MCP server (creates .mcp.json — see Section 4)
# Done automatically by init, or create manually

# 4. Verify
npx ruflo@latest doctor
```

---

## 3. Configuration Files

After installation, these files exist in the Serene project:

### Files Created

| File                                | Location               | Purpose                                              |
| ----------------------------------- | ---------------------- | ---------------------------------------------------- |
| `claude-flow.config.json`           | Project root           | Main Ruflo config (topology, agents, memory)         |
| `.mcp.json`                         | Project root           | MCP server registration for Claude Code              |
| `.claude-flow/`                     | Project root           | Ruflo working directory (workflows, metrics, memory) |
| `.claude-flow/workflows/store.json` | Inside `.claude-flow/` | Workflow definitions and state                       |
| `.claude-flow/CAPABILITIES.md`      | Inside `.claude-flow/` | Auto-generated feature reference                     |

### claude-flow.config.json (Main Config)

```json
{
  "version": "3.0.0",
  "v3Mode": true,
  "sparc": false,
  "agents": {
    "defaultType": "coder",
    "maxConcurrent": 8,
    "autoSpawn": true,
    "timeout": 300
  },
  "swarm": {
    "topology": "hierarchical",
    "maxAgents": 8,
    "autoScale": true,
    "coordinationStrategy": "specialized"
  },
  "memory": {
    "backend": "hybrid",
    "path": "./data/ruflo-memory",
    "cacheSize": 256,
    "enableHNSW": true
  },
  "mcp": {
    "transport": "stdio",
    "autoStart": true,
    "tools": "all"
  },
  "providers": [
    { "name": "anthropic", "priority": 1, "enabled": true },
    { "name": "openrouter", "priority": 2, "enabled": false },
    { "name": "ollama", "priority": 3, "enabled": false }
  ]
}
```

> **Note:** Set `memory.path` to `./data/ruflo-memory` (not `./data/memory`) to avoid conflicts with Serene's own data directory.

### .gitignore Additions

Add to Serene's `.gitignore`:

```gitignore
# Ruflo
.claude-flow/
data/ruflo-memory/
claude-flow.config.json
.glm.json
```

---

## 4. MCP Server Setup

The MCP server gives Claude Code access to Ruflo's coordination tools (swarm init, memory, agent spawning).

### Configuration via .mcp.json (Recommended)

Create `.mcp.json` in the Serene project root (NOT inside `.claude/settings.json`):

**File:** `/Users/garden/projects/PinkElephant/serene/.mcp.json`

```json
{
  "mcpServers": {
    "claude-flow": {
      "command": "npx",
      "args": ["-y", "claude-flow@v3alpha", "mcp", "start"],
      "transport": "stdio"
    }
  }
}
```

This keeps MCP config separate from permissions/hooks in `.claude/settings.json`.

### Why .mcp.json Instead of settings.json

| Aspect        | `.mcp.json`                          | `.claude/settings.json`            |
| ------------- | ------------------------------------ | ---------------------------------- |
| Purpose       | MCP server definitions only          | Permissions, hooks, plugins        |
| Auto-detected | Yes, by Claude Code on session start | Yes                                |
| Scope         | Project-level (Serene only)          | Project-level                      |
| Separation    | Clean — MCP config isolated          | Mixed — MCP alongside permissions  |
| Conflicts     | None — dedicated file                | Can conflict with permission edits |

### Alternative: Global MCP (All Projects)

```bash
claude mcp add --global claude-flow -- npx -y claude-flow@v3alpha mcp start
# Writes to ~/.claude/settings.json
```

### Verify MCP Registration

Restart Claude Code in the Serene project, then check that `mcp__claude-flow__*` tools are available.

---

## 5. Verification & Doctor

### Quick Health Check

```bash
cd /Users/garden/projects/PinkElephant/serene
npx ruflo@latest doctor
```

Checks: Node.js 20+, npm 9+, git, config validity, daemon, memory DB, API keys, MCP, disk space, TypeScript.

### Auto-Fix Issues

```bash
npx ruflo@latest doctor --fix
```

### Post-Install Runtime Setup

After `init`, two services must be started manually before using swarm or memory features:

**1. Start the daemon** (background coordination across sessions):

```bash
ruflo daemon start
ruflo daemon status   # verify it's running
```

**2. Initialize and start memory** (persistent HNSW search):

```bash
ruflo memory configure --backend hybrid
ruflo memory init --force --verbose
ruflo memory list     # verify it's accessible
```

> **Note on doctor warnings:**
>
> - `⚠ Config File: No config file` — Cosmetic. The CLI checks for a separate internal config; your `.claude-flow/config.yaml` is the actual runtime config and is already correct. Safe to ignore.
> - `⚠ API Keys: No API keys found` — Misleading. Claude Code manages `ANTHROPIC_API_KEY` internally; ruflo's CLI check doesn't see it. Safe to ignore.
> - `⚠ agentic-flow: Not installed` — Optional. Only needed for local embeddings; ruflo uses fallbacks automatically.

### Manual Verification Steps

```bash
# 1. Config exists
ls -la claude-flow.config.json

# 2. Working directory exists
ls -la .claude-flow/

# 3. MCP server registered
cat .mcp.json

# 4. CLI accessible
npx ruflo@latest --version

# 5. Memory system works
npx ruflo@latest memory init --force --verbose
npx ruflo@latest memory store --key "test" --value "hello" --namespace test
npx ruflo@latest memory search --query "hello" --namespace test

# 6. Swarm initializes
npx ruflo@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# 7. Daemon starts
npx ruflo@latest daemon start
npx ruflo@latest daemon status
npx ruflo@latest daemon stop
```

### Verify from Inside Claude Code

Start a new Claude Code session in Serene and ask:

```
List all available MCP tools from claude-flow
```

You should see `mcp__claude-flow__swarm_init`, `mcp__claude-flow__memory_usage`, etc.

---

## 6. GLM Integration (z.ai Models)

### What GLM Is

GLM (`/usr/local/bin/glm`) wraps Claude Code and routes API calls through `https://api.z.ai/api/anthropic`. It uses z.ai GLM models and supports the same `claude -p` headless mode.

### GLM Project Config

Create `.glm.json` in the Serene root:

```json
{
  "apiKey": "YOUR_GLM_API_KEY_HERE",
  "defaultModel": "glm-4-long",
  "opusModel": "glm-4-long",
  "sonnetModel": "glm-4-flash",
  "haikuModel": "glm-4-flash-lite",
  "enableThinking": true,
  "enableStreaming": true,
  "reasoningEffort": "medium"
}
```

```bash
chmod 600 .glm.json  # Secure the file
```

### Using GLM in Workflows

GLM is not a built-in Ruflo provider — invoke it via Bash in workflow steps:

```bash
# GLM for UI review (cost-effective)
glm -p "Review the analytics dashboard for accessibility..."

# Claude for architecture (deep reasoning)
claude -p "Design the journal router architecture..."

# Both in parallel
claude -p "Implement MoodBarChart component..." &
glm -p "Review mood-selector.tsx for accessibility..." &
wait
```

### Recommended Model Split

| Task                | Use Claude | Use GLM | Why                              |
| ------------------- | ---------- | ------- | -------------------------------- |
| Plan creation       | Yes        | No      | Deep architectural reasoning     |
| TDD implementation  | Yes        | No      | Code generation quality          |
| `/simplify` review  | Either     | Either  | Both review code well            |
| Bowser YAML writing | Either     | Either  | Template-based                   |
| UI visual review    | No         | Yes     | Cost-effective for visual checks |
| Docs/README writing | No         | Yes     | Good at prose generation         |
| Worktree management | Either     | Either  | Simple git operations            |

---

## 7. Workflow Automation

### Pipeline Per Deliverable

Each deliverable follows this exact pipeline (from `deliverables.md`):

```
/plan-creator → /plan-loop → /simplify → prettier → bowser YAML → /ui-review → manual review → commit
```

### Two-Step Pattern: Plan Then Execute

Plans are saved to `.claude/plans/<slug>-<hash>-plan.md`. To pass the plan to the executor:

```bash
# The newest file in .claude/plans/ is always the just-created plan
PLAN=$(ls -t .claude/plans/ | head -1)
/essentials:plan-loop .claude/plans/$PLAN
```

This works because nothing else writes to `.claude/plans/` between step 1 (plan creation) and step 2 (plan execution).

### Running serene-workflow.yaml

The workflow file is committed at the project root. Run it from the Serene directory:

```bash
cd /Users/garden/projects/PinkElephant/serene

# 1. Validate — check syntax and dependencies without executing
ruflo workflow run -f ./serene-workflow.yaml --dry-run

# 2. Run the full workflow (all 3 tracks, parallel B+C)
ruflo workflow run -f ./serene-workflow.yaml --parallel --max-agents 8

# 3. Run a single step (e.g. only D6 planning)
ruflo workflow run -f ./serene-workflow.yaml --step d6-plan

# 4. Resume from a specific step (e.g. after fixing a failure)
ruflo workflow run -f ./serene-workflow.yaml --from d7-plan
```

> **Before running:** ensure the daemon is running (`ruflo daemon start`) and memory is initialized (`ruflo memory list`).

**Step IDs for `--step` / `--from`:**

| Step ID           | Description                   |
| ----------------- | ----------------------------- |
| `d6-plan`         | D6: Create plan               |
| `d6-implement`    | D6: Execute plan              |
| `d6-qa`           | D6: Simplify + QA gate        |
| `d7-plan`         | D7: Create plan               |
| `d7-implement`    | D7: Execute plan              |
| `d7-qa`           | D7: Simplify + QA gate        |
| `d8-plan`         | D8: Create plan               |
| `d8-implement`    | D8: Execute plan              |
| `d8-qa`           | D8: Simplify + QA gate        |
| `d9-plan`         | D9: Analytics (parallel)      |
| `d9-implement`    | D9: Analytics execute         |
| `d9-qa`           | D9: Analytics QA              |
| `d12-plan`        | D12: Docs + deploy (parallel) |
| `d12-implement`   | D12: Docs + deploy execute    |
| `d12-qa`          | D12: Docs + deploy QA         |
| `merge-worktrees` | Merge parallel tracks         |
| `final-qa`        | Full E2E QA                   |

---

### Workflow YAML: serene-workflow.yaml

The full YAML is at `./serene-workflow.yaml` in the project root. Contents for reference:

```yaml
name: "Serene PRD Completion"
description: "Complete remaining deliverables #6-#12 with full pipeline"

# ================================================================
# TRACK A: Sequential (D6 → D7 → D8) — Critical Path
# Each deliverable has 3 sub-steps: plan → implement → QA
# ================================================================

steps:
  # ------ DELIVERABLE #6: Entry Save + Timeline ------

  - stepId: "d6-plan"
    name: "D6: Create Plan"
    type: task
    config:
      task: |
        Run /essentials:plan-creator with this input:

        "Read and analyze @ai_docs/prd/ and @ai_docs/prd/deliverables.md
        and all referenced PRD files to create a thorough plan for
        Deliverable #6 — Entry Save + Timeline.

        PRD references: 08-frontend-components.md §9.3 (EntryForm, EntryCard, Timeline),
        03-feature-specs.md §4B.2 (timeline grouping), 06-api-design.md §7.1 (API contracts).
        User stories: US-MJ-004 (save), US-MJ-005 (timeline), US-MJ-006 (detail view).

        MANDATORY REQUIREMENTS:
        - Follow ALL instructions from deliverables.md 'Steps for EVERY deliverable'
        - Follow 'CRITICAL: Bowser QA Gate Rules (NON-NEGOTIABLE)'
        - Use context7 for ALL library/framework documentation lookups
        - Use /frontend-design skill for ALL UI component visual decisions
        - Include a /simplify step that runs after implementation
        - Include bowser YAML story creation matching deliverables.md template
        - Include /ui-review QA gate — all stories must pass
        CRITICAL"

  - stepId: "d6-implement"
    name: "D6: Execute Plan"
    type: task
    config:
      dependsOn: ["d6-plan"]
      task: |
        Find the latest plan file:
        Run: ls -t .claude/plans/ | head -1
        Run /essentials:plan-loop .claude/plans/<latest-plan-file>
        Follow all tasks in dependency order until exit criteria pass.

  - stepId: "d6-qa"
    name: "D6: Simplify + QA Gate"
    type: task
    config:
      dependsOn: ["d6-implement"]
      task: |
        STEP 1 — SIMPLIFY:
        Run /simplify on all files changed in Deliverable #6.
        Fix ALL found issues/bugs/suggestions.
        Run: bun test --run (must pass after simplification)
        Run: bun prettier --write . && bun prettier --check .

        STEP 2 — BOWSER QA GATE (NON-NEGOTIABLE):
        Write ai_review/user_stories/entry-save-timeline.yaml using
        the exact template from ai_docs/prd/deliverables.md Deliverable #6.
        Run /ui-review entry-save-timeline — ALL stories MUST PASS.
        If ANY story fails, fix and re-run until ALL are green.
        DO NOT proceed with failing bowser tests.

  # ------ DELIVERABLE #7: Edit + Delete ------

  - stepId: "d7-plan"
    name: "D7: Create Plan"
    type: task
    config:
      dependsOn: ["d6-qa"]
      task: |
        Run /essentials:plan-creator with this input:

        "Read and analyze @ai_docs/prd/ and @ai_docs/prd/deliverables.md
        and all referenced PRD files to create a thorough plan for
        Deliverable #7 — Edit + Delete Entry.

        PRD references: 02-user-stories.md US-MJ-007/008,
        06-api-design.md §7.1 (update/delete contracts).
        User stories: US-MJ-007 (edit), US-MJ-008 (delete).

        MANDATORY REQUIREMENTS:
        - Follow ALL instructions from deliverables.md 'Steps for EVERY deliverable'
        - Follow 'CRITICAL: Bowser QA Gate Rules (NON-NEGOTIABLE)'
        - Use context7 for ALL library/framework documentation lookups
        - Use /frontend-design skill for ALL UI component visual decisions
        - Include a /simplify step that runs after implementation
        - Include bowser YAML story creation matching deliverables.md template
        - Include /ui-review QA gate — all stories must pass
        CRITICAL"

  - stepId: "d7-implement"
    name: "D7: Execute Plan"
    type: task
    config:
      dependsOn: ["d7-plan"]
      task: |
        Find the latest plan file:
        Run: ls -t .claude/plans/ | head -1
        Run /essentials:plan-loop .claude/plans/<latest-plan-file>
        Follow all tasks in dependency order until exit criteria pass.

  - stepId: "d7-qa"
    name: "D7: Simplify + QA Gate"
    type: task
    config:
      dependsOn: ["d7-implement"]
      task: |
        STEP 1 — SIMPLIFY:
        Run /simplify on all files changed in Deliverable #7.
        Fix ALL found issues/bugs/suggestions.
        Run: bun test --run (must pass)
        Run: bun prettier --write . && bun prettier --check .

        STEP 2 — BOWSER QA GATE (NON-NEGOTIABLE):
        Write ai_review/user_stories/entry-crud.yaml using
        the exact template from ai_docs/prd/deliverables.md Deliverable #7.
        Run /ui-review entry-crud — ALL stories MUST PASS.
        If ANY story fails, fix and re-run until ALL are green.

  # ------ DELIVERABLE #8: AI Response Display ------

  - stepId: "d8-plan"
    name: "D8: Create Plan"
    type: task
    config:
      dependsOn: ["d7-qa"]
      task: |
        Run /essentials:plan-creator with this input:

        "Read and analyze @ai_docs/prd/ and @ai_docs/prd/deliverables.md
        and all referenced PRD files to create a thorough plan for
        Deliverable #8 — AI Response Display (Streaming + History).

        PRD references: 08-frontend-components.md §9.3 (AiResponse, SafetyBanner),
        07-ai-integration.md (streaming), 06-api-design.md §7.2 (SSE format).
        User stories: US-AI-001, US-AI-002, US-AI-003.

        CRITICAL NOTE: Requires ANTHROPIC_API_KEY in .env.local for real AI responses.
        Bowser tests should verify UI behavior even without API key.

        MANDATORY REQUIREMENTS:
        - Follow ALL instructions from deliverables.md 'Steps for EVERY deliverable'
        - Follow 'CRITICAL: Bowser QA Gate Rules (NON-NEGOTIABLE)'
        - Use context7 for ALL library/framework documentation lookups
        - Use /frontend-design skill for ALL UI component visual decisions
        - Include a /simplify step that runs after implementation
        - Include bowser YAML story creation matching deliverables.md template
        - Include /ui-review QA gate — all stories must pass
        CRITICAL"

  - stepId: "d8-implement"
    name: "D8: Execute Plan"
    type: task
    config:
      dependsOn: ["d8-plan"]
      task: |
        Find the latest plan file:
        Run: ls -t .claude/plans/ | head -1
        Run /essentials:plan-loop .claude/plans/<latest-plan-file>
        Follow all tasks in dependency order until exit criteria pass.

  - stepId: "d8-qa"
    name: "D8: Simplify + QA Gate"
    type: task
    config:
      dependsOn: ["d8-implement"]
      task: |
        STEP 1 — SIMPLIFY:
        Run /simplify on all files changed in Deliverable #8.
        Fix ALL found issues/bugs/suggestions.
        Run: bun test --run (must pass)
        Run: bun prettier --write . && bun prettier --check .

        STEP 2 — BOWSER QA GATE (NON-NEGOTIABLE):
        Write ai_review/user_stories/ai-response.yaml using
        the exact template from ai_docs/prd/deliverables.md Deliverable #8.
        Run /ui-review ai-response — ALL stories MUST PASS.
        If ANY story fails, fix and re-run until ALL are green.

  # ================================================================
  # TRACK B: Independent — runs parallel with Track A
  # Uses worktree isolation to avoid file conflicts
  # ================================================================

  - stepId: "d9-plan"
    name: "D9: Create Plan (Analytics)"
    type: parallel
    config:
      isolation: worktree
      task: |
        Run /essentials:plan-creator with this input:

        "Read and analyze @ai_docs/prd/ and @ai_docs/prd/deliverables.md
        and all referenced PRD files to create a thorough plan for
        Deliverable #9 — Analytics Dashboard.

        PRD references: 06-api-design.md §7.3 (analytics API),
        08-frontend-components.md §9.3 (chart specs),
        03-feature-specs.md §4B.3 (chart library + design).
        User stories: US-AN-001, US-AN-002, US-AN-003.

        MANDATORY REQUIREMENTS:
        - Follow ALL instructions from deliverables.md 'Steps for EVERY deliverable'
        - Follow 'CRITICAL: Bowser QA Gate Rules (NON-NEGOTIABLE)'
        - Use context7 for ALL library/framework documentation lookups
        - Use context7 for recharts library documentation
        - Use /frontend-design skill for ALL chart visual decisions
        - Include a /simplify step that runs after implementation
        - Include bowser YAML story creation matching deliverables.md template
        - Include /ui-review QA gate — all stories must pass
        CRITICAL"

  - stepId: "d9-implement"
    name: "D9: Execute Plan (Analytics)"
    type: parallel
    config:
      dependsOn: ["d9-plan"]
      isolation: worktree
      task: |
        Find the latest plan file:
        Run: ls -t .claude/plans/ | head -1
        Run /essentials:plan-loop .claude/plans/<latest-plan-file>
        Follow all tasks in dependency order until exit criteria pass.

  - stepId: "d9-qa"
    name: "D9: Simplify + QA Gate (Analytics)"
    type: parallel
    config:
      dependsOn: ["d9-implement"]
      isolation: worktree
      task: |
        STEP 1 — SIMPLIFY:
        Run /simplify on all files changed in Deliverable #9.
        Fix ALL found issues/bugs/suggestions.
        Run: bun test --run (must pass)
        Run: bun prettier --write . && bun prettier --check .

        STEP 2 — BOWSER QA GATE (NON-NEGOTIABLE):
        Write ai_review/user_stories/analytics.yaml using
        the exact template from ai_docs/prd/deliverables.md Deliverable #9.
        Run /ui-review analytics — ALL stories MUST PASS.
        If ANY story fails, fix and re-run until ALL are green.

  # ================================================================
  # TRACK C: Independent — runs parallel with Track A
  # Uses worktree isolation. GLM recommended for docs tasks.
  # ================================================================

  - stepId: "d12-plan"
    name: "D12: Create Plan (Docs + Deploy)"
    type: parallel
    config:
      isolation: worktree
      task: |
        Run /essentials:plan-creator with this input:

        "Read and analyze @ai_docs/prd/ and @ai_docs/prd/deliverables.md
        and all referenced PRD files to create a thorough plan for
        Deliverable #12 — Docs + Deployment + Final E2E QA.

        PRD references: 14-readme.md, 15-deployment.md,
        13-phases.md Phase 6 + 7.

        MANDATORY REQUIREMENTS:
        - Follow ALL instructions from deliverables.md 'Steps for EVERY deliverable'
        - Follow 'CRITICAL: Bowser QA Gate Rules (NON-NEGOTIABLE)'
        - Rewrite README.md — zero template references
        - Create docs/deployment/serene-deployment-guide.md (all 11 sections)
        - Create docs/deployment/serene-infrastructure-reference.md
        - Update terraform.tfvars.example: project_slug = serene
        - Update Wrangler configs: serene-web, serene-app, serene-api
        - Update seed data with realistic journal entries
        - Include /simplify step and bowser QA gate
        CRITICAL"

  - stepId: "d12-implement"
    name: "D12: Execute Plan (Docs + Deploy)"
    type: parallel
    config:
      dependsOn: ["d12-plan"]
      isolation: worktree
      task: |
        Find the latest plan file:
        Run: ls -t .claude/plans/ | head -1
        Run /essentials:plan-loop .claude/plans/<latest-plan-file>
        Follow all tasks in dependency order until exit criteria pass.

  - stepId: "d12-qa"
    name: "D12: Simplify + QA Gate (Docs + Deploy)"
    type: parallel
    config:
      dependsOn: ["d12-implement"]
      isolation: worktree
      task: |
        STEP 1 — SIMPLIFY:
        Run /simplify on all changed code files.
        Run: bun prettier --write . && bun prettier --check .

        STEP 2 — BOWSER QA GATE (NON-NEGOTIABLE):
        Write ai_review/user_stories/e2e-full.yaml using
        the exact template from ai_docs/prd/deliverables.md Deliverable #12.
        Run /ui-review e2e-full — ALL stories MUST PASS.
        If ANY story fails, fix and re-run until ALL are green.

  # ================================================================
  # FINAL: After all tracks complete — merge worktrees + E2E QA
  # ================================================================

  - stepId: "merge-worktrees"
    name: "Merge Parallel Tracks"
    type: task
    config:
      dependsOn: ["d8-qa", "d9-qa", "d12-qa"]
      task: |
        Merge worktree branches from Track B and Track C back to main.
        Resolve any conflicts.
        Run: bun test --run && bun typecheck && bun lint
        All must pass after merge.

  - stepId: "final-qa"
    name: "Final E2E QA"
    type: task
    config:
      dependsOn: ["merge-worktrees"]
      task: |
        Run ALL bowser YAML stories in ai_review/user_stories/:
        - branding.yaml
        - entry-form-parts.yaml
        - entry-save-timeline.yaml
        - entry-crud.yaml
        - ai-response.yaml
        - analytics.yaml
        - landing.yaml
        - auth-flow.yaml
        - e2e-full.yaml

        Verify: bun test --run, bun typecheck, bun lint — ALL pass.
        No console errors in production build.
        Full walkthrough: landing → signup → journal → AI → analytics.
```

### Execution Flow Diagram

```
START
  │
  ├── Track A (main branch, sequential):
  │   d6-plan → d6-implement → d6-qa
  │   → d7-plan → d7-implement → d7-qa
  │   → d8-plan → d8-implement → d8-qa ──┐
  │                                        │
  ├── Track B (worktree, parallel):        │
  │   d9-plan → d9-implement → d9-qa ─────┤
  │                                        │
  ├── Track C (worktree, parallel):        │
  │   d12-plan → d12-implement → d12-qa ──┤
  │                                        │
  │                              merge-worktrees
  │                                        │
  │                                   final-qa
  │                                        │
  END
```

### Step Pipeline Per Deliverable

```
┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  *-plan      │    │  *-implement     │    │  *-qa              │
│              │    │                  │    │                    │
│ /plan-creator│───>│ ls -t plans/ |  │───>│ /simplify          │
│ + context7   │    │   head -1        │    │ bun test --run     │
│ + /frontend- │    │ /plan-loop       │    │ bun prettier       │
│   design     │    │   <latest-plan>  │    │ Write bowser YAML  │
│              │    │                  │    │ /ui-review (MUST   │
│ Generates:   │    │ Executes plan    │    │   PASS all stories)│
│ .claude/     │    │ task-by-task     │    │                    │
│  plans/      │    │ until exit       │    │                    │
│  <slug>.md   │    │ criteria pass    │    │                    │
└──────────────┘    └──────────────────┘    └────────────────────┘
```

---

## 8. Worktrees for Parallel Execution

### Why Worktrees Are Needed

Track A, B, and C run in parallel. Without worktrees, agents editing shared files (package.json, tsconfig, etc.) can conflict.

### Automatic Worktree Management

Claude Code's Task tool handles worktrees automatically with `isolation: "worktree"`:

1. Creates a temporary git worktree and branch
2. Runs the agent in that isolated checkout
3. Returns the worktree path and branch name when done
4. Auto-cleans up if no changes were made

**You do not need to manually create worktrees, run `bun install`, or manage branches.**

### In the Workflow YAML

Track B and C steps use `isolation: worktree`:

```yaml
- stepId: "d9-plan"
  type: parallel
  config:
    isolation: worktree # ← auto-creates worktree
    task: "..."
```

Track A runs on the main branch (no worktree needed).

### What IS Manual: Merging

After agents complete, their changes live on separate worktree branches. The `merge-worktrees` step in the workflow handles this:

```bash
git merge <branch-from-d9-worktree>
git merge <branch-from-d12-worktree>
```

This is intentionally a checkpoint — review before combining parallel tracks.

### Manual Worktree Commands (If Needed)

```bash
# Create worktrees manually
git worktree add ../serene-d9 -b deliverable/9-analytics
git worktree add ../serene-d12 -b deliverable/12-docs

# Check existing worktrees
git worktree list

# Install deps in worktree
cd ../serene-d9 && bun install

# Merge back
cd /Users/garden/projects/PinkElephant/serene
git merge deliverable/9-analytics
git merge deliverable/12-docs

# Clean up
git worktree remove ../serene-d9
git worktree remove ../serene-d12
git branch -d deliverable/9-analytics
git branch -d deliverable/12-docs
```

---

## 9. Model & CLI Configuration

### How Models Are Selected

Ruflo does **not** auto-select between Claude and GLM. The model depends on how you invoke:

| Invocation         | Model Used                        |
| ------------------ | --------------------------------- |
| Task tool agents   | Session's configured Claude model |
| `claude -p "..."`  | Claude (Anthropic API)            |
| `glm -p "..."`     | GLM (z.ai API)                    |
| Workflow YAML task | Whatever CLI the prompt instructs |

### Using GLM for Specific Workflow Steps

To use GLM for cost-effective tasks (UI review, docs), modify the step's prompt:

```yaml
# Example: Use GLM for docs writing
- stepId: "d12-docs-glm"
  type: parallel
  config:
    task: |
      Use GLM for documentation:
      glm -p "Read ai_docs/prd/14-readme.md and README.md.
      Rewrite README.md for Serene. Zero template references."
```

### Plan-Creator Model

`/essentials:plan-creator` uses `model: opus` by default (set in its command definition). This is the right choice for architectural planning — don't change it.

### Plan-Loop Model

`/essentials:plan-loop` also uses `model: opus`. This ensures high-quality implementation. Keep it.

### Where GLM Adds Value

Use GLM for steps that don't need Opus-level reasoning:

```bash
# UI accessibility review
glm -p "Review mood-selector.tsx for WCAG 2.1 AA compliance..."

# Documentation prose
glm -p "Write the deployment guide section on Cloudflare Workers..."

# Bowser YAML generation
glm -p "Generate bowser YAML stories for the analytics dashboard..."
```

---

## 10. Troubleshooting

### Common Issues

| Problem                          | Fix                                                              |
| -------------------------------- | ---------------------------------------------------------------- | ------------------- |
| `npx ruflo` not found            | `npm install -g ruflo@latest`                                    |
| MCP tools missing in Claude Code | Restart Claude Code session; verify `.mcp.json` exists           |
| `doctor` reports missing config  | Cosmetic — `.claude-flow/config.yaml` is the real config; ignore |
| Memory store fails               | `npx ruflo@latest memory init --force`                           |
| GLM API key error                | Set `GLM_API_KEY` env var or create `.glm.json`                  |
| Worktree conflicts               | `git worktree list` to check existing worktrees                  |
| Daemon port in use               | `lsof -i :3000` then kill the process                            |
| `bun install` fails in worktree  | `bun install --force` in worktree directory                      |
| Plan file not found by plan-loop | `ls -t .claude/plans/                                            | head -5` to find it |

### Status Commands

```bash
npx ruflo@latest doctor           # Full health check
npx ruflo@latest daemon status    # Daemon status
npx ruflo@latest swarm status     # Swarm status
npx ruflo@latest memory list      # Memory entries
git worktree list                 # Worktree status
ls -t .claude/plans/ | head -5    # Recent plans
```

### Reset Everything

```bash
cd /Users/garden/projects/PinkElephant/serene
rm -rf .claude-flow/ claude-flow.config.json data/ruflo-memory/
rm .mcp.json
git worktree remove ../serene-d9 2>/dev/null
git worktree remove ../serene-d12 2>/dev/null
npx ruflo@latest init --wizard    # Fresh start
```

---

## Quick Reference Card

```bash
# === INSTALL ===
npx ruflo@latest init --wizard
npx ruflo@latest doctor --fix

# === FIRST TIME: start runtime services ===
ruflo memory configure --backend hybrid
ruflo memory init --force --verbose
ruflo daemon start

# === DAILY ===
ruflo daemon start
npx ruflo@latest swarm init --topology hierarchical --max-agents 8

# === WORKFLOW ===
ruflo workflow run -f serene-workflow.yaml --parallel --max-agents 8
ruflo workflow run -f serene-workflow.yaml --step d6-plan
ruflo workflow run -f serene-workflow.yaml --dry-run

# === MEMORY ===
npx ruflo@latest memory search --query "..."
npx ruflo@latest memory store --key "k" --value "v" --namespace patterns

# === WORKTREES ===
git worktree add ../serene-d9 -b deliverable/9-analytics
git worktree list
git worktree remove ../serene-d9

# === GLM ===
glm -p "Review component for accessibility..."

# === PLANS ===
ls -t .claude/plans/ | head -1    # Latest plan
```

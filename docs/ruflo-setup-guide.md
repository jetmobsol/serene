# Ruflo Setup Guide for Serene

> **Purpose:** Step-by-step installation, configuration, and verification of Ruflo (Claude Flow v3) in the Serene project. Includes GLM (z.ai) integration for dual-model workflows.
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
9. [Model & CLI Configuration in Workflows](#9-model--cli-configuration-in-workflows)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before installing Ruflo, verify these are available:

```bash
# Required
node --version    # Must be >= 20 (you have 25.5.0)
npm --version     # Must be >= 9 (you have 11.8.0)
git --version     # Any recent version
bun --version     # Required for Serene (you have 1.3.9+)

# Optional (for GLM integration)
glm --version     # z.ai GLM CLI wrapper (you have it at /usr/local/bin/glm)
```

Ensure you have API keys ready:

- `ANTHROPIC_API_KEY` — for Claude AI vibe check feature (required for Serene)
- `GLM_API_KEY` — for z.ai GLM models (optional, for dual-model workflows)

---

## 2. Installation

### Option A: Full Install Script (Recommended)

Run from the Serene project root:

```bash
cd ....serene
curl -fsSL https://cdn.jsdelivr.net/gh/ruvnet/claude-flow@main/scripts/install.sh | bash -s -- --full
```

The `--full` flag does:

- Installs `ruflo` globally via npm
- Adds the MCP server to Claude Code project settings
- Runs `npx ruflo doctor` to verify health
- Runs `npx ruflo init` to create config files

### Option B: npx Init Wizard (Interactive)

```bash
cd ....serene
npx ruflo@latest init --wizard
```

Walks you through config options interactively. Choose:

- Topology: **hierarchical** (anti-drift, recommended)
- Max Agents: **8**
- Strategy: **specialized**
- Memory Backend: **hybrid**

### Option C: Manual Step-by-Step

```bash
cd ....serene

# Step 1: Install CLI globally
npm install -g ruflo@latest

# Step 2: Initialize config in project
npx ruflo@latest init

# Step 3: Add MCP server to Claude Code (project-level)
claude mcp add claude-flow -- npx -y claude-flow@v3alpha mcp start

# Step 4: Verify
npx ruflo@latest doctor
```

---

## 3. Configuration Files

After installation, these files are created in the Serene project:

### Files Created

| File                                | Location               | Purpose                                              |
| ----------------------------------- | ---------------------- | ---------------------------------------------------- |
| `claude-flow.config.json`           | Project root           | Main Ruflo configuration (topology, agents, memory)  |
| `.claude-flow/`                     | Project root directory | Ruflo working directory (workflows, metrics, memory) |
| `.claude-flow/workflows/store.json` | Inside `.claude-flow/` | Workflow definitions and state                       |
| `.claude-flow/CAPABILITIES.md`      | Inside `.claude-flow/` | Auto-generated reference of all features             |
| `.claude/settings.json`             | `.claude/` directory   | Claude Code settings (MCP server entries)            |

### claude-flow.config.json (Main Config)

This is the primary config file. After init, edit it to match Serene's needs:

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

**Important:** Change `memory.path` to `./data/ruflo-memory` (not `./data/memory`) to avoid conflicts with Serene's own data directory.

### .gitignore Additions

Add these to Serene's `.gitignore`:

```gitignore
# Ruflo
.claude-flow/
data/ruflo-memory/
claude-flow.config.json
```

---

## 4. MCP Server Setup

The MCP server lets Claude Code access Ruflo's coordination tools (swarm init, memory, agent spawning).

### Where It Gets Configured

**Project-level** (recommended — only active in Serene):

```
.../serene/.claude/settings.json
```

The entry added:

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

### Manual MCP Setup (if --full didn't add it)

```bash
cd ..../serene
claude mcp add claude-flow -- npx -y claude-flow@v3alpha mcp start
```

### Verify MCP is Registered

```bash
# Check Claude Code settings
cat .claude/settings.json | grep -A5 "claude-flow"
```

### Alternative: Global MCP (all projects)

```bash
claude mcp add --global claude-flow -- npx -y claude-flow@v3alpha mcp start
# Writes to ~/.claude/settings.json
```

---

## 5. Verification & Doctor

### Quick Health Check

```bash
cd ..../serene
npx ruflo@latest doctor
```

This checks:

- Node.js version (20+)
- npm version (9+)
- Git installation
- Config file exists and is valid
- Daemon status
- Memory database accessibility
- API keys present
- MCP server registration
- Disk space
- TypeScript installation

### Auto-Fix Issues

```bash
npx ruflo@latest doctor --fix
```

Automatically fixes what it can (creates missing dirs, initializes memory DB, etc.).

### Manual Verification Steps

```bash
# 1. Config exists
ls -la claude-flow.config.json

# 2. Working directory exists
ls -la .claude-flow/

# 3. MCP server registered in Claude Code
cat .claude/settings.json

# 4. CLI is accessible
npx ruflo@latest --version

# 5. Memory system works
npx ruflo@latest memory init --force --verbose
npx ruflo@latest memory store --key "test" --value "hello" --namespace test
npx ruflo@latest memory search --query "hello" --namespace test

# 6. Swarm can initialize
npx ruflo@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# 7. Daemon starts
npx ruflo@latest daemon start
npx ruflo@latest daemon status
npx ruflo@latest daemon stop
```

### Verification from Inside Claude Code

After setup, open a new Claude Code session in the Serene project and verify MCP tools are available:

```
> Ask Claude: "List all available MCP tools from claude-flow"
```

You should see tools like `mcp__claude-flow__swarm_init`, `mcp__claude-flow__memory_usage`, etc.

---

## 6. GLM Integration (z.ai Models)

### What GLM Is

GLM (`/usr/local/bin/glm`) is a wrapper around Claude Code that:

- Routes API calls through `https://api.z.ai/api/anthropic` instead of Anthropic directly
- Uses z.ai GLM models (configured via `.glm.json` or `GLM_API_KEY`)
- Supports the same `claude -p` (print/pipe) headless mode
- Can use custom models: opus, sonnet, haiku variants from z.ai

### GLM Configuration

Create a project-level config for Serene:

```bash
# Create .glm.json in Serene project root
cat > ..../serene/.glm.json << 'EOF'
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
EOF

# Secure the file
chmod 600 .glm.json
```

Add to `.gitignore`:

```gitignore
.glm.json
```

### How GLM Works with Ruflo

GLM is **not a built-in Ruflo provider** — it's a separate CLI that wraps `claude`. You use it in two ways:

#### Way 1: Use GLM for Specific Workflow Steps (via Bash)

In your workflow YAML, you can invoke GLM directly for tasks where you want z.ai models:

```yaml
- stepId: "d9-ui-review"
  name: "D9: UI Review via GLM"
  type: task
  config:
    task: |
      Run this command to get a GLM-powered UI review:
      glm -p "Review the analytics dashboard components in apps/app/routes/(app)/analytics.tsx and apps/app/components/analytics/ for visual quality, accessibility, and UX. Check against the specs in ai_docs/prd/08-frontend-components.md"
```

#### Way 2: Use GLM as a Headless Worker for Parallel Tasks

GLM supports `claude -p` mode (since it wraps Claude Code), so you can spawn headless GLM workers:

```bash
# GLM for UI review (z.ai model)
glm -p "Review the mood selector component for accessibility" &

# Claude for backend logic (Anthropic model)
claude -p "Analyze the journal router for security issues" &

wait  # Both run in parallel
```

#### Way 3: Use GLM for Bowser/UI Review Tasks

Since GLM models may be cheaper or faster for visual review tasks, you can use them specifically for QA:

```bash
# Use GLM for UI review steps
glm -p "Read ai_review/user_stories/analytics.yaml and verify each story against the running app at localhost:5173/analytics. Report pass/fail for each story."
```

### Recommended GLM Usage in Serene

| Task                | Use Claude | Use GLM | Why                                     |
| ------------------- | ---------- | ------- | --------------------------------------- |
| Plan creation       | Yes        | No      | Needs deep reasoning about architecture |
| TDD implementation  | Yes        | No      | Needs code generation quality           |
| `/simplify` review  | Either     | Either  | Both can review code quality            |
| Bowser YAML writing | Either     | Either  | Template-based, either works            |
| UI visual review    | No         | Yes     | Cost-effective for visual checks        |
| Docs/README writing | No         | Yes     | Good for prose generation               |
| Worktree management | Either     | Either  | Simple git operations                   |

---

## 7. Workflow Automation

### Creating the Serene Workflow File

Save this as `serene-workflow.yaml` in the Serene project root:

```yaml
name: "Serene PRD Completion"
description: "Complete remaining deliverables #6-#12 with full pipeline"

steps:
  # ============================================================
  # TRACK A: Sequential (D6 → D7 → D8) — Critical Path
  # ============================================================

  - stepId: "d6"
    name: "Deliverable #6 — Entry Save + Timeline"
    type: task
    config:
      task: |
        You are working on the Serene project.
        Execute Deliverable #6 from ai_docs/prd/deliverables.md.

        FOLLOW THIS EXACT PIPELINE:

        STEP 1 — PLAN:
        Run /essentials:plan-creator with this scope:
        "Deliverable #6 from ai_docs/prd/deliverables.md.
        PRD references: 08-frontend-components.md §9.3, 03-feature-specs.md §4B.2.
        User stories: US-MJ-004 (save), US-MJ-005 (timeline), US-MJ-006 (detail view)."

        STEP 2 — IMPLEMENT (TDD):
        Write failing tests first, then implementation.
        Files to create/modify:
        - apps/app/components/journal/entry-form.tsx
        - apps/app/components/journal/entry-card.tsx
        - apps/app/components/journal/timeline.tsx
        - apps/app/lib/queries/journal.ts (TanStack Query hooks)
        - apps/app/lib/utils/date-groups.ts + tests
        - apps/app/routes/(app)/journal/index.tsx (update)
        - apps/app/routes/(app)/journal/$entryId.tsx (create)
        Run: bun test --run (must pass)

        STEP 3 — SIMPLIFY:
        Run /simplify on all changed files.
        Run: bun test --run (must still pass)

        STEP 4 — FORMAT:
        Run: bun prettier --write . && bun prettier --check .

        STEP 5 — BOWSER YAML:
        Write ai_review/user_stories/entry-save-timeline.yaml
        using the exact template from ai_docs/prd/deliverables.md Deliverable #6.

        STEP 6 — QA GATE:
        Run /ui-review entry-save-timeline
        If any story FAILS, fix and re-run until ALL PASS.

  - stepId: "d7"
    name: "Deliverable #7 — Edit + Delete"
    type: task
    config:
      dependsOn: ["d6"]
      task: |
        You are working on the Serene project.
        Execute Deliverable #7 from ai_docs/prd/deliverables.md.

        FOLLOW THIS EXACT PIPELINE:

        STEP 1 — PLAN:
        Run /essentials:plan-creator with scope:
        "Deliverable #7 from ai_docs/prd/deliverables.md.
        PRD references: 02-user-stories.md US-MJ-007/008, 06-api-design.md §7.1.
        User stories: US-MJ-007 (edit), US-MJ-008 (delete)."

        STEP 2 — IMPLEMENT (TDD):
        Wire edit action (pre-fill EntryForm with existing data).
        Wire journal.update mutation with optimistic update.
        Wire delete action with confirmation dialog + journal.delete mutation.
        Error handling: revert optimistic update on failure, show error toast.
        Run: bun test --run

        STEP 3 — SIMPLIFY: Run /simplify. Run: bun test --run
        STEP 4 — FORMAT: bun prettier --write . && bun prettier --check .
        STEP 5 — BOWSER YAML: Write ai_review/user_stories/entry-crud.yaml per deliverables.md
        STEP 6 — QA GATE: Run /ui-review entry-crud — ALL MUST PASS

  - stepId: "d8"
    name: "Deliverable #8 — AI Response Display"
    type: task
    config:
      dependsOn: ["d7"]
      task: |
        You are working on the Serene project.
        Execute Deliverable #8 from ai_docs/prd/deliverables.md.

        FOLLOW THIS EXACT PIPELINE:

        STEP 1 — PLAN:
        Run /essentials:plan-creator with scope:
        "Deliverable #8 from ai_docs/prd/deliverables.md.
        PRD references: 08-frontend-components.md §9.3 (AiResponse, SafetyBanner),
        07-ai-integration.md (streaming), 06-api-design.md §7.2 (SSE format).
        User stories: US-AI-001, US-AI-002, US-AI-003."

        STEP 2 — IMPLEMENT (TDD):
        - AiResponse component with SSE streaming consumer
        - SafetyBanner component (crisis resource display)
        - Wire entry save → AI vibe check trigger (notes >= 50 chars)
        - SSE client: connect to GET /api/ai/stream/:entryId
        - Pulsing dots while waiting for first token
        Run: bun test --run

        STEP 3 — SIMPLIFY: Run /simplify. Run: bun test --run
        STEP 4 — FORMAT: bun prettier --write . && bun prettier --check .
        STEP 5 — BOWSER YAML: Write ai_review/user_stories/ai-response.yaml per deliverables.md
        STEP 6 — QA GATE: Run /ui-review ai-response — ALL MUST PASS

  # ============================================================
  # TRACK B: Independent (runs parallel with Track A)
  # ============================================================

  - stepId: "d9"
    name: "Deliverable #9 — Analytics Dashboard"
    type: parallel
    config:
      task: |
        You are working on the Serene project.
        Execute Deliverable #9 from ai_docs/prd/deliverables.md.

        FOLLOW THIS EXACT PIPELINE:

        STEP 1 — PLAN:
        Run /essentials:plan-creator with scope:
        "Deliverable #9 from ai_docs/prd/deliverables.md.
        PRD references: 06-api-design.md §7.3, 08-frontend-components.md §9.3,
        03-feature-specs.md §4B.3.
        User stories: US-AN-001, US-AN-002, US-AN-003."

        STEP 2 — IMPLEMENT (TDD):
        - apps/api/routers/analytics.ts (3 queries: weeklyMoodDistribution, moodTrend, tagCorrelation)
        - Register analytics router in apps/api/lib/app.ts
        - Install recharts in apps/app
        - MoodBarChart, MoodTrendChart, TagCorrelation components
        - Analytics route page with tab navigation
        - TanStack Query hooks: apps/app/lib/queries/analytics.ts
        - Week navigation (prev/next), empty states
        Run: bun test --run

        STEP 3 — SIMPLIFY: Run /simplify. Run: bun test --run
        STEP 4 — FORMAT: bun prettier --write . && bun prettier --check .
        STEP 5 — BOWSER YAML: Write ai_review/user_stories/analytics.yaml per deliverables.md
        STEP 6 — QA GATE: Run /ui-review analytics — ALL MUST PASS

  # ============================================================
  # TRACK C: Independent (runs parallel with Track A)
  # ============================================================

  - stepId: "d12"
    name: "Deliverable #12 — Docs + Deployment"
    type: parallel
    config:
      task: |
        You are working on the Serene project.
        Execute Deliverable #12 from ai_docs/prd/deliverables.md.

        FOLLOW THIS EXACT PIPELINE:

        STEP 1 — PLAN:
        Run /essentials:plan-creator with scope:
        "Deliverable #12 from ai_docs/prd/deliverables.md.
        PRD references: 14-readme.md, 15-deployment.md, 13-phases.md Phase 6+7."

        STEP 2 — IMPLEMENT:
        - Rewrite README.md for Serene (zero template references)
        - Create docs/deployment/serene-deployment-guide.md
        - Create docs/deployment/serene-infrastructure-reference.md
        - Update terraform.tfvars.example: project_slug = "serene"
        - Update Wrangler configs: serene-web, serene-app, serene-api
        - Update seed data with realistic journal entries
        - CSS theme finalization (calm palette)

        STEP 3 — SIMPLIFY: Run /simplify on changed code files
        STEP 4 — FORMAT: bun prettier --write . && bun prettier --check .
        STEP 5 — BOWSER YAML: Write ai_review/user_stories/e2e-full.yaml per deliverables.md
        STEP 6 — QA GATE: Run /ui-review e2e-full — ALL MUST PASS

  # ============================================================
  # FINAL: After all tracks complete
  # ============================================================

  - stepId: "final-qa"
    name: "Final E2E QA"
    type: task
    config:
      dependsOn: ["d8", "d9", "d12"]
      task: |
        Run ALL bowser YAML stories in ai_review/user_stories/.
        Full E2E walkthrough: landing → signup → journal → AI → analytics.
        Verify: bun test --run, bun typecheck, bun lint all pass.
        No console errors in production build.
```

### Running the Workflow

```bash
# Dry run (validate without executing)
npx ruflo@latest workflow run -f ./serene-workflow.yaml --dry-run

# Execute with parallel tracks
npx ruflo@latest workflow run -f ./serene-workflow.yaml --parallel --max-agents 8

# Execute a single deliverable
npx ruflo@latest workflow run -f ./serene-workflow.yaml --step d6
```

---

## 8. Worktrees for Parallel Execution

When running Track A, B, and C in parallel, agents may edit overlapping files. Git worktrees give each parallel track its own working copy.

### Why Worktrees Are Needed

```
Without worktrees:
  Agent A edits apps/app/routes/(app)/journal/index.tsx  (D6)
  Agent B edits apps/app/routes/(app)/analytics.tsx      (D9)
  Agent C edits README.md                                 (D12)
  → Usually safe (different files), but shared package.json, tsconfig, etc. can conflict

With worktrees:
  Each agent has its own complete checkout — zero conflicts possible
```

### Creating Worktrees Manually

```bash
cd ..../serene

# Create branches for parallel tracks
git checkout -b deliverable/6-entry-timeline   # Track A starts here
git checkout main

git worktree add ../serene-d9 -b deliverable/9-analytics
git worktree add ../serene-d12 -b deliverable/12-docs

# Result:
# ..../serene        ← Track A (D6→D7→D8)
# ..../serene-d9      ← Track B (D9)
# ..../serene-d12     ← Track C (D12)
```

### Installing Dependencies in Worktrees

Each worktree needs its own `node_modules`:

```bash
cd ..../serene-d9 && bun install
cd ..../serene-d12 && bun install
```

### Using Worktrees with Ruflo Task Tool

In Claude Code, use `isolation: "worktree"` to auto-create worktrees:

```javascript
// Track A: main branch (no worktree needed)
Task({
  prompt: "Implement Deliverable #6...",
  subagent_type: "coder",
  description: "D6 Entry Save + Timeline",
});

// Track B: auto-worktree
Task({
  prompt: "Implement Deliverable #9 in this worktree...",
  subagent_type: "coder",
  description: "D9 Analytics",
  isolation: "worktree",
  run_in_background: true,
});

// Track C: auto-worktree
Task({
  prompt: "Implement Deliverable #12 in this worktree...",
  subagent_type: "coder",
  description: "D12 Docs",
  isolation: "worktree",
  run_in_background: true,
});
```

### Merging Worktrees Back

After all tracks complete:

```bash
cd ..../serene

# Merge Track B
git merge deliverable/9-analytics
# Resolve any conflicts if needed

# Merge Track C
git merge deliverable/12-docs

# Clean up worktrees
git worktree remove ../serene-d9
git worktree remove ../serene-d12

# Clean up branches
git branch -d deliverable/9-analytics
git branch -d deliverable/12-docs
```

---

## 9. Model & CLI Configuration in Workflows

### How Ruflo Selects Models

Ruflo's headless worker executor uses `claude --print` under the hood:

```typescript
// From headless-worker-executor.ts line 1125
const child = spawn('claude', ['--print', prompt], { ... });
```

This means:

- **Default:** Uses whatever model your Claude Code is configured with
- **Agent subtype:** The `subagent_type` in Task calls selects the agent prompt, not the model
- **Model routing:** Ruflo's `hooks route` recommends a model tier, but the Task tool agent inherits the session's model

### Using GLM Instead of Claude for Specific Steps

GLM wraps `claude` with z.ai routing. To use it in workflow steps, invoke it via Bash:

```yaml
# In workflow step — use GLM for a UI review task
- stepId: "d9-glm-review"
  name: "D9: GLM UI Review"
  type: task
  config:
    task: |
      Run this bash command to get a z.ai GLM model review:

      glm -p "Read the file apps/app/routes/(app)/analytics.tsx and the PRD spec at ai_docs/prd/08-frontend-components.md. Review the analytics dashboard implementation for:
      1. Visual quality and calm aesthetic consistency
      2. Accessibility (WCAG 2.1 AA)
      3. Component structure and reuse
      4. Empty state handling
      Report issues found."
```

### Configuring GLM Per-Project

Create `.glm.json` in the Serene root with model preferences:

```json
{
  "apiKey": "YOUR_GLM_API_KEY",
  "defaultModel": "glm-4-long",
  "sonnetModel": "glm-4-flash",
  "haikuModel": "glm-4-flash-lite",
  "enableThinking": true,
  "reasoningEffort": "medium"
}
```

GLM reads this automatically when invoked from the Serene directory.

### Dual-Model Strategy for Serene

Use both Claude and GLM strategically in your workflow:

```bash
# Claude (Anthropic) — deep reasoning tasks
claude -p "Design the analytics router architecture..."

# GLM (z.ai) — cost-effective review and prose tasks
glm -p "Review the landing page HTML for accessibility issues..."
glm -p "Write the Serene deployment guide for Cloudflare Workers..."

# Run both in parallel
claude -p "Implement the MoodBarChart component with recharts..." &
glm -p "Review the existing mood-selector.tsx for accessibility..." &
wait
```

### Adjusting the Workflow YAML for GLM

To use GLM for specific deliverables, change the task prompt to invoke `glm -p`:

```yaml
# Use GLM for docs-heavy deliverable (cheaper, good at prose)
- stepId: "d12-glm"
  name: "D12: Docs via GLM"
  type: parallel
  config:
    task: |
      Use GLM for documentation tasks. Run these commands:

      # README rewrite
      glm -p "Read ai_docs/prd/14-readme.md and the current README.md.
      Rewrite README.md for Serene per the PRD spec. Zero template references."

      # Deployment guide
      glm -p "Read ai_docs/prd/15-deployment.md. Create
      docs/deployment/serene-deployment-guide.md with all 11 required sections."
```

### Model Selection Is NOT Auto-Configured

Important clarification: Ruflo does **not** auto-select between Claude and GLM. The model is determined by:

1. **Task tool agents** → Use the session's configured Claude model
2. **Bash `claude -p`** → Uses Claude directly
3. **Bash `glm -p`** → Uses z.ai GLM models
4. **Workflow YAML** → Whatever CLI you specify in the task prompt

You choose which CLI to invoke. Ruflo orchestrates _when_ and _where_, not _which model_.

---

## 10. Troubleshooting

### Common Issues

| Problem                              | Fix                                                 |
| ------------------------------------ | --------------------------------------------------- |
| `npx ruflo` command not found        | Run `npm install -g ruflo@latest`                   |
| MCP tools not showing in Claude Code | Restart Claude Code session after adding MCP server |
| `doctor` reports missing config      | Run `npx ruflo@latest init` in Serene root          |
| Memory store fails                   | Run `npx ruflo@latest memory init --force`          |
| GLM API key error                    | Set `GLM_API_KEY` env var or create `.glm.json`     |
| Worktree conflicts                   | Run `git worktree list` to check existing worktrees |
| Daemon won't start                   | Check if port 3000 is in use: `lsof -i :3000`       |
| bun install fails in worktree        | Run `bun install --force` in the worktree directory |

### Checking Status

```bash
# Ruflo health
npx ruflo@latest doctor

# Daemon status
npx ruflo@latest daemon status

# Swarm status
npx ruflo@latest swarm status

# Memory status
npx ruflo@latest memory list

# Worktree status
git worktree list

# GLM status
glm --version
```

### Resetting Everything

```bash
cd ..../serene

# Remove Ruflo config
rm -rf .claude-flow/ claude-flow.config.json data/ruflo-memory/

# Remove MCP server
claude mcp remove claude-flow

# Remove worktrees
git worktree list  # check first
git worktree remove ../serene-d9 2>/dev/null
git worktree remove ../serene-d12 2>/dev/null

# Reinstall fresh
npx ruflo@latest init --wizard
```

---

## Quick Reference Card

```bash
# === INSTALLATION ===
npx ruflo@latest init --wizard          # Interactive setup
npx ruflo@latest doctor --fix           # Verify & fix

# === DAILY USAGE ===
npx ruflo@latest daemon start           # Start background workers
npx ruflo@latest swarm init             # Initialize swarm coordination
npx ruflo@latest memory search --query "..." # Search past patterns

# === WORKFLOW ===
npx ruflo@latest workflow run -f serene-workflow.yaml --parallel
npx ruflo@latest workflow run -f serene-workflow.yaml --step d6
npx ruflo@latest workflow run -f serene-workflow.yaml --dry-run

# === WORKTREES ===
git worktree add ../serene-d9 -b deliverable/9-analytics
git worktree list
git worktree remove ../serene-d9

# === GLM (z.ai) ===
glm -p "Review this component for accessibility..."
glm -p --model glm-4-flash "Quick review of..."

# === VERIFICATION ===
npx ruflo@latest doctor
npx ruflo@latest daemon status
npx ruflo@latest swarm status
git worktree list
```

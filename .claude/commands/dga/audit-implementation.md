---
description: Audit implementation against plan - bidirectional deviation detection
argument-hint: <plan-file-path> [commit-count] [strict|normal]
allowed-tools: Read, Grep, Glob, Bash(git:*), Write, mcp__ast-grep__find_code, mcp__ast-grep__find_code_by_rule
model: opus
---

<!--
COMMAND: audit-implementation
VERSION: 2.2.0
AUTHOR: tac
LAST UPDATED: 2026-02-14
PURPOSE: Bidirectional plan vs implementation auditor
CHANGELOG:
  v2.2.0 (2026-02-14): Renamed from plan-audit to audit-implementation for clarity
  v2.1.0 (2026-02-06): Trimmed prompt size, removed unimplementable parallel sections, fixed tool access
  v2.0.0 (2026-02-01): Bidirectional verification, addition detection
-->

$IF($1,
Perform a comprehensive bidirectional audit of the plan file against its implementation.,
**Error:** No plan file path provided.

**Usage:** `/dga:audit-implementation <plan-file-path> [commit-count] [strict|normal]`

**Examples:**

- `/dga:audit-implementation .claude/plans/tac/feature/user-notifications.md`
- `/dga:audit-implementation .claude/plans/tac/bug/login-fix.md 5`
- `/dga:audit-implementation .claude/plans/tac/feature/my-feature.md "" normal`

Please provide the path to a plan file.
)

**Input Arguments:**

- Plan file: `$1`
- Commit count: `$2` (optional)
- Strictness: `$3` (optional, default: "strict")

You are a meticulous implementation auditor. Your task is to perform a comprehensive, **BIDIRECTIONAL** comparison between a plan document and its actual implementation in code. You identify every deviation, classify whether changes are improvements or regressions, document missing items, **AND detect additions that exist in implementation but were NOT specified in the plan**.

**CRITICAL**: Be extremely thorough. Check naming conventions down to capitalization and underscores. Verify file paths character-by-character. Flag even minor spacing differences in identifiers.

**BIDIRECTIONAL REQUIREMENT**: You MUST verify in BOTH directions:

1. **Plan -> Implementation**: Every plan specification exists in code
2. **Implementation -> Plan**: Every significant code element was specified in plan

## Arguments

- **$1** (required): Path to the plan file
- **$2** (optional): Number of recent commits to analyze. Defaults to all commits vs main.
- **$3** (optional): Strictness level - `strict` (default) or `normal`

### Strictness Levels

**strict** (default): Every code block must match exactly. All imports, annotations, test counts verified. Additions flagged.

**normal** (for progress checks): Presence verification primarily. Minor variations tolerated. Focus on critical deviations.

## Phase 1: Parse the Plan

Read the plan file at `$1` completely and extract all verifiable specifications.

**Extract these specification categories:**

### 1.1 File Specifications

For each file mentioned: exact path, create vs edit action, purpose.

### 1.2 Naming Specifications

For each named entity: classes, functions, types, variables, constants, API routes — exact names with case.

### 1.3 Import Specifications

For each file with code blocks: extract all import statements and implied dependencies.

### 1.4 Structural Specifications

API endpoints (method, path, schemas), database columns (name, type, constraints), dependencies, environment variables, configuration keys, annotations.

### 1.5 Behavioral Specifications

Error handling, logging, validation rules, business logic, code logic from plan code blocks.

### 1.6 Test Specifications

Test file paths, case names, exact test count per file, coverage targets, specific scenarios.

**Output format:** Document findings in structured YAML with fields: `file`, `plan_line`, `status` (MATCH/DEVIATION/MISSING/ADDITION), `severity`, `explanation`. Use this format consistently for all phases.

Example:

```yaml
- file: "path/to/File.kt"
  plan_line: 45
  status: "DEVIATION"
  severity: "minor"
  explanation: "Implementation uses different approach but achieves same result"
```

## Phase 2: Identify Implementation Scope

Use git to identify all changes in scope.

```bash
# Get the main branch name
git rev-parse --abbrev-ref origin/HEAD

# If $2 (commit-count) specified:
git log -n $2 --pretty=format:"%H %s"
git diff HEAD~$2 --name-only

# If $2 NOT specified (compare to main):
git log origin/main..HEAD --pretty=format:"%H %s"
git diff origin/main...HEAD --name-only

# Get detailed changes
git diff origin/main...HEAD --stat
```

## Phase 3: Cross-Reference Every Specification (BIDIRECTIONAL)

**Direction 1: Plan -> Implementation** — For each spec in plan, verify it exists in code.
**Direction 2: Implementation -> Plan** — For each element in code, verify it was specified.

Anything found only in Direction 2 is an **ADDITION** that needs assessment.

### 3.1 File Path Verification

Check if each planned file exists at exact path. Verify create vs edit action matches.

### 3.2 Naming Verification

Read actual implementation files and search for exact names (case-sensitive). Flag casing variations, word order differences, separator differences, abbreviations.

### 3.3 Import Verification

For each file: verify planned imports exist in actual file. Flag missing imports as DEVIATION. Flag extra imports as ADDITION.

### 3.4 Code Logic Verification

For code blocks in plan: perform semantic diff. Are same operations performed in same order? Extra or missing steps? Changed parameters or method calls?

### 3.5 API Verification

Verify HTTP method, path (including path variables), request/response schemas match exactly.

### 3.6 Database Schema Verification

Find migration files. Verify table/column names, types, constraints match.

### 3.7 Dependency Verification

Read package.json, build.gradle.kts, requirements.txt. Verify package names and versions.

### 3.8 Test Verification (Quantitative)

Check test file exists, specified cases exist, **count actual vs planned test cases**, verify coverage.

### 3.9 Addition Detection (Implementation -> Plan)

Scan each implementation file for public classes, functions, annotations, imports. Compare against plan. Flag anything not in plan.

### 3.10 Structural Pattern Verification

Use `find_code_by_rule` to verify implementation follows project ast-grep rules — match rules by language: `.kt` files against `kotlin/` rules, `.py` files against `python/` rules, `.ts`/`.tsx` files against `typescript/` rules in `.ast-grep/rules/`. Flag violations as DEVIATION with appropriate severity. Use `find_code` for ad-hoc pattern checks (e.g., verifying a renamed function). Limit to 3 scan operations to avoid token overhead.

### 3.11 Verification Approach

Process all checks (3.1-3.10) sequentially. For each implementation file, verify all applicable categories before moving to the next file.

## Phase 4: Classify Each Finding

### Classification Categories

1. **MATCH**: Implementation exactly matches plan
2. **DEVIATION**: Implementation differs from plan
3. **IMPROVEMENT**: Deviation that is objectively better
4. **REGRESSION**: Deviation that is objectively worse
5. **MISSING**: Plan spec not implemented
6. **ADDITION**: Implementation element not in plan

### Addition Assessment

- **IMPROVEMENT**: Enhances quality, security, or correctness
- **UNNECESSARY**: Adds complexity without benefit
- **NEEDS_REVIEW**: Unclear benefit — requires human decision

### Severity Levels

- **critical**: Security vulnerability, breaking change, data loss risk, core functionality missing
- **major**: Significant functional difference, wrong behavior, missing important feature
- **minor**: Cosmetic difference, naming variation, documentation gap

### Improvement Criteria

Flag as IMPROVEMENT when: reduces security vulnerabilities, improves performance, increases maintainability, follows project patterns better, adds error handling, increases test coverage, fixes bugs in plan code, adds required framework annotations.

### Regression Criteria

Flag as REGRESSION when: introduces security risk, removes planned functionality, reduces error handling, decreases maintainability, violates project patterns, reduces test coverage.

## Phase 5: Generate Report

Write the audit report to `.claude/audits/{plan-name}-audit-implementation-{YYYY-MM-DD}.md`

The report must include these sections:

1. **Summary table**: Total specifications, matches, deviations, improvements, regressions, missing, additions
2. **Additions breakdown**: Count by assessment (improvement/unnecessary/needs review)
3. **Severity breakdown**: Count by critical/major/minor
4. **Detailed findings by file**: Each finding with classification, severity, plan reference, implementation reference, and explanation
5. **Additions not in plan**: Separate section for implementation elements not specified in plan
6. **Missing items**: Plan specs with no implementation
7. **Recommendations**: Must fix, should address, no action required
8. **Audit verification checklist**: Confirm all sections processed, all files analyzed, bidirectional check complete

## Error Handling

| Scenario                      | Action                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| Plan file not found           | Report error: "Plan file not found at: {path}. Verify the path and try again."                         |
| Plan file unparseable         | Report error: "Cannot parse plan file. Expected markdown with structured sections."                    |
| Git commands fail             | Report error: "Git operation failed: {error}. Ensure you're in a git repository with remote 'origin'." |
| No commits in scope           | Report: "No commits found between base and HEAD. Nothing to audit."                                    |
| Implementation file not found | Flag as MISSING with severity based on file type                                                       |

## Verification Step

After completing the audit, confirm:

- All plan sections were processed
- All changed files were analyzed
- Every finding has both plan and implementation references
- Bidirectional verification completed (additions detected)
- Quantitative test comparison performed

Report verification status:

```markdown
## Audit Verification

- [x] All plan sections processed
- [x] All changed files analyzed
- [x] All findings have dual references
- [x] Bidirectional verification complete
- [x] Test count comparison performed
- [x] Report written to: .claude/audits/...

**Audit Status**: COMPLETE
**Strictness Level**: strict
```

# Spec Compliance Checker — Design

> Validates generated Angular code against the spec it claims to implement.

## Problem

The spec framework has tools that validate specs themselves (spec-lint) and
provenance headers in generated code (spec-header-check). What's missing is
the middle layer: **does the generated code actually comply with what the
spec prescribes?**

When an agent generates a component from a spec, it stamps an `@spec` header.
Today nothing verifies that the generated code follows the spec's checklist --
teams discover drift during code review, or worse, in production.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Architecture | Hybrid: universal passes + checklist-driven rules | Catches convention violations always; grows with specs over time |
| Uncheckable items | Report as `manual` severity | Full checklist visibility; teams see what needs human eyes |
| Spec resolution | Configurable `--spec-root` path | No network deps in CI; works for monorepo and multi-repo setups |
| Output format | pretty / github / json (matches existing CI tools) | Consistent with spec-header-check and spec-active-gate |
| Language | Node.js (no dependencies) | Matches all existing tools; zero-install in CI |

## Architecture

```
Source file with @spec header
        |
        v
+------------------------+
|  1. File Discovery     |  Walk source tree, find @spec headers,
|     & Component        |  bundle .ts + .html + .scss into
|     Bundling           |  ComponentBundle objects.
+----------+-------------+
           |
           v
+------------------------+
|  2. Universal Passes   |  Always run. Angular convention checks
|     (fw/angular)       |  derived from fw/angular/component-patterns.
+----------+-------------+
           |
           v
+------------------------+
|  3. Checklist Rules    |  Parse referenced spec's checklist.
|     (spec-specific)    |  Match items -> rule library -> run checks.
|                        |  Unmatched items -> "manual" severity.
+----------+-------------+
           |
           v
+------------------------+
|  4. Report Generator   |  Outputs in same format CLAUDE.md
|     (pretty/github/    |  prescribes for compliance reports.
|      json)             |
+------------------------+
```

## CLI Interface

```bash
node tools/ci/spec-compliance-check.js                          # full scan
node tools/ci/spec-compliance-check.js --changed-only           # git-changed files only
node tools/ci/spec-compliance-check.js --spec-root ../specs     # custom spec location
node tools/ci/spec-compliance-check.js --format github          # GH Actions annotations
node tools/ci/spec-compliance-check.js --format json            # machine-readable
node tools/ci/spec-compliance-check.js --fail-on warning        # exit 1 on warnings too
```

**Flags:**

| Flag | Default | Description |
|---|---|---|
| `--spec-root <path>` | Current working directory | Root of the spec-framework tree. Looks for `tools/registry/registry.json` under this path; resolves each spec's `path` field relative to it. |
| `--changed-only` | false | Only scan git-changed `.ts` files |
| `--format <mode>` | `pretty` | Output: `pretty`, `github`, `json` |
| `--fail-on <level>` | `error` | Exit 1 on: `error`, `warning`, or `info` |

**Exit codes:**
- `0` -- all checks pass (manual items do not count as failures)
- `1` -- at least one `fail` result (or warning/info per `--fail-on`)

## File Discovery & Component Bundling

A single Angular component spans multiple files. The checker groups them for
analysis.

**Discovery flow:**

1. Walk the source tree (or git-changed files with `--changed-only`)
2. Find all `.ts` files containing an `@spec` header
3. For each matched `.ts` file, resolve sibling files by Angular convention:
   - `deal-grid.component.ts` -> `deal-grid.component.html`, `deal-grid.component.scss`
   - Check for inline templates/styles (`template:` / `styles:` in decorator)
4. Bundle into a `ComponentBundle`:

```js
{
  entry: 'src/features/coverage-banker/deal-grid/deal-grid.component.ts',
  files: {
    ts:   'deal-grid.component.ts',       // always present
    html: 'deal-grid.component.html',     // null if inline template
    scss: 'deal-grid.component.scss',     // null if absent (also checks .css)
    spec: 'deal-grid.component.spec.ts',  // test file, optional
  },
  header: {
    specId: 'ds/patterns/ag-grid-datatable',
    specVersion: '2.0.0',
    personaId: 'domain/personas/coverage-banker',  // optional
    personaVersion: '1.0.0',                       // optional
  },
  inlineTemplate: false,
}
```

**Scan defaults:**
- Extensions: `.ts`, `.html`, `.scss`, `.css`
- Ignore: `node_modules`, `dist`, `.git`, `coverage`, `.angular`
- Same ignore patterns as existing `spec-header-check.js`

## Layer 1: Universal Passes

These run on every file with an `@spec` header regardless of which spec it
references. They codify the Angular conventions from
`fw/angular/component-patterns` that CLAUDE.md says apply "regardless of
whether a spec exists."

| Pass ID | What it checks | Files | How |
|---|---|---|---|
| `onpush` | `ChangeDetectionStrategy.OnPush` in `@Component` | `.ts` | Regex for `changeDetection` in decorator |
| `standalone` | `standalone: true` in `@Component` | `.ts` | Regex in decorator |
| `signal-inputs` | Uses `input()` / `input.required()`, no `@Input()` | `.ts` | `@Input(` as violation |
| `signal-outputs` | Uses `output()`, no `@Output()` / `EventEmitter` | `.ts` | `@Output(` / `EventEmitter` as violation |
| `inject-pattern` | Uses `inject()`, no constructor DI | `.ts` | `constructor(` with DI params as violation (empty or super-only constructors are allowed) |
| `control-flow` | Uses `@if` / `@for`, no `*ngIf` / `*ngFor` | `.html` | `*ngIf` / `*ngFor` as violation |
| `ds-imports` | No direct `@angular/material` or `@angular/cdk` imports | `.ts` | Grep import paths |
| `token-usage` | No hardcoded hex colors or raw px in styles | `.scss` or `.css` | Regex for `#[0-9a-fA-F]{3,8}`, bare `px` outside token imports |
| `state-coverage` | Loading, empty, and error states in template | `.html` | Grep for skeleton/loading, empty state, error/retry patterns |

Each pass returns:

```js
{ passId, status: 'pass' | 'fail' | 'skip', message, file, evidence }
```

A pass returns `skip` when its required file type doesn't exist (e.g., no
`.html` file). For inline templates, `control-flow` and `state-coverage`
check the `.ts` file instead.

## Layer 2: Checklist Rules

Parses the referenced spec's checklist section and matches each item against
a rule library.

**Flow:**

1. Read `@spec` header -> resolve spec via registry + `--spec-root`
2. Parse spec markdown -> extract Agent Checklist section (§11 or §13)
3. For each `- [ ]` item, iterate rule library for a pattern match
4. Matched -> run check function -> `pass` / `fail`
5. Unmatched -> report as `manual`

**Rule structure:**

```js
{
  id: 'loading-state',
  // Regex matched against checklist item text
  pattern: /loading\s+state.*(?:skeleton|implemented|per\s+§)/i,
  // Which files in the component bundle to scan
  fileTypes: ['.html', '.ts'],
  // Returns true if compliant, false if violation
  check: (content, allFiles) => /skeleton|loading|isLoading|shimmer/i.test(content),
  // Human-readable failure message
  evidence: 'No loading/skeleton state found in template',
}
```

**Each rule has:**
- `id` -- unique identifier, usable for suppression/config
- `pattern` -- regex matched against checklist item text
- `fileTypes` -- which files in the component bundle to scan
- `check(content, allFiles)` -- boolean. Receives file content and full bundle for cross-file checks
- `evidence` -- human-readable failure message

**Deduplication:** Rules that overlap with universal passes (e.g., OnPush
appears in both the universal set and a spec's checklist) reuse the universal
pass result rather than running the check twice.

**Initial rule library (~25 rules):**

| Category | Example rules | Count |
|---|---|---|
| Angular conventions | OnPush, standalone, signals, inject, control flow | 6 |
| Import restrictions | No Material/CDK, DS wrappers only | 2 |
| Token/styling | No hex colors, no raw px, semantic token imports | 3 |
| State coverage | Loading/skeleton, empty state, error + retry | 3 |
| Accessibility | aria-label, aria-disabled, heading hierarchy | 3 |
| Column/grid specifics | Column pinning, renderer usage, sort defaults | 4 |
| Null/zero handling | Dash placeholder, null checks | 2 |
| File structure | File naming, required files present | 2 |

## Report Generator

Three output modes matching existing CI tools. Output mirrors the compliance
report format prescribed in CLAUDE.md.

**Symbols:** `✓` pass, `✗` fail, `◌` manual review needed

**Pretty output (default):**

```
spec-compliance-check

  Scanning 4 files with @spec headers...

+-----------------------------------------------------------+
| deal-grid.component.ts                                    |
| @spec ds/patterns/ag-grid-datatable v2.0.0                |
| @persona domain/personas/coverage-banker v1.0.0           |
+-----------------------------------------------------------+
| Universal Passes                                          |
|   ✓ onpush          ChangeDetectionStrategy.OnPush        |
|   ✓ standalone       standalone: true                     |
|   ✓ signal-inputs    input() / input.required()           |
|   ✗ ds-imports       Direct @angular/material import      |
|     -> line 12: import { MatSort } from '@angular/...     |
|                                                           |
| Spec Checklist (17 items)                                 |
|   ✓ Column order matches §2 exactly                       |
|   ✓ dealName pinned left, actions pinned right             |
|   ✗ Loading state (skeleton, 8 rows) per §9               |
|     -> No skeleton/loading pattern found in template      |
|   ◌ All acceptance criteria from §12 are satisfied         |
|     -> manual review needed                               |
|   ◌ Pre-built renderers used — no new renderer created     |
|     -> manual review needed                               |
+-----------------------------------------------------------+
| 12 pass · 2 fail · 3 manual                               |
+-----------------------------------------------------------+

Summary: 4 files scanned
  ✗ 1 file(s) with failures
  ✓ 3 file(s) fully compliant
```

**GitHub Actions format (`--format github`):**

```
::error file=src/deal-grid.component.ts,title=Spec Compliance [ds-imports]::Direct @angular/material import (line 12)
::error file=src/deal-grid.component.ts,title=Spec Compliance [loading-state]::No skeleton/loading pattern found
::notice file=src/deal-grid.component.ts,title=Spec Compliance [manual]::3 checklist items require manual review
```

**JSON format (`--format json`):**

```json
{
  "summary": { "files": 4, "pass": 3, "fail": 1, "totalChecks": 68 },
  "files": [{
    "file": "src/deal-grid.component.ts",
    "spec": "ds/patterns/ag-grid-datatable",
    "version": "2.0.0",
    "universal": [
      { "passId": "onpush", "status": "pass" },
      { "passId": "ds-imports", "status": "fail", "evidence": "..." }
    ],
    "checklist": [
      { "item": "Column order matches §2 exactly", "status": "pass", "ruleId": "column-order" },
      { "item": "Loading state...", "status": "fail", "ruleId": "loading-state", "evidence": "..." },
      { "item": "All acceptance criteria...", "status": "manual" }
    ]
  }]
}
```

## Integration Points

### With existing CI tools

The compliance checker complements, not replaces, the existing tools:

| Tool | What it validates | When to run |
|---|---|---|
| `spec-lint.js` | Spec files are well-formed | On spec changes |
| `spec-active-gate.js` | All active specs pass linting | Pre-merge gate |
| `spec-header-check.js` | `@spec` headers are current, not deprecated | On code changes |
| `spec-dependency-check.js` | DS package changes flag affected specs | On package.json changes |
| **`spec-compliance-check.js`** | **Generated code follows spec checklist** | **On code changes** |

### With agent workflows (Agent-OS / Spec Kit)

The compliance checker fits into AI agent workflows at two points:

1. **Post-generation validation** -- after an agent generates code from a spec,
   the compliance checker runs as a verification step before the agent commits
   or opens a PR. This catches drift between what the spec prescribes and what
   the agent actually produced.

2. **CI pipeline gate** -- runs in the PR pipeline alongside existing checks.
   Blocks merge if generated code has compliance failures.

### With CLAUDE.md compliance report

The checker's output format intentionally mirrors the compliance report that
CLAUDE.md requires agents to output before any generated code:

```
<!-- SPEC COMPLIANCE REPORT -->
Spec: [spec-id] v[version]
Checklist:
  ✓ [item] -- compliant
  ✗ [item] -- violation: [what was wrong]
  ◌ [item] -- manual review needed
```

This means the same report format is used by agents (self-reported) and by
the compliance checker (independently verified). Discrepancies between the
two indicate the agent is not correctly self-verifying.

## Scope boundaries

**In scope:**
- Static analysis of `.ts`, `.html`, `.scss`/`.css` files
- Universal Angular convention checks
- Checklist item matching via rule library
- Pretty, GitHub Actions, and JSON output
- `--spec-root` for portable spec resolution
- `--changed-only` for incremental CI runs

**Out of scope (future work):**
- Runtime/behavioral validation (requires test execution)
- AST-level TypeScript parsing (using regex; AST is a future upgrade)
- Auto-fix / code generation from compliance failures
- Remote spec fetching (use `--spec-root` with a local clone instead)

## Files to create

| File | Purpose |
|---|---|
| `tools/ci/spec-compliance-check.js` | Main CLI script (~400-500 lines) |

All logic lives in the single file, matching the pattern of the existing CI
tools. The rule library is defined inline. If it grows beyond ~50 rules, it
can be extracted to `tools/ci/compliance-rules.js`.

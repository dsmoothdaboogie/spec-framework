# Spec Framework

> Spec-driven AI development for enterprise Angular MFE environments.
> Consistent patterns across teams — without shared library coupling.

---

## What this is

The Spec Framework is the authoritative source of implementation patterns for all product teams. Instead of shared component libraries that create cross-team coupling, teams use **specs** — structured markdown documents that tell AI coding agents (and human developers) exactly how to implement a pattern correctly.

A spec defines: DS tokens to use, component structure, canonical configuration, behavioral variants, required states, and a self-verification checklist for agents. Specs are the single source of truth — your own knowledge of Angular, AG Grid, or any library is always secondary to what a spec prescribes.

---

## How this repo fits with your codebase

The spec-framework is a **standalone repo** — it lives outside your application code. Your team's repo references it for specs and tooling:

```
your-team-repo/                  spec-framework/  (this repo)
├── src/                         ├── specs/
│   └── app/                     ├── tools/
│       └── features/            ├── docs/
│           └── my-grid/         └── CLAUDE.md
├── tools/ci/ ← (copy or symlink from spec-framework)
└── CLAUDE.md ← (copy or extend from spec-framework)
```

**Two ways to use the tools:**

```bash
# Option A: Run directly from spec-framework (for exploration)
cd spec-framework
node tools/registry/registry-cli.js search "dashboard"

# Option B: Run from your repo with --spec-root (for CI and compliance checks)
cd your-team-repo
node ../spec-framework/tools/ci/spec-compliance-check.js --spec-root ../spec-framework --changed-only
```

Most teams copy `tools/ci/` into their own repo and configure `--spec-root` to point at the spec-framework checkout. See [WORKFLOW-GUIDE.md](docs/WORKFLOW-GUIDE.md) for CI setup details.

## Quick start

```bash
# Find a spec for your use case
node tools/registry/registry-cli.js search "data table"

# List all active specs
node tools/registry/registry-cli.js list --status active

# Get full spec details
node tools/registry/registry-cli.js get ds/patterns/ag-grid-datatable

# Show a spec's composition tree (templates and pages)
node tools/registry/registry-cli.js tree ds/templates/deal-list

# Validate registry integrity
node tools/registry/registry-cli.js validate

# Lint a spec file
node tools/linter/spec-lint.js specs/ds/patterns/ag-grid-datatable.spec.md
```

---

## Repository structure

```
spec-framework/
├── specs/
│   ├── ds/                        # Design system specs
│   │   ├── tokens/                # Token adapter — swap point between specs and library
│   │   ├── components/            # Component adapter — semantic names to library implementations
│   │   ├── patterns/              # Organism-level UI patterns (ag-grid, etc.)
│   │   ├── templates/             # Page structure contracts composing organisms into layouts
│   │   └── layout/                # App shell and page chrome specs (reserved)
│   ├── domain/                    # Business domain specs
│   │   ├── personas/              # User persona definitions (who uses what)
│   │   ├── entitlements/          # Entitlement and permission contracts
│   │   └── patterns/              # Domain-specific organism compositions (e.g. ag-grid variants per persona)
│   ├── feat/                      # Feature page specs (persona implementations of templates)
│   │   └── [feature]/             # One folder per feature; one page spec per persona
│   └── fw/                        # Framework standards (independent of DS)
│       ├── angular/               # Angular component patterns and conventions
│       ├── services/              # Data access layer patterns
│       ├── state/                 # State management (NgRx SignalStore)
│       └── testing/               # Testing standards
│
├── tools/
│   ├── registry/
│   │   ├── registry.json          # Central spec index — source of truth for all spec metadata
│   │   ├── registry.schema.json   # JSON schema for registry validation
│   │   ├── registry-cli.js        # CLI: list, search, get, tree, validate
│   │   └── registry-sync.js       # Auto-syncs registry from spec frontmatter
│   ├── linter/
│   │   └── spec-lint.js           # Validates spec files against meta-spec rules
│   ├── hooks/
│   │   ├── pre-commit             # Auto-syncs registry on spec changes
│   │   └── install-hooks.js       # Installs git hooks
│   ├── ci/
│   │   ├── spec-header-check.js     # CI: validates @spec provenance headers
│   │   ├── spec-dependency-check.js  # CI: flags specs affected by DS package changes
│   │   ├── spec-active-gate.js       # CI: blocks merge if active specs fail linting
│   │   └── spec-compliance-check.js  # CI: validates generated code against spec checklists
│   └── explorer/
│       └── server.js              # Local web UI for browsing specs
│
└── docs/
    ├── SPEC.template.md           # Authoring guide for organism-level pattern specs
    ├── COMPOSITION-SPEC.template.md # Authoring guide for composition specs
    ├── WORKFLOW-GUIDE.md          # How to use specs with AI agents and CI
    ├── PERSONA.template.md        # Authoring guide for persona docs
    ├── AGENT.system-prompt.md     # Standard system prompt for AI agents consuming specs
    ├── AGENT-INTEGRATION.md       # Setup guide: Copilot, Cursor, Claude, Devin
    ├── GOVERNANCE.md              # Lifecycle, versioning, review process, roles
    └── DS-SWAP-GUIDE.md          # How to swap the underlying design system library
```

---

## Spec namespaces

| Namespace | What lives here |
|---|---|
| `ds/tokens` | Token adapter — maps semantic tokens to the current DS library |
| `ds/components` | Component adapter — maps semantic component names to library implementations |
| `ds/patterns` | Organism-level specs — reusable UI patterns any team can use |
| `ds/templates` | Template specs — page structure contracts (atomic design: Templates) |
| `ds/layout` | App shell and page chrome specs (reserved) |
| `domain/personas` | User persona definitions — who uses the system and what they need |
| `domain/entitlements` | Entitlement and permission contracts |
| `domain/patterns` | Domain-specific compositions — organism specs scoped to a persona or business context |
| `feat/[feature]` | Page specs — persona-specific implementations of a template spec |
| `fw/angular` | Angular component patterns and conventions |
| `fw/services` | Data access layer patterns |
| `fw/state` | State management patterns (NgRx SignalStore) |
| `fw/testing` | Testing standards |

---

## Atomic design tiers

Specs map to atomic design levels. Each tier builds on the one below.

| Tier | Spec type | Namespace | Owner |
|---|---|---|---|
| Atoms / Molecules | Token + component specs | `ds/tokens`, `ds/components` | UI Architecture |
| Organisms | Pattern specs | `ds/patterns`, `domain/patterns` | UI Architecture |
| Templates | Template specs | `ds/templates` | UI Architecture |
| Pages | Page specs | `feat/[feature]` | Feature teams (reviewed by UI Architecture) |

When implementing a feature, agents read specs bottom-up: tokens → components → organism → template → page spec.

---

## Spec status

| Status | Meaning |
|---|---|
| `draft` | In progress — not for production use |
| `active` | Reviewed and approved — use this |
| `deprecated` | Replaced — check `deprecatedBy` for successor |

---

## Guide: Using a spec to build something

You need to build a UI component (a grid, a dashboard, a page) and want to know if there's already a spec for it.

### Step 1: Search the registry

```bash
# Search by keyword
node tools/registry/registry-cli.js search "data table"
node tools/registry/registry-cli.js search "dashboard"

# Browse all active specs
node tools/registry/registry-cli.js list --status active

# Or use the visual explorer
node tools/explorer/server.js
# Open http://localhost:3000 in your browser
```

If you find a spec with `status: active`, use it. If no spec exists, see "Creating a new spec" below.

### Step 2: Read the spec and its dependencies

Every spec tells you what to read first. Look for the **Agent instruction** block in section 1 — it lists the reading order.

**Example:** To build a Coverage Banker grid, the composition spec says read these in order:

```
1. fw/angular/component-patterns     ← Angular conventions (signals, OnPush, etc.)
2. ds/tokens/semantic                 ← Token names to use in SCSS
3. ds/components/component-map        ← Component names to use in templates
4. ds/patterns/ag-grid-datatable      ← Base grid pattern (structure, states, options)
5. This composition spec              ← What's different for this persona
```

The base pattern spec tells you **how** the pattern works. The composition spec tells you **what** this specific persona sees (which columns, which widgets, which actions).

### Step 3: Generate the code

**Option A — With an AI agent (recommended):**

If you have Claude, Copilot, or another AI agent configured with the `CLAUDE.md` instructions, just ask it:

```
Build the Coverage Banker dashboard from spec domain/patterns/dashboard/coverage-banker
```

The agent will:
- Read all dependency specs in order
- Generate the component files
- Stamp `@spec` headers for traceability
- Output a compliance report showing what it checked

**Option B — Manually:**

Follow the spec section by section. The spec is designed to be read in order:

| Section | What to do |
|---|---|
| Scope | Confirm your use case is covered |
| Tokens | Note every token — use these in your SCSS, never raw values |
| Structure | Create the file scaffold |
| Configuration | Copy the config object verbatim |
| Columns / Widgets | Implement in the exact order listed |
| States | Implement loading, empty, and error — all three are required |
| Checklist | Self-verify every item before submitting |

### Step 4: Verify compliance

```bash
# From your team's repo — point --spec-root at the spec-framework checkout
node tools/ci/spec-compliance-check.js --spec-root ../spec-framework --changed-only

# Or if running from inside the spec-framework (e.g., the demo app)
node tools/ci/spec-compliance-check.js --changed-only

# Expected output: ✓ pass for each automated check
# ◌ manual items = things you need to verify by eye
```

Fix any failures, then commit. The CI pipeline will run the same checks on your PR.

### Step 5: Commit with @spec headers

Your generated files should have a provenance header so CI can trace them back:

```typescript
// @spec    ds/patterns/ag-grid-datatable v2.0.0
// @persona domain/patterns/ag-grid-datatable/coverage-banker v1.0.0
```

This is how `spec-header-check` knows which spec your code was built from — and can flag it if the spec gets a new version later.

---

## Guide: Creating a new spec

You need a pattern that doesn't have a spec yet, or you need a new persona-specific composition of an existing pattern.

### First: figure out what kind of spec you need

| I want to... | Spec type | Template | Where it goes |
|---|---|---|---|
| Define a new reusable UI pattern (grid, dashboard, form) | Pattern spec | `docs/SPEC.template.md` | `specs/ds/patterns/` |
| Customize an existing pattern for a specific persona | Composition spec | `docs/COMPOSITION-SPEC.template.md` | `specs/domain/patterns/{pattern}/{persona}.spec.md` |
| Define a page layout that combines patterns | Template spec | `docs/SPEC.template.md` | `specs/ds/templates/` |
| Define a user persona | Persona doc | `docs/PERSONA.template.md` | `specs/domain/personas/` |

**Most of the time, you're writing a composition spec.** The base patterns (`ag-grid-datatable`, `dashboard`) already exist. You just need to define the delta for your persona — which columns, which widgets, which actions.

### Step 1: Copy the right template

```bash
# For a new composition spec (most common)
cp docs/COMPOSITION-SPEC.template.md specs/domain/patterns/dashboard/my-persona.spec.md

# For a new base pattern
cp docs/SPEC.template.md specs/ds/patterns/my-pattern.spec.md
```

### Step 2: Fill in the frontmatter

Every spec starts with metadata. Fill in these fields:

```markdown
**spec-id:** `domain/patterns/dashboard/my-persona`
**version:** `1.0.0`
**status:** `draft`          <!-- start as draft, promote to active after review -->
**owner:** Your Team Name
**base-pattern:** `ds/patterns/dashboard` v1.0.0    <!-- composition specs only -->
**persona:** `domain/personas/my-persona` v1.0.0     <!-- composition specs only -->
```

### Step 3: Write the spec sections

**For a composition spec** (persona-specific delta):

| Section | What to write | Tips |
|---|---|---|
| Intent | 2-3 sentences: who is this for, what do they care about | Include the reading order for agents |
| Columns / Widgets | Table listing every column or widget with params | Order is authoritative — agents follow it exactly |
| Filters | Which columns are filterable, with defaults | |
| Row / Bulk actions | What actions are available | Be explicit about what's absent, not just what's present |
| States | Loading, empty, error — customize messages | All three are required |
| Checklist | Verification items for agents | Each `- [ ]` item becomes a check the agent runs |

**For a base pattern spec** (new reusable pattern):

| Section | What to write | Tips |
|---|---|---|
| Intent + Scope | What this covers and doesn't cover | Link to sibling specs for out-of-scope items |
| Tokens | Every DS token the pattern uses | Agents will never use raw values — list everything |
| Structure | File layout and required inputs/outputs | |
| Configuration | The canonical config object | Agents copy this verbatim |
| Variants | Different modes (client-side, server-side, etc.) | |
| States | Loading, empty, error contracts | |
| Checklist | Agent verification items | This drives the compliance checker |

### Step 4: Lint your spec

```bash
node tools/linter/spec-lint.js specs/domain/patterns/dashboard/my-persona.spec.md
```

Fix any structural issues the linter flags (missing sections, bad frontmatter, etc.).

### Step 5: Register it

Add an entry to `tools/registry/registry.json`:

```json
{
  "spec-id": "domain/patterns/dashboard/my-persona",
  "version": "1.0.0",
  "status": "draft",
  "path": "specs/domain/patterns/dashboard/my-persona.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/templates/deal-pipeline-page"]
}
```

Or let the sync tool do it:

```bash
node tools/registry/registry-sync.js
```

### Step 6: Test it with an agent

Before promoting to `active`, verify that an agent can actually generate correct code from your spec:

```bash
# Ask your AI agent to generate code from the spec
# Then run the compliance checker on the output
node tools/ci/spec-compliance-check.js --changed-only
```

If the agent produces compliant code, your spec is clear enough. If not, the compliance report tells you what was ambiguous or missing.

### Step 7: Open a PR

- Set `status: draft` for initial review
- UI Architecture reviews the spec structure and completeness
- After approval, promote to `status: active`
- The `spec-active-gate` CI check ensures all active specs pass linting

### Quick reference: what makes a good spec

| Do | Don't |
|---|---|
| Be explicit about what's **absent** ("no checkbox column") | Assume agents will infer what's missing |
| List columns/widgets in exact display order | Leave ordering ambiguous |
| Specify null/empty rendering ("—" for null dates) | Let agents guess placeholder text |
| Include a checklist with verifiable items | Write checklist items that can't be checked |
| Reference tokens by name, never raw values | Use hex colors or px values in spec |
| Link to dependency specs in the reading order | Assume agents know the dependency chain |

---

## Contributing

See [GOVERNANCE.md](docs/GOVERNANCE.md) for the full lifecycle, versioning, and review process.

---

## Demo app

The `deal-management-demo/` directory contains a working Angular 19 app that proves the spec-driven workflow end-to-end. It implements a multi-persona deal management pipeline with dashboards and data grids — all generated from specs.

```bash
cd deal-management-demo
npm install
npx ng serve
```

### What the demo includes

**6 personas** — each with a Dashboard and Grid view, switchable via sub-navigation:

| Persona | Grid focus | Dashboard focus |
|---|---|---|
| Coverage Banker | Revenue pipeline, fee columns | Pipeline value, top deals, stage distribution |
| Syndicate Banker | Book-building, coverage multiples | Approaching close, book coverage |
| Business Execution Lead | Milestones, days tracking | Milestone %, execution alerts |
| Conflict Clearance | Conflict status (read-only) | Pending/flagged counts, conflict distribution |
| Compliance Viewer | MNPI, info barriers (read-only) | MNPI flags, audit activity |
| Deal Origination Banker | Origination pipeline | Pipeline growth, early-stage deals |

**Generic primitives** — DS-portable components with no business logic:
- Cell renderers: `StatusBadgeRendererComponent`, `ValueDisplayRendererComponent`
- Dashboard widgets: `MetricCardComponent`, `MiniGridComponent`, `StatusDistributionComponent`, `ActivityFeedComponent`, `AlertListComponent`

**7 deal wrapper renderers** — thin wrappers that map business logic to generic primitives

**Agent test (Phase 3)** — The Deal Origination Banker grid and dashboard were generated by an AI agent reading only the composition specs. The compliance checker validated the output with **0 failures** on all automated checks.

### Primitives registry

```bash
# Search for a widget or renderer
node tools/registry/primitives-cli.js search "metric"

# List all widget primitives
node tools/registry/primitives-cli.js list --category widgets
```

---

## CI tools

These tools run in your CI pipeline to catch spec drift:

| Tool | What it does | When to run |
|---|---|---|
| `spec-lint` | Validates spec files are well-formed | On spec file changes |
| `spec-active-gate` | Ensures all active specs pass linting | Pre-merge gate |
| `spec-header-check` | Validates `@spec` headers in generated code are current | On code changes |
| `spec-dependency-check` | Flags specs affected by DS package version changes | On `package.json` changes |
| `spec-compliance-check` | Validates generated code follows the spec's checklist | On code changes |

All tools support `--format github` for GitHub Actions annotations and `--format json` for machine-readable output.

All compliance/header tools accept `--spec-root <path>` to point at the spec-framework when running from a separate repo.

```bash
# Run from inside spec-framework (browsing specs, linting)
node tools/linter/spec-lint.js specs/ds/patterns/ag-grid-datatable.spec.md
node tools/ci/spec-active-gate.js

# Run from your team's repo (compliance checks against your generated code)
node ../spec-framework/tools/ci/spec-header-check.js --spec-root ../spec-framework --changed-only
node ../spec-framework/tools/ci/spec-compliance-check.js --spec-root ../spec-framework --changed-only
```

See [WORKFLOW-GUIDE.md](docs/WORKFLOW-GUIDE.md) for GitHub Actions CI setup.

---

## Maintained by

UI Architecture · [internal contact / Slack channel]

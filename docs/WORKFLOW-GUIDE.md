# Workflow Guide

> How to use specs with AI agents and CI tooling.

---

## Overview

The spec framework follows a closed loop:

1. **Author specs** -- UI Architecture writes structured markdown specs that define implementation contracts
2. **Agent generates** -- AI coding agents read specs from the registry, generate Angular code that follows the spec exactly
3. **Agent self-verifies** -- the agent runs through the spec's checklist and stamps a compliance report before outputting code
4. **CI independently verifies** -- automated tools validate `@spec` headers, spec structure, dependency freshness, and code compliance
5. **Specs evolve** -- when patterns change, specs get new versions; CI catches stale implementations

This loop ensures that generated code stays aligned with the spec even as specs and DS packages evolve over time.

---

## For teams adopting specs

### Step 1: Get the tools

Either copy the `tools/` directory into your repo, or point tools at your spec-framework checkout:

```bash
# Option A: tools live in your repo
cp -r spec-framework/tools ./tools

# Option B: point at an external spec root
node ../spec-framework/tools/ci/spec-compliance-check.js --spec-root ../spec-framework
```

### Step 2: Install git hooks

```bash
node tools/hooks/install-hooks.js
```

This installs the `pre-commit` hook that auto-syncs the registry when spec files change.

### Step 3: Add CI checks

Add the CI tools to your pipeline. Example GitHub Actions workflow:

```yaml
name: Spec Checks
on:
  pull_request:
    branches: [main]

jobs:
  spec-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Lint active specs
        run: node tools/ci/spec-active-gate.js --format github

      - name: Check @spec headers
        run: node tools/ci/spec-header-check.js --changed-only --format github

      - name: Check DS dependency drift
        run: node tools/ci/spec-dependency-check.js --format github

      - name: Compliance check
        run: node tools/ci/spec-compliance-check.js --changed-only --format github
```

### Step 4: Configure your AI agent

Point your agent at the spec framework via its configuration file:

- **Claude** -- `CLAUDE.md` (already included in this repo)
- **GitHub Copilot** -- `.github/copilot-instructions.md`
- **Cursor / other** -- see `docs/AGENT-INTEGRATION.md`

The key instruction for any agent: search the registry before generating UI code, and follow the spec reading order documented in `CLAUDE.md`.

---

## Agent loop: search, generate, verify

The recommended agent workflow for generating spec-compliant code:

```
┌─────────────────────────────────────────────────────┐
│  1. Search registry for relevant spec               │
│     node tools/registry/registry-cli.js search "…"  │
│                                                     │
│  2. Read spec + dependencies (tokens, components)   │
│     Follow the reading order in CLAUDE.md           │
│                                                     │
│  3. Generate Angular code                           │
│     Apply every section -- do not skip              │
│                                                     │
│  4. Stamp @spec header in generated files           │
│     @spec  ds/patterns/ag-grid-datatable v2.0.0     │
│     @generated 2026-04-06                           │
│                                                     │
│  5. Self-verify against spec checklist              │
│     Output SPEC COMPLIANCE REPORT                   │
│                                                     │
│  6. Run compliance check locally                    │
│     node tools/ci/spec-compliance-check.js          │
│                                                     │
│  7. Commit / open PR                                │
└─────────────────────────────────────────────────────┘
```

### Post-generation hook example

If your agent framework supports post-generation hooks, run the compliance check automatically:

```bash
#!/bin/bash
# post-generate.sh -- run after agent produces code
node tools/ci/spec-compliance-check.js --changed-only --fail-on warning
if [ $? -ne 0 ]; then
  echo "Compliance check failed. Review violations before committing."
  exit 1
fi
```

### Trust-but-verify pattern

Agent self-verification (step 5) is a fast feedback loop during generation. CI verification (steps in the pipeline) is the independent check that catches what the agent missed. Both layers are needed:

- **Self-verify** catches errors before the agent finishes, reducing review churn
- **CI verify** catches drift over time (spec version bumps, DS package changes) and ensures the agent did not hallucinate compliance

---

## @spec header format

Generated files should include a provenance header so CI tools can trace code back to the spec that produced it:

```typescript
// @spec    ds/patterns/ag-grid-datatable v2.0.0
// @persona domain/patterns/ag-grid-datatable/coverage-banker v1.0.0
// @generated 2026-04-06
// @compliance PASS
```

| Field | Required | Read by |
|---|---|---|
| `@spec` | Yes | `spec-header-check`, `spec-compliance-check` |
| `@persona` | No | `spec-header-check` |
| `@generated` | No | `spec-header-check` (staleness detection) |
| `@compliance` | No | `spec-compliance-check` |

Place the header in a comment block at the top of each generated component file (`.ts`, `.html`, `.scss`).

---

## CI tool reference

| Tool | Purpose | Key flags |
|---|---|---|
| `spec-lint` | Validates spec markdown structure | `<file>` positional arg |
| `spec-active-gate` | Blocks merge if any active spec fails linting | `--changed-only`, `--format github\|json` |
| `spec-header-check` | Validates `@spec` headers are current and not deprecated | `--changed-only`, `--fail-on warning`, `--format github\|json` |
| `spec-dependency-check` | Flags specs affected by DS package version changes | `--format github\|json` |
| `spec-compliance-check` | Validates generated code against the spec's checklist rules | `--changed-only`, `--spec-root <path>`, `--fail-on warning`, `--format github\|json` |

All tools exit `0` on success and non-zero on failure, making them suitable for CI gates.

### Output formats

- **`pretty`** (default) -- coloured terminal output for local development
- **`github`** -- emits `::error::` and `::warning::` annotations for GitHub Actions
- **`json`** -- machine-readable output for custom integrations

---

## Maintaining compliance over time

### When a spec version bumps

1. The registry is updated with the new version
2. `spec-header-check` flags any generated files that reference the old version as **stale**
3. Teams re-generate affected components against the new spec
4. `spec-compliance-check` validates the regenerated code

### When DS packages change

1. A PR updates `package.json` with new DS package versions
2. `spec-dependency-check` detects the version delta and lists all specs that depend on those packages
3. Spec authors review whether the specs need updates
4. If specs change, the version-bump cycle above applies

### When a spec is deprecated

1. The spec's status is set to `deprecated` with a `deprecatedBy` pointer
2. `spec-header-check` flags any generated files still referencing the deprecated spec as **errors**
3. Agents refuse to generate code against deprecated specs (per CLAUDE.md instructions)
4. Teams migrate to the replacement spec

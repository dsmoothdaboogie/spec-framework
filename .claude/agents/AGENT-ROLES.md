# Spec Framework — Agent Context

This file is shared context for all role-based agents reviewing this spec framework. Read it before doing any spec review.

---

## What this framework is

A spec-driven development framework for Angular UI pattern generation used on an internal investment banking deal management platform. Specs are structured markdown files that define the complete implementation contract for a UI pattern — they are the authoritative source of truth. AI agents (Claude Code, GitHub Copilot, Devin.ai) read a spec and generate code mechanically, without making architectural decisions themselves.

The framework has two layers:
- **Layer A** — Pre-built, shared building blocks: cell renderers, calculation functions, domain types. Lives in `src/app/shared/` in the demo app. Agents must NOT recreate these.
- **Layer B** — Persona-specific wiring: each persona grid is composed from Layer A components per spec instructions. Lives in `src/app/features/<persona>/deal-grid/`.

---

## Repository structure

```
spec-framework/
├── specs/
│   ├── fw/          — Framework meta-specs (spec authoring standards)
│   ├── ds/          — Design system specs (tokens, components, patterns)
│   │   ├── tokens/
│   │   ├── components/
│   │   └── patterns/
│   └── domain/      — Business domain specs
│       ├── personas/          — Who uses each view
│       ├── entitlements/      — What data each persona can see
│       └── patterns/
│           └── ag-grid-datatable/   — Persona-specific grid specs
├── tools/
│   ├── registry/
│   │   ├── registry.json      — Spec index (id, title, version, status, tags)
│   │   └── registry-cli.js    — CLI for search/get/validate
│   └── linter/
│       └── spec-lint.js       — Validates spec structure completeness
├── .claude/
│   ├── settings.json          — Agent teams enabled
│   └── agents/                — Role-based agent definitions (you are here)
└── docs/
    └── GAP-REPORT.template.md — Standard output format for gap reviews
```

---

## CLI tools (run from spec-framework root)

```bash
# Search the registry
node tools/registry/registry-cli.js search "<keyword>"

# Retrieve a spec by ID (shows specType, layer, dependsOn, requiredBy)
node tools/registry/registry-cli.js get domain/patterns/ag-grid-datatable/coverage-banker

# Check blast radius of changing a spec
node tools/registry/registry-cli.js blast-radius ds/patterns/ag-grid-datatable

# Validate registry entries
node tools/registry/registry-cli.js validate

# Lint a spec (auto-detects spec type: pattern vs composition)
node tools/linter/spec-lint.js specs/domain/patterns/ag-grid-datatable/coverage-banker.spec.md

# CI: verify all active specs pass linting
node tools/ci/spec-active-gate.js
```

---

## Key specs to read for a full-stack review

| Spec | Purpose |
|---|---|
| `specs/domain/personas/coverage-banker.persona.md` | Who the user is, what they need |
| `specs/domain/entitlements/deal-full.entitlement.md` | What data they can see |
| `specs/domain/patterns/ag-grid-datatable/coverage-banker.spec.md` | How the grid is built |
| `specs/ds/patterns/deal-grid-calculations.spec.md` | Shared calculation contracts |

---

## Gap report format

All agents produce output using `docs/GAP-REPORT.template.md`. Key sections:
- **Gaps Found** — table: Gap | Severity (critical/major/minor) | Spec section | Recommendation
- **Missing spec sections** — sections that should exist but don't
- **Long-term scalability concerns** — issues that compound as the framework grows
- **Recommended new spec templates** — new spec types or sections needed

Severity guide:
- `critical` — blocks correct implementation or creates compliance risk
- `major` — causes inconsistency across agents or personas
- `minor` — friction or omission that degrades quality over time

# Spec Framework

> Spec-driven AI development for enterprise Angular MFE environments.
> Consistent patterns across teams — without shared library coupling.

---

## What this is

The Spec Framework is the authoritative source of implementation patterns for all product teams. Instead of shared component libraries that create cross-team coupling, teams use **specs** — structured markdown documents that tell AI coding agents (and human developers) exactly how to implement a pattern correctly.

A spec defines: DS tokens to use, component structure, canonical configuration, behavioral variants, required states, and a self-verification checklist for agents. Specs are the single source of truth — your own knowledge of Angular, AG Grid, or any library is always secondary to what a spec prescribes.

---

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
│   │   ├── storybook/             # Storybook authoring standards
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
│   │   └── pre-commit             # Runs linter on changed specs before commit
│   ├── ci/
│   │   ├── spec-header-check.js   # CI: validates spec frontmatter headers
│   │   └── spec-dependency-check.js # CI: validates spec cross-references
│   └── explorer/
│       └── server.js              # Local web UI for browsing specs
│
└── docs/
    ├── SPEC.template.md           # Authoring guide for organism-level pattern specs
    ├── TEMPLATE-SPEC.template.md  # Authoring guide for template specs (page layouts)
    ├── PAGE-SPEC.template.md      # Authoring guide for page specs (persona implementations)
    ├── PERSONA.template.md        # Authoring guide for persona docs
    ├── AGENT.system-prompt.md     # Standard system prompt for AI agents consuming specs
    ├── AGENT-INTEGRATION.md       # Setup guide: Copilot, Cursor, Claude, Devin
    ├── GOVERNANCE.md              # Lifecycle, versioning, review process, roles
    └── DS-SWAP-GUIDE.md           # How to swap the underlying design system library
```

---

## Spec namespaces

| Namespace | What lives here |
|---|---|
| `ds/tokens` | Token adapter — maps semantic tokens to the current DS library |
| `ds/components` | Component adapter — maps semantic component names to library implementations |
| `ds/patterns` | Organism-level specs — reusable UI patterns any team can use |
| `ds/templates` | Template specs — page structure contracts (atomic design: Templates) |
| `ds/storybook` | Storybook authoring standards |
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

## Contributing a spec

See [GOVERNANCE.md](docs/GOVERNANCE.md) for the full process.

Short version:

1. Choose the right authoring guide from `docs/` based on what you're writing
2. Copy the template, fill it in, run the linter
3. Add an entry to `registry.json`
4. Open a PR — UI Architecture reviews before merging to `active`

| What you're writing | Template to use |
|---|---|
| Organism-level UI pattern | `docs/SPEC.template.md` |
| Page layout contract | `docs/TEMPLATE-SPEC.template.md` |
| Persona implementation of a template | `docs/PAGE-SPEC.template.md` |
| User persona | `docs/PERSONA.template.md` |

---

## Maintained by

UI Architecture · [internal contact / Slack channel]

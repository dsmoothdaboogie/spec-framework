# Spec Framework

> Spec-driven AI development for enterprise Angular MFE environments.
> Consistent patterns across teams — without shared library coupling.

---

## What this is

The Spec Framework is the authoritative source of implementation patterns for all product teams. Instead of shared component libraries that create cross-team coupling, teams use **specs** — structured markdown documents that tell AI coding agents (and human developers) exactly how to implement a pattern correctly.

A spec defines: DS tokens to use, component structure, canonical configuration, behavioral variants, required states, and a self-verification checklist for agents.

---

## Quick start

```bash
# Find a spec for your use case
node tools/registry/registry-cli.js search "data table"

# Get spec details
node tools/registry/registry-cli.js get ds/patterns/ag-grid-datatable

# In your AI agent (Copilot, Cursor, Claude):
/spec ds/patterns/ag-grid-datatable my-feature
```

---

## Repository structure

```
spec-framework/
├── specs/
│   └── ds/
│       ├── patterns/          # UI pattern specs (ag-grid, forms, etc.)
│       ├── tokens/            # DS token reference specs
│       └── layout/            # Page layout specs
├── tools/
│   ├── registry/
│   │   ├── registry.json      # Central spec index
│   │   ├── registry.schema.json
│   │   └── registry-cli.js    # CLI: list, search, get, validate
│   └── linter/
│       └── spec-lint.js       # Validates spec files against meta-spec
└── docs/
    ├── SPEC.template.md       # Meta-spec — template for all specs
    ├── AGENT.system-prompt.md # Standard system prompt for AI agents
    ├── copilot-commands.json  # Copilot Chat slash command definitions
    └── GOVERNANCE.md          # Lifecycle, versioning, review process
```

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

Short version: copy `SPEC.template.md`, fill it in, run `spec-lint.js`, add to `registry.json`, open a PR.

---

## Maintained by

UI Architecture · [internal contact / Slack channel]

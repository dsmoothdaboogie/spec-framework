# CLAUDE.md

## Spec-driven development

This repository uses a spec-driven development framework. Specs are standalone
markdown files that define what to build — columns, widgets, actions, states,
renderers, and a self-verification checklist.

Specs are the authoritative source of truth. Follow the spec exactly as written.

### Spec locations

```
specs/grid/{persona}.spec.md        — standalone grid spec per persona
specs/dashboard/{persona}.spec.md   — standalone dashboard spec per persona
specs/detail-view/{persona}.spec.md — standalone detail view spec per persona
specs/reference/                    — background docs (grid defaults, widget contracts, calculations)
tools/registry/registry.json        — spec index
tools/registry/primitives.json      — renderer, widget, and editor registry
```

### Before generating a component

1. Search the registry for a relevant spec:
   `node tools/registry/registry-cli.js search "<use case>"`

2. If a spec exists with `status: active`:
   - Read it completely — each spec is self-contained
   - Follow every section — do not skip or partially apply
   - Use renderers listed in the spec (see `tools/registry/primitives.json` for full component docs)

3. If no spec exists:
   - Note the gap explicitly in your response
   - Suggest a spec-id for UI Architecture to consider

### How to read a spec

Each spec follows a consistent structure. Read it top to bottom:

| Section | What to do |
|---------|------------|
| Purpose | Understand what this persona cares about |
| Columns / Widgets | Implement in the exact order listed |
| Filters | Apply default filter values |
| Actions | Implement row and bulk actions (or confirm none for read-only views) |
| Renderers | Use the specified components from the primitives registry |
| Null / Zero rendering | Every nullable field must render per spec — do not guess |
| States | Implement loading, empty, and error — all three required |
| Defaults | Apply sort, data mode, entitlement rules |
| Checklist | Self-verify before outputting |

### Required output format

Before any generated code, output this compliance report:

```
<!-- SPEC COMPLIANCE REPORT -->
Spec: [spec-id] v[version]

Checklist:
  ✓ [item] — compliant
  ✗ [item] — violation: [what was wrong]
  ⚠ [item] — partial: [what's missing]

Unresolved (items spec did not cover):
  — [decision you made independently]
```

### Token usage

All visual properties use CSS custom properties defined in `:root`:

```scss
.my-component {
  background: var(--color-surface-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-subtle);
  padding: var(--spacing-s4);
}
```

Never use raw hex colors, px values, or font stacks. See `specs/reference/` docs
or `styles.scss` `:root` block for the full token list.

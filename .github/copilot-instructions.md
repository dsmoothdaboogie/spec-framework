# GitHub Copilot Instructions

## How to use this file

This file configures GitHub Copilot Chat behavior for this repository
(.github/copilot-instructions.md). If you already have a
copilot-instructions.md, copy only the block marked
<!-- SPEC FRAMEWORK START --> through <!-- SPEC FRAMEWORK END -->
and paste it into your existing file at a logical position.

This block is self-contained and will not conflict with existing Copilot
instructions or team preferences already in this file.

---

<!-- SPEC FRAMEWORK START ─────────────────────────────────────────────────────
     Spec-Driven AI Development Framework — GitHub Copilot Integration
     Version: 1.0.0
     Maintainer: UI Architecture
──────────────────────────────────────────────────────────────────────────── -->

## Spec-driven development

This codebase uses a spec framework for all Angular UI pattern generation.
When generating Angular components, always check for a spec first.

### Check for a spec before generating

Use the /spec-search slash command or check the registry directly:
- Registry: `tools/registry/registry.json`
- Pattern specs: `specs/ds/patterns/`
- Token spec: `specs/ds/tokens/semantic.spec.md`
- Component map: `specs/ds/components/component-map.spec.md`

If a spec exists with `status: active`, follow it completely.
If no spec exists, apply the Angular conventions below and note the gap.

### Slash commands available

- `/spec <spec-id> [feature-name]` — generate a component from a spec
- `/spec-search <description>` — find a spec for a use case
- `/spec-check <spec-id>` — check selected code against a spec
- `/spec-new <spec-id> <title>` — scaffold a new spec from the template

These commands are defined in `docs/copilot-commands.json`.

### How to follow a spec

1. Read the full spec before writing any code
2. §2 Scope — confirm the use case is in scope, else route to correct spec
3. §3 Tokens — use only semantic token imports, never raw values
4. §4 Structure — scaffold the file layout first
5. §5 Config — copy verbatim, no overrides
6. §6 Types — use DS renderers/formatters, no inline formatting
7. §7 Variants — identify and state the correct variant
8. §8–9 States — loading, empty, and error are all required

### Output contract

When generating code against a spec, output this before the code:

```
<!-- SPEC COMPLIANCE REPORT -->
Spec: [spec-id] v[version]
Variant: [name] — [reason]
Checklist: [§11 items marked ✓ / ✗ / ⚠]
Unresolved: [gaps you decided independently]
```

### Angular conventions (always apply)

- `input()`, `output()`, `inject()` — never `@Input`, `@Output`,
  constructor injection
- Standalone components — no NgModules
- `ChangeDetectionStrategy.OnPush` — every component
- `takeUntilDestroyed()` — all subscriptions
- No direct Material/AG Grid/CDK imports in feature components
- No inline styles — SCSS with semantic tokens only

### Token import paths (always stable)

```scss
@use '@company/spec-tokens/color'   as color;
@use '@company/spec-tokens/type'    as type;
@use '@company/spec-tokens/spacing' as spacing;
@use '@company/spec-tokens/grid'    as grid-tokens;
```

<!-- SPEC FRAMEWORK END ────────────────────────────────────────────────────── -->

---

<!-- Add your team or developer-specific Copilot instructions below -->

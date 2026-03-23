# Devin Knowledge: Spec-Driven Development Framework

## How to use this file

Devin reads knowledge files from the repository to inform its behavior.
If you already have a `.devin/knowledge.md` or similar Devin knowledge
file, copy the block marked <!-- SPEC FRAMEWORK START --> through
<!-- SPEC FRAMEWORK END --> and paste it into your existing file.

This block is self-contained. It will not conflict with existing Devin
knowledge or team-specific instructions.

---

<!-- SPEC FRAMEWORK START ─────────────────────────────────────────────────────
     Spec-Driven AI Development Framework — Devin Integration
     Version: 1.0.0
     Maintainer: UI Architecture
──────────────────────────────────────────────────────────────────────────── -->

## Spec Framework

### What it is

This repository uses a spec-driven development framework. Specs are
structured markdown files that define exactly how to implement UI patterns —
tokens, component structure, configuration, and a self-verification
checklist. They are the authoritative source of truth for all Angular
component generation.

### Before writing any Angular component

Run the registry search to check if a spec exists:

```bash
node tools/registry/registry-cli.js search "<pattern description>"
```

If a spec exists with `status: active`, you must follow it. Read it
completely before generating any code.

If no spec exists, note the gap in your session summary and proceed with
the universal Angular conventions listed below.

### Spec file locations

```
specs/ds/tokens/semantic.spec.md       — token adapter (always read first)
specs/ds/components/component-map.spec.md  — component adapter
specs/ds/patterns/*.spec.md            — pattern implementation specs
```

### Reading a spec — required steps

1. Check scope (§2) — if out of scope, identify the correct spec and stop
2. Read token map (§3) — all visual properties use semantic tokens only
3. Use file layout (§4.1) — generate the scaffold before filling content
4. Copy configuration verbatim (§5) — no additions or removals
5. Map column/field types to DS renderers (§6) — no inline formatting
6. Identify behavioral variant (§7) — state your selection before coding
7. Implement all required states (§8–9) — loading, empty, error are
   all mandatory, never optional

### Required output before code

Before outputting any generated files, output this report:

```
SPEC COMPLIANCE REPORT
Spec: [spec-id] v[version]
Variant: [name] — [reason for selection]

Checklist:
[reproduce the §11 checklist from the spec]
[mark each: PASS | FAIL | PARTIAL]

Gaps (items spec did not cover):
[list anything you decided independently]
```

### Spec linter

Before completing any session that generates Angular components, run:

```bash
node tools/linter/spec-lint.js specs/ds/patterns/[relevant-spec].spec.md
```

This validates the spec itself, not the generated code. Run it to confirm
you were working from a valid spec.

### Registry validation

If you add or modify anything in `tools/registry/registry.json`, always
run:

```bash
node tools/registry/registry-cli.js validate
```

Fix any errors before completing the session.

### Universal Angular conventions (always apply)

- Angular 19 signals API: `input()`, `output()`, `signal()`, `computed()`
- No `@Input`, `@Output`, or constructor injection anywhere
- Standalone components only — no NgModules
- `ChangeDetectionStrategy.OnPush` on every component
- `takeUntilDestroyed()` for subscriptions — no manual unsubscribe patterns
- No direct imports of Angular Material, AG Grid, or CDK in feature
  components — use DS wrapper components only
- No inline styles — SCSS only, semantic tokens only

### Token imports (always use these paths)

```scss
@use '@company/spec-tokens/color'    as color;
@use '@company/spec-tokens/type'     as type;
@use '@company/spec-tokens/spacing'  as spacing;
@use '@company/spec-tokens/grid'     as grid-tokens;
```

Never import from `@angular/material` directly in a feature component.

### What to do when a spec is deprecated

Stop. Report: "[spec-id] is deprecated — use [deprecatedBy] instead."
Do not generate code against a deprecated spec under any circumstances.

### What to do when no spec exists

Note it, proceed with Angular conventions above, and include in your
session summary:
"No spec found for [pattern]. Suggest creating spec-id: [proposed-id]."

<!-- SPEC FRAMEWORK END ────────────────────────────────────────────────────── -->

---

<!-- Add Devin-specific or team-specific knowledge below this line -->

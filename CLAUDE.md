# CLAUDE.md

> **Status in this organisation:** Not currently enabled in the workplace.
> This file is included for future readiness. When Claude becomes available,
> this file will be picked up automatically — no additional configuration needed.

## How to use this file

CLAUDE.md is Claude's repository-level memory file. If you already have a
CLAUDE.md, copy only the block marked <!-- SPEC FRAMEWORK START --> through
<!-- SPEC FRAMEWORK END --> and paste it into your existing file.

This block is self-contained and will not conflict with existing Claude
instructions or personal preferences already in this file.

---

<!-- SPEC FRAMEWORK START ─────────────────────────────────────────────────────
     Spec-Driven AI Development Framework — Claude Integration
     Version: 2.0.0
     Maintainer: UI Architecture
──────────────────────────────────────────────────────────────────────────── -->

## Spec-driven development

This repository uses a spec-driven development framework for all Angular UI
pattern generation. Specs are structured markdown files that define the
complete implementation contract for a pattern — tokens, structure,
configuration, and a self-verification checklist.

Specs are the authoritative source of truth. Your own knowledge of Angular,
AG Grid, or Angular Material is always secondary to what a spec prescribes.

### Spec types and locations

The framework has two spec types with different section schemas:
- **Pattern specs** (`SPEC.template.md`) — ds/ and fw/ layer specs with full section schema
- **Composition specs** (`COMPOSITION-SPEC.template.md`) — domain/ layer-3 delta specs that compose a base pattern for a specific persona

```
specs/ds/tokens/semantic.spec.md          — token adapter, read first
specs/ds/components/component-map.spec.md — component adapter, read second
specs/ds/patterns/*.spec.md               — pattern specs
specs/domain/patterns/**/*.spec.md        — composition specs (persona-specific deltas)
tools/registry/registry.json              — spec index with typed dependency edges
```

### Before generating any Angular component

1. Search the registry for a relevant spec:
   `node tools/registry/registry-cli.js search "<use case>"`

2. If a spec exists with `status: active`:
   - Read it completely before writing any code
   - Read `ds/tokens/semantic` and `ds/components/component-map` alongside it
   - Follow every section — do not skip or partially apply

3. If no spec exists:
   - Apply the Angular conventions below
   - Note the gap explicitly in your response
   - Suggest a spec-id for UI Architecture to consider

### Reading a pattern spec — required order

| Step | Section | Action |
|------|---------|--------|
| 1 | §2 Scope | Confirm in scope. If not, name the correct spec and stop. |
| 2 | §3 Tokens | Note every semantic token. Never use raw values anywhere. |
| 3 | §4 Structure | Generate the file scaffold before any logic. |
| 4 | §5 Config | Copy the configuration object verbatim. No modifications. |
| 5 | §6 Types | Map each column/field type to its DS renderer or formatter. |
| 6 | §7 Variants | Identify the correct variant. State your selection. |
| 7 | §8–9 States | Implement loading, empty, and error. All three are required. |
| 8 | §11 Checklist | Self-verify before outputting. Report results. |

### Reading a composition spec — required order

| Step | Section | Action |
|------|---------|--------|
| 1 | §1 Intent | Follow the spec reading order — read all dependencies first. |
| 2 | §2 Columns | Column order is authoritative. Match renderer params exactly. |
| 3 | §3–5 Filters/Actions | Implement filters, row actions, and bulk actions with scope. |
| 4 | §6 Variant | Note data strategy, sort, density, pagination. |
| 5 | §7 Value getters | Use exact calculation functions — no ad-hoc implementations. |
| 6 | §8 Null/zero rules | Every nullable column must render per spec. Do not guess. |
| 7 | §9–11 States | Loading, empty, error — all three required. |
| 8 | §12 Acceptance | Verify all acceptance criteria are satisfied. |
| 9 | §13 Checklist | Self-verify before outputting. Report results. |

### Required output format

Before any generated code, output this compliance report:

```
<!-- SPEC COMPLIANCE REPORT -->
Spec: [spec-id] v[version]
Variant selected: [name] — [one sentence reason]

Checklist:
[reproduce §11 checklist from the spec, marking each item]
  ✓ [item] — compliant
  ✗ [item] — violation: [what was wrong]
  ⚠ [item] — partial: [what's missing]

Unresolved (items spec did not cover):
  — [decision you made independently]
```

### Deprecated specs

If `status: deprecated`, stop immediately:
"[spec-id] is deprecated. Use [deprecatedBy] instead."
Do not generate code against a deprecated spec.

### Spec gaps

If the use case is out of scope for any spec:
"This use case is not covered by [spec-id]. I need clarification on
[specific gap] before proceeding." Do not guess or improvise.

### Universal Angular conventions

These apply regardless of whether a spec exists:

```typescript
// ✓ Angular 19 patterns
name = input<string>();
clicked = output<void>();
service = inject(MyService);

// ✗ Never use these
@Input() name: string;
@Output() clicked = new EventEmitter();
constructor(private service: MyService) {}
```

- Standalone components only — no NgModules
- `ChangeDetectionStrategy.OnPush` on every component, always
- `takeUntilDestroyed()` for all observable subscriptions
- No direct Angular Material, AG Grid, or CDK imports in feature components
- DS wrapper components only via `@company/ds/*`
- No inline styles — component SCSS only
- CSS custom properties only — no raw hex colors, px values, or font stacks

### Token usage

```scss
// All visual properties go through CSS custom properties defined in :root
// See ds/tokens/semantic spec for the full token list
.my-component {
  background: var(--color-surface-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-subtle);
  padding: var(--spacing-s4);
  font: var(--type-label);
}
```

### Cortex integration

If Cortex slash commands are available in this session:
- Use `/spec <spec-id>` to retrieve and apply a spec
- Use `/spec-search <description>` to find relevant specs
- Use `/spec-check <spec-id>` to verify selected code against a spec

<!-- SPEC FRAMEWORK END ────────────────────────────────────────────────────── -->

---

<!-- Add your personal Claude preferences below this line.
     Examples: preferred response length, formatting style,
     language preferences, domain-specific context. -->

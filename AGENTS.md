# AGENTS.md

This file is the root behavioral contract for all AI agents operating in this
repository. It may contain team-specific or developer-specific conventions
above or below the spec framework block.

If you already have an AGENTS.md, copy only the block marked
<!-- SPEC FRAMEWORK START --> through <!-- SPEC FRAMEWORK END -->
and paste it into your existing file. It is self-contained and will not
conflict with existing content.

---

<!-- SPEC FRAMEWORK START ─────────────────────────────────────────────────────
     Spec-Driven AI Development Framework
     Version: 1.0.0
     Maintainer: UI Architecture
     Do not edit this block directly. Changes should be made in
     docs/AGENT.system-prompt.md and propagated here.
──────────────────────────────────────────────────────────────────────────── -->

## Spec-Driven Development

This repository uses a spec-driven development framework. Before generating
any UI component or pattern, you must locate and read the relevant spec.
Specs are the authoritative source of truth. Your own knowledge of a library
is always secondary to what a spec prescribes.

### Where specs live

```
specs/
└── ds/
    ├── tokens/
    │   └── semantic.spec.md          ← token adapter (read this first)
    ├── components/
    │   └── component-map.spec.md     ← component adapter (read this second)
    └── patterns/
        └── [pattern].spec.md         ← implementation pattern specs
```

### Finding the right spec

1. Search the registry: `node tools/registry/registry-cli.js search "<use case>"`
2. List all active specs: `node tools/registry/registry-cli.js list --status active`
3. Get a specific spec: `node tools/registry/registry-cli.js get <spec-id>`

If no spec exists for your use case, proceed with your best judgment and
note the gap. Do not create a spec file yourself — raise it with UI
Architecture.

### How to read a spec

Read the spec top to bottom before writing any code.

1. **Check §2 Scope first.** If the use case is out of scope, name the
   correct spec and stop. Do not improvise a solution.
2. **Read §3 DS Tokens.** Never use raw hex, px, or rem values for any
   property listed in the token map. Always use the semantic import path.
3. **Use §4 Component Structure as your scaffold.** Generate the file
   layout before filling in content.
4. **Copy §5 configuration verbatim.** Never add or remove options unless
   explicitly instructed.
5. **Check §6 column/field types.** Use only the prescribed DS renderers
   and formatters — no inline formatting.
6. **Identify the behavioral variant from §7** before generating. State
   which variant you selected and why.
7. **Generate all required states from §8–9.** Missing a loading or empty
   state is a spec violation.

### Output contract

When generating code against a spec, always output this report first,
before any code:

```
<!-- SPEC COMPLIANCE REPORT -->
Spec: [spec-id] v[version]
Variant selected: [variant name] — [one sentence reason]

Checklist:
[copy the agent checklist from §11 of the spec]
[mark each item ✓ compliant | ✗ violation | ⚠ partial]

Unresolved:
[anything the spec did not cover that you decided independently]
```

### When the spec doesn't cover something

State clearly: "This use case is not covered by [spec-id]. I need
clarification on [specific gap] before proceeding." Do not guess.

### Deprecated specs

If a spec has `status: deprecated`, stop immediately. Report:
"[spec-id] is deprecated. Use [deprecatedBy] instead." Do not generate
code against a deprecated spec.

### Universal Angular conventions

These apply to all generated code regardless of whether a spec exists:

- Angular 19+ patterns only: `input()`, `output()`, `inject()` — never
  `@Input`, `@Output`, or constructor injection
- Standalone components only — no NgModules
- `ChangeDetectionStrategy.OnPush` on every component
- `takeUntilDestroyed()` for all subscriptions — no manual unsubscribe
- DS component imports only — never import Material, CDK, or AG Grid
  directly into a feature component
- No inline styles on any component

<!-- SPEC FRAMEWORK END ────────────────────────────────────────────────────── -->

---

<!-- Add your team or developer-specific conventions below this line -->

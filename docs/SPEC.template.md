# Pattern Spec: [Title]
**spec-id:** `[namespace]/[category]/[pattern-name]`
**version:** `0.1.0`
**status:** `draft` <!-- draft | active | deprecated -->
**owner:** `[Team Name]`
**last-reviewed:** `YYYY-MM-DD`
**applies-to:** `Angular 19+, [library and version]`
**replaces:** `n/a` <!-- or spec-id of deprecated spec this replaces -->

---

## 1. Intent

<!-- 2–4 sentences. What problem does this spec solve and for whom?
     End with the agent instruction anchor. -->

> **Agent instruction:** [One sentence directing the agent's default behavior when consuming this spec.]

---

## 2. Scope

### In scope
<!-- Bullet list of what this spec covers. Be specific. -->

### Out of scope
<!-- Bullet list of what this spec does NOT cover, with redirects to sibling specs. -->
<!-- Format: "[use case] → `[spec-id]`" -->

---

## 3. Design System Tokens

<!-- All visual properties must use DS tokens. List every token used. -->

```scss
// Required imports
@use '@company/ds-tokens/[module]' as [alias];
```

| Property | Token | Notes |
|---|---|---|
| [property] | `[alias].$[token-name]` | |

> **Agent instruction:** Never use raw hex, px, or rem values for any property listed above.

---

## 4. Component Structure

### 4.1 File layout

```
[feature]/
└── components/
    └── [feature]-[pattern]/
        ├── [feature]-[pattern].component.ts
        ├── [feature]-[pattern].component.html
        ├── [feature]-[pattern].component.scss
        ├── [feature]-[pattern].types.ts
        └── [feature]-[pattern].component.spec.ts
```

### 4.2 Required inputs / outputs

```typescript
@Component({ ... })
export class FeaturePatternComponent {
  // Required inputs
  // Optional inputs with defaults
  // Outputs
}
```

### 4.3 Template skeleton

```html
<!-- Minimal required template structure -->
```

---

## 5. [Primary Configuration Section]

<!-- e.g. Grid Options, Form Config, Router Config -->
<!-- Include the canonical default object/config as a code block -->
<!-- Mark which fields are immutable vs. configurable -->

---

## 6. [Composition / Sub-pattern Section]

<!-- e.g. Column Conventions, Field Types, Route Guards -->
<!-- Use tables to map types to their prescribed implementations -->

---

## 7. [Behavioral Variants]

<!-- e.g. Data Modes, Auth Modes, Layout Modes -->
<!-- Define the decision rule the agent uses to select the right variant -->

---

## 8. [State Management]

<!-- e.g. Loading, Empty, Error states -->
<!-- All states are required. List the DS component for each. -->

---

## 9. Accessibility Requirements

<!-- Minimum a11y requirements specific to this pattern -->
- [ ] [requirement]

---

## 10. Testing Requirements

<!-- Minimum required test coverage for this pattern -->
- [ ] [test case]

---

## 11. Agent Checklist

<!-- Every item maps to a section above. Agent self-verifies before output. -->
<!-- Add/remove items as appropriate for this pattern. -->

> Before outputting generated code, verify every item below:

- [ ] File layout matches §4.1
- [ ] All required inputs/outputs present per §4.2
- [ ] [Primary config] matches §5 — no ad-hoc overrides
- [ ] All DS tokens used — zero hardcoded values per §3
- [ ] All required states implemented per §8
- [ ] All accessibility requirements met per §9
- [ ] [Pattern-specific check]

---

## 12. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 0.1.0 | YYYY-MM-DD | Initial draft | [Author] |

---

## 13. Related Specs & Resources

- `[spec-id]` — [description]
- Library docs: [url]

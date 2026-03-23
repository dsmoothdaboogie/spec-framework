# Template Spec: [Title]

> **This is the authoring guide for template specs (atomic design: Templates).**
> Template specs define page structure contracts — which organisms compose a page and how.
> - For organism-level specs, use `docs/SPEC.template.md`
> - For persona-specific page implementations, use `docs/PAGE-SPEC.template.md`

**spec-id:** `ds/templates/[page-name]`
**spec-type:** `template`
**version:** `0.1.0`
**status:** `draft` <!-- draft | active | deprecated -->
**owner:** `UI Architecture`
**last-reviewed:** `YYYY-MM-DD`
**applies-to:** `Angular 19+`
**composes:** `[spec-id of each organism this template uses]`
**instantiated-by:** see registry

---

## 1. Intent

<!-- 2–4 sentences. What page pattern does this template define? Who builds implementations of it?
     End with the agent instruction anchor specifying the full reading order. -->

> **Agent instruction:** Read `ds/tokens/semantic`, `ds/components/component-map`, and `[organism spec-ids]` — in that order — before reading this template. This spec composes those patterns. If implementing a specific persona, also read that persona's page spec after reading this template.

---

## 2. Scope

### In scope
<!-- What page-level concerns does this template govern? -->

### Out of scope
<!-- What does this template NOT cover? Redirect to sibling templates or page specs.
     Format: "[use case] → `[spec-id]`" -->

---

## 3. Design System Tokens

<!-- Token imports and usage for the page shell only.
     Organism tokens are governed by their own pattern specs — do not redefine them here. -->

```scss
@use '@company/spec-tokens/color'    as color;
@use '@company/spec-tokens/type'     as type;
@use '@company/spec-tokens/spacing'  as spacing;
```

| Property | Token | Region |
|---|---|---|
| [property] | `[alias].$[token]` | [which region] |

> **Agent instruction:** Never use raw hex, px, or rem for any property above. Token references here apply to the page shell only.

---

## 4. Page Structure

### 4.1 File layout

```
[feature]/
├── [feature]-page.component.ts
├── [feature]-page.component.html
├── [feature]-page.component.scss
├── [feature]-page.types.ts
└── components/
    └── [sub-components per slot]
```

### 4.2 Region map

<!-- List all named regions the page template defines. -->

| Region | CSS class | Required | Default sizing |
|---|---|---|---|
| [region name] | `.[css-class]` | yes/no | [sizing] |

### 4.3 Host layout

```scss
/* CSS grid or flex layout for the page host */
:host {
  display: grid;
  /* ... */
}
```

### 4.4 Page component inputs / outputs

```typescript
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class FeaturePageComponent {
  // Required inputs (if any — usually none; data comes from router resolver)
  // Outputs (if the page is embedded and a parent needs to react)
}
```

---

## 5. Organism Composition

<!-- For each organism used, document the constraint tier and specific requirements.
     Constraint tiers:
       Fixed       — template mandates this; page specs cannot override
       Configurable — template mandates the slot; page spec provides specifics
       Optional    — slot exists; page spec declares fill or explicit skip -->

### 5.1 [Region name] — [organism spec-id]

| Aspect | Constraint | Tier |
|---|---|---|
| Organism | `[spec-id]` v[min-version]+ | Fixed |
| [config aspect] | [constraint] | Fixed/Configurable/Optional |

### 5.2 Required minimum [data / fields / items]

<!-- If the template mandates a minimum set (e.g., required columns), define it here.
     Page specs may add to this set; they may not remove from it. -->

| Position | Field | Label | Type |
|---|---|---|---|
| [n] | `[field]` | [Header] | [type / DS renderer] |

> **Agent instruction:** [Minimum set constraint in one sentence.]

---

## 6. Slot Configuration Contracts

<!-- Define the formal API that every implementing page spec must satisfy.
     One section per slot. -->

### Slot: [slot-name]

**Required:** yes / no

<!-- What organism fills this slot? What must the page spec provide?
     What must the page spec NOT override? -->

---

## 7. Layout Variants

<!-- Define the layout variants a page spec must declare.
     Page specs declare their variant in **layout-variant:** frontmatter. -->

**Variant A: `[variant-name]`** — [description]

**Variant B: `[variant-name]`** — [description]

> **Agent instruction:** Read the page spec's `**layout-variant:**` frontmatter before generating. If absent, raise the gap — do not assume a default.

---

## 8. Required States (Page Level)

<!-- Full-page states, distinct from per-organism states.
     Per-organism states are governed by their pattern specs. -->

| State | Trigger | Implementation |
|---|---|---|
| Page loading | [trigger] | `DsLoadingSpinnerComponent` covering all regions |
| Page error | [trigger] | `DsErrorStateComponent` with retry action |
| [other] | [trigger] | [implementation] |

---

## 9. Routing Contract

```typescript
{
  path: '[page-spec declares the path]',
  loadComponent: () => import('./[feature]-page.component'),
  canActivate: [/* page spec declares guards */],
  resolve: { /* page spec declares resolvers */ },
}
```

---

## 10. Cross-Organism Interaction Contract

<!-- If organisms on the page communicate (e.g., row selection opens a panel),
     define the event flow here. Leave empty with a note if no cross-organism
     interaction is required. -->

---

## 11. Accessibility Requirements

- [ ] [page-level a11y requirement]
- [ ] All organism-level a11y requirements from composed specs apply

---

## 12. Agent Checklist

> **Agent instruction:** Page specs reproduce this checklist verbatim and add persona-specific items. Use this checklist only when generating without a page spec.

- [ ] Layout variant declared and implemented per §7
- [ ] All regions present in DOM per §4.2
- [ ] Host layout matches §4.3
- [ ] All organism compositions applied; `gridOptions` (or equivalent) verbatim per §5
- [ ] Minimum [data/fields] set present in correct order per §5.2
- [ ] All slot contracts satisfied per §6
- [ ] Page-level states implemented per §8
- [ ] Routing contract satisfied per §9
- [ ] Cross-organism interactions implemented per §10
- [ ] All a11y requirements met per §11
- [ ] All composed organism checklist items verified

---

## 13. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 0.1.0 | YYYY-MM-DD | Initial draft | UI Architecture |

---

## 14. Related Specs & Resources

- `[organism spec-id]` — [description] (read before this template)
- `ds/tokens/semantic` — token adapter
- `ds/components/component-map` — component adapter
- `[page spec-id]` — [persona] page spec

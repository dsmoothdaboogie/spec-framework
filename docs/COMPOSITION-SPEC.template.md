# Composition Spec: [Title]
**spec-id:** `domain/patterns/[base-pattern]/[persona-name]`
**version:** `0.1.0`
**status:** `draft` <!-- draft | active | deprecated -->
**spec-type:** `composition`
**layer:** `3`
**owner:** `[Team Name]`
**last-reviewed:** `YYYY-MM-DD`
**applies-to:** `Angular 19+`
**base-pattern:** `ds/patterns/[base-pattern]` v[X.Y.Z]
**persona:** `domain/personas/[persona-name]` v[X.Y.Z]
**entitlement:** `domain/entitlements/[entitlement-name]` v[X.Y.Z]
**compliance-signoff:** `[Name / Role / Date]` <!-- required if any column is fee-sensitive, revenue-sensitive, or mnpi-sensitive -->

---

## 1. Intent

<!-- 2–4 sentences. What delta does this spec define on top of the base pattern?
     Name the persona and their primary workflow. -->

> **Agent instruction:** Read specs in this order before generating:
> 1. `fw/angular/component-patterns` — structural contract
> 2. `ds/tokens/semantic` — token adapter
> 3. `ds/components/component-map` — component adapter
> 4. `ds/patterns/[base-pattern]` — base pattern contract
> 5. `ds/patterns/[calculations-spec]` — calculation functions and pre-built renderers
> 6. `domain/personas/[persona-name]` — persona context
> 7. `domain/entitlements/[entitlement-name]` — entitlement rules
> 8. This spec — delta only
>
> Do NOT create new cell renderers. Use the pre-built renderers from `src/app/shared/cell-renderers/` as listed in the calculations spec §5.

---

## 2. Columns

<!-- Define every column in display order. This is the authoritative column list. -->

| # | Column | Field | Type | Renderer / Import path | Pinned | Sensitivity tags |
|---|--------|-------|------|------------------------|--------|-----------------|
| 1 | — | — | checkbox | `DS_CHECKBOX_COL` (see base pattern §5) | left | — |
| 2 | [Column Name] | `fieldName` | text | — (plain text) | — | — |

<!-- If a column uses a pre-built renderer, state the full component name and any
     cellRendererParams as a code block immediately below the table. -->

### Renderer params

```typescript
// Col [N]: [Column Name]
{
  cellRenderer: [RendererComponent],
  cellRendererParams: {
    // Document every param — do not leave for agents to infer
  }
}
```

### Badge / status color map (if applicable)

<!-- Enumerate every value → variant mapping so visual regression tests can be spec-driven. -->

| Value | Badge variant |
|---|---|
| [value] | [variant] |

---

## 3. Filters (default active)

| Column | Filter type | Default value |
|--------|-------------|---------------|
| [Column Name] | Multi-select / Range / Date range | [default or "None"] |

---

## 4. Row actions

```typescript
[
  {
    id: '[action-id]',
    label: '[Label]',
    icon: '[icon]',
    disabled: /* expression evaluated via params.data — document the logic */,
  },
]
```

> **Agent instruction:** `disabled` is evaluated inside the renderer via `params.data`.
> Disabled state renders with `aria-disabled="true"` and reduced opacity — not hidden.

---

## 5. Bulk actions

```typescript
[
  { id: '[action-id]', label: '[Label]', scope: '[all | own-deals-only | team-deals-only]' },
]
```

<!-- For each action with a scope constraint, specify the enforcement mechanism:
     pre-filter, userContext param, or server-side guard. -->

---

## 6. Behavioral variant

<!-- Client-side or server-side data. Default sort field and direction.
     Row density (compact / standard). Pagination default. -->

- **Data strategy:** Client-side (mock data in demo)
- **Default sort:** `[field]` [ascending | descending] (per persona §5)
- **Row density:** [compact | standard] (per persona §5)
- **Pagination default:** [number] rows per page

---

## 7. Column value getters

<!-- Code blocks for every calculated column. Reference the exact calculation function
     from the calculations spec. -->

```typescript
// Col [N]: [Column Name]
{
  colId: '[colId]',
  headerName: '[Header]',
  valueGetter: (p) => calcFunction(p.data.fieldA, p.data.fieldB),
  valueFormatter: (p) => formatFunction(p.value),
}
```

---

## 8. Null / zero value rendering rules

<!-- Every nullable or calculated column must have a stated fallback.
     Agents must not guess what to render for null/undefined/zero. -->

| Column | Null / undefined | Zero | Negative |
|--------|-----------------|------|----------|
| [Column Name] | Render "—" | [Render "0" or "—"] | [Render as-is or "—"] |

---

## 9. Loading state

```typescript
{
  // Skeleton rows, shimmer effect, or spinner — reference base pattern §8
  type: '[skeleton | spinner]',
  rows: [number],  // number of placeholder rows to show
}
```

---

## 10. Empty state

```typescript
{
  icon: '[icon]',
  title: '[Title]',
  description: '[Description]',
}
```

---

## 11. Error state

```typescript
{
  icon: '[icon]',
  title: '[Title]',
  description: '[Description]',
  retryAction: true,  // show a retry button
}
```

---

## 12. Acceptance criteria

<!-- Minimum 5 assertable, user-facing scenarios. Each must be verifiable from this spec
     alone — no external knowledge required. QA uses these to write Playwright/Cypress tests. -->

- [ ] **AC-1:** [When X, then Y is visible / hidden / formatted as Z]
- [ ] **AC-2:** [When user has entitlement [level], columns [list] are [visible | suppressed]]
- [ ] **AC-3:** [When [field] is null, cell renders "—"]
- [ ] **AC-4:** [Bulk action [name] applies only to [scope]]
- [ ] **AC-5:** [Default sort is [field] [direction], default filters are [list]]

---

## 13. Agent checklist

<!-- Every item maps to a section above. Agent self-verifies before output. -->

> Before outputting generated code, verify every item below:

- [ ] All 15 spec sections read before generating
- [ ] Pre-built renderers used — no new renderer created
- [ ] Column order matches §2 exactly
- [ ] All `cellRendererParams` match §2 renderer params — no missing or extra params
- [ ] All sensitivity-tagged columns have corresponding entitlement enforcement
- [ ] Calculated columns use `valueGetter` per §7 — not stored fields
- [ ] Null/zero rendering matches §8 for every nullable column
- [ ] Loading state implemented per §9
- [ ] Empty state implemented per §10
- [ ] Error state implemented per §11
- [ ] All acceptance criteria from §12 are satisfied
- [ ] Row actions match §4 — disabled logic present
- [ ] Bulk actions match §5 — scope constraints enforced
- [ ] Default sort and pagination match §6
- [ ] [Pattern-specific check]

---

## 14. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 0.1.0 | YYYY-MM-DD | Initial draft | [Author] |

---

## 15. Related Specs

- `ds/patterns/[base-pattern]` — base pattern
- `ds/patterns/[calculations-spec]` — calculation functions + pre-built renderers
- `domain/personas/[persona-name]`
- `domain/entitlements/[entitlement-name]`

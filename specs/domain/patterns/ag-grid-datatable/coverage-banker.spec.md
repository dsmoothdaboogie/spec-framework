# Composition Spec: AG Grid — Coverage Banker
**spec-id:** `domain/patterns/ag-grid-datatable/coverage-banker`
**version:** `1.1.0`
**status:** `active`
**spec-type:** `composition`
**layer:** `3`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-06
**base-pattern:** `ds/patterns/ag-grid-datatable` v2.0.0
**persona:** `domain/personas/coverage-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0
**compliance-signoff:** `J. Martinez / Head of Compliance / 2026-03-15`

---

## 1. Intent

Defines the AG Grid datatable as experienced by a Coverage Banker. Revenue-focused pipeline view with deal size, gross spread, estimated revenue, and days-to-close prominence. This spec defines only the delta from the base pattern.

> **Agent instruction:** Read specs in this order before generating:
> 1. `fw/angular/component-patterns` — structural contract
> 2. `ds/tokens/semantic` — token adapter
> 3. `ds/components/component-map` — component adapter
> 4. `ds/patterns/ag-grid-datatable` — base grid contract
> 5. `ds/patterns/deal-grid-calculations` — calculation functions and pre-built renderers
> 6. `domain/personas/coverage-banker` — persona context
> 7. `domain/entitlements/deal-full` — entitlement rules
> 8. This spec — delta only
>
> Do NOT create new cell renderers. Use the pre-built renderers from `src/app/shared/cell-renderers/` as listed in `ds/patterns/deal-grid-calculations §5`.

---

## 2. Columns

| # | Column | Field | Type | Renderer / Import path | Pinned | fee-sensitive |
|---|--------|-------|------|------------------------|--------|---------------|
| 1 | — | — | checkbox | `DS_CHECKBOX_COL` | left | false |
| 2 | Deal Name | `dealName` | text | — (plain text, router link on click) | left | false |
| 3 | Issuer | `issuerName` | text | — | — | false |
| 4 | Type | `dealType` | badge | `DealStageRendererComponent` variant: neutral | — | false |
| 5 | Stage | `stage` | badge | `DealStageRendererComponent` | — | false |
| 6 | Deal Size | `dealSizeUsd` | custom | `DealSizeRendererComponent` | — | false |
| 7 | Gross Spread | `grossSpreadBps` | custom | `FeeRevenueRendererComponent` (shows bps + inline revenue) | — | **true** |
| 8 | Est. Revenue | calculated | currency | `valueGetter` → `calcGrossRevenue()`, formatted as currency | — | **true** |
| 9 | Days to Close | calculated | custom | `DaysCountdownRendererComponent` (thresholds: warn=30, error=7) | — | false |
| 10 | Mandate Date | `mandateDate` | date | date pipe | — | false |
| 11 | Coverage Banker | `coverageBankerName` | text | — | — | false |
| 12 | — | — | actions | `ActionsCellRendererComponent` | right | false |

### Stage badge color map (applied by `DealStageRendererComponent`)

| Stage | Badge variant |
|---|---|
| Origination | info |
| Mandate | info |
| Due Diligence | warning |
| Marketing | warning |
| Pricing | success |
| Closed | neutral |
| Withdrawn | error |

---

## 3. Filters (default active)

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Stage | Multi-select | Mandate, Due Diligence, Marketing, Pricing |
| Deal Type | Multi-select | None (show all) |
| Deal Size | Range | None |
| Mandate Date | Date range | None |

---

## 4. Row actions

```typescript
[
  { id: 'view',          label: 'View',          icon: '👁' },
  { id: 'advance-stage', label: 'Advance stage', icon: '→', disabled: stage === 'Closed' || stage === 'Withdrawn' },
  { id: 'add-note',      label: 'Add note',      icon: '📝' },
]
```

---

## 5. Bulk actions

```typescript
[
  { id: 'bulk-advance', label: 'Advance stage' },
  { id: 'export',       label: 'Export CSV' },
]
```

---

## 6. Behavioral variant

Client-side data (mock data in demo). Default sort: `expectedCloseDate` ascending per persona §5.

---

## 7. Column value getters

```typescript
// Col 8: Estimated Revenue
{
  colId: 'estimatedRevenue',
  headerName: 'Est. Revenue',
  valueGetter: (p) => calcGrossRevenue(p.data.dealSizeUsd, p.data.grossSpreadBps),
}

// Col 9: Days to Close
{
  colId: 'daysToClose',
  headerName: 'Days to Close',
  valueGetter: (p) => calcDaysToClose(p.data.expectedCloseDate),
}
```

---

## 8. Null / zero value rendering rules

| Column | Null / undefined | Zero | Negative |
|--------|-----------------|------|----------|
| Deal Name | — (should never be null) | — | — |
| Issuer | Render "—" | — | — |
| Deal Size | Render "—" | Render "$0" | — |
| Gross Spread | Render "—" | Render "0 bps" | — |
| Est. Revenue | Render "—" | Render "$0" | Render as negative (red text) |
| Days to Close | Render "—" (withdrawn/no close date) | Render "Today" | Render as overdue with error styling |
| Mandate Date | Render "—" | — | — |
| Coverage Banker | Render "Unassigned" | — | — |

---

## 9. Loading state

```typescript
{
  type: 'skeleton',
  rows: 8,
  // Render 8 skeleton rows matching column widths from §2
  // Use base pattern §8 skeleton row component
}
```

---

## 10. Empty state

```typescript
{
  icon: '💼',
  title: 'No deals in your pipeline',
  description: 'Deals you cover will appear here.',
}
```

---

## 11. Error state

```typescript
{
  icon: '⚠',
  title: 'Unable to load deals',
  description: 'Something went wrong loading your pipeline. Please try again.',
  retryAction: true,
}
```

---

## 12. Acceptance criteria

- [ ] **AC-1:** When the grid loads, columns appear in the exact order defined in §2 (checkbox, Deal Name, Issuer, Type, Stage, Deal Size, Gross Spread, Est. Revenue, Days to Close, Mandate Date, Coverage Banker, Actions).
- [ ] **AC-2:** When a user has `deal-full` entitlement, Gross Spread (Col 7) and Est. Revenue (Col 8) are visible. When entitlement is `deal-restricted`, both columns are hidden — no empty column, no error.
- [ ] **AC-3:** When `expectedCloseDate` is null (e.g., withdrawn deal), Days to Close renders "—" — not "0", not blank, not an error.
- [ ] **AC-4:** When `daysToClose <= 7`, the cell renders with error styling. When `daysToClose <= 30 AND > 7`, warning styling. When `daysToClose > 30`, normal styling.
- [ ] **AC-5:** Default sort is `expectedCloseDate` ascending, default filters exclude Origination and Closed/Withdrawn stages.
- [ ] **AC-6:** Bulk "Export CSV" exports only deals owned by the current user — not all visible rows.
- [ ] **AC-7:** Row action "Advance stage" is disabled (not hidden) for deals in Closed or Withdrawn stage, with `aria-disabled="true"`.
- [ ] **AC-8:** When data is loading, 8 skeleton rows render. When loading fails, error state with retry button appears.

---

## 13. Agent checklist

> Before outputting generated code, verify every item below:

- [ ] All 15 spec sections read before generating
- [ ] Pre-built renderers used — no new renderer created
- [ ] Column order matches §2 exactly
- [ ] All `cellRendererParams` match §2 — no missing or extra params
- [ ] `dealName` pinned left, `actions` pinned right
- [ ] Stage badge uses color map from §2
- [ ] `FeeRevenueRendererComponent` for grossSpreadBps (shows inline revenue)
- [ ] `estimatedRevenue` uses `valueGetter` per §7 — not a stored field
- [ ] `DaysCountdownRendererComponent` thresholds: warn=30d, error=7d
- [ ] Null/zero rendering matches §8 for every nullable column
- [ ] Loading state (skeleton, 8 rows) implemented per §9
- [ ] Empty state implemented per §10
- [ ] Error state with retry implemented per §11
- [ ] All acceptance criteria from §12 are satisfied
- [ ] Row actions match §4 — disabled logic present with `aria-disabled`
- [ ] Bulk actions match §5 — export scope is own-deals-only
- [ ] Default sort: expectedCloseDate asc, default filters per §3

---

## 14. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Product |
| 1.1.0 | 2026-04-06 | Added loading/error states, null rules, acceptance criteria, compliance-signoff | UI Architecture |

---

## 15. Related Specs

- `ds/patterns/ag-grid-datatable` — base pattern
- `ds/patterns/deal-grid-calculations` — calculation functions + pre-built renderers
- `domain/personas/coverage-banker`
- `domain/entitlements/deal-full`

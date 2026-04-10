# Grid: Coverage Banker

**spec-id:** `grid/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-08
**pattern:** `ag-grid-datatable`
**persona:** `coverage-banker`
**entitlement:** `deal-full`
**compliance-signoff:** `J. Martinez / Head of Compliance / 2026-03-15`

---

## 1. Purpose

Revenue-focused pipeline view for Coverage Bankers. Deal size, gross spread, estimated revenue, and days-to-close are the primary data signals. The banker needs to see which deals are closing soon and what revenue they represent. Fee-sensitive columns (Gross Spread, Est. Revenue) are hidden when entitlement is `deal-restricted`.

---

## 2. Columns

| # | Column | Field | Type | Renderer | Pinned | fee-sensitive |
|---|--------|-------|------|----------|--------|---------------|
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

## 3. Filters

Default active filters:

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Stage | Multi-select | Mandate, Due Diligence, Marketing, Pricing |
| Deal Type | Multi-select | None (show all) |
| Deal Size | Range | None |
| Mandate Date | Date range | None |

---

## 4. Row Actions

```typescript
[
  { id: 'view',          label: 'View',          icon: 'visibility' },
  { id: 'advance-stage', label: 'Advance stage', icon: 'arrow_forward',
    disabled: stage === 'Closed' || stage === 'Withdrawn',
    ariaDisabled: stage === 'Closed' || stage === 'Withdrawn' },
  { id: 'add-note',      label: 'Add note',      icon: 'note_add' },
]
```

"Advance stage" is disabled (not hidden) for Closed or Withdrawn deals, with `aria-disabled="true"`.

---

## 5. Bulk Actions

```typescript
[
  { id: 'bulk-advance', label: 'Advance stage' },
  { id: 'export',       label: 'Export CSV' },    // exports own-deals-only, not all visible rows
]
```

---

## 6. Renderers

Use pre-built renderers from `src/app/shared/cell-renderers/`. Do NOT create new renderers. Reference `primitives.json` for full component docs.

| Column | Renderer | Import path |
|--------|----------|-------------|
| Type, Stage | `DealStageRendererComponent` | `src/app/shared/cell-renderers/deal-stage-renderer/` |
| Deal Size | `DealSizeRendererComponent` | `src/app/shared/cell-renderers/deal-size-renderer/` |
| Gross Spread | `FeeRevenueRendererComponent` | `src/app/shared/cell-renderers/fee-revenue-renderer/` |
| Days to Close | `DaysCountdownRendererComponent` | `src/app/shared/cell-renderers/days-countdown-renderer/` |
| Actions | `ActionsCellRendererComponent` | `src/app/shared/cell-renderers/actions-cell-renderer/` |

---

## 7. Calculations

All functions are pure exports from `src/app/shared/calculations/deal-calculations.ts`.

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

`DaysCountdownRendererComponent` thresholds for Days to Close: `{ warnDays: 30, errorDays: 7 }`.

---

## 8. Null / Zero Rendering

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

## 9. States

### Loading

```typescript
{
  type: 'skeleton',
  rows: 8,
  // Render 8 skeleton rows matching column widths from §2
}
```

### Empty

```typescript
{
  icon: 'work',
  title: 'No deals in your pipeline',
  description: 'Deals you cover will appear here.',
}
```

### Error

```typescript
{
  icon: 'warning',
  title: 'Unable to load deals',
  description: 'Something went wrong loading your pipeline. Please try again.',
  retryAction: true,
}
```

---

## 10. Defaults

- **Data mode:** Client-side (mock data in demo)
- **Default sort:** `expectedCloseDate` ascending
- **Default filters:** Stage = Mandate, Due Diligence, Marketing, Pricing (excludes Origination and Closed/Withdrawn)
- **Entitlement:** `deal-full` — Gross Spread (col 7) and Est. Revenue (col 8) visible. At `deal-restricted`, both columns are hidden — no empty column, no error.

---

## 11. Acceptance Criteria

- [ ] **AC-1:** Columns appear in the exact order defined in §2 (checkbox, Deal Name, Issuer, Type, Stage, Deal Size, Gross Spread, Est. Revenue, Days to Close, Mandate Date, Coverage Banker, Actions).
- [ ] **AC-2:** At `deal-full` entitlement, Gross Spread (col 7) and Est. Revenue (col 8) are visible. At `deal-restricted`, both are hidden — no empty column, no error.
- [ ] **AC-3:** When `expectedCloseDate` is null (e.g., withdrawn deal), Days to Close renders "—" — not "0", not blank, not an error.
- [ ] **AC-4:** When `daysToClose <= 7`, cell renders with error styling. When `daysToClose <= 30 AND > 7`, warning styling. When `daysToClose > 30`, normal styling.
- [ ] **AC-5:** Default sort is `expectedCloseDate` ascending, default filters exclude Origination and Closed/Withdrawn stages.
- [ ] **AC-6:** Bulk "Export CSV" exports only deals owned by the current user — not all visible rows.
- [ ] **AC-7:** Row action "Advance stage" is disabled (not hidden) for Closed or Withdrawn stage, with `aria-disabled="true"`.
- [ ] **AC-8:** When data is loading, 8 skeleton rows render. When loading fails, error state with retry button appears.

---

## 12. Checklist

- [ ] Column order matches §2
- [ ] `dealName` pinned left, `actions` pinned right
- [ ] Stage badge uses color map from §2
- [ ] `FeeRevenueRendererComponent` for `grossSpreadBps` (shows inline revenue)
- [ ] Est. Revenue uses `valueGetter` per §7 — not a stored field
- [ ] `DaysCountdownRendererComponent` thresholds: warn=30d, error=7d
- [ ] Renderers match §6 — no new renderers created
- [ ] Null/zero rendering matches §8 for every nullable column
- [ ] All three states implemented per §9
- [ ] Default sort: `expectedCloseDate` asc
- [ ] Default filters match §3
- [ ] Row actions match §4 — disabled logic present with `aria-disabled`
- [ ] Bulk actions match §5 — export scope is own-deals-only
- [ ] Fee-sensitive columns hidden at `deal-restricted` entitlement
- [ ] All acceptance criteria from §11 satisfied

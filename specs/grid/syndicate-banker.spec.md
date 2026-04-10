# Grid: Syndicate Banker

**spec-id:** `grid/syndicate-banker`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-08
**pattern:** `ag-grid-datatable`
**persona:** `syndicate-banker`
**entitlement:** `deal-full`

---

## 1. Purpose

Book-building focused pipeline view for Syndicate Bankers. Coverage multiple and allocation size are the primary data signals. Pricing date proximity drives sort order — bankers need to see which deals are pricing soonest and whether books are covered.

---

## 2. Columns

| # | Column | Field | Type | Renderer | Pinned | Notes |
|---|--------|-------|------|----------|--------|-------|
| 1 | — | — | checkbox | `DS_CHECKBOX_COL` | left | |
| 2 | Deal Name | `dealName` | text | — | left | pinned |
| 3 | Issuer | `issuerName` | text | — | — | |
| 4 | Type | `dealType` | badge | `DealStageRendererComponent` variant: neutral | — | |
| 5 | Stage | `stage` | badge | `DealStageRendererComponent` | — | same color map as §2 stage table |
| 6 | Deal Size | `dealSizeUsd` | custom | `DealSizeRendererComponent` | — | |
| 7 | Gross Spread | `grossSpreadBps` | text | `valueFormatter: formatBps` | — | "125bps" — no inline revenue |
| 8 | Book Coverage | `bookbuildCoverageMultiple` | custom | `CoverageMultipleRendererComponent` | — | color thresholds per §7 |
| 9 | Allocation | `syndicateAllocationUsd` | custom | `DealSizeRendererComponent` | — | |
| 10 | Pricing Date | `pricingDate` | date | date pipe | — | |
| 11 | Syndicate Desk | `syndicateDeskName` | text | — | — | |
| 12 | — | — | actions | `ActionsCellRendererComponent` | right | |

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
| Stage | Multi-select | Marketing, Pricing |
| Deal Type | Multi-select | IPO, Follow-on, ECM, DCM, Leveraged Finance |
| Pricing Date | Date range | None |
| Syndicate Desk | Single-select | None |

---

## 4. Row Actions

```typescript
[
  { id: 'view',            label: 'View' },
  { id: 'update-books',    label: 'Update books' },
  { id: 'pricing-summary', label: 'Pricing summary' },
]
```

---

## 5. Bulk Actions

```typescript
[
  { id: 'export', label: 'Export CSV' },
]
```

---

## 6. Renderers

Use pre-built renderers from `src/app/shared/cell-renderers/`. Do NOT create new renderers. Reference `primitives.json` for full component docs.

| Column | Renderer | Import path |
|--------|----------|-------------|
| Type, Stage | `DealStageRendererComponent` | `src/app/shared/cell-renderers/deal-stage-renderer/` |
| Deal Size, Allocation | `DealSizeRendererComponent` | `src/app/shared/cell-renderers/deal-size-renderer/` |
| Book Coverage | `CoverageMultipleRendererComponent` | `src/app/shared/cell-renderers/coverage-multiple-renderer/` |
| Actions | `ActionsCellRendererComponent` | `src/app/shared/cell-renderers/actions-cell-renderer/` |

Note: `grossSpreadBps` uses `valueFormatter: formatBps` — NOT `FeeRevenueRendererComponent`. Result is "125bps" with no inline revenue figure.

---

## 7. Book Coverage Color Thresholds

Applied by `CoverageMultipleRendererComponent` via `cellRendererParams`:

| Coverage multiple | CSS variable |
|---|---|
| ≥ 2.0x | `var(--color-status-success)` |
| ≥ 1.0x and < 2.0x | `var(--color-status-warning)` |
| < 1.0x | `var(--color-status-error)` |

---

## 8. States

### Loading

```typescript
{
  type: 'skeleton',
  rows: 8,
}
```

### Empty

```typescript
{
  icon: 'bar_chart',
  title: 'No active book-building deals',
  description: 'Capital markets deals in Marketing or Pricing stage will appear here.',
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

## 9. Defaults

- **Data mode:** Client-side
- **Default sort:** `pricingDate` ascending
- **Default filters:** Stage = Marketing, Pricing; Deal Type = IPO, Follow-on, ECM, DCM, Leveraged Finance
- **Entitlement:** `deal-full`

---

## 10. Checklist

- [ ] Column order matches §2
- [ ] `dealName` pinned left, `actions` pinned right
- [ ] Stage badge uses color map from §2
- [ ] `DealSizeRendererComponent` used for both `dealSizeUsd` AND `syndicateAllocationUsd`
- [ ] `CoverageMultipleRendererComponent` uses color thresholds from §7
- [ ] `grossSpreadBps` uses `formatBps` value formatter — NOT `FeeRevenueRendererComponent`
- [ ] Renderers match §6 — no new renderers created
- [ ] All three states implemented per §8
- [ ] Default sort: `pricingDate` asc
- [ ] Default filters match §3
- [ ] Row actions match §4
- [ ] Bulk actions match §5

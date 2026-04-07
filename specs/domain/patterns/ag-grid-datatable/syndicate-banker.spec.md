# Composition Spec: AG Grid — Syndicate Banker
**spec-id:** `domain/patterns/ag-grid-datatable/syndicate-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Product
**spec-type:** `composition`
**last-reviewed:** 2026-04-03
**base-pattern:** `ds/patterns/ag-grid-datatable` v2.0.0
**persona:** `domain/personas/syndicate-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the AG Grid datatable for a Syndicate Banker. Book-building focus: coverage multiple and allocation size are the primary data signals. Pricing date proximity drives sort order.

> **Agent instruction:** Read specs in order:
> 1. `fw/angular/component-patterns`
> 2. `ds/tokens/semantic`
> 3. `ds/components/component-map`
> 4. `ds/patterns/ag-grid-datatable`
> 5. `ds/patterns/deal-grid-calculations`
> 6. `domain/personas/syndicate-banker`
> 7. `domain/entitlements/deal-full`
> 8. This spec
>
> Do NOT create new cell renderers. Use pre-built renderers from `src/app/shared/cell-renderers/` per `ds/patterns/deal-grid-calculations §5`.

---

## 2. Columns

| # | Column | Field | Type | Renderer | Pinned | Notes |
|---|--------|-------|------|----------|--------|-------|
| 1 | — | — | checkbox | `DS_CHECKBOX_COL` | left | |
| 2 | Deal Name | `dealName` | text | — | left | pinned |
| 3 | Issuer | `issuerName` | text | — | — | |
| 4 | Type | `dealType` | badge | `DealStageRendererComponent` variant: neutral | — | |
| 5 | Stage | `stage` | badge | `DealStageRendererComponent` | — | same color map as coverage-banker §2 |
| 6 | Deal Size | `dealSizeUsd` | custom | `DealSizeRendererComponent` | — | |
| 7 | Gross Spread | `grossSpreadBps` | text | `valueFormatter: formatBps` | — | "125bps" — no inline revenue here |
| 8 | Book Coverage | `bookbuildCoverageMultiple` | custom | `CoverageMultipleRendererComponent` | — | ≥2x green, ≥1x amber, <1x red |
| 9 | Allocation | `syndicateAllocationUsd` | custom | `DealSizeRendererComponent` | — | |
| 10 | Pricing Date | `pricingDate` | date | date pipe | — | |
| 11 | Syndicate Desk | `syndicateDeskName` | text | — | — | |
| 12 | — | — | actions | `ActionsCellRendererComponent` | right | |

---

## 3. Filters (default active)

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Stage | Multi-select | Marketing, Pricing |
| Deal Type | Multi-select | IPO, Follow-on, ECM, DCM, Leveraged Finance |
| Pricing Date | Date range | None |
| Syndicate Desk | Single-select | None |

---

## 4. Row actions

```typescript
[
  { id: 'view',            label: 'View' },
  { id: 'update-books',    label: 'Update books' },
  { id: 'pricing-summary', label: 'Pricing summary' },
]
```

---

## 5. Bulk actions

```typescript
[
  { id: 'export', label: 'Export CSV' },
]
```

---

## 6. Behavioral variant

Client-side data. Default sort: `pricingDate` ascending per persona §5.

---

## 7. Coverage multiple thresholds (applied by `CoverageMultipleRendererComponent`)

| Coverage multiple | CSS variable |
|---|---|
| ≥ 2.0x | `var(--color-status-success)` |
| ≥ 1.0x and < 2.0x | `var(--color-status-warning)` |
| < 1.0x | `var(--color-status-error)` |

---

## 8. Loading state

```typescript
{
  type: 'skeleton',
  rows: 8,
}
```

---

## 9. Empty state

```typescript
{
  icon: '📊',
  title: 'No active book-building deals',
  description: 'Capital markets deals in Marketing or Pricing stage will appear here.',
}
```

---

## 10. Error state

```typescript
{
  icon: '⚠',
  title: 'Unable to load deals',
  description: 'Something went wrong loading your pipeline. Please try again.',
  retryAction: true,
}
```

---

## 11. Agent checklist

- [ ] Pre-built renderers used — no new renderer created
- [ ] `dealName` pinned left
- [ ] `DealSizeRendererComponent` for `dealSizeUsd` AND `syndicateAllocationUsd`
- [ ] `CoverageMultipleRendererComponent` uses color thresholds from §7
- [ ] `grossSpreadBps` uses `formatBps` value formatter — NOT `FeeRevenueRendererComponent`
- [ ] Row actions match §4
- [ ] Bulk: export only
- [ ] Default sort: pricingDate asc

---

## 12. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Product |

---

## 13. Related Specs

- `ds/patterns/deal-grid-calculations`
- `domain/personas/syndicate-banker`
- `domain/entitlements/deal-full`

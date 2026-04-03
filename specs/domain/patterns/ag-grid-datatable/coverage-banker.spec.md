# Composition Spec: AG Grid — Coverage Banker
**spec-id:** `domain/patterns/ag-grid-datatable/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-03
**base-pattern:** `ds/patterns/ag-grid-datatable` v2.0.0
**persona:** `domain/personas/coverage-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

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

## 8. Empty state

```typescript
{
  icon: '💼',
  title: 'No deals in your pipeline',
  description: 'Deals you cover will appear here.',
}
```

---

## 9. Agent checklist

- [ ] All 8 spec sections read before generating
- [ ] Pre-built renderers used — no new renderer created
- [ ] Column order matches §2 exactly
- [ ] `dealName` pinned left, `actions` pinned right
- [ ] Stage badge uses color map from §2
- [ ] `FeeRevenueRendererComponent` for grossSpreadBps (shows inline revenue)
- [ ] `estimatedRevenue` uses `valueGetter` per §7 — not a stored field
- [ ] `DaysCountdownRendererComponent` thresholds: warn=30d, error=7d
- [ ] Row actions match §4 — no delete, canAdvanceStage check present
- [ ] Bulk actions match §5
- [ ] Default sort: expectedCloseDate asc

---

## 10. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Product |

---

## 11. Related Specs

- `ds/patterns/ag-grid-datatable` — base pattern
- `ds/patterns/deal-grid-calculations` — calculation functions + pre-built renderers
- `domain/personas/coverage-banker`
- `domain/entitlements/deal-full`

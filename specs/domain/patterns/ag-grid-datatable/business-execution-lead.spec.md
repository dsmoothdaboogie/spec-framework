# Composition Spec: AG Grid — Business Execution Lead
**spec-id:** `domain/patterns/ag-grid-datatable/business-execution-lead`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-03
**base-pattern:** `ds/patterns/ag-grid-datatable` v2.0.0
**persona:** `domain/personas/business-execution-lead` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the AG Grid datatable for a Business Execution Lead. Timeline-focused: daysInStage, milestone progress, and expected close proximity drive the view. Revenue and spread columns are absent — execution tracking data dominates.

> **Agent instruction:** Read specs in order:
> 1. `fw/angular/component-patterns`
> 2. `ds/tokens/semantic`
> 3. `ds/components/component-map`
> 4. `ds/patterns/ag-grid-datatable`
> 5. `ds/patterns/deal-grid-calculations`
> 6. `domain/personas/business-execution-lead`
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
| 5 | Stage | `stage` | badge | `DealStageRendererComponent` | — | |
| 6 | Deal Size | `dealSizeUsd` | custom | `DealSizeRendererComponent` | — | |
| 7 | Mandate Date | `mandateDate` | date | date pipe | — | |
| 8 | Days in Stage | calculated | custom | `DaysCountdownRendererComponent` (thresholds: warn=14, error=30) | — | see §3 |
| 9 | Exp. Close | `expectedCloseDate` | date | date pipe | — | |
| 10 | Days to Close | calculated | custom | `DaysCountdownRendererComponent` (thresholds: warn=30, error=7) | — | |
| 11 | Milestones | calculated | custom | `MilestoneProgressRendererComponent` | — | |
| 12 | — | — | actions | `ActionsCellRendererComponent` | right | |

---

## 3. Days in Stage alert thresholds

`DaysCountdownRendererComponent` for the `daysInStage` column uses **inverted** thresholds — higher days = more risk:

| Days in stage | Color |
|---|---|
| > 30 | `var(--color-status-error)` |
| > 14 | `var(--color-status-warning)` |
| ≤ 14 | `var(--color-status-success)` |

Pass `{ warnDays: 14, errorDays: 30 }` as `thresholds` on the column's `cellRendererParams`.

Note: `daysToClose` (col 10) uses the standard thresholds (warn=30, error=7) — not the inverted ones.

---

## 4. Value getters

```typescript
// Col 8: Days in Stage
{
  colId: 'daysInStage',
  valueGetter: (p) => calcDaysInStage(p.data.stageChangedDate),
}

// Col 10: Days to Close
{
  colId: 'daysToClose',
  valueGetter: (p) => calcDaysToClose(p.data.expectedCloseDate),
}

// Col 11: Milestones percent
{
  colId: 'milestonesPercent',
  valueGetter: (p) => ({
    completed: p.data.completedMilestones,
    total: p.data.totalMilestones,
  }),
}
```

---

## 5. Filters (default active)

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Stage | Multi-select | Mandate, Due Diligence, Marketing |
| Deal Type | Multi-select | None |
| Expected Close | Date range | None |

---

## 6. Row actions

```typescript
[
  { id: 'view',              label: 'View' },
  { id: 'update-milestones', label: 'Update milestones' },
  { id: 'escalate',          label: 'Escalate', variant: 'danger' },
]
```

---

## 7. Bulk actions

```typescript
[
  { id: 'export',        label: 'Export CSV' },
  { id: 'bulk-escalate', label: 'Bulk escalate' },
]
```

---

## 8. Behavioral variant

Client-side data. Default sort: `daysInStage` descending (longest-stalled first) per persona §5.

---

## 9. Empty state

```typescript
{
  icon: '✅',
  title: 'No deals in execution',
  description: 'Deals in Mandate through Pricing stage will appear here.',
}
```

---

## 10. Agent checklist

- [ ] Pre-built renderers used — no new renderer created
- [ ] `DaysCountdownRendererComponent` used for BOTH daysInStage and daysToClose with distinct thresholds
- [ ] daysInStage thresholds: warn=14, error=30 (inverted — longer is worse)
- [ ] daysToClose thresholds: warn=30, error=7 (standard)
- [ ] `MilestoneProgressRendererComponent` for milestone column
- [ ] Row actions match §6 — escalate has danger variant
- [ ] Bulk actions match §7 — bulk-escalate included
- [ ] Default sort: daysInStage desc

---

## 11. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Product |

---

## 12. Related Specs

- `ds/patterns/deal-grid-calculations`
- `domain/personas/business-execution-lead`
- `domain/entitlements/deal-full`

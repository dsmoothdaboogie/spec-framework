# Composition Spec: AG Grid — Business Execution Lead
**spec-id:** `domain/patterns/ag-grid-datatable/business-execution-lead`
**version:** `1.1.0`
**status:** `active`
**spec-type:** `composition`
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

## 3. Filters (default active)

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Stage | Multi-select | Mandate, Due Diligence, Marketing |
| Deal Type | Multi-select | None |
| Expected Close | Date range | None |

---

## 4. Row actions

```typescript
[
  { id: 'view',              label: 'View' },
  { id: 'update-milestones', label: 'Update milestones' },
  { id: 'escalate',          label: 'Escalate', variant: 'danger' },
]
```

---

## 5. Bulk actions

```typescript
[
  { id: 'export',        label: 'Export CSV' },
  { id: 'bulk-escalate', label: 'Bulk escalate' },
]
```

---

## 6. Behavioral variant

Client-side data. Default sort: `daysInStage` descending (longest-stalled first) per persona §5.

---

## 7. Days in Stage alert thresholds

`DaysCountdownRendererComponent` for the `daysInStage` column uses **inverted** thresholds — higher days = more risk:

| Days in stage | Color |
|---|---|
| > 30 | `var(--color-status-error)` |
| > 14 | `var(--color-status-warning)` |
| ≤ 14 | `var(--color-status-success)` |

Pass `{ warnDays: 14, errorDays: 30 }` as `thresholds` on the column's `cellRendererParams`.

Note: `daysToClose` (col 10) uses the standard thresholds (warn=30, error=7) — not the inverted ones.

---

## 8. Column value getters

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

## 9. Null / zero value rendering rules

| Column | Null / undefined | Zero | Negative |
|--------|-----------------|------|----------|
| Deal Name | — (should never be null) | — | — |
| Issuer | Render "—" | — | — |
| Deal Size | Render "—" | Render "$0" | — |
| Stage | Render "—" | — | — |
| Days in Stage | Render "—" (no stage change date) | Render "Today" | — |
| Exp. Close | Render "—" | — | — |
| Days to Close | Render "—" (no close date) | Render "Today" | Render as overdue with error styling |
| Milestones | Render "0 / 0" | Render "0 / N" | — |
| Mandate Date | Render "—" | — | — |

---

## 10. Loading state

```typescript
{
  type: 'skeleton',
  rows: 8,
  // Render 8 skeleton rows matching column widths from §2
  // Use base pattern §8 skeleton row component
}
```

---

## 11. Empty state

```typescript
{
  icon: '✅',
  title: 'No deals in execution',
  description: 'Deals in Mandate through Pricing stage will appear here.',
}
```

---

## 12. Error state

```typescript
{
  icon: '⚠',
  title: 'Unable to load deals',
  description: 'Something went wrong loading execution data. Please try again.',
  retryAction: true,
}
```

---

## 13. Acceptance criteria

- [ ] **AC-1:** When the grid loads, columns appear in the exact order defined in §2 (checkbox, Deal Name, Issuer, Type, Stage, Deal Size, Mandate Date, Days in Stage, Exp. Close, Days to Close, Milestones, Actions).
- [ ] **AC-2:** When `daysInStage > 30`, the cell renders with error styling. When `daysInStage > 14 AND <= 30`, warning styling. When `daysInStage <= 14`, success styling.
- [ ] **AC-3:** When `daysToClose <= 7`, the cell renders with error styling. When `daysToClose <= 30 AND > 7`, warning styling. When `daysToClose > 30`, normal styling.
- [ ] **AC-4:** Default sort is `daysInStage` descending, default filters include Mandate, Due Diligence, and Marketing stages.
- [ ] **AC-5:** Row action "Escalate" uses danger variant and is always visible.
- [ ] **AC-6:** Bulk "Export CSV" exports only visible/filtered rows.
- [ ] **AC-7:** `MilestoneProgressRendererComponent` renders completed vs total milestones with a progress indicator.
- [ ] **AC-8:** When data is loading, 8 skeleton rows render. When loading fails, error state with retry button appears.

---

## 14. Agent checklist

> Before outputting generated code, verify every item below:

- [ ] All 16 spec sections read before generating
- [ ] Pre-built renderers used — no new renderer created
- [ ] Column order matches §2 exactly
- [ ] `DaysCountdownRendererComponent` used for BOTH daysInStage and daysToClose with distinct thresholds
- [ ] daysInStage thresholds: warn=14, error=30 (inverted — longer is worse)
- [ ] daysToClose thresholds: warn=30, error=7 (standard)
- [ ] `MilestoneProgressRendererComponent` for milestone column
- [ ] `dealName` pinned left, `actions` pinned right
- [ ] Null/zero rendering matches §9 for every nullable column
- [ ] Loading state (skeleton, 8 rows) implemented per §10
- [ ] Empty state implemented per §11
- [ ] Error state with retry implemented per §12
- [ ] All acceptance criteria from §13 are satisfied
- [ ] Row actions match §4 — escalate has danger variant
- [ ] Bulk actions match §5 — bulk-escalate included
- [ ] Default sort: daysInStage desc, default filters per §3

---

## 15. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Product |
| 1.1.0 | 2026-04-06 | Added loading/error states, null rules, acceptance criteria; renumbered sections for linter compliance | UI Architecture |

---

## 16. Related Specs

- `ds/patterns/ag-grid-datatable` — base pattern
- `ds/patterns/deal-grid-calculations` — calculation functions + pre-built renderers
- `domain/personas/business-execution-lead`
- `domain/entitlements/deal-full`

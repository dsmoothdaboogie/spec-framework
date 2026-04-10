# Grid: Business Execution Lead

**spec-id:** `grid/business-execution-lead`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-08
**pattern:** `ag-grid-datatable`
**persona:** `business-execution-lead`
**entitlement:** `deal-full`

---

## 1. Purpose

Timeline-focused pipeline view for Business Execution Leads. Days in stage, milestone progress, and expected close proximity are the primary signals. Revenue and spread columns are absent — execution tracking data dominates. The view surfaces stalled deals (longest in stage first) to drive escalation decisions.

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
| 8 | Days in Stage | calculated | custom | `DaysCountdownRendererComponent` (inverted thresholds: warn=14, error=30) | — | higher = more risk |
| 9 | Exp. Close | `expectedCloseDate` | date | date pipe | — | |
| 10 | Days to Close | calculated | custom | `DaysCountdownRendererComponent` (standard thresholds: warn=30, error=7) | — | |
| 11 | Milestones | calculated | custom | `MilestoneProgressRendererComponent` | — | |
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
| Stage | Multi-select | Mandate, Due Diligence, Marketing |
| Deal Type | Multi-select | None |
| Expected Close | Date range | None |

---

## 4. Row Actions

```typescript
[
  { id: 'view',              label: 'View' },
  { id: 'update-milestones', label: 'Update milestones' },
  { id: 'escalate',          label: 'Escalate', variant: 'danger' },
]
```

---

## 5. Bulk Actions

```typescript
[
  { id: 'export',        label: 'Export CSV' },
  { id: 'bulk-escalate', label: 'Bulk escalate' },
]
```

---

## 6. Renderers

Use pre-built renderers from `src/app/shared/cell-renderers/`. Do NOT create new renderers. Reference `primitives.json` for full component docs.

| Column | Renderer | Import path |
|--------|----------|-------------|
| Type, Stage | `DealStageRendererComponent` | `src/app/shared/cell-renderers/deal-stage-renderer/` |
| Deal Size | `DealSizeRendererComponent` | `src/app/shared/cell-renderers/deal-size-renderer/` |
| Days in Stage | `DaysCountdownRendererComponent` | `src/app/shared/cell-renderers/days-countdown-renderer/` |
| Days to Close | `DaysCountdownRendererComponent` | `src/app/shared/cell-renderers/days-countdown-renderer/` |
| Milestones | `MilestoneProgressRendererComponent` | `src/app/shared/cell-renderers/milestone-progress-renderer/` |
| Actions | `ActionsCellRendererComponent` | `src/app/shared/cell-renderers/actions-cell-renderer/` |

---

## 7. Calculations

All functions are pure exports from `src/app/shared/calculations/deal-calculations.ts`.

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

### Days in Stage thresholds (inverted — higher days = more risk)

Pass `{ warnDays: 14, errorDays: 30 }` as `thresholds` on `cellRendererParams` for the `daysInStage` column.

| Days in stage | Color |
|---|---|
| > 30 | `var(--color-status-error)` |
| > 14 | `var(--color-status-warning)` |
| ≤ 14 | `var(--color-status-success)` |

Note: `daysToClose` (col 10) uses standard thresholds `{ warnDays: 30, errorDays: 7 }` — not the inverted ones.

---

## 8. Null / Zero Rendering

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

## 9. States

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
  icon: 'check_circle',
  title: 'No deals in execution',
  description: 'Deals in Mandate through Pricing stage will appear here.',
}
```

### Error

```typescript
{
  icon: 'warning',
  title: 'Unable to load deals',
  description: 'Something went wrong loading execution data. Please try again.',
  retryAction: true,
}
```

---

## 10. Defaults

- **Data mode:** Client-side
- **Default sort:** `daysInStage` descending (longest-stalled first)
- **Default filters:** Stage = Mandate, Due Diligence, Marketing
- **Entitlement:** `deal-full`

---

## 11. Acceptance Criteria

- [ ] **AC-1:** Columns appear in the exact order defined in §2 (checkbox, Deal Name, Issuer, Type, Stage, Deal Size, Mandate Date, Days in Stage, Exp. Close, Days to Close, Milestones, Actions).
- [ ] **AC-2:** When `daysInStage > 30`, cell renders with error styling. When `daysInStage > 14 AND <= 30`, warning styling. When `daysInStage <= 14`, success styling.
- [ ] **AC-3:** When `daysToClose <= 7`, cell renders with error styling. When `daysToClose <= 30 AND > 7`, warning styling. When `daysToClose > 30`, normal styling.
- [ ] **AC-4:** Default sort is `daysInStage` descending, default filters include Mandate, Due Diligence, and Marketing stages.
- [ ] **AC-5:** Row action "Escalate" uses danger variant and is always visible.
- [ ] **AC-6:** Bulk "Export CSV" exports only visible/filtered rows.
- [ ] **AC-7:** `MilestoneProgressRendererComponent` renders completed vs total milestones with a progress indicator.
- [ ] **AC-8:** When data is loading, 8 skeleton rows render. When loading fails, error state with retry button appears.

---

## 12. Checklist

- [ ] Column order matches §2
- [ ] `dealName` pinned left, `actions` pinned right
- [ ] Stage badge uses color map from §2
- [ ] `DaysCountdownRendererComponent` used for BOTH daysInStage and daysToClose with distinct thresholds
- [ ] daysInStage thresholds: warn=14, error=30 (inverted — longer is worse)
- [ ] daysToClose thresholds: warn=30, error=7 (standard)
- [ ] `MilestoneProgressRendererComponent` for milestones column
- [ ] Renderers match §6 — no new renderers created
- [ ] Null/zero rendering matches §8 for every nullable column
- [ ] All three states implemented per §9
- [ ] Default sort: `daysInStage` desc
- [ ] Default filters match §3
- [ ] Row actions match §4 — escalate has danger variant
- [ ] Bulk actions match §5 — bulk-escalate included
- [ ] All acceptance criteria from §11 satisfied

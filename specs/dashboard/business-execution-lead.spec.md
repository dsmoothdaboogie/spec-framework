# Dashboard: Business Execution Lead

**spec-id:** `dashboard/business-execution-lead`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-04-08
**pattern:** `dashboard`
**persona:** `business-execution-lead`
**entitlement:** `deal-full`

---

## 1. Purpose

Milestone and timeline focused dashboard for Business Execution Leads. Execution risk visibility is primary — the lead needs to know average milestone completion, how many deals are active, pipeline value, and pending conflict count. The miniGrid surfaces deals approaching close with milestone progress to prioritise attention.

---

## 2. Widget Layout

| Row | Slot | Widget Type | Component | Params |
|---|---|---|---|---|
| 1 | metrics-1 | `metricCard` | `MetricCardComponent` | metric: `activeDealCount`, label: "Active Deals", format: number |
| 1 | metrics-2 | `metricCard` | `MetricCardComponent` | metric: `avgMilestonePercent`, label: "Avg Milestone %", format: percent |
| 1 | metrics-3 | `metricCard` | `MetricCardComponent` | metric: `totalPipelineValue`, label: "Pipeline Value", format: currency |
| 1 | metrics-4 | `metricCard` | `MetricCardComponent` | metric: `pendingConflicts`, label: "Pending Conflicts", format: number |
| 2 | main-1 | `statusDistribution` | `StatusDistributionComponent` | title: "Deals by Stage", groupBy: stage |
| 2 | main-2 | `miniGrid` | `MiniGridComponent` | title: "Approaching Close", dataSource: approachingClose, maxRows: 5 |
| 3 | detail-1 | `alertList` | `AlertListComponent` | title: "Execution Alerts", maxItems: 5 |

Row 1 uses `.dashboard__row--metrics` layout (4-col grid).
Row 2 uses `.dashboard__row--two-col` layout (2-col grid).
Row 3 uses `.dashboard__row` layout (full-width).

---

## 3. MiniGrid Columns

### Approaching Close (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | `dealName` | flex: 1 | — |
| 2 | Done | `completedMilestones` | 60 | — |
| 3 | Total | `totalMilestones` | 60 | — |
| 4 | Close Date | `expectedCloseDate` | 110 | date locale |

---

## 4. States

### Loading
Dashboard shows a centered loading message while data loads.

### Empty
Individual widgets handle empty data gracefully (e.g., "No execution alerts" in the alert list).

### Error
Dashboard shows a centered error message with retry if the store enters error state.

---

## 5. Checklist

- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly (4 metrics, 2-col main, full-width detail)
- [ ] MiniGrid columns match §3 (4 columns, in order)
- [ ] All three states implemented per §4

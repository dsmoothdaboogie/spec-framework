# Dashboard: Syndicate Banker

**spec-id:** `dashboard/syndicate-banker`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-04-08
**pattern:** `dashboard`
**persona:** `syndicate-banker`
**entitlement:** `deal-full`

---

## 1. Purpose

Book-building focused dashboard for Syndicate Bankers. Active deal count leads the metrics row — the banker needs to know how many deals are in flight. Pipeline value, average deal size, and total deal count round out the overview. The miniGrid surfaces deals approaching close date with book coverage multiples for quick triage.

---

## 2. Widget Layout

| Row | Slot | Widget Type | Component | Params |
|---|---|---|---|---|
| 1 | metrics-1 | `metricCard` | `MetricCardComponent` | metric: `activeDealCount`, label: "Active Deals", format: number |
| 1 | metrics-2 | `metricCard` | `MetricCardComponent` | metric: `totalPipelineValue`, label: "Pipeline Value", format: currency |
| 1 | metrics-3 | `metricCard` | `MetricCardComponent` | metric: `avgDealSize`, label: "Avg Deal Size", format: currency |
| 1 | metrics-4 | `metricCard` | `MetricCardComponent` | metric: `totalDealCount`, label: "Total Deals", format: number |
| 2 | main-1 | `statusDistribution` | `StatusDistributionComponent` | title: "Deals by Stage", groupBy: stage |
| 2 | main-2 | `miniGrid` | `MiniGridComponent` | title: "Approaching Close", dataSource: approachingClose, maxRows: 5 |
| 3 | detail-1 | `activityFeed` | `ActivityFeedComponent` | title: "Recent Activity", maxItems: 8 |

Row 1 uses `.dashboard__row--metrics` layout (4-col grid).
Row 2 uses `.dashboard__row--two-col` layout (2-col grid).
Row 3 uses `.dashboard__row` layout (full-width).

---

## 3. MiniGrid Columns

### Approaching Close (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | `dealName` | flex: 1 | — |
| 2 | Stage | `stage` | 100 | — |
| 3 | Book Cov. | `bookbuildCoverageMultiple` | 90 | `${value.toFixed(1)}x` or "—" if 0 |
| 4 | Close Date | `expectedCloseDate` | 110 | date locale |

---

## 4. States

### Loading
Dashboard shows a centered loading message while data loads.

### Empty
Individual widgets handle empty data gracefully (e.g., "No recent activity" in the activity feed).

### Error
Dashboard shows a centered error message with retry if the store enters error state.

---

## 5. Checklist

- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly (4 metrics, 2-col main, full-width detail)
- [ ] MiniGrid columns match §3 (4 columns, in order)
- [ ] Book coverage formatter renders "—" when value is 0
- [ ] All three states implemented per §4

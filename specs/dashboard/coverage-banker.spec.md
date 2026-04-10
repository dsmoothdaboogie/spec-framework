# Dashboard: Coverage Banker

**spec-id:** `dashboard/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-04-08
**pattern:** `dashboard`
**persona:** `coverage-banker`
**entitlement:** `deal-full`

---

## 1. Purpose

Revenue-focused dashboard for Coverage Bankers. Pipeline value is the primary KPI. The dashboard surfaces total pipeline value, active deal count, average deal size, and pending conflict alerts in the metrics row. Stage distribution and top deals by size give the banker a quick read on pipeline health.

---

## 2. Widget Layout

| Row | Slot | Widget Type | Component | Params |
|---|---|---|---|---|
| 1 | metrics-1 | `metricCard` | `MetricCardComponent` | metric: `totalPipelineValue`, label: "Pipeline Value", format: currency, trend: up |
| 1 | metrics-2 | `metricCard` | `MetricCardComponent` | metric: `activeDealCount`, label: "Active Deals", format: number |
| 1 | metrics-3 | `metricCard` | `MetricCardComponent` | metric: `avgDealSize`, label: "Avg Deal Size", format: currency |
| 1 | metrics-4 | `metricCard` | `MetricCardComponent` | metric: `pendingConflicts`, label: "Pending Conflicts", format: number |
| 2 | main-1 | `statusDistribution` | `StatusDistributionComponent` | title: "Deals by Stage", groupBy: stage |
| 2 | main-2 | `miniGrid` | `MiniGridComponent` | title: "Top Deals by Size", dataSource: topDealsBySize, maxRows: 5 |
| 3 | detail-1 | `activityFeed` | `ActivityFeedComponent` | title: "Recent Activity", maxItems: 8 |
| 3 | detail-2 | `alertList` | `AlertListComponent` | title: "Alerts", maxItems: 5 |

Row 1 uses `.dashboard__row--metrics` layout (4-col grid).
Row 2 uses `.dashboard__row--two-col` layout (2-col grid).
Row 3 uses `.dashboard__row--two-col` layout (2-col grid).

---

## 3. MiniGrid Columns

### Top Deals by Size (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | `dealName` | flex: 1 | — |
| 2 | Stage | `stage` | 110 | — |
| 3 | Size ($m) | `dealSizeUsd` | 100 | `$${value}m` |
| 4 | Spread | `grossSpreadBps` | 80 | `${value}bps` |

---

## 4. States

### Loading
Dashboard shows a centered loading message while data loads.

### Empty
Individual widgets handle empty data gracefully (e.g., "No recent activity" in the activity feed, "No alerts" in the alert list).

### Error
Dashboard shows a centered error message with retry if the store enters error state.

---

## 5. Checklist

- [ ] All 8 widgets rendered per §2
- [ ] Widget order matches §2 exactly (4 metrics, 2-col main, 2-col detail)
- [ ] MiniGrid columns match §3 (4 columns, in order)
- [ ] All three states implemented per §4

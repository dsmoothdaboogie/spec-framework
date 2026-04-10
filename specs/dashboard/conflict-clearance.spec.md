# Dashboard: Conflict Clearance

**spec-id:** `dashboard/conflict-clearance`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Legal
**last-reviewed:** 2026-04-08
**pattern:** `dashboard`
**persona:** `conflict-clearance`
**entitlement:** `deal-restricted`

---

## 1. Purpose

Conflict review pipeline dashboard for Conflict Clearance Officers. Read-only context. The dashboard surfaces pending review count, flagged conflict count, total deal count, and active deal count as metrics. Stage distribution is shown by conflict status rather than deal stage, with an alert list and recent conflict activity feed.

---

## 2. Widget Layout

| Row | Slot | Widget Type | Component | Params |
|---|---|---|---|---|
| 1 | metrics-1 | `metricCard` | `MetricCardComponent` | metric: `pendingConflicts`, label: "Pending Reviews", format: number |
| 1 | metrics-2 | `metricCard` | `MetricCardComponent` | metric: `flaggedConflicts`, label: "Flagged Conflicts", format: number |
| 1 | metrics-3 | `metricCard` | `MetricCardComponent` | metric: `totalDealCount`, label: "Total Deals", format: number |
| 1 | metrics-4 | `metricCard` | `MetricCardComponent` | metric: `activeDealCount`, label: "Active Deals", format: number |
| 2 | main-1 | `statusDistribution` | `StatusDistributionComponent` | title: "Conflict Status Distribution", groupBy: conflictStatus |
| 2 | main-2 | `alertList` | `AlertListComponent` | title: "Conflict Alerts", maxItems: 5 |
| 3 | detail-1 | `activityFeed` | `ActivityFeedComponent` | title: "Recent Conflict Activity", maxItems: 8 |

Row 1 uses `.dashboard__row--metrics` layout (4-col grid).
Row 2 uses `.dashboard__row--two-col` layout (2-col grid).
Row 3 uses `.dashboard__row` layout (full-width).

---

## 3. States

### Loading
Dashboard shows a centered loading message while data loads.

### Empty
Individual widgets handle empty data gracefully (e.g., "No conflict alerts" in the alert list).

### Error
Dashboard shows a centered error message with retry if the store enters error state.

---

## 4. Checklist

- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly (4 metrics, 2-col main, full-width detail)
- [ ] `statusDistribution` groups by `conflictStatus` — not deal stage
- [ ] All three states implemented per §3

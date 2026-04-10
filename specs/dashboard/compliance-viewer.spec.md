# Dashboard: Compliance Viewer

**spec-id:** `dashboard/compliance-viewer`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Compliance
**last-reviewed:** 2026-04-08
**pattern:** `dashboard`
**persona:** `compliance-viewer`
**entitlement:** `mnpi-full`

---

## 1. Purpose

MNPI and audit focused dashboard for Compliance Viewers. Read-only context. The dashboard surfaces MNPI flagged deal count, pending and flagged conflict counts, and total deal count as metrics. Conflict status distribution gives an overview of the compliance pipeline. Alert list and audit activity feed complete the view.

---

## 2. Widget Layout

| Row | Slot | Widget Type | Component | Params |
|---|---|---|---|---|
| 1 | metrics-1 | `metricCard` | `MetricCardComponent` | metric: `mnpiFlaggedCount`, label: "MNPI Flagged", format: number |
| 1 | metrics-2 | `metricCard` | `MetricCardComponent` | metric: `pendingConflicts`, label: "Pending Reviews", format: number |
| 1 | metrics-3 | `metricCard` | `MetricCardComponent` | metric: `flaggedConflicts`, label: "Flagged Conflicts", format: number |
| 1 | metrics-4 | `metricCard` | `MetricCardComponent` | metric: `totalDealCount`, label: "Total Deals", format: number |
| 2 | main-1 | `statusDistribution` | `StatusDistributionComponent` | title: "Conflict Status Distribution", groupBy: conflictStatus |
| 2 | main-2 | `alertList` | `AlertListComponent` | title: "Compliance Alerts", maxItems: 5 |
| 3 | detail-1 | `activityFeed` | `ActivityFeedComponent` | title: "Audit Activity", maxItems: 10 |

Row 1 uses `.dashboard__row--metrics` layout (4-col grid).
Row 2 uses `.dashboard__row--two-col` layout (2-col grid).
Row 3 uses `.dashboard__row` layout (full-width).

---

## 3. States

### Loading
Dashboard shows a centered loading message while data loads.

### Empty
Individual widgets handle empty data gracefully (e.g., "No compliance alerts" in the alert list).

### Error
Dashboard shows a centered error message with retry if the store enters error state.

---

## 4. Checklist

- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly (4 metrics, 2-col main, full-width detail)
- [ ] `statusDistribution` groups by `conflictStatus` — not deal stage
- [ ] `activityFeed` maxItems is 10 (not the default 8)
- [ ] All three states implemented per §3

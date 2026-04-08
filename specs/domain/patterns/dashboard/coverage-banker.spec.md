# Composition Spec: Dashboard — Coverage Banker
**spec-id:** `domain/patterns/dashboard/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/coverage-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Coverage Banker. Revenue-focused metrics,
pipeline value as primary KPI, stage distribution, top deals by size, recent activity,
and conflict alerts.

> **Agent instruction:** Read specs in this order:
> 1. `ds/tokens/semantic`
> 2. `ds/components/component-map`
> 3. `ds/patterns/dashboard`
> 4. `ds/templates/deal-pipeline-page`
> 5. This spec

---

## 2. Widget Layout

| Row | Slot | Widget Type | Params |
|---|---|---|---|
| 1 | metrics-1 | metricCard | metric: totalPipelineValue, label: Pipeline Value, format: currency, trend: up |
| 1 | metrics-2 | metricCard | metric: activeDealCount, label: Active Deals, format: number |
| 1 | metrics-3 | metricCard | metric: avgDealSize, label: Avg Deal Size, format: currency |
| 1 | metrics-4 | metricCard | metric: pendingConflicts, label: Pending Conflicts, format: number |
| 2 | main-1 | statusDistribution | title: Deals by Stage, groupBy: stage |
| 2 | main-2 | miniGrid | title: Top Deals by Size, dataSource: topDealsBySize, maxRows: 5 |
| 3 | detail-1 | activityFeed | title: Recent Activity, maxItems: 8 |
| 3 | detail-2 | alertList | title: Alerts, maxItems: 5 |

---

## 3. MiniGrid Column Definitions

### Top Deals by Size (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | dealName | flex: 1 | — |
| 2 | Stage | stage | 110 | — |
| 3 | Size ($m) | dealSizeUsd | 100 | `$${value}m` |
| 4 | Spread | grossSpreadBps | 80 | `${value}bps` |

---

## 4. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 8 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] MiniGrid columns match §3
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |

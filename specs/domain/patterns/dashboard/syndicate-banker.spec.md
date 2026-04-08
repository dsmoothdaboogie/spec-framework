# Composition Spec: Dashboard — Syndicate Banker
**spec-id:** `domain/patterns/dashboard/syndicate-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/syndicate-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Syndicate Banker. Book-building focus with
coverage multiples, approaching close dates, and stage distribution.

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
| 1 | metrics-1 | metricCard | metric: activeDealCount, label: Active Deals, format: number |
| 1 | metrics-2 | metricCard | metric: totalPipelineValue, label: Pipeline Value, format: currency |
| 1 | metrics-3 | metricCard | metric: avgDealSize, label: Avg Deal Size, format: currency |
| 1 | metrics-4 | metricCard | metric: totalDealCount, label: Total Deals, format: number |
| 2 | main-1 | statusDistribution | title: Deals by Stage, groupBy: stage |
| 2 | main-2 | miniGrid | title: Approaching Close, dataSource: approachingClose, maxRows: 5 |
| 3 | detail-1 | activityFeed | title: Recent Activity, maxItems: 8 |

---

## 3. MiniGrid Column Definitions

### Approaching Close (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | dealName | flex: 1 | — |
| 2 | Stage | stage | 100 | — |
| 3 | Book Cov. | bookbuildCoverageMultiple | 90 | `${value.toFixed(1)}x` or `—` if 0 |
| 4 | Close Date | expectedCloseDate | 110 | date locale |

---

## 4. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] MiniGrid columns match §3
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |

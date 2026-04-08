# Composition Spec: Dashboard — Compliance Viewer
**spec-id:** `domain/patterns/dashboard/compliance-viewer`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Compliance
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/compliance-viewer` v1.0.0
**entitlement:** `domain/entitlements/mnpi-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Compliance Viewer. MNPI and audit focused —
shows MNPI flagged count, conflict statuses, and audit activity. Read-only context.

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
| 1 | metrics-1 | metricCard | metric: mnpiFlaggedCount, label: MNPI Flagged, format: number |
| 1 | metrics-2 | metricCard | metric: pendingConflicts, label: Pending Reviews, format: number |
| 1 | metrics-3 | metricCard | metric: flaggedConflicts, label: Flagged Conflicts, format: number |
| 1 | metrics-4 | metricCard | metric: totalDealCount, label: Total Deals, format: number |
| 2 | main-1 | statusDistribution | title: Conflict Status Distribution, groupBy: conflictStatus |
| 2 | main-2 | alertList | title: Compliance Alerts, maxItems: 5 |
| 3 | detail-1 | activityFeed | title: Audit Activity, maxItems: 10 |

---

## 3. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 4. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture / Compliance |

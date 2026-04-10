# Reference: Dashboard

> **This is a reference document**, not a spec. Persona specs under `specs/grid/` and `specs/dashboard/` are the primary artifacts. This doc provides background on grid defaults, widget contracts, and calculation functions if needed.

**spec-id:** `ds/patterns/dashboard`
**version:** `1.0.0`
**owner:** `UI Architecture`
**last-reviewed:** `2026-04-08`
**applies-to:** `Angular 19+`

---

## Scope

### In scope
- Widget type registry and param contracts
- Dashboard layout system (rows and columns)
- Per-widget loading, empty, and error states
- Accessibility requirements for widget containers

### Out of scope
- Specific widget content — handled by persona specs
- Charts or data visualizations — future spec
- Real-time refresh / WebSocket — future spec
- Page template (header, navigation)

---

## Design System Tokens

| Property | CSS Custom Property | Notes |
|---|---|---|
| Widget background | `var(--color-surface-primary)` | Card surface |
| Widget border | `var(--color-border-subtle)` | 1px solid |
| Widget border radius | `var(--spacing-s2)` | 8px — consistent card rounding |
| Widget padding | `var(--spacing-s4)` | 16px — internal padding |
| Widget gap | `var(--spacing-s4)` | 16px — between widgets in a row |
| Row gap | `var(--spacing-s4)` | 16px — between rows |
| Dashboard padding | `var(--spacing-s5)` | 20px — outer container |
| Widget title | `var(--type-label)` | 13px, 600 — section heading |
| Metric value | `var(--type-label-strong)` | 28px, 700 — KPI number |
| Metric label | `var(--type-label-small)` | 12px, 500 — KPI label |

---

## Widget Type Registry

| Widget Type | Component | Required Params | Optional Params |
|---|---|---|---|
| `metricCard` | `MetricCardComponent` | `label`, `value`, `format` | `trend`, `previousValue`, `clickable` |
| `miniGrid` | `MiniGridComponent` | `columnDefs`, `rowData` | `maxRows` (default 5), `title`, `viewAllLabel` |
| `statusDistribution` | `StatusDistributionComponent` | `segments` | `title` |
| `activityFeed` | `ActivityFeedComponent` | `items` | `maxItems` (default 10), `title` |
| `alertList` | `AlertListComponent` | `items` | `maxItems` (default 5), `title` |

---

## Layout System

Dashboards use a row-based grid layout:

```
Row 1: [widget] [widget] [widget] [widget]    ← metrics row (4-col)
Row 2: [widget] [widget]                       ← two-col row
Row 3: [widget]                                ← full-width row
```

Layout classes:
- `.dashboard__row--metrics` → `grid-template-columns: repeat(4, 1fr)`
- `.dashboard__row--two-col` → `grid-template-columns: 1fr 1fr`
- `.dashboard__row` (default) → single column

---

## States

### Loading state

Dashboard shows a centered loading message while the store loads.

### Empty state

Individual widgets handle empty data gracefully (e.g., "No recent activity").

### Error state

Dashboard shows a centered error message if the store enters error state.

---

## Accessibility

- Widget titles use `<h3>` elements for heading hierarchy (page title is `<h1>`, persona is `<h2>`)
- StatusDistribution bar has `role="img"` with `aria-label`
- Clickable MetricCards have `role="button"` and `tabindex="0"`
- AlertList items convey severity through text, not color alone

---

## Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |

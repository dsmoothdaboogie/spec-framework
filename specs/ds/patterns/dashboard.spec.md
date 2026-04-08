# Pattern Spec: Dashboard
**spec-id:** `ds/patterns/dashboard`
**version:** `1.0.0`
**status:** `active`
**owner:** `UI Architecture`
**last-reviewed:** `2026-04-08`
**applies-to:** `Angular 19+`
**replaces:** `n/a`

---

## 1. Intent

Defines the standard dashboard pattern for persona-driven views. A dashboard is a
configurable grid of widgets — each widget is a generic, DS-portable component that
receives data and display params from a composition spec.

> **Agent instruction:** Read this spec alongside `ds/tokens/semantic` and
> `ds/components/component-map`. Then read the persona's dashboard composition spec
> to determine which widgets to render and with what params.

---

## 2. Scope

### In scope
- Widget type registry and param contracts
- Dashboard layout system (rows and columns)
- Per-widget loading, empty, and error states
- Accessibility requirements for widget containers

### Out of scope
- Specific widget content → handled by composition specs
- Charts or data visualizations → future spec
- Real-time refresh / WebSocket → future spec
- Page template (header, navigation) → `ds/templates/deal-pipeline-page`

---

## 3. Design System Tokens

```scss
@use '@company/spec-tokens/color'   as color;
@use '@company/spec-tokens/type'    as type;
@use '@company/spec-tokens/spacing' as spacing;
```

| Property | Token | Notes |
|---|---|---|
| Widget background | `color.$surface-primary` | Card surface |
| Widget border | `color.$border-subtle` | 1px solid |
| Widget border radius | `spacing.$s2` (8px) | Consistent card rounding |
| Widget padding | `spacing.$s4` (16px) | Internal padding |
| Widget gap | `spacing.$s4` (16px) | Between widgets in a row |
| Row gap | `spacing.$s4` (16px) | Between rows |
| Dashboard padding | `spacing.$s5` (20px) | Outer container |
| Widget title | `type.$label-large` (13px, 600) | Section heading |
| Metric value | `type.$display-small` (28px, 700) | KPI number |
| Metric label | `type.$label-small` (12px, 500) | KPI label |

> **Agent instruction:** Never use raw hex, px, or rem values for any property listed above.

---

## 4. Component Structure

### 4.1 File layout

```
features/{persona}/dashboard/
├── dashboard.component.ts
├── dashboard.component.html
└── dashboard.component.scss
```

### 4.2 Required inputs

Dashboard components receive data from the DealStore via inject() and render
widget components in a grid layout defined by the composition spec.

---

## 5. Widget Type Registry

| Widget Type | Component | Required Params | Optional Params |
|---|---|---|---|
| `metricCard` | `MetricCardComponent` | `label`, `value`, `format` | `trend`, `previousValue`, `clickable` |
| `miniGrid` | `MiniGridComponent` | `columnDefs`, `rowData` | `maxRows` (default 5), `title`, `viewAllLabel` |
| `statusDistribution` | `StatusDistributionComponent` | `segments` | `title` |
| `activityFeed` | `ActivityFeedComponent` | `items` | `maxItems` (default 10), `title` |
| `alertList` | `AlertListComponent` | `items` | `maxItems` (default 5), `title` |

---

## 6. Layout System

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

## 7. States

### 7.1 Loading state

Dashboard shows a centered loading message while the store loads.

### 7.2 Empty state

Individual widgets handle empty data gracefully (e.g., "No recent activity").

### 7.3 Error state

Dashboard shows a centered error message if the store enters error state.

---

## 8. Accessibility

- Widget titles use `<h3>` elements for heading hierarchy (page title is `<h1>`, persona is `<h2>`)
- StatusDistribution bar has `role="img"` with `aria-label`
- Clickable MetricCards have `role="button"` and `tabindex="0"`
- AlertList items convey severity through text, not color alone

---

## 9. Agent Checklist

- [ ] Semantic tokens read — all visual properties from §3
- [ ] Component map read — widget components resolved
- [ ] All 5 widget types available per §5
- [ ] Layout uses row-based grid per §6
- [ ] Loading state implemented per §7.1
- [ ] Empty state per widget per §7.2
- [ ] Error state implemented per §7.3
- [ ] Heading hierarchy per §8
- [ ] `ChangeDetectionStrategy.OnPush` on dashboard component
- [ ] `standalone: true` on dashboard component
- [ ] `inject()` for DealStore — no constructor DI
- [ ] `@spec` header present with spec-id and version

---

## 10. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |

---

## 11. Related Specs

- `ds/tokens/semantic` — token adapter
- `ds/components/component-map` — component adapter
- `ds/templates/deal-pipeline-page` — page template
- `domain/patterns/dashboard/*` — persona composition specs

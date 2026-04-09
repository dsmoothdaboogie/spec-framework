# Template Spec: Deal Pipeline Page
**spec-id:** `ds/templates/deal-pipeline-page`
**version:** `1.0.0`
**status:** `active`
**owner:** `UI Architecture`
**last-reviewed:** `2026-04-08`
**applies-to:** `Angular 19+`
**replaces:** `n/a`

---

## 1. Intent

Defines the page shell for a persona-driven deal pipeline view. Each persona gets a
page with sub-navigation between Dashboard and Grid views, sharing the same DealStore.

> **Agent instruction:** This spec defines the page template. Read it before building
> any persona's dashboard or grid view. The sub-navigation is signal-based — do not
> use Angular Router.

---

## 2. Scope

### In scope
- Page shell layout: persona header + sub-navigation + content viewport
- Sub-navigation between Dashboard and Grid views
- Signal-based view switching (no Angular Router)
- Cross-navigation from dashboard widgets to grid view

### Out of scope
- Widget content → `ds/patterns/dashboard` + composition specs
- Grid content → `ds/patterns/ag-grid-datatable` + composition specs
- Global navigation (persona tabs) → app shell, not this spec

---

## 3. Page Structure

```
┌──────────────────────────────────────────┐
│  App Header (app shell)                  │
├──────────────────────────────────────────┤
│  Persona Tabs (app shell)                │
├──────────────────────────────────────────┤
│  Sub-Nav: [Dashboard] [Grid]             │  ← this spec
├──────────────────────────────────────────┤
│  Content Viewport                        │  ← this spec
│  ┌────────────────────────────────────┐  │
│  │ Dashboard or Grid (one at a time)  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 4. Navigation Signals

```typescript
activeView = signal<'dashboard' | 'grid'>('dashboard');
```

- Default view: `dashboard`
- Switching persona tab resets view to `dashboard`
- "View all" links in widgets set view to `grid`

---

## 5. Sub-Navigation Bar

| Property | CSS Custom Property | Value |
|---|---|---|
| Height | — | 36px |
| Background | `var(--color-surface-secondary)` | Light gray |
| Border bottom | `var(--color-border-subtle)` | 1px solid |
| Active tab color | `var(--color-brand-primary)` | Blue |
| Active tab border | `var(--color-brand-primary)` | 2px bottom |
| Font size | `var(--type-label-small)` | 12px |
| Font weight (active) | — | 600 |

---

## 6. Agent Checklist

- [ ] Sub-navigation renders Dashboard and Grid buttons
- [ ] Default view is Dashboard
- [ ] Persona tab switch resets to Dashboard
- [ ] Signal-based navigation — no Angular Router
- [ ] Only one view mounted at a time
- [ ] Content viewport fills remaining height

---

## 7. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |

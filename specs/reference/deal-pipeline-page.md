# Reference: Deal Pipeline Page

> **This is a reference document**, not a spec. Persona specs under `specs/grid/` and `specs/dashboard/` are the primary artifacts. This doc provides background on grid defaults, widget contracts, and calculation functions if needed.

**spec-id:** `ds/templates/deal-pipeline-page`
**version:** `1.0.0`
**owner:** `UI Architecture`
**last-reviewed:** `2026-04-08`
**applies-to:** `Angular 19+`

---

## Scope

### In scope
- Page shell layout: persona header + sub-navigation + content viewport
- Sub-navigation between Dashboard and Grid views
- Signal-based view switching (no Angular Router)
- Cross-navigation from dashboard widgets to grid view

### Out of scope
- Widget content — handled by persona dashboard specs
- Grid content — handled by persona grid specs
- Global navigation (persona tabs) — app shell, not this template

---

## Page Structure

```
┌──────────────────────────────────────────┐
│  App Header (app shell)                  │
├──────────────────────────────────────────┤
│  Persona Tabs (app shell)                │
├──────────────────────────────────────────┤
│  Sub-Nav: [Dashboard] [Grid]             │  ← this template
├──────────────────────────────────────────┤
│  Content Viewport                        │  ← this template
│  ┌────────────────────────────────────┐  │
│  │ Dashboard or Grid (one at a time)  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## Navigation Signals

```typescript
activeView = signal<'dashboard' | 'grid'>('dashboard');
```

- Default view: `dashboard`
- Switching persona tab resets view to `dashboard`
- "View all" links in widgets set view to `grid`

---

## Sub-Navigation Bar

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

## Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |

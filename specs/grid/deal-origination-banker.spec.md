# Grid: Deal Origination Banker

**spec-id:** `grid/deal-origination-banker`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-08
**pattern:** `ag-grid-datatable`
**persona:** `deal-origination-banker`
**entitlement:** `mnpi-standard`
**compliance-signoff:** `J. Martinez / Head of Compliance / 2026-03-15`

---

## 1. Purpose

Pipeline management view for Deal Origination Bankers. Focuses on deal ownership, stage progression, and pipeline growth. Server-side data — deal pipelines always exceed 500 rows. MNPI-sensitive columns (MNPI Flag, Wall Cross Date) are suppressed at `mnpi-standard` entitlement and only visible at `mnpi-full`.

---

## 2. Columns

Columns 8–9 are suppressed at `mnpi-standard` entitlement. They render at `mnpi-full`.

| # | Column | Field | Type | Renderer | Pinned | mnpi-sensitive |
|---|--------|-------|------|----------|--------|----------------|
| 1 | — | — | checkbox | `DS_CHECKBOX_COL` | left | false |
| 2 | Deal Name | `dealName` | text | — | — | false |
| 3 | Stage | `stage` | badge | `DsBadgeCellRendererComponent` | — | false |
| 4 | Counterparty | `counterpartyName` | text | — | — | false |
| 5 | Deal Size | `dealSize` | currency | `DS_CURRENCY_FORMATTER` | — | false |
| 6 | Owner | `ownerName` | text | — | — | false |
| 7 | Last Updated | `lastUpdated` | date | `DS_DATE_FORMATTER` | — | false |
| 8 | MNPI Flag | `mnpiFlag` | badge | `DsBadgeCellRendererComponent` | — | **true** |
| 9 | Wall Cross Date | `wallCrossDate` | date | `DS_DATE_FORMATTER` | — | **true** |
| 10 | — | — | actions | `DsRowActionsCellRendererComponent` | right | false |

---

## 3. Filters

Default active filters:

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Stage | Multi-select chip | Active, Under Review |
| Owner | Single-select | Current user |
| Deal Size | Range | None |
| Last Updated | Date range | Last 90 days |

---

## 4. Row Actions

Permission-resolved per row using `resolveRowActions()` pattern:

```typescript
const actions: DsRowAction[] = [
  { id: 'view',           label: 'View',           icon: 'visibility' },
  { id: 'advance-stage',  label: 'Advance stage',  icon: 'arrow_forward',
    disabled: !canAdvanceStage(row) },
  { id: 'add-note',       label: 'Add note',       icon: 'note_add' },
];

if (canEdit(row)) {
  actions.push({ id: 'edit', label: 'Edit', icon: 'edit' });
}

// No delete action for this persona
// Export is per-row via toolbar, not row action
```

---

## 5. Bulk Actions

Visible when rows are selected:

```typescript
[
  { id: 'bulk-advance', label: 'Advance stage', icon: 'arrow_forward' },
  { id: 'bulk-assign',  label: 'Reassign',      icon: 'person'        },
  { id: 'export',       label: 'Export',         icon: 'download'      },
]
```

---

## 6. Renderers

Use DS renderer components from `@company/ds/ag-grid`. Reference `primitives.json` for full component docs.

| Column | Renderer |
|--------|----------|
| Stage, MNPI Flag | `DsBadgeCellRendererComponent` |
| Deal Size | `DS_CURRENCY_FORMATTER` (value formatter) |
| Last Updated, Wall Cross Date | `DS_DATE_FORMATTER` (value formatter) |
| Actions | `DsRowActionsCellRendererComponent` |

---

## 7. Calculations

None — no calculated columns in this view.

---

## 8. States

### Loading

```typescript
{
  type: 'skeleton',
  rows: 8,
}
```

### Empty

```typescript
noRowsOverlayComponentParams = {
  icon:        'business_center',
  title:       'No deals in your pipeline',
  description: 'Deals you own or are assigned to will appear here.',
  action:      { label: 'Create deal', callback: () => this.onCreate() },
};
```

### Error

```typescript
{
  icon: 'warning',
  title: 'Unable to load deals',
  description: 'Something went wrong loading your pipeline. Please try again.',
  retryAction: true,
}
```

---

## 9. Defaults

- **Data mode:** Server-side (deal pipelines always exceed 500 rows)
- **Default sort:** `lastUpdated` descending
- **Default filters:** Stage = Active, Under Review; Owner = Current user; Last Updated = Last 90 days
- **Entitlement:** `mnpi-standard` — columns 8–9 suppressed (hidden, not blank)

---

## 10. Checklist

- [ ] Column order matches §2
- [ ] Renderers match §6
- [ ] MNPI-sensitive columns (8–9) suppressed at `mnpi-standard` — hidden, not blank
- [ ] Filters match §3 — defaults applied
- [ ] Row actions match §4 — no delete action present
- [ ] Bulk actions match §5
- [ ] Server-side data mode used
- [ ] Default sort: `lastUpdated` desc
- [ ] All three states implemented per §8
- [ ] Empty state includes "Create deal" action button

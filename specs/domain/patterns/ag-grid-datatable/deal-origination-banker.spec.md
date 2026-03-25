# Composition Spec: AG Grid — Deal Origination Banker
**spec-id:** `domain/patterns/ag-grid-datatable/deal-origination-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-03-20
**base-pattern:** `ds/patterns/ag-grid-datatable` v2.0.0
**persona:** `domain/personas/deal-origination-banker` v1.0.0
**entitlement:** `domain/entitlements/mnpi-standard` v1.0.0

---

## 1. Intent

Defines the ag-grid datatable as experienced by a Deal Origination Banker. This spec only defines the delta from the base pattern. All structural rules, token usage, gridOptions, and component conventions inherit from `ds/patterns/ag-grid-datatable` unchanged.

> **Agent instruction:** Read specs in this order before generating:
> 1. `fw/angular/component-patterns` — structural contract
> 2. `ds/tokens/semantic` — token adapter
> 3. `ds/components/component-map` — component adapter
> 4. `ds/patterns/ag-grid-datatable` — base grid contract
> 5. `domain/personas/deal-origination-banker` — persona context
> 6. `domain/entitlements/mnpi-standard` — entitlement rules
> 7. This spec — delta only
>
> Apply entitlement suppression rules from step 6 to column table below.

---

## 2. Columns

Columns are listed in display order. Apply entitlement suppression from `domain/entitlements/mnpi-standard` before rendering.

| # | Column | Field | Type | DS Renderer | Pinned | mnpi-sensitive | audit-only |
|---|--------|-------|------|-------------|--------|----------------|------------|
| 1 | — | — | checkbox | `DS_CHECKBOX_COL` | left | false | false |
| 2 | Deal Name | `dealName` | text | — | — | false | false |
| 3 | Stage | `stage` | badge | `DsBadgeCellRendererComponent` | — | false | false |
| 4 | Counterparty | `counterpartyName` | text | — | — | false | false |
| 5 | Deal Size | `dealSize` | currency | `DS_CURRENCY_FORMATTER` | — | false | false |
| 6 | Owner | `ownerName` | text | — | — | false | false |
| 7 | Last Updated | `lastUpdated` | date | `DS_DATE_FORMATTER` | — | false | false |
| 8 | MNPI Flag | `mnpiFlag` | badge | `DsBadgeCellRendererComponent` | — | **true** | false |
| 9 | Wall Cross Date | `wallCrossDate` | date | `DS_DATE_FORMATTER` | — | **true** | false |
| 10 | — | — | actions | `DsRowActionsCellRendererComponent` | right | false | false |

Columns 8–9 are suppressed at `mnpi-standard` entitlement. They render at `mnpi-full`.

---

## 3. Filters

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Stage | Multi-select chip | Active, Under Review |
| Owner | Single-select | Current user |
| Deal Size | Range | None |
| Last Updated | Date range | Last 90 days |

---

## 4. Row actions

Use `resolveRowActions()` from base pattern §8 with these permissions:

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

## 5. Bulk actions

Visible when rows are selected:

```typescript
[
  { id: 'bulk-advance', label: 'Advance stage', icon: 'arrow_forward' },
  { id: 'bulk-assign',  label: 'Reassign',      icon: 'person'        },
  { id: 'export',       label: 'Export',         icon: 'download'      },
]
```

---

## 6. Behavioral variant

Server-side (§7.2 of base pattern). Deal pipelines always exceed 500 rows.

Default sort: `lastUpdated` descending (from persona §5).

---

## 7. Empty state

```typescript
noRowsOverlayComponentParams = {
  icon:        'business_center',
  title:       'No deals in your pipeline',
  description: 'Deals you own or are assigned to will appear here.',
  action:      { label: 'Create deal', callback: () => this.onCreate() },
};
```

---

## 8. Agent checklist

- [ ] Base pattern spec read — all structural rules applied
- [ ] Persona definition read — workflow context understood
- [ ] Entitlement spec read — mnpi-standard suppression applied
- [ ] Columns 8–9 suppressed (mnpi-sensitive: true)
- [ ] Column order matches §2 exactly
- [ ] Filters match §3 — defaults applied
- [ ] Row actions match §4 — no delete action present
- [ ] Bulk actions match §5
- [ ] Server-side mode used per §6
- [ ] Default sort: `lastUpdated` desc
- [ ] Empty state matches §7
- [ ] `@spec` header includes persona and entitlement

---

## 9. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | UI Architecture |

---

## 10. Related Specs

- `ds/patterns/ag-grid-datatable` — base pattern
- `domain/personas/deal-origination-banker` — persona
- `domain/entitlements/mnpi-standard` — entitlement
- `domain/patterns/ag-grid-datatable/compliance-viewer` — sibling

# Composition Spec: AG Grid — Compliance Viewer
**spec-id:** `domain/patterns/ag-grid-datatable/compliance-viewer`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Compliance
**spec-type:** `composition`
**last-reviewed:** 2026-03-20
**base-pattern:** `ds/patterns/ag-grid-datatable` v2.0.0
**persona:** `domain/personas/compliance-viewer` v1.0.0
**entitlement:** `domain/entitlements/mnpi-full` v1.0.0

---

## 1. Intent

Defines the ag-grid datatable as experienced by a Compliance Viewer. Read-only, full MNPI visibility, audit columns prominent. This spec only defines the delta from the base pattern.

> **Agent instruction:** Read specs in this order:
> 1. `fw/angular/component-patterns`
> 2. `ds/tokens/semantic`
> 3. `ds/components/component-map`
> 4. `ds/patterns/ag-grid-datatable`
> 5. `domain/personas/compliance-viewer`
> 6. `domain/entitlements/mnpi-full`
> 7. This spec
>
> This is a read-only view. No edit controls, no bulk actions, no export.
> Render zero action buttons — not disabled, not hidden, absent.

---

## 2. Columns

All MNPI and audit columns visible. No suppression at `mnpi-full` entitlement.

| # | Column | Field | Type | DS Renderer | Pinned | Notes |
|---|--------|-------|------|-------------|--------|-------|
| 1 | Deal Name | `dealName` | text | — | — | |
| 2 | Stage | `stage` | badge | `DsBadgeCellRendererComponent` | — | |
| 3 | Counterparty | `counterpartyName` | text | — | — | |
| 4 | MNPI Flag | `mnpiFlag` | badge | `DsBadgeCellRendererComponent` | — | mnpi-sensitive |
| 5 | Wall Cross Date | `wallCrossDate` | date | `DS_DATE_FORMATTER` | — | mnpi-sensitive |
| 6 | Wall Cross Approver | `wallCrossApprover` | text | — | — | audit-only |
| 7 | Last Accessed By | `lastAccessedBy` | text | — | — | audit-only |
| 8 | Last Accessed At | `lastAccessedAt` | date | `DS_DATE_FORMATTER` | — | audit-only |
| 9 | Information Barrier | `infoBarrierStatus` | badge | `DsBadgeCellRendererComponent` | — | compliance-only |
| 10 | Audit Timestamp | `auditTimestamp` | date | `DS_DATE_FORMATTER` | right | audit-only |

No checkbox column. No actions column. Compliance Viewers have no actions.

---

## 3. Filters

| Column | Filter type | Default |
|--------|-------------|---------|
| MNPI Flag | Multi-select | Flagged |
| Stage | Multi-select | None |
| Audit Timestamp | Date range | Last 30 days |
| Information Barrier | Multi-select | Exception |

---

## 4. Row actions

**None.** This is a read-only view. Do not render `DsRowActionsCellRendererComponent`. Do not render `DS_CHECKBOX_COL`. The actions column must be absent entirely — not present and empty, not disabled.

```typescript
// No resolveRowActions() call
// No actions column in columnDefs
// No DS_CHECKBOX_COL in columnDefs
```

---

## 5. Bulk actions

**None.** Do not render `DsBulkActionBarComponent`. Do not render the toolbar slot for bulk actions.

---

## 6. Behavioral variant

Server-side (§7.2 of base pattern).

Default sort: `auditTimestamp` descending (from persona §5).

---

## 7. Grid options override

One permitted override from base gridOptions — row selection disabled:

```typescript
// Override applied on top of base gridOptions
rowSelection: undefined,
suppressRowClickSelection: true,
```

This is the only permitted override. Document it with a comment in the generated file.

---

## 8. Loading state

```typescript
{
  type: 'skeleton',
  rows: 8,
}
```

---

## 9. Empty state

```typescript
noRowsOverlayComponentParams = {
  icon:        'shield',
  title:       'No deals match this filter',
  description: 'Adjust the date range or MNPI filter to find records.',
  action:      null,   // no action for compliance viewer
};
```

---

## 10. Error state

```typescript
{
  icon: '⚠',
  title: 'Unable to load deals',
  description: 'Something went wrong loading your pipeline. Please try again.',
  retryAction: true,
}
```

---

## 11. Agent checklist

- [ ] Base pattern spec read — all structural rules applied
- [ ] Persona definition read — read-only, full MNPI context understood
- [ ] Entitlement spec read — mnpi-full, all columns render
- [ ] All 10 columns present per §2
- [ ] No checkbox column
- [ ] No actions column
- [ ] No row actions rendered — not disabled, absent
- [ ] No bulk action bar
- [ ] Row selection disabled per §7
- [ ] Server-side mode used
- [ ] Default sort: `auditTimestamp` desc
- [ ] `@spec` header includes persona and entitlement

---

## 12. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | UI Architecture / Compliance |

---

## 13. Related Specs

- `ds/patterns/ag-grid-datatable` — base pattern
- `domain/personas/compliance-viewer` — persona
- `domain/entitlements/mnpi-full` — entitlement
- `domain/patterns/ag-grid-datatable/deal-origination-banker` — sibling

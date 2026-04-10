# Grid: Compliance Viewer

**spec-id:** `grid/compliance-viewer`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Compliance
**last-reviewed:** 2026-04-08
**pattern:** `ag-grid-datatable`
**persona:** `compliance-viewer`
**entitlement:** `mnpi-full`

---

## 1. Purpose

Read-only MNPI and audit view for Compliance Viewers. Full MNPI visibility — wall cross dates, approvers, information barriers, and audit timestamps are all prominently shown. No edit controls, no bulk actions, no export. All interactive elements must be absent entirely — not disabled, not hidden, absent.

---

## 2. Columns

No checkbox column. No actions column. All MNPI and audit columns visible at `mnpi-full` entitlement.

| # | Column | Field | Type | Renderer | Pinned | Notes |
|---|--------|-------|------|----------|--------|-------|
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

---

## 3. Filters

| Column | Filter type | Default |
|--------|-------------|---------|
| MNPI Flag | Multi-select | Flagged |
| Stage | Multi-select | None |
| Audit Timestamp | Date range | Last 30 days |
| Information Barrier | Multi-select | Exception |

---

## 4. Row Actions

None. This is a read-only view. Do not render `DsRowActionsCellRendererComponent`. Do not render `DS_CHECKBOX_COL`. The actions column must be absent entirely — not present and empty, not disabled.

---

## 5. Bulk Actions

None. Do not render a bulk action bar or toolbar slot for bulk actions.

---

## 6. Renderers

Use DS renderer components from `@company/ds/ag-grid`. Reference `primitives.json` for full component docs.

| Column | Renderer |
|--------|----------|
| Stage, MNPI Flag, Information Barrier | `DsBadgeCellRendererComponent` |
| Wall Cross Date, Last Accessed At, Audit Timestamp | `DS_DATE_FORMATTER` (value formatter) |

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
  icon:        'shield',
  title:       'No deals match this filter',
  description: 'Adjust the date range or MNPI filter to find records.',
  action:      null,   // no action for compliance viewer
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

- **Data mode:** Server-side (deal pipelines exceed 500 rows)
- **Default sort:** `auditTimestamp` descending
- **Default filters:** MNPI Flag = Flagged; Audit Timestamp = Last 30 days; Information Barrier = Exception
- **Row selection:** Disabled. Override grid options:

  ```typescript
  // Only permitted override — document with comment in generated file
  rowSelection: undefined,
  suppressRowClickSelection: true,
  ```

- **Entitlement:** `mnpi-full` — all columns render

---

## 10. Checklist

- [ ] Column order matches §2 (10 columns)
- [ ] No checkbox column
- [ ] No actions column
- [ ] No row actions rendered — not disabled, absent
- [ ] No bulk action bar
- [ ] Row selection disabled per §9
- [ ] Server-side data mode used
- [ ] Default sort: `auditTimestamp` desc
- [ ] Default filters match §3
- [ ] All three states implemented per §8
- [ ] Renderers match §6

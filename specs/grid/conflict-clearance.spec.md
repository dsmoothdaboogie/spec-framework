# Grid: Conflict Clearance Officer

**spec-id:** `grid/conflict-clearance`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Legal
**last-reviewed:** 2026-04-08
**pattern:** `ag-grid-datatable`
**persona:** `conflict-clearance`
**entitlement:** `deal-restricted`

---

## 1. Purpose

Strict read-only conflict-review view for Conflict Clearance Officers. No financial data, no row actions, no export, no row selection. The persona reviews conflict status, MNPI flags, and information barriers. All interactive elements (checkbox column, actions column, bulk action bar, toolbar) must be absent entirely — not disabled, not hidden, absent.

---

## 2. Columns

No checkbox column. No actions column.

| # | Column | Field | Type | Renderer | Pinned | conflict-sensitive |
|---|--------|-------|------|----------|--------|--------------------|
| 1 | Deal Name | `dealName` | text | — | left | false |
| 2 | Issuer | `issuerName` | text | — | — | false |
| 3 | Type | `dealType` | badge | `DealStageRendererComponent` variant: neutral | — | false |
| 4 | Conflict Status | `conflictStatus` | custom | `ConflictStatusRendererComponent` | — | **true** |
| 5 | MNPI Flag | `mnpiFlag` | badge | boolean → badge (true=error variant + label "Yes", false=neutral variant + label "No") | — | **true** |
| 6 | Info Barrier | `infoBarrier` | text | null renders as "None" | — | **true** |
| 7 | Submitted Date | `mandateDate` | date | date pipe | — | false |
| 8 | Review Date | `conflictReviewDate` | date | date pipe | — | **true** |
| 9 | Reviewed By | `conflictReviewedBy` | text | null renders as "—" | — | **true** |
| 10 | Notes | `conflictNotes` | text | truncate at 60 chars, full text in title attribute | — | **true** |

---

## 3. Filters

Default active filters:

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Conflict Status | Multi-select | Pending, Flagged |
| MNPI Flag | Boolean toggle | None (show all) |
| Submitted Date | Date range | None |

---

## 4. Row Actions

None. This is a read-only view. The `columnDefs` array must contain zero references to an actions column or `ActionsCellRendererComponent`.

---

## 5. Bulk Actions

None. No bulk action bar rendered. No toolbar. No selection count.

---

## 6. Renderers

Use pre-built renderers from `src/app/shared/cell-renderers/`. Do NOT create new renderers. Reference `primitives.json` for full component docs.

| Column | Renderer | Import path |
|--------|----------|-------------|
| Type | `DealStageRendererComponent` | `src/app/shared/cell-renderers/deal-stage-renderer/` |
| Conflict Status | `ConflictStatusRendererComponent` | `src/app/shared/cell-renderers/conflict-status-renderer/` |

### `ConflictStatusRendererComponent` color map

| Status | Badge variant |
|---|---|
| Pending | warning |
| Flagged | error |
| Cleared | success |
| Waived | neutral |

### MNPI Flag rendering

`mnpiFlag` is a boolean. Render as badge: `true` → error variant, label "Yes". `false` → neutral variant, label "No".

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
{
  icon: 'shield',
  title: 'No conflict submissions match this filter',
  description: 'Adjust the status or date range filter to find submissions.',
}
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

- **Data mode:** Client-side
- **Default sort:** `conflictStatus` custom comparator (Pending first, then Flagged, then Waived, then Cleared), secondary `mandateDate` ascending

  ```typescript
  const STATUS_ORDER = { Pending: 0, Flagged: 1, Waived: 2, Cleared: 3 };
  ```

- **Row selection:** Disabled. Override grid options:

  ```typescript
  rowSelection: undefined,
  suppressRowClickSelection: true,
  ```

- **Entitlement:** `deal-restricted`

---

## 10. Checklist

- [ ] Column order matches §2
- [ ] `dealName` pinned left
- [ ] `DS_CHECKBOX_COL` — absent from columnDefs (not disabled, absent)
- [ ] Actions column — absent from columnDefs
- [ ] Bulk action bar — absent from template
- [ ] No export capability
- [ ] Row selection disabled per §9
- [ ] `ConflictStatusRendererComponent` uses color map from §6
- [ ] `mnpiFlag` boolean renders as error/neutral badge with "Yes"/"No" label
- [ ] `infoBarrier` null renders as "None" text
- [ ] `conflictReviewedBy` null renders as "—"
- [ ] All three states implemented per §8
- [ ] Default sort: `conflictStatus` custom comparator per §9

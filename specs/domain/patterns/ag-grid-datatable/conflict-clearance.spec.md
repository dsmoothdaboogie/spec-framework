# Composition Spec: AG Grid — Conflict Clearance Officer
**spec-id:** `domain/patterns/ag-grid-datatable/conflict-clearance`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Legal
**spec-type:** `composition`
**last-reviewed:** 2026-04-03
**base-pattern:** `ds/patterns/ag-grid-datatable` v2.0.0
**persona:** `domain/personas/conflict-clearance` v1.0.0
**entitlement:** `domain/entitlements/deal-restricted` v1.0.0

---

## 1. Intent

Defines the AG Grid datatable for a Conflict Clearance Officer. Strict read-only conflict-review view. No financial data, no row actions, no export, no row selection. This spec only defines the delta from the base pattern.

> **Agent instruction:** Read specs in order:
> 1. `fw/angular/component-patterns`
> 2. `ds/tokens/semantic`
> 3. `ds/components/component-map`
> 4. `ds/patterns/ag-grid-datatable`
> 5. `domain/personas/conflict-clearance`
> 6. `domain/entitlements/deal-restricted`
> 7. This spec
>
> **This is a strict read-only view.** Render zero action controls. Do NOT include `DS_CHECKBOX_COL` in columnDefs. Do NOT include an actions column. Do NOT render a bulk action bar or toolbar. These must be **absent** — not disabled, not hidden, absent entirely.

---

## 2. Columns

| # | Column | Field | Type | Renderer | Pinned | conflict-sensitive |
|---|--------|-------|------|----------|--------|--------------------|
| 1 | Deal Name | `dealName` | text | — | left | false |
| 2 | Issuer | `issuerName` | text | — | — | false |
| 3 | Type | `dealType` | badge | `DealStageRendererComponent` variant: neutral | — | false |
| 4 | Conflict Status | `conflictStatus` | custom | `ConflictStatusRendererComponent` | — | **true** |
| 5 | MNPI Flag | `mnpiFlag` | badge | boolean → badge (true=error, false=neutral, label="Yes"/"No") | — | **true** |
| 6 | Info Barrier | `infoBarrier` | text | null renders as "None" | — | **true** |
| 7 | Submitted Date | `mandateDate` | date | date pipe | — | false |
| 8 | Review Date | `conflictReviewDate` | date | date pipe | — | **true** |
| 9 | Reviewed By | `conflictReviewedBy` | text | null renders as "—" | — | **true** |
| 10 | Notes | `conflictNotes` | text | truncate at 60 chars, full text in title attribute | — | **true** |

No checkbox column. No actions column.

---

## 3. Filters (default active)

| Column | Filter type | Default value |
|--------|-------------|---------------|
| Conflict Status | Multi-select | Pending, Flagged |
| MNPI Flag | Boolean toggle | None (show all) |
| Submitted Date | Date range | None |

---

## 4. Row actions

**None.** The `columnDefs` array must contain zero references to an actions column or `ActionsCellRendererComponent`.

---

## 5. Bulk actions

**None.** No bulk action bar rendered. No toolbar. No selection count.

---

## 6. Behavioral variant

Client-side data. Default sort: `conflictStatus` custom comparator (Pending first, then Flagged, then Waived, then Cleared), secondary `mandateDate` ascending.

Conflict status sort order:
```typescript
const STATUS_ORDER = { Pending: 0, Flagged: 1, Waived: 2, Cleared: 3 };
```

---

## 7. Grid options override

Row selection must be disabled:

```typescript
rowSelection: undefined,  // no selection
suppressRowClickSelection: true,
```

---

## 8. `ConflictStatusRendererComponent` color map

| Status | Badge variant |
|---|---|
| Pending | warning |
| Flagged | error |
| Cleared | success |
| Waived | neutral |

---

## 9. Loading state

```typescript
{
  type: 'skeleton',
  rows: 8,
}
```

---

## 10. Empty state

```typescript
{
  icon: '🛡',
  title: 'No conflict submissions match this filter',
  description: 'Adjust the status or date range filter to find submissions.',
}
```

---

## 11. Error state

```typescript
{
  icon: '⚠',
  title: 'Unable to load deals',
  description: 'Something went wrong loading your pipeline. Please try again.',
  retryAction: true,
}
```

---

## 12. Agent checklist

- [ ] `DS_CHECKBOX_COL` — absent from columnDefs (not disabled, absent)
- [ ] Actions column — absent from columnDefs
- [ ] Bulk action bar — absent from template
- [ ] No export capability
- [ ] Row selection disabled per §7
- [ ] `ConflictStatusRendererComponent` uses color map from §8
- [ ] `mnpiFlag` boolean renders as error/neutral badge with "Yes"/"No" label
- [ ] `infoBarrier` null renders as "None" text
- [ ] `conflictReviewedBy` null renders as "—"
- [ ] Column order matches §2 exactly
- [ ] `dealName` pinned left
- [ ] Default sort: conflictStatus custom comparator per §6

---

## 13. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Legal |

---

## 14. Related Specs

- `ds/patterns/deal-grid-calculations`
- `domain/personas/conflict-clearance`
- `domain/entitlements/deal-restricted`

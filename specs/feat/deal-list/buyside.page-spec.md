# Page Spec: Deal List — Buyside Trader
**spec-id:** `feat/deal-list/buyside`
**spec-type:** `page`
**version:** `1.0.0`
**status:** `active`
**owner:** Buyside Trading UI Team
**last-reviewed:** 2026-03-22
**applies-to:** `Angular 19+`
**extends:** `ds/templates/deal-list` v1.0.0
**layout-variant:** `list-only`
**persona:** `buyside-trader`

---

## 1. Intent

This page spec defines the deal list for buyside traders. Buyside traders need to see all deals they are a counterparty to, prioritised by trade date descending, with quick access to deal status and notional. The page is read-only; traders navigate to a deal detail route for actions.

> **Agent instruction:** Read `ds/tokens/semantic`, `ds/components/component-map`, `ds/patterns/ag-grid-datatable`, and `ds/templates/deal-list` — in that order — before reading this spec. This spec only declares what is persona-specific. Do not re-implement anything the template or pattern specs already prescribe.

---

## 2. Scope

### In scope
- Buyside trader deal list — deals where `side === 'buy'` and `ownerId === currentUserId`
- Server-side data mode (total row count provided by API)
- List-only layout variant (no detail panel)
- Deal status filtering and free-text search by counterparty name or deal ID

### Out of scope
- Sellside deal list → `feat/deal-list/sellside` (future)
- Admin deal list → `feat/deal-list/admin` (future)
- Deal detail view → `feat/deal-detail/buyside` (future)
- Editable deal fields → `ds/patterns/ag-grid-editable`
- Cross-persona deal comparison → product requirements, not in scope for this page

---

## 3. Slot Fulfillment

| Slot | Status | Implementation |
|---|---|---|
| page-toolbar | filled | `BuysideDealsToolbarComponent` — see §3.1 |
| filter-bar | filled | `BuysideDealsFilterBarComponent` — see §3.2 |
| data-region | filled | `BuysideDealsTableComponent` — see §4 |
| detail-panel | not used | layout-variant is `list-only` |

### 3.1 Toolbar

`BuysideDealsToolbarComponent` implements the toolbar slot:

- **Page title:** "My Deals"
- **Primary CTA:** "Export" button — triggers CSV export of current view
- **Filter toggle:** standard filter toggle (wired per template §6, slot: filter-bar)
- **Bulk action bar:** shown when rows are selected; actions: "Download selected" only

### 3.2 Filter bar

`BuysideDealsFilterBarComponent` implements the filter bar slot:

- `DsSearchInputComponent` — searches `counterparty` and `dealId` fields
- `DsSelectComponent` — "Status" filter; options: All, Active, Pending, Settled, Cancelled
- `DsSelectComponent` — "Trade date" filter; options: Today, This week, This month, Custom range

---

## 4. Column Definitions

Required minimum columns are inherited from `ds/templates/deal-list §5.3` and must not be modified. The buyside persona appends the following columns after position 6:

| Position | `field` | `headerName` | Type / Renderer |
|---|---|---|---|
| 1 | *(DS_CHECKBOX_COL)* | — | from template — do not redefine |
| 2 | `dealId` | Deal ID | from template — do not redefine |
| 3 | `counterparty` | Counterparty | from template — do not redefine |
| 4 | `tradeDate` | Trade Date | from template — do not redefine |
| 5 | `notionalAmount` | Notional | from template — do not redefine |
| 6 | `status` | Status | from template — do not redefine |
| 7 | `instrument` | Instrument | text |
| 8 | `maturityDate` | Maturity | date — `DS_DATE_FORMATTER` |
| 9 | `pnl` | P&L | currency — `DS_CURRENCY_FORMATTER`; positive values use `color.$status-success`, negative use `color.$status-error` |
| last | *(actions)* | — | from template — do not redefine |

Default sort: `tradeDate` descending.

---

## 5. Row Actions

Buyside traders have one row action: navigate to deal detail.

```typescript
protected resolveRowActions(row: BuysideDeal): DsRowAction[] {
  return [
    {
      label: 'View deal',
      icon: 'open_in_new',
      action: () => this.router.navigate(['/deals', row.dealId]),
    },
  ];
}
```

No permission check is required — all buyside traders can view all deals in their list.

---

## 6. Permissions and Routing

**Route path:** `/deals` (registered under the buyside trader MFE shell)

**Route guards:**
- `AuthGuard` — user must be authenticated
- `PersonaGuard` — user must have `persona: buyside-trader` in their profile

**Route resolver:** `BuysideDealsResolver` — fetches first page of deals and total count before the page renders. This prevents the blank flash; the page displays immediately with data.

**Permission-denied state copy:** "You don't have access to this page. Contact your administrator if you believe this is an error."

---

## 7. Required States

| State | Copy / Behaviour |
|---|---|
| Page loading | Full-page `DsLoadingSpinnerComponent` — wired to resolver pending |
| Page error | `DsErrorStateComponent`: "Unable to load deals. Try again." with retry button that re-runs the resolver |
| Permission denied | `DsErrorStateComponent`: copy from §6 |
| Empty (authenticated, no deals) | `DsEmptyStateComponent` in data region: "You have no deals yet." — no action button |
| Empty (filters applied, no results) | `DsEmptyStateComponent`: "No deals match your filters." with "Clear filters" action |

---

## 8. Agent Checklist

> **Agent instruction:** This checklist incorporates all items from `ds/templates/deal-list §12`. Do not skip the template checklist items — they are required, not optional.

> **Before outputting generated code, verify every item below:**

**From `ds/templates/deal-list §12` (reproduced verbatim):**
- [ ] Layout variant declared (`list-only`) and implemented — no detail panel slot
- [ ] All four regions present in DOM per template §4.2
- [ ] Host uses CSS grid layout per template §4.3
- [ ] Data region filled by `ag-grid-datatable`; `gridOptions` verbatim per template §5.2
- [ ] Required minimum columns present in correct order per template §5.3
- [ ] `DS_CHECKBOX_COL` is first column; actions column is last
- [ ] All four slot contracts satisfied (toolbar, filter-bar, data-region filled; detail-panel declared as not used)
- [ ] Toolbar includes filter toggle and CTA button
- [ ] Filter bar emits `filtersChanged`; wired to data region per template §10.2
- [ ] Page-level loading, error, and permission-denied states implemented per template §8
- [ ] Routing contract satisfied (lazy-loaded, `AuthGuard` + `PersonaGuard` declared) per template §9
- [ ] All page-level a11y requirements met per template §11
- [ ] All `ag-grid-datatable` agent checklist items verified

**Buyside persona additions:**
- [ ] Columns 7–9 (instrument, maturity, P&L) appended after required minimum set per §4
- [ ] P&L column uses `color.$status-success` / `color.$status-error` tokens — no raw colours
- [ ] Default sort is `tradeDate` descending
- [ ] Row action navigates to `/deals/[dealId]` per §5
- [ ] Empty state copy matches §7 exactly
- [ ] `BuysideDealsResolver` pre-fetches first page — no blank flash

---

## 9. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-22 | Initial release | Buyside Trading UI Team |

---

## 10. Related Specs & Resources

- `ds/templates/deal-list` — parent template (read before this spec)
- `ds/patterns/ag-grid-datatable` — primary organism
- `ds/tokens/semantic` — token adapter
- `ds/components/component-map` — component adapter
- `feat/deal-list/sellside` — sellside variant (future)
- `feat/deal-detail/buyside` — detail page (future)

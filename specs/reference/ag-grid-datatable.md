# Reference: AG Grid Datatable

> **This is a reference document**, not a spec. Persona specs under `specs/grid/` and `specs/dashboard/` are the primary artifacts. This doc provides background on grid defaults, widget contracts, and calculation functions if needed.

**spec-id:** `ds/patterns/ag-grid-datatable`
**version:** `2.0.0`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**applies-to:** Angular 19+, AG Grid Community/Enterprise v31+

---

## Scope

### In scope
- Standard read-only datatables with sorting, filtering, and pagination
- Inline row actions (view, edit, delete)
- Bulk selection with toolbar actions
- Server-side and client-side data modes
- Empty, loading, and error states

### Out of scope
- Editable grid cells
- Master/detail rows
- Tree data

---

## Design System Tokens

| Property | CSS Custom Property | Usage |
|---|---|---|
| Header background | `var(--color-surface-secondary)` | Column header row |
| Header text | `var(--type-label-strong)` + `var(--color-text-primary)` | Column header labels |
| Row hover | `var(--color-surface-hover)` | Mouse-over row highlight |
| Row selected | `var(--color-surface-secondary)` | Selected row background |
| Border color | `var(--color-border-subtle)` | Row dividers, grid borders |
| Row height | `var(--grid-row-height-default)` | Standard row height (48px) |
| Header height | `var(--grid-header-height)` | Column header height (52px) |
| Cell padding | `var(--spacing-s3)` | Horizontal cell padding (12px) |
| Toolbar height | `var(--grid-toolbar-height)` | Table toolbar height (56px) |

---

## Grid Options (Standard Defaults)

```typescript
import { GridOptions } from 'ag-grid-community';
import { DsLoadingOverlayComponent, DsEmptyStateOverlayComponent } from '@company/ds/ag-grid';

readonly gridOptions: GridOptions = {
  domLayout: 'normal',
  rowHeight: 48,
  headerHeight: 52,
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  multiSortKey: 'ctrl',
  floatingFiltersHeight: 40,
  animateRows: true,
  suppressColumnVirtualisation: false,
  suppressRowVirtualisation: false,
  enableCellTextSelection: true,
  ensureDomOrder: true,
  suppressMenuHide: true,
  suppressContextMenu: true,
};

readonly loadingOverlay      = DsLoadingOverlayComponent;
readonly emptyOverlay        = DsEmptyStateOverlayComponent;
readonly emptyOverlayParams  = {
  icon: 'table_rows',
  title: 'No results found',
  description: 'Try adjusting your filters.',
};
```

---

## Column Definition Conventions

### Base column def

```typescript
import { ColDef } from 'ag-grid-community';

export const BASE_COL: ColDef = {
  sortable: true,
  resizable: true,
  minWidth: 100,
  suppressHeaderMenuButton: true,
  unSortIcon: true,
};
```

### Column types → DS components

| Column type | Pattern | Import |
|---|---|---|
| Text | `{ ...BASE_COL, field: 'name' }` | — |
| Date | `valueFormatter: DS_DATE_FORMATTER` | `@company/ds/ag-grid` |
| Currency | `valueFormatter: DS_CURRENCY_FORMATTER` | `@company/ds/ag-grid` |
| Number | `valueFormatter: DS_NUMBER_FORMATTER` | `@company/ds/ag-grid` |
| Status / Badge | `cellRenderer: DsBadgeCellRendererComponent` | `@company/ds/ag-grid` |
| Checkbox select | `DS_CHECKBOX_COL` constant — never redefine | `@company/ds/ag-grid` |
| Row actions | `cellRenderer: DsRowActionsCellRendererComponent`, pinned right | `@company/ds/ag-grid` |

---

## Data Modes

**Decision rule:** `totalRows` input is `null` → client mode. `totalRows` is a `number` → server mode.

### Client-side (< ~500 rows)

```typescript
rowData   = signal<RowDataType[]>([]);
totalRows = signal<null>(null);
```

### Server-side (> ~500 rows or unknown size)

```typescript
rowData   = signal<RowDataType[]>([]);
totalRows = signal<number>(0);

onPageChange(e: PageChangeEvent)     { this.load({ page: e.page, size: e.pageSize }); }
onSortChange(e: SortChangeEvent)     { this.currentSort = e; this.load(); }
onFilterChange(e: FilterChangeEvent) { this.currentFilter = e; this.load(); }
```

---

## Row Actions Pattern

Actions are permission-resolved per row. Never hardcode a static list.

```typescript
function resolveRowActions(row: RowDataType, canEdit: boolean, canDelete: boolean): DsRowAction[] {
  const actions: DsRowAction[] = [
    { id: 'view', label: 'View', icon: 'visibility' },
  ];
  if (canEdit)   actions.push({ id: 'edit',   label: 'Edit',   icon: 'edit' });
  if (canDelete) actions.push({ id: 'delete', label: 'Delete', icon: 'delete', variant: 'destructive' });
  return actions;
}
```

---

## Required States

All three are required in every grid implementation.

| State | Component | Trigger |
|---|---|---|
| Loading | `DsLoadingOverlayComponent` | `loading()` input is `true` |
| Empty | `DsEmptyStateOverlayComponent` | `rowData()` is empty, `loading()` is false |
| Error | `DsErrorStateComponent` wrapping the container | Data fetch failure |

---

## Theming

Apply `ds-ag-theme` class to `ag-grid-angular`. Never apply AG Grid built-in themes directly.

---

## mt-datatable Equivalents

The `mt-datatable` component is the design system's wrapper around AG Grid. Check the project's `package.json` for `@citi-icg-172888/ng-icgds/datatable`. If present, use mt-datatable types. The primitives registry `adapterAliases` field in `tools/registry/primitives.json` contains the complete mapping.

| AG Grid | mt-datatable equivalent |
|---|---|
| `ColDef` | `MtColumnDefs` |
| `GridOptions` | `MtGridOptions` |
| `<ag-grid-angular>` | `<mt-datatable>` |
| `import { ... } from 'ag-grid-community'` | `import { ... } from '@citi-icg-172888/ng-icgds/datatable'` |

---

## Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial spec | UI Architecture |
| 2.0.0 | 2026-03-20 | Decoupled from DS — semantic adapter layer introduced | UI Architecture |

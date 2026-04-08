# Pattern Spec: AG Grid Datatable
**spec-id:** `ds/patterns/ag-grid-datatable`
**version:** `2.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**applies-to:** Angular 19+, AG Grid Community/Enterprise v31+
**token-adapter:** `ds/tokens/semantic` v1.0.0
**component-adapter:** `ds/components/component-map` v1.0.0

---

## 1. Intent

This spec defines the standard implementation pattern for AG Grid datatables across all product teams. It references semantic token and component names only — the underlying library (currently Angular Material) is resolved via the adapter specs listed in the frontmatter. Swapping the DS requires no changes to this spec.

> **Agent instruction:** Read `ds/tokens/semantic` and `ds/components/component-map` before generating code. All token and component references here are semantic — never import Angular Material or any library directly into a feature component. Flag any requirement this spec does not cover rather than improvising.

---

## 2. Scope

### In scope
- Standard read-only datatables with sorting, filtering, and pagination
- Inline row actions (view, edit, delete)
- Bulk selection with toolbar actions
- Server-side and client-side data modes
- Empty, loading, and error states

### Out of scope
- Editable grid cells → `ds/patterns/ag-grid-editable`
- Master/detail rows → `ds/patterns/ag-grid-master-detail`
- Tree data → `ds/patterns/ag-grid-tree`

---

## 3. Design System Tokens

All visual properties must use semantic tokens. Never use raw values.

```scss
@use '@company/spec-tokens/color'    as color;
@use '@company/spec-tokens/type'     as type;
@use '@company/spec-tokens/spacing'  as spacing;
@use '@company/spec-tokens/grid'     as grid-tokens;
```

| Property | Semantic token | Current Material value |
|---|---|---|
| Header background | `color.$surface-secondary` | `surface-variant` |
| Header text | `type.$label-strong` + `color.$text-primary` | `label-large` bold + `on-surface` |
| Row hover | `color.$surface-hover` | `surface-variant` @ 8% |
| Row selected | `color.$surface-selected` | `secondary-container` |
| Border color | `color.$border-subtle` | `outline-variant` |
| Row height | `grid-tokens.$row-height-default` | 48px |
| Header height | `grid-tokens.$header-height` | 52px |
| Cell padding | `spacing.$s3` horizontal | 12px |
| Toolbar height | `grid-tokens.$toolbar-height` | 56px |

> **Agent instruction:** The "Current Material value" column is informational only. Always use the semantic token in generated code.

---

## 4. Component Structure

### 4.1 File layout

```
feature/
└── components/
    └── [feature]-table/
        ├── [feature]-table.component.ts
        ├── [feature]-table.component.html
        ├── [feature]-table.component.scss
        ├── [feature]-table.types.ts
        └── [feature]-table.component.spec.ts
```

### 4.2 Required inputs / outputs

```typescript
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';
import { PageChangeEvent, SortChangeEvent, FilterChangeEvent } from '@company/ds/ag-grid';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTableComponent {

  // Required
  rowData    = input.required<RowDataType[]>();
  columnDefs = input.required<ColDef<RowDataType>[]>();

  // Optional with defaults
  loading         = input<boolean>(false);
  totalRows       = input<number | null>(null);
  pageSize        = input<number>(25);
  pageSizeOptions = input<number[]>([10, 25, 50, 100]);
  ariaLabel       = input<string>('Data table');

  // Outputs
  rowAction       = output<{ action: string; row: RowDataType }>();
  pageChange      = output<PageChangeEvent>();
  sortChange      = output<SortChangeEvent>();
  filterChange    = output<FilterChangeEvent>();
  selectionChange = output<RowDataType[]>();
}
```

### 4.3 Template skeleton

```html
<div class="ds-table-container" [class.is-loading]="loading()">

  <div class="ds-table-toolbar">
    <ng-content select="[tableToolbar]" />
    @if (selectedRows().length) {
      <ds-bulk-action-bar
        [count]="selectedRows().length"
        (clearSelection)="clearSelection()">
        <ng-content select="[bulkActions]" />
      </ds-bulk-action-bar>
    }
  </div>

  <ag-grid-angular
    class="ds-ag-theme"
    [attr.aria-label]="ariaLabel()"
    [rowData]="rowData()"
    [columnDefs]="resolvedColumnDefs()"
    [gridOptions]="gridOptions"
    [loadingOverlayComponent]="loadingOverlay"
    [noRowsOverlayComponent]="emptyOverlay"
    [noRowsOverlayComponentParams]="emptyOverlayParams"
    (gridReady)="onGridReady($event)"
    (sortChanged)="onSortChanged($event)"
    (filterChanged)="onFilterChanged($event)"
    (selectionChanged)="onSelectionChanged($event)"
  />

  <ds-table-pagination
    [pageSize]="pageSize()"
    [pageSizeOptions]="pageSizeOptions()"
    [totalRows]="totalRows()"
    (pageChange)="onPageChange($event)"
  />

</div>
```

---

## 5. Grid Options (Standard Defaults)

Copy verbatim. Do not add, remove, or override in individual feature components.

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

## 6. Column Definition Conventions

### 6.1 Base column def

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

### 6.2 Column types → DS components

| Column type | Pattern | Import |
|---|---|---|
| Text | `{ ...BASE_COL, field: 'name' }` | — |
| Date | `valueFormatter: DS_DATE_FORMATTER` | `@company/ds/ag-grid` |
| Currency | `valueFormatter: DS_CURRENCY_FORMATTER` | `@company/ds/ag-grid` |
| Number | `valueFormatter: DS_NUMBER_FORMATTER` | `@company/ds/ag-grid` |
| Status / Badge | `cellRenderer: DsBadgeCellRendererComponent` | `@company/ds/ag-grid` |
| Checkbox select | `DS_CHECKBOX_COL` constant — never redefine | `@company/ds/ag-grid` |
| Row actions | `cellRenderer: DsRowActionsCellRendererComponent`, pinned right | `@company/ds/ag-grid` |

### 6.3 Standard column set pattern

```typescript
import {
  DS_CHECKBOX_COL,
  DS_DATE_FORMATTER,
  DS_CURRENCY_FORMATTER,
  DsBadgeCellRendererComponent,
  DsRowActionsCellRendererComponent,
} from '@company/ds/ag-grid';

export function buildColumnDefs(canEdit: boolean, canDelete: boolean): ColDef<RowDataType>[] {
  return [
    DS_CHECKBOX_COL,
    { ...BASE_COL, field: 'name', headerName: 'Name', flex: 2 },
    { ...BASE_COL, field: 'createdAt', headerName: 'Created', valueFormatter: DS_DATE_FORMATTER },
    { ...BASE_COL, field: 'amount', headerName: 'Amount', valueFormatter: DS_CURRENCY_FORMATTER },
    {
      ...BASE_COL,
      field: 'status',
      headerName: 'Status',
      cellRenderer: DsBadgeCellRendererComponent,
      cellRendererParams: (p) => ({ variant: statusToVariant(p.value) }),
    },
    {
      colId: 'actions',
      headerName: '',
      pinned: 'right',
      width: 56,
      sortable: false,
      resizable: false,
      cellRenderer: DsRowActionsCellRendererComponent,
      cellRendererParams: (p) => ({ actions: resolveRowActions(p.data, canEdit, canDelete) }),
    },
  ];
}
```

---

## 7. Data Modes

**Decision rule:** `totalRows` input is `null` → client mode. `totalRows` is a `number` → server mode.

### 7.1 Client-side (< ~500 rows)

```typescript
rowData   = signal<RowDataType[]>([]);
totalRows = signal<null>(null);
```

### 7.2 Server-side (> ~500 rows or unknown size)

```typescript
rowData   = signal<RowDataType[]>([]);
totalRows = signal<number>(0);

onPageChange(e: PageChangeEvent)     { this.load({ page: e.page, size: e.pageSize }); }
onSortChange(e: SortChangeEvent)     { this.currentSort = e; this.load(); }
onFilterChange(e: FilterChangeEvent) { this.currentFilter = e; this.load(); }

private load(overrides = {}) {
  this.tableService.fetch({ ...this.currentSort, ...this.currentFilter, ...overrides })
    .pipe(takeUntilDestroyed())
    .subscribe(({ data, total }) => {
      this.rowData.set(data);
      this.totalRows.set(total);
    });
}
```

---

## 8. Row Actions

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

## 9. Required States

All three are required. None are optional.

| State | Component | Trigger |
|---|---|---|
| Loading | `DsLoadingOverlayComponent` | `loading()` input is `true` |
| Empty | `DsEmptyStateOverlayComponent` | `rowData()` is empty, `loading()` is false |
| Error | `DsErrorStateComponent` wrapping the container | Data fetch failure |

---

## 10. Theming

Apply `ds-ag-theme` class to `ag-grid-angular`. Never apply AG Grid built-in themes directly.

`ds-ag-theme` is defined in the adapter at `adapters/current/ag-grid/_theme.scss` and maps AG Grid CSS variables to semantic tokens. Feature component SCSS must contain only:

```scss
:host {
  display: block;
  height: 100%;
}
```

---

## 11. Accessibility Requirements

- All columns must have meaningful `headerName` (except checkbox and actions)
- `[attr.aria-label]` bound via `ariaLabel()` input — never omit
- Badges must include text label — color alone cannot convey status
- `ensureDomOrder: true` must stay in `gridOptions`

---

## 12. Agent Checklist

> Verify every item before outputting generated code:

- [ ] File layout matches §4.1
- [ ] All inputs/outputs present per §4.2 including `ariaLabel`
- [ ] `gridOptions` matches §5 verbatim — no overrides
- [ ] `loadingOverlay` and `emptyOverlay` assigned per §5
- [ ] All columns extend `BASE_COL` per §6.1
- [ ] Column types use DS formatters/renderers per §6.2 — no inline formatting
- [ ] `DS_CHECKBOX_COL` used directly — not redefined
- [ ] Actions column is last, pinned right, width 56
- [ ] Data mode correctly identified per §7 decision rule
- [ ] Row actions use `resolveRowActions()` pattern per §8
- [ ] All three states implemented per §9
- [ ] `ds-ag-theme` applied — no AG Grid built-in theme
- [ ] Feature SCSS contains only `:host` rule
- [ ] Zero raw values — all via semantic token imports per §3
- [ ] No direct Angular Material imports in feature component

---

## 13. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial spec | UI Architecture |
| 2.0.0 | 2026-03-20 | Decoupled from DS — semantic adapter layer introduced | UI Architecture |

---

## 14. Related Specs & Resources

- `ds/tokens/semantic` — token adapter (swap point)
- `ds/components/component-map` — component adapter (swap point)
- `ds/patterns/ag-grid-editable` — future
- AG Grid v31: https://ag-grid.com/angular-data-grid/
- Angular Material v17: https://material.angular.io

---

## 15. DS Adapter — mt-datatable Equivalents

> **Agent instruction:** Check the project's `package.json` for `@citi-icg-172888/ng-icgds/datatable`. If present, use mt-datatable types. If only `ag-grid-community` is present, use AG Grid types directly. The primitives registry `adapterAliases` field in `tools/registry/primitives.json` contains the complete mapping.

The `mt-datatable` component is the design system's wrapper around AG Grid. Same engine, different type names and template tag. When generating code for repos that use mt-datatable:

| AG Grid (this spec) | mt-datatable equivalent |
|---|---|
| `ColDef` | `MtColumnDefs` |
| `GridOptions` | `MtGridOptions` |
| `GridApi` | `MtGridOptions` (accessed via grid instance) |
| `<ag-grid-angular>` | `<mt-datatable>` |
| `import { ... } from 'ag-grid-community'` | `import { ... } from '@citi-icg-172888/ng-icgds/datatable'` |
| `import { AgGridAngular } from 'ag-grid-angular'` | `import { MtDatatableModule } from '@citi-icg-172888/ng-icgds/datatable'` |

### What stays the same

- All column type conventions from §6 (BASE_COL, DS_CHECKBOX_COL, formatters, renderers)
- All cell renderer components and their `cellRendererParams` interfaces
- Grid options defaults from §5 (rowHeight, headerHeight, etc.)
- Loading, empty, and error state patterns from §8–§9
- All semantic token references from §3

### What changes

- Type imports: `ColDef` → `MtColumnDefs`, `GridOptions` → `MtGridOptions`
- Template tag: `<ag-grid-angular>` → `<mt-datatable>`
- Module import: `AgGridAngular` → `MtDatatableModule`
- Some grid API access patterns may differ — consult the mt-datatable wrapper docs

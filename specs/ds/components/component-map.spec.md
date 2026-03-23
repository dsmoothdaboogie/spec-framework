# Component Spec: Semantic Component Map
**spec-id:** `ds/components/component-map`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**adapter:** `material-v3`
**applies-to:** Angular 19+, Angular Material 17+

---

## 1. Intent

This spec maps semantic DS component names to their current Material implementations. Pattern specs reference DS component names (e.g. `DsBadgeComponent`, `DsEmptyStateComponent`) — this file defines what those resolve to today.

Like the token spec, this is a swap point. When your internal DS ships, update the mappings here. Pattern specs don't change.

> **Agent instruction:** Import components using the semantic DS paths defined in §3. Never import Angular Material components directly into feature components. If a semantic component you need is not listed here, raise it with UI Architecture.

---

## 2. Component categories

- **§3** — Display components (badges, chips, avatars)
- **§4** — Feedback components (loading, empty state, error state, snackbar)
- **§5** — Navigation components (tabs, breadcrumbs, pagination)
- **§6** — Form components (inputs, selects, datepickers)
- **§7** — Layout components (card, divider, toolbar)
- **§8** — Grid-specific components (cell renderers, overlays, row actions)

---

## 3. Display components

| DS component name | Import path | Material implementation | Notes |
|---|---|---|---|
| `DsBadgeComponent` | `@company/ds/display` | `MatChip` (non-interactive) with status color | Use `[variant]` input for status colors |
| `DsIconComponent` | `@company/ds/display` | `MatIcon` | Wraps mat-icon with size/color normalization |
| `DsAvatarComponent` | `@company/ds/display` | Custom over `MatIcon` | Initials fallback when no image |
| `DsTagComponent` | `@company/ds/display` | `MatChip` (removable) | For filter tags, labels |

### DsBadgeComponent usage

```typescript
// Import
import { DsBadgeComponent } from '@company/ds/display';

// Template
<ds-badge variant="success">Active</ds-badge>
<ds-badge variant="warning">Pending</ds-badge>
<ds-badge variant="error">Inactive</ds-badge>
<ds-badge variant="info">Draft</ds-badge>
<ds-badge variant="neutral">Archived</ds-badge>
```

### Material implementation (adapter)

```typescript
// adapters/material-v3/display/badge.component.ts
@Component({
  selector: 'ds-badge',
  standalone: true,
  imports: [MatChipsModule],
  template: `
    <mat-chip
      [class]="'ds-badge ds-badge--' + variant()"
      [disableRipple]="true"
      [selectable]="false">
      <ng-content />
    </mat-chip>
  `,
})
export class DsBadgeComponent {
  variant = input<'success' | 'warning' | 'error' | 'info' | 'neutral'>('neutral');
}
```

---

## 4. Feedback components

| DS component name | Import path | Material implementation | Notes |
|---|---|---|---|
| `DsLoadingSpinnerComponent` | `@company/ds/feedback` | `MatProgressSpinner` | Normalized size/color |
| `DsLoadingOverlayComponent` | `@company/ds/feedback` | Custom over `MatProgressSpinner` | Used as AG Grid loading overlay |
| `DsEmptyStateComponent` | `@company/ds/feedback` | Custom layout + `MatIcon` | Required for all empty grid/list states |
| `DsErrorStateComponent` | `@company/ds/feedback` | Custom layout + `MatIcon` | Required for all error states |
| `DsSnackbarService` | `@company/ds/feedback` | `MatSnackBar` wrapper | Normalized success/error/info variants |

### DsEmptyStateComponent usage

```typescript
import { DsEmptyStateComponent } from '@company/ds/feedback';

// As AG Grid noRowsOverlayComponent:
noRowsOverlayComponent = DsEmptyStateComponent;
noRowsOverlayComponentParams = {
  icon: 'table_rows',         // Material icon name
  title: 'No results found',
  description: 'Try adjusting your filters or search terms.',
  action: null,               // optional: { label: 'Clear filters', callback: fn }
};
```

### Material implementation (adapter)

```typescript
// adapters/material-v3/feedback/empty-state.component.ts
@Component({
  selector: 'ds-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="ds-empty-state">
      <mat-icon class="ds-empty-state__icon">{{ icon() }}</mat-icon>
      <p class="ds-empty-state__title">{{ title() }}</p>
      <p class="ds-empty-state__description">{{ description() }}</p>
      @if (action()) {
        <button mat-stroked-button (click)="action()!.callback()">
          {{ action()!.label }}
        </button>
      }
    </div>
  `,
})
export class DsEmptyStateComponent {
  icon        = input<string>('inbox');
  title       = input<string>('Nothing here');
  description = input<string>('');
  action      = input<{ label: string; callback: () => void } | null>(null);
}
```

---

## 5. Navigation components

| DS component name | Import path | Material implementation | Notes |
|---|---|---|---|
| `DsTabsComponent` | `@company/ds/navigation` | `MatTabGroup` | Normalized to label-only tabs by default |
| `DsBreadcrumbsComponent` | `@company/ds/navigation` | Custom + `MatIcon` for separator | |
| `DsPaginatorComponent` | `@company/ds/navigation` | `MatPaginator` | Normalized page size options |
| `DsTablePaginationComponent` | `@company/ds/navigation` | `MatPaginator` | Specifically wired for table output contract |

### DsTablePaginationComponent usage

```typescript
import { DsTablePaginationComponent } from '@company/ds/navigation';

// Template
<ds-table-pagination
  [pageSize]="pageSize()"
  [pageSizeOptions]="[10, 25, 50, 100]"
  [totalRows]="totalRows()"
  (pageChange)="onPageChange($event)"
/>
```

---

## 6. Form components

| DS component name | Import path | Material implementation | Notes |
|---|---|---|---|
| `DsInputComponent` | `@company/ds/forms` | `MatInput` + `MatFormField` | Normalized label/hint/error layout |
| `DsSelectComponent` | `@company/ds/forms` | `MatSelect` | |
| `DsDatepickerComponent` | `@company/ds/forms` | `MatDatepicker` | |
| `DsCheckboxComponent` | `@company/ds/forms` | `MatCheckbox` | |
| `DsRadioGroupComponent` | `@company/ds/forms` | `MatRadioGroup` | |
| `DsTextareaComponent` | `@company/ds/forms` | `MatInput` textarea | |
| `DsSearchInputComponent` | `@company/ds/forms` | `MatInput` + search icon | Includes clear button |

---

## 7. Layout components

| DS component name | Import path | Material implementation | Notes |
|---|---|---|---|
| `DsCardComponent` | `@company/ds/layout` | `MatCard` | Normalized padding/elevation |
| `DsDividerComponent` | `@company/ds/layout` | `MatDivider` | |
| `DsToolbarComponent` | `@company/ds/layout` | `MatToolbar` | |
| `DsMenuComponent` | `@company/ds/layout` | `MatMenu` | |
| `DsDialogService` | `@company/ds/layout` | `MatDialog` wrapper | Normalized sizes: sm/md/lg/xl |
| `DsDrawerComponent` | `@company/ds/layout` | `MatSidenav` | |
| `DsTooltipDirective` | `@company/ds/layout` | `MatTooltip` | |

---

## 8. Grid-specific components

These are purpose-built for AG Grid integration. They have no direct Material parent but use Material components internally.

| DS component name | Import path | AG Grid role | Material internals |
|---|---|---|---|
| `DsBadgeCellRendererComponent` | `@company/ds/ag-grid` | `cellRenderer` for status columns | `DsBadgeComponent` |
| `DsRowActionsCellRendererComponent` | `@company/ds/ag-grid` | `cellRenderer` for actions column | `MatIconButton` + `MatMenu` |
| `DsCheckboxCellRendererComponent` | `@company/ds/ag-grid` | `cellRenderer` for selection column | `MatCheckbox` |
| `DsLoadingOverlayComponent` | `@company/ds/ag-grid` | `loadingOverlayComponent` | `MatProgressSpinner` |
| `DsEmptyStateOverlayComponent` | `@company/ds/ag-grid` | `noRowsOverlayComponent` | `DsEmptyStateComponent` |
| `DsBulkActionBarComponent` | `@company/ds/ag-grid` | Toolbar shown on row selection | `MatToolbar` + `MatButton` |

### DS_CHECKBOX_COL constant

```typescript
// @company/ds/ag-grid
import { ColDef } from 'ag-grid-community';
import { DsCheckboxCellRendererComponent } from './renderers';

export const DS_CHECKBOX_COL: ColDef = {
  colId: 'selection',
  headerName: '',
  width: 52,
  pinned: 'left',
  sortable: false,
  resizable: false,
  checkboxSelection: false,        // handled by renderer, not AG Grid native
  headerCheckboxSelection: false,
  cellRenderer: DsCheckboxCellRendererComponent,
};
```

### DsRowActionsCellRendererComponent usage

```typescript
// In column def
{
  colId: 'actions',
  headerName: '',
  pinned: 'right',
  width: 56,
  sortable: false,
  resizable: false,
  cellRenderer: DsRowActionsCellRendererComponent,
  cellRendererParams: (params) => ({
    actions: resolveRowActions(params.data),
  }),
}

// DsRowAction type
interface DsRowAction {
  id: string;
  label: string;
  icon: string;              // Material icon name
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}
```

---

## 9. DS swap checklist

When your internal DS ships:

- [ ] For each row in §3–§8: replace `Material implementation` with DS component
- [ ] Update import paths from `@company/ds/[module]` to actual DS package paths (or keep if DS uses same paths)
- [ ] Remove adapter implementation files — DS components are used directly
- [ ] Bump version (major)
- [ ] Verify all AG Grid-specific components still satisfy the cell renderer interface
- [ ] Run a smoke test: generate one component against `ds/patterns/ag-grid-datatable` and verify output

---

## 10. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial — Material v3 adapter | UI Architecture |

---

## 11. Related Specs

- `ds/tokens/semantic` — token layer swap point
- `ds/patterns/ag-grid-datatable` — primary consumer of grid-specific components

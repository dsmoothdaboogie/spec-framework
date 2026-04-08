// @spec domain/patterns/ag-grid-datatable/deal-origination-banker v1.0.0
// @persona domain/personas/deal-origination-banker v1.0.0
// @entitlement domain/entitlements/mnpi-standard v1.0.0
//
// Agent-generated from composition spec. Columns 8–9 (MNPI Flag, Wall Cross Date)
// are included here but would be SUPPRESSED at mnpi-standard entitlement and only
// rendered at mnpi-full entitlement. In a production build, an entitlement guard
// would filter these column defs before they reach the grid.

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ColDef, GridOptions, ValueFormatterParams, themeQuartz } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { DealStore } from '../../../state/deal.store';
import { Deal, DealStage } from '../../../shared/types/deal.types';
import { DealSizeRendererComponent } from '../../../shared/cell-renderers/deal-size-renderer/deal-size-renderer.component';
import { DealStageRendererComponent } from '../../../shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component';

// ─── Formatters ────────────────────────────────────────────────────────────

const datePipe = new DatePipe('en-US');

const dateFormatter = (p: ValueFormatterParams): string =>
  p.value ? datePipe.transform(p.value, 'dd MMM yyyy') ?? '—' : '—';

// ─── Stage variant map ──────────────────────────────────────────────────────

const STAGE_VARIANT: Record<DealStage, string> = {
  Origination: 'info',
  Mandate: 'info',
  'Due Diligence': 'warning',
  Marketing: 'warning',
  Pricing: 'success',
  Closed: 'neutral',
  Withdrawn: 'error',
};

// ─── MNPI variant map ───────────────────────────────────────────────────────

function mnpiVariant(flagged: boolean): string {
  return flagged ? 'error' : 'neutral';
}

// ─── Row actions ────────────────────────────────────────────────────────────
// Composition spec §4 — no delete action for this persona.

function canAdvanceStage(row: Deal): boolean {
  return row.stage !== 'Closed' && row.stage !== 'Withdrawn';
}

function canEdit(row: Deal): boolean {
  // In production this would check row ownership / entitlement.
  // For demo: coverage banker owns deals they are assigned to.
  return true;
}

interface DsRowAction {
  id: string;
  label: string;
  icon: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

function resolveRowActions(row: Deal): DsRowAction[] {
  const actions: DsRowAction[] = [
    { id: 'view',          label: 'View',          icon: 'visibility' },
    { id: 'advance-stage', label: 'Advance stage', icon: 'arrow_forward', disabled: !canAdvanceStage(row) },
    { id: 'add-note',      label: 'Add note',       icon: 'note_add' },
  ];

  if (canEdit(row)) {
    actions.push({ id: 'edit', label: 'Edit', icon: 'edit' });
  }

  // No delete action per §4 composition spec.
  return actions;
}

// ─── BASE_COL per ds/patterns/ag-grid-datatable §6.1 ───────────────────────

const BASE_COL: ColDef = {
  sortable: true,
  resizable: true,
  minWidth: 100,
  suppressHeaderMenuButton: true,
  unSortIcon: true,
};

// ─── Column definitions per composition spec §2 ─────────────────────────────
// Column order is authoritative — do not reorder.
// Columns 8–9 marked with @mnpi-sensitive: would be suppressed at mnpi-standard.

function buildColumnDefs(): ColDef<Deal>[] {
  return [
    // Col 1 — Checkbox (DS_CHECKBOX_COL equivalent; in this demo wired via checkboxSelection)
    {
      colId: 'selection',
      headerName: '',
      width: 52,
      pinned: 'left',
      sortable: false,
      resizable: false,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      suppressHeaderMenuButton: true,
    },

    // Col 2 — Deal Name
    {
      ...BASE_COL,
      field: 'dealName',
      headerName: 'Deal Name',
      flex: 2,
      minWidth: 180,
      cellStyle: { fontWeight: '600' },
    },

    // Col 3 — Stage (badge renderer)
    {
      ...BASE_COL,
      field: 'stage',
      headerName: 'Stage',
      width: 140,
      cellRenderer: DealStageRendererComponent,
      cellRendererParams: (p: { value: DealStage }) => ({
        variant: STAGE_VARIANT[p.value] ?? 'neutral',
      }),
    },

    // Col 4 — Counterparty (maps to issuerName per Deal interface)
    {
      ...BASE_COL,
      field: 'issuerName',
      headerName: 'Counterparty',
      flex: 1,
      minWidth: 130,
    },

    // Col 5 — Deal Size (currency via DealSizeRendererComponent)
    {
      ...BASE_COL,
      field: 'dealSizeUsd',
      headerName: 'Deal Size',
      width: 120,
      cellRenderer: DealSizeRendererComponent,
    },

    // Col 6 — Owner (maps to coverageBankerName per Deal interface)
    {
      ...BASE_COL,
      field: 'coverageBankerName',
      headerName: 'Owner',
      flex: 1,
      minWidth: 130,
    },

    // Col 7 — Last Updated (maps to lastModified per Deal interface)
    {
      ...BASE_COL,
      field: 'lastModified',
      headerName: 'Last Updated',
      width: 140,
      valueFormatter: dateFormatter,
    },

    // Col 8 — MNPI Flag (@mnpi-sensitive: true — suppressed at mnpi-standard entitlement)
    {
      ...BASE_COL,
      field: 'mnpiFlag',
      headerName: 'MNPI Flag',
      width: 120,
      cellRenderer: DealStageRendererComponent,
      cellRendererParams: (p: { value: boolean }) => ({
        variant: mnpiVariant(p.value),
        // Label is rendered as 'Yes' / 'No' to satisfy a11y (color alone cannot convey state)
      }),
      valueFormatter: (p: ValueFormatterParams) => (p.value ? 'Yes' : 'No'),
    },

    // Col 9 — Wall Cross Date (@mnpi-sensitive: true — suppressed at mnpi-standard entitlement)
    // No wallCrossDate field in mock Deal interface — rendered as N/A.
    {
      ...BASE_COL,
      colId: 'wallCrossDate',
      headerName: 'Wall Cross Date',
      width: 150,
      valueGetter: () => null,
      valueFormatter: () => 'N/A',
    },

    // Col 10 — Actions (pinned right, width 56 per §6.2)
    {
      colId: 'actions',
      headerName: '',
      pinned: 'right',
      width: 56,
      sortable: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      // In production: cellRenderer: DsRowActionsCellRendererComponent
      // cellRendererParams: (p) => ({ actions: resolveRowActions(p.data) })
      // For demo, actions column is intentionally left without a renderer
      // because DsRowActionsCellRendererComponent is not yet wired in this repo.
      // Row action handler is available via onRowAction().
    },
  ];
}

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-deal-origination-banker-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './deal-grid.component.html',
  styleUrl: './deal-grid.component.scss',
})
export class DealOriginationBankerGridComponent implements OnInit {

  // 1. Injected services
  private readonly store = inject(DealStore);

  // 2. Grid config
  readonly theme      = themeQuartz;
  readonly columnDefs = buildColumnDefs();

  // 3. Store-derived data
  readonly rowData   = this.store.items;
  readonly isLoading = this.store.isLoading;
  readonly hasError  = this.store.hasError;

  // 4. Internal signals
  readonly selectedRows  = signal<Deal[]>([]);
  readonly selectedCount = computed(() => this.selectedRows().length);

  // 5. Grid options — per ds/patterns/ag-grid-datatable §5 (verbatim, extended with
  //    default sort per composition spec §6: lastUpdated desc)
  readonly gridOptions: GridOptions<Deal> = {
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
    // Default sort per composition spec §6 — lastUpdated desc
    // Field mapping: lastUpdated → lastModified in Deal interface
    initialState: {
      sort: {
        sortModel: [{ colId: 'lastModified', sort: 'desc' }],
      },
    },
    defaultColDef: {
      sortable: true,
      resizable: true,
      suppressHeaderMenuButton: true,
      unSortIcon: true,
    },
  };

  // ─── Bulk actions per composition spec §5 ────────────────────────────────

  readonly bulkActions = [
    { id: 'bulk-advance', label: 'Advance stage', icon: 'arrow_forward' },
    { id: 'bulk-assign',  label: 'Reassign',      icon: 'person'        },
    { id: 'export',       label: 'Export',         icon: 'download'      },
  ];

  // ─── Empty state per composition spec §8 ─────────────────────────────────

  readonly emptyOverlayParams = {
    icon:        'business_center',
    title:       'No deals in your pipeline',
    description: 'Deals you own or are assigned to will appear here.',
    action:      { label: 'Create deal', callback: () => this.onCreate() },
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.store.loadDeals();
  }

  // ─── Public methods ───────────────────────────────────────────────────────

  onSelectionChanged(event: any): void {
    this.selectedRows.set(event.api.getSelectedRows());
  }

  clearSelection(): void {
    this.selectedRows.set([]);
  }

  onRowAction(action: string, row: Deal): void {
    // In production: dispatch to router / dialog / store based on action id.
    console.log('[DealOriginationBankerGrid] row action', action, row.dealId);
  }

  onBulkAction(actionId: string): void {
    console.log('[DealOriginationBankerGrid] bulk action', actionId, 'on', this.selectedCount(), 'rows');
  }

  private onCreate(): void {
    console.log('[DealOriginationBankerGrid] create deal');
  }
}

// @spec-reads: domain/patterns/ag-grid-datatable/conflict-clearance v1.0.0
// STRICT READ-ONLY. No checkbox col, no actions col, no bulk bar — absent entirely.
import {
  Component, ChangeDetectionStrategy, inject, OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ColDef, GridOptions, ValueFormatterParams, themeQuartz } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { DealStore } from '../../../state/deal.store';
import { Deal, ConflictStatus } from '../../../shared/types/deal.types';
import { DealStageRendererComponent } from '../../../shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component';
import { ConflictStatusRendererComponent } from '../../../shared/cell-renderers/conflict-status-renderer/conflict-status-renderer.component';

const datePipe = new DatePipe('en-US');
const dateFormatter = (p: ValueFormatterParams) =>
  p.value ? datePipe.transform(p.value, 'dd MMM yyyy') ?? '' : '—';

// Per spec §6: Pending first, Flagged, Waived, Cleared
const STATUS_ORDER: Record<ConflictStatus, number> = {
  Pending: 0, Flagged: 1, Waived: 2, Cleared: 3,
};

function buildColumnDefs(): ColDef<Deal>[] {
  // Per spec §10 checklist: NO DS_CHECKBOX_COL, NO actions column
  return [
    {
      field: 'dealName', headerName: 'Deal Name', pinned: 'left',
      flex: 2, minWidth: 180, cellStyle: { fontWeight: '600' },
    },
    { field: 'issuerName', headerName: 'Issuer', flex: 1, minWidth: 130 },
    {
      field: 'dealType', headerName: 'Type', width: 140,
      cellRenderer: DealStageRendererComponent,
      cellRendererParams: () => ({ variant: 'neutral' }),
    },
    {
      field: 'conflictStatus', headerName: 'Conflict Status', width: 150,
      cellRenderer: ConflictStatusRendererComponent,
      comparator: (a: ConflictStatus, b: ConflictStatus) =>
        (STATUS_ORDER[a] ?? 99) - (STATUS_ORDER[b] ?? 99),
    },
    {
      field: 'mnpiFlag', headerName: 'MNPI Flag', width: 110,
      cellRenderer: DealStageRendererComponent,
      cellRendererParams: (p: { value: boolean }) => ({
        value: p.value ? 'Yes' : 'No',
        variant: p.value ? 'error' : 'neutral',
      }),
      valueGetter: (p) => p.data?.mnpiFlag,
    },
    {
      field: 'infoBarrier', headerName: 'Info Barrier', width: 130,
      valueFormatter: (p) => p.value ?? 'None',
    },
    {
      field: 'mandateDate', headerName: 'Submitted Date', width: 140,
      valueFormatter: dateFormatter,
    },
    {
      field: 'conflictReviewDate', headerName: 'Review Date', width: 130,
      valueFormatter: dateFormatter,
    },
    {
      field: 'conflictReviewedBy', headerName: 'Reviewed By', width: 140,
      valueFormatter: (p) => p.value ?? '—',
    },
    {
      field: 'conflictNotes', headerName: 'Notes', flex: 2, minWidth: 200,
      valueFormatter: (p) => {
        if (!p.value) return '—';
        return p.value.length > 60 ? p.value.slice(0, 60) + '…' : p.value;
      },
      tooltipField: 'conflictNotes',
    },
  ];
}

@Component({
  selector: 'app-conflict-clearance-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './deal-grid.component.html',
  styleUrl: './deal-grid.component.scss',
})
export class ConflictClearanceGridComponent implements OnInit {
  private readonly store = inject(DealStore);

  readonly theme      = themeQuartz;
  readonly rowData    = this.store.items;
  readonly isLoading  = this.store.isLoading;
  readonly hasError   = this.store.hasError;
  readonly columnDefs = buildColumnDefs();

  // Per spec §7: row selection disabled — no selection property at all
  readonly gridOptions: GridOptions = {
    rowHeight: 48,
    headerHeight: 48,
    defaultColDef: { sortable: true, resizable: true, suppressHeaderMenuButton: true, unSortIcon: true },
    suppressRowClickSelection: true,
    animateRows: true,
    suppressContextMenu: true,
    tooltipShowDelay: 300,
  };

  ngOnInit(): void {
    this.store.loadDeals();
  }
}

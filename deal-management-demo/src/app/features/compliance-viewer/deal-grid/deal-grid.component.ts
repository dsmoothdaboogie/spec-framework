/**
 * @spec ds/patterns/ag-grid-datatable v2.0.0
 * @persona domain/personas/compliance-viewer v1.0.0
 * @entitlement domain/entitlements/mnpi-full v1.0.0
 */
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { DealStore } from '../../../state/deal.store';
import { Deal } from '../../../shared/types/deal.types';
import { DealStageRendererComponent } from '../../../shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component';
import { ConflictStatusRendererComponent } from '../../../shared/cell-renderers/conflict-status-renderer/conflict-status-renderer.component';

@Component({
  selector: 'app-compliance-viewer-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './deal-grid.component.html',
  styleUrl: './deal-grid.component.scss',
})
export class ComplianceViewerGridComponent implements OnInit {
  private readonly store = inject(DealStore);

  readonly isLoading = this.store.isLoading;
  readonly hasError = this.store.hasError;
  readonly isEmpty = this.store.isEmpty;
  readonly rowData = this.store.items;

  // Strict read-only: no row selection, no checkbox, no actions (per spec §4, §5, §7)
  readonly gridOptions: GridOptions<Deal> = {
    rowHeight: 48,
    headerHeight: 52,
    animateRows: true,
    rowSelection: undefined,
    suppressRowClickSelection: true,
    defaultColDef: {
      sortable: true,
      resizable: true,
      minWidth: 100,
    },
  };

  readonly columnDefs: ColDef<Deal>[] = [
    { field: 'dealName', headerName: 'Deal Name', minWidth: 180 },
    { field: 'stage', headerName: 'Stage', cellRenderer: DealStageRendererComponent, width: 130 },
    { field: 'issuerName', headerName: 'Counterparty', minWidth: 160 },
    {
      field: 'mnpiFlag', headerName: 'MNPI Flag', width: 110,
      valueFormatter: (params: any) => params.value ? 'Yes' : 'No',
    },
    {
      field: 'infoBarrier', headerName: 'Information Barrier', width: 150,
      valueFormatter: (params: any) => params.value ?? 'None',
    },
    { field: 'conflictStatus', headerName: 'Conflict Status', cellRenderer: ConflictStatusRendererComponent, width: 140 },
    {
      field: 'conflictReviewedBy', headerName: 'Reviewed By', width: 140,
      valueFormatter: (params: any) => params.value ?? '—',
    },
    {
      field: 'conflictReviewDate', headerName: 'Review Date', width: 120,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '—',
    },
    {
      field: 'conflictNotes', headerName: 'Notes', minWidth: 200, flex: 1,
      valueFormatter: (params: any) => params.value ?? '—',
      tooltipField: 'conflictNotes',
    },
    {
      field: 'auditTimestamp', headerName: 'Audit Timestamp', width: 150, pinned: 'right',
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleString() : '—',
      sort: 'desc',
    },
  ];

  ngOnInit(): void {
    this.store.loadDeals();
  }
}

// @spec-reads: domain/patterns/ag-grid-datatable/syndicate-banker v1.0.0
// Book-building focus. CoverageMultipleRendererComponent is the primary signal.
import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ColDef, GridOptions, ValueFormatterParams, themeQuartz } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { DealStore } from '../../../state/deal.store';
import { Deal, DealStage } from '../../../shared/types/deal.types';
import { formatBps } from '../../../shared/calculations/deal-calculations';
import { DealSizeRendererComponent } from '../../../shared/cell-renderers/deal-size-renderer/deal-size-renderer.component';
import { DealStageRendererComponent } from '../../../shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component';
import { CoverageMultipleRendererComponent } from '../../../shared/cell-renderers/coverage-multiple-renderer/coverage-multiple-renderer.component';

const datePipe = new DatePipe('en-US');
const dateFormatter = (p: ValueFormatterParams) =>
  p.value ? datePipe.transform(p.value, 'dd MMM yyyy') ?? '' : '—';

const STAGE_VARIANT: Record<DealStage, string> = {
  Origination: 'info', Mandate: 'info', 'Due Diligence': 'warning',
  Marketing: 'warning', Pricing: 'success', Closed: 'neutral', Withdrawn: 'error',
};

function buildColumnDefs(): ColDef<Deal>[] {
  return [
    {
      field: 'dealName', headerName: 'Deal Name', pinned: 'left',
      flex: 2, minWidth: 180, cellStyle: { fontWeight: '600' }, checkboxSelection: true, headerCheckboxSelection: true,
    },
    { field: 'issuerName', headerName: 'Issuer', flex: 1, minWidth: 130 },
    {
      field: 'dealType', headerName: 'Type', width: 140,
      cellRenderer: DealStageRendererComponent,
      cellRendererParams: () => ({ variant: 'neutral' }),
    },
    {
      field: 'stage', headerName: 'Stage', width: 140,
      cellRenderer: DealStageRendererComponent,
      cellRendererParams: (p: { value: DealStage }) => ({ variant: STAGE_VARIANT[p.value] ?? 'neutral' }),
    },
    {
      field: 'dealSizeUsd', headerName: 'Deal Size', width: 110,
      cellRenderer: DealSizeRendererComponent,
    },
    {
      // Per spec §2 col 7: formatBps only, NOT FeeRevenueRendererComponent
      field: 'grossSpreadBps', headerName: 'Gross Spread', width: 120,
      valueFormatter: (p) => formatBps(p.value),
      cellStyle: { fontWeight: '500' },
    },
    {
      // Per spec §2 col 8: CoverageMultipleRendererComponent — the primary signal
      field: 'bookbuildCoverageMultiple', headerName: 'Book Coverage', width: 140,
      cellRenderer: CoverageMultipleRendererComponent,
    },
    {
      field: 'syndicateAllocationUsd', headerName: 'Allocation', width: 110,
      cellRenderer: DealSizeRendererComponent,
    },
    {
      field: 'pricingDate', headerName: 'Pricing Date', width: 130,
      valueFormatter: dateFormatter,
    },
    { field: 'syndicateDeskName', headerName: 'Syndicate Desk', flex: 1, minWidth: 130 },
  ];
}

@Component({
  selector: 'app-syndicate-banker-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './deal-grid.component.html',
  styleUrl: './deal-grid.component.scss',
})
export class SyndicateBankerGridComponent implements OnInit {
  private readonly store = inject(DealStore);

  readonly theme      = themeQuartz;
  readonly rowData    = this.store.items;
  readonly isLoading  = this.store.isLoading;
  readonly hasError   = this.store.hasError;
  readonly columnDefs = buildColumnDefs();

  readonly selectedRows  = signal<Deal[]>([]);
  readonly selectedCount = computed(() => this.selectedRows().length);

  readonly gridOptions: GridOptions = {
    rowHeight: 48,
    headerHeight: 48,
    defaultColDef: { sortable: true, resizable: true, suppressHeaderMenuButton: true, unSortIcon: true },
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    animateRows: true,
    suppressContextMenu: true,
  };

  ngOnInit(): void {
    this.store.loadDeals();
  }

  onSelectionChanged(event: any): void {
    this.selectedRows.set(event.api.getSelectedRows());
  }

  clearSelection(): void {
    this.selectedRows.set([]);
  }
}

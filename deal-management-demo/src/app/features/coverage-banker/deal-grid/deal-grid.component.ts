// @spec-reads: domain/patterns/ag-grid-datatable/coverage-banker v1.0.0
// Wires pre-built shared renderers per spec §2. No new renderer logic here.
import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, computed, DestroyRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ColDef, GridOptions, ValueFormatterParams, themeQuartz } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { DealStore } from '../../../state/deal.store';
import { Deal, DealStage } from '../../../shared/types/deal.types';
import {
  calcGrossRevenue,
  calcDaysToClose,
  formatBps,
} from '../../../shared/calculations/deal-calculations';
import { DealSizeRendererComponent } from '../../../shared/cell-renderers/deal-size-renderer/deal-size-renderer.component';
import { DealStageRendererComponent } from '../../../shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component';
import { FeeRevenueRendererComponent } from '../../../shared/cell-renderers/fee-revenue-renderer/fee-revenue-renderer.component';
import { DaysCountdownRendererComponent } from '../../../shared/cell-renderers/days-countdown-renderer/days-countdown-renderer.component';

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
      field: 'grossSpreadBps', headerName: 'Gross Spread', width: 140,
      cellRenderer: FeeRevenueRendererComponent,
    },
    {
      colId: 'estimatedRevenue', headerName: 'Est. Revenue', width: 120,
      valueGetter: (p) => calcGrossRevenue(p.data?.dealSizeUsd ?? 0, p.data?.grossSpreadBps ?? 0),
      valueFormatter: (p) => {
        const v = p.value as number;
        return v >= 1 ? `$${v.toFixed(1)}m` : `$${(v * 1000).toFixed(0)}k`;
      },
      cellStyle: { fontWeight: '600', color: 'var(--color-brand-primary)' },
    },
    {
      colId: 'daysToClose', headerName: 'Days to Close', width: 120,
      valueGetter: (p) => calcDaysToClose(p.data?.expectedCloseDate ?? null),
      cellRenderer: DaysCountdownRendererComponent,
      cellRendererParams: () => ({ thresholds: { warnDays: 30, errorDays: 7 } }),
    },
    {
      field: 'mandateDate', headerName: 'Mandate Date', width: 130,
      valueFormatter: dateFormatter,
    },
    { field: 'coverageBankerName', headerName: 'Coverage Banker', flex: 1, minWidth: 140 },
  ];
}

@Component({
  selector: 'app-coverage-banker-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './deal-grid.component.html',
  styleUrl: './deal-grid.component.scss',
})
export class CoverageBankerGridComponent implements OnInit {
  private readonly store = inject(DealStore);

  readonly theme      = themeQuartz;
  readonly rowData    = this.store.items;
  readonly isLoading  = this.store.isLoading;
  readonly hasError   = this.store.hasError;
  readonly columnDefs = buildColumnDefs();

  readonly selectedRows = signal<Deal[]>([]);
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

// @spec-reads: domain/patterns/ag-grid-datatable/business-execution-lead v1.0.0
// Timeline focus. daysInStage uses INVERTED thresholds (warn=14, error=30).
// daysToClose uses standard thresholds (warn=30, error=7).
import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ColDef, GridOptions, ValueFormatterParams, themeQuartz } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { DealStore } from '../../../state/deal.store';
import { Deal, DealStage } from '../../../shared/types/deal.types';
import {
  calcDaysInStage,
  calcDaysToClose,
} from '../../../shared/calculations/deal-calculations';
import { DealSizeRendererComponent } from '../../../shared/cell-renderers/deal-size-renderer/deal-size-renderer.component';
import { DealStageRendererComponent } from '../../../shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component';
import { DaysCountdownRendererComponent } from '../../../shared/cell-renderers/days-countdown-renderer/days-countdown-renderer.component';
import { MilestoneProgressRendererComponent } from '../../../shared/cell-renderers/milestone-progress-renderer/milestone-progress-renderer.component';

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
      field: 'mandateDate', headerName: 'Mandate Date', width: 130,
      valueFormatter: dateFormatter,
    },
    {
      // Per spec §3: INVERTED thresholds — more days = more risk (warn=14, error=30)
      colId: 'daysInStage', headerName: 'Days in Stage', width: 130,
      valueGetter: (p) => calcDaysInStage(p.data?.stageChangedDate ?? new Date()),
      cellRenderer: DaysCountdownRendererComponent,
      cellRendererParams: () => ({ thresholds: { warnDays: 14, errorDays: 30 } }),
    },
    {
      field: 'expectedCloseDate', headerName: 'Exp. Close', width: 130,
      valueFormatter: dateFormatter,
    },
    {
      // Standard thresholds (warn=30, error=7)
      colId: 'daysToClose', headerName: 'Days to Close', width: 130,
      valueGetter: (p) => calcDaysToClose(p.data?.expectedCloseDate ?? null),
      cellRenderer: DaysCountdownRendererComponent,
      cellRendererParams: () => ({ thresholds: { warnDays: 30, errorDays: 7 } }),
    },
    {
      colId: 'milestones', headerName: 'Milestones', width: 160,
      valueGetter: (p) => p.data?.completedMilestones ?? 0,
      cellRenderer: MilestoneProgressRendererComponent,
    },
  ];
}

@Component({
  selector: 'app-bel-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './deal-grid.component.html',
  styleUrl: './deal-grid.component.scss',
})
export class BusinessExecutionLeadGridComponent implements OnInit {
  private readonly store = inject(DealStore);

  readonly theme      = themeQuartz;
  readonly rowData    = this.store.items;
  readonly isLoading  = this.store.isLoading;
  readonly hasError   = this.store.hasError;
  readonly columnDefs = buildColumnDefs();

  readonly selectedRows  = signal<Deal[]>([]);
  readonly selectedCount = computed(() => this.selectedRows().length);

  readonly gridOptions: GridOptions = {
    rowHeight: 52,
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

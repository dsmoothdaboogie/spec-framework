import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';
import { MiniGridComponent } from '../../../shared/widgets/mini-grid/mini-grid.component';
import type { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-bel-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricCardComponent, StatusDistributionComponent, AlertListComponent, MiniGridComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class BusinessExecutionLeadDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  readonly approachingCloseColumns: ColDef[] = [
    { field: 'dealName', headerName: 'Deal', flex: 1 },
    { field: 'completedMilestones', headerName: 'Done', width: 60 },
    { field: 'totalMilestones', headerName: 'Total', width: 60 },
    { field: 'expectedCloseDate', headerName: 'Close Date', width: 110, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : '—' },
  ];

  ngOnInit(): void { this.store.loadDeals(); }
}

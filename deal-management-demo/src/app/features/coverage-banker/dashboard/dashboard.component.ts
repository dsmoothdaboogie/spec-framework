import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';
import { MiniGridComponent } from '../../../shared/widgets/mini-grid/mini-grid.component';
import type { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-coverage-banker-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricCardComponent, StatusDistributionComponent, ActivityFeedComponent, AlertListComponent, MiniGridComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class CoverageBankerDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  readonly topDealsColumns: ColDef[] = [
    { field: 'dealName', headerName: 'Deal', flex: 1 },
    { field: 'stage', headerName: 'Stage', width: 110 },
    { field: 'dealSizeUsd', headerName: 'Size ($m)', width: 100, valueFormatter: (p: any) => `$${p.value}m` },
    { field: 'grossSpreadBps', headerName: 'Spread', width: 80, valueFormatter: (p: any) => `${p.value}bps` },
  ];

  ngOnInit(): void { this.store.loadDeals(); }
}

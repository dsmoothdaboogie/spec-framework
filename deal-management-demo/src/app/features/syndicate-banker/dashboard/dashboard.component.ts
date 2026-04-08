import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { MiniGridComponent } from '../../../shared/widgets/mini-grid/mini-grid.component';
import type { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-syndicate-banker-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricCardComponent, StatusDistributionComponent, ActivityFeedComponent, MiniGridComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class SyndicateBankerDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  readonly approachingCloseColumns: ColDef[] = [
    { field: 'dealName', headerName: 'Deal', flex: 1 },
    { field: 'stage', headerName: 'Stage', width: 100 },
    { field: 'bookbuildCoverageMultiple', headerName: 'Book Cov.', width: 90, valueFormatter: (p: any) => p.value > 0 ? `${p.value.toFixed(1)}x` : '—' },
    { field: 'expectedCloseDate', headerName: 'Close Date', width: 110, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : '—' },
  ];

  ngOnInit(): void { this.store.loadDeals(); }
}

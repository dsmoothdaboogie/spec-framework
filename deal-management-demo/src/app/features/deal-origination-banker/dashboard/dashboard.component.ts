// @spec domain/patterns/dashboard/deal-origination-banker v1.0.0
// @base ds/patterns/dashboard v1.0.0
// @persona domain/personas/deal-origination-banker v1.0.0
// @entitlement domain/entitlements/deal-full v1.0.0
//
// Origination-focused dashboard — highlights early-stage pipeline (Origination, Mandate).
// All 8 widgets per composition spec §2 are rendered.

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from '@angular/core';
import type { ColDef } from 'ag-grid-community';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';
import { MiniGridComponent } from '../../../shared/widgets/mini-grid/mini-grid.component';

@Component({
  selector: 'app-deal-origination-banker-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MetricCardComponent,
    StatusDistributionComponent,
    ActivityFeedComponent,
    AlertListComponent,
    MiniGridComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DealOriginationBankerDashboardComponent implements OnInit {

  // 1. Injected services — no constructor DI per fw/angular/component-patterns §5
  protected readonly store = inject(DealStore);

  // 2. MiniGrid column definitions per composition spec §3 — Top Deals by Size
  // Field mapping: dealType (not grossSpreadBps) per spec §3 col 4
  readonly topDealsColumns: ColDef[] = [
    { field: 'dealName',    headerName: 'Deal',      flex: 1                                            },
    { field: 'stage',       headerName: 'Stage',     width: 110                                         },
    { field: 'dealSizeUsd', headerName: 'Size ($m)', width: 100,
      valueFormatter: (p: any) => `$${p.value}m`                                                       },
    { field: 'dealType',    headerName: 'Type',      width: 100                                         },
  ];

  ngOnInit(): void {
    this.store.loadDeals();
  }
}

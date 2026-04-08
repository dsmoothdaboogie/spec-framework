import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';

@Component({
  selector: 'app-compliance-viewer-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricCardComponent, StatusDistributionComponent, ActivityFeedComponent, AlertListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class ComplianceViewerDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);
  ngOnInit(): void { this.store.loadDeals(); }
}

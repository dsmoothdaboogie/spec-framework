import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CoverageBankerGridComponent } from './features/coverage-banker/deal-grid/deal-grid.component';
import { SyndicateBankerGridComponent } from './features/syndicate-banker/deal-grid/deal-grid.component';
import { BusinessExecutionLeadGridComponent } from './features/business-execution-lead/deal-grid/deal-grid.component';
import { ConflictClearanceGridComponent } from './features/conflict-clearance/deal-grid/deal-grid.component';
import { ComplianceViewerGridComponent } from './features/compliance-viewer/deal-grid/deal-grid.component';
import { CoverageBankerDashboardComponent } from './features/coverage-banker/dashboard/dashboard.component';
import { SyndicateBankerDashboardComponent } from './features/syndicate-banker/dashboard/dashboard.component';
import { BusinessExecutionLeadDashboardComponent } from './features/business-execution-lead/dashboard/dashboard.component';
import { ConflictClearanceDashboardComponent } from './features/conflict-clearance/dashboard/dashboard.component';
import { ComplianceViewerDashboardComponent } from './features/compliance-viewer/dashboard/dashboard.component';
import { DealOriginationBankerGridComponent } from './features/deal-origination-banker/deal-grid/deal-grid.component';
import { DealOriginationBankerDashboardComponent } from './features/deal-origination-banker/dashboard/dashboard.component';

type PersonaTab = 'coverage' | 'syndicate' | 'bel' | 'conflict' | 'compliance' | 'origination';
type ActiveView = 'dashboard' | 'grid';

interface Tab {
  id: PersonaTab;
  label: string;
  subtitle: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CoverageBankerGridComponent,
    SyndicateBankerGridComponent,
    BusinessExecutionLeadGridComponent,
    ConflictClearanceGridComponent,
    ComplianceViewerGridComponent,
    CoverageBankerDashboardComponent,
    SyndicateBankerDashboardComponent,
    BusinessExecutionLeadDashboardComponent,
    ConflictClearanceDashboardComponent,
    ComplianceViewerDashboardComponent,
    DealOriginationBankerGridComponent,
    DealOriginationBankerDashboardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly activeTab = signal<PersonaTab>('coverage');
  readonly activeView = signal<ActiveView>('dashboard');

  readonly tabs: Tab[] = [
    { id: 'coverage',    label: 'Coverage Banker',         subtitle: 'deal-full entitlement' },
    { id: 'syndicate',   label: 'Syndicate Banker',        subtitle: 'deal-full entitlement' },
    { id: 'bel',         label: 'Business Execution Lead', subtitle: 'deal-full entitlement' },
    { id: 'conflict',    label: 'Conflict Clearance',      subtitle: 'deal-restricted entitlement' },
    { id: 'compliance',  label: 'Compliance Viewer',       subtitle: 'mnpi-full entitlement' },
    { id: 'origination', label: 'Deal Origination Banker', subtitle: 'mnpi-standard entitlement' },
  ];

  setTab(id: PersonaTab): void {
    this.activeTab.set(id);
    this.activeView.set('dashboard');
  }

  setView(view: ActiveView): void {
    this.activeView.set(view);
  }
}

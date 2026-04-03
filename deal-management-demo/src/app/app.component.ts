import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CoverageBankerGridComponent } from './features/coverage-banker/deal-grid/deal-grid.component';
import { SyndicateBankerGridComponent } from './features/syndicate-banker/deal-grid/deal-grid.component';
import { BusinessExecutionLeadGridComponent } from './features/business-execution-lead/deal-grid/deal-grid.component';
import { ConflictClearanceGridComponent } from './features/conflict-clearance/deal-grid/deal-grid.component';

type PersonaTab = 'coverage' | 'syndicate' | 'bel' | 'conflict';

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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly activeTab = signal<PersonaTab>('coverage');

  readonly tabs: Tab[] = [
    { id: 'coverage',  label: 'Coverage Banker',       subtitle: 'deal-full entitlement' },
    { id: 'syndicate', label: 'Syndicate Banker',       subtitle: 'deal-full entitlement' },
    { id: 'bel',       label: 'Business Execution Lead', subtitle: 'deal-full entitlement' },
    { id: 'conflict',  label: 'Conflict Clearance',     subtitle: 'deal-restricted entitlement' },
  ];

  setTab(id: PersonaTab): void {
    this.activeTab.set(id);
  }
}

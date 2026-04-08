// @spec-reads: domain/patterns/ag-grid-datatable/business-execution-lead §4 col 11
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { calcMilestonesPercent } from '../../calculations/deal-calculations';
import { ValueDisplayRendererComponent, DisplayVariant } from '../../primitives/value-display/value-display-renderer.component';

@Component({
  selector: 'app-milestone-progress-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValueDisplayRendererComponent],
  template: `<app-value-display [primaryText]="label()" [secondaryText]="percentLabel()" [variant]="colorState()" />`,
})
export class MilestoneProgressRendererComponent implements ICellRendererAngularComp {
  private readonly _completed = signal<number>(0);
  private readonly _total = signal<number>(0);
  readonly percent = computed(() => calcMilestonesPercent(this._completed(), this._total()));
  readonly label = computed(() => this._total() === 0 ? '—' : `${this._completed()}/${this._total()}`);
  readonly percentLabel = computed(() => this._total() === 0 ? '' : `${this.percent()}%`);
  readonly colorState = computed<DisplayVariant>(() => {
    const p = this.percent();
    if (this._total() === 0) return 'neutral';
    if (p >= 80) return 'success';
    if (p >= 50) return 'warning';
    return 'error';
  });

  agInit(params: ICellRendererParams): void {
    this._completed.set(params.data?.completedMilestones ?? 0);
    this._total.set(params.data?.totalMilestones ?? 0);
  }
  refresh(params: ICellRendererParams): boolean {
    this._completed.set(params.data?.completedMilestones ?? 0);
    this._total.set(params.data?.totalMilestones ?? 0);
    return true;
  }
}

// @spec-reads: domain/patterns/ag-grid-datatable/business-execution-lead §4 col 11
// @spec-reads: ds/patterns/deal-grid-calculations §3.11
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { calcMilestonesPercent } from '../../calculations/deal-calculations';

@Component({
  selector: 'app-milestone-progress-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './milestone-progress-renderer.component.html',
  styleUrl: './milestone-progress-renderer.component.scss',
})
export class MilestoneProgressRendererComponent implements ICellRendererAngularComp {
  private readonly _completed = signal<number>(0);
  private readonly _total     = signal<number>(0);

  readonly hasTotal = computed(() => this._total() > 0);
  readonly percent  = computed(() => calcMilestonesPercent(this._completed(), this._total()));
  readonly label    = computed(() =>
    this._total() === 0
      ? '—'
      : `${this._completed()}/${this._total()} (${this.percent()}%)`,
  );

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

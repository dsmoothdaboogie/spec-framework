// @spec-reads: ds/patterns/deal-grid-calculations — configurable thresholds
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ValueDisplayRendererComponent, DisplayVariant } from '../../primitives/value-display/value-display-renderer.component';

export interface DaysCountdownThresholds { warnDays: number; errorDays: number; }
export interface DaysCountdownRendererParams extends ICellRendererParams { thresholds?: DaysCountdownThresholds; }
const DEFAULT: DaysCountdownThresholds = { warnDays: 30, errorDays: 7 };

@Component({
  selector: 'app-days-countdown-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValueDisplayRendererComponent],
  template: `<app-value-display [primaryText]="label()" [variant]="colorState()" [bold]="true" />`,
})
export class DaysCountdownRendererComponent implements ICellRendererAngularComp {
  private readonly _days = signal<number | null>(null);
  private readonly _thresholds = signal<DaysCountdownThresholds>(DEFAULT);

  readonly label = computed(() => {
    const d = this._days();
    if (d === null) return '—';
    if (d < 0) return `${Math.abs(d)}d overdue`;
    return `${d}d`;
  });

  readonly colorState = computed<DisplayVariant>(() => {
    const d = this._days();
    if (d === null) return 'neutral';
    const t = this._thresholds();
    if (t.errorDays > t.warnDays) {
      if (d >= t.errorDays) return 'error';
      if (d >= t.warnDays) return 'warning';
      return 'success';
    } else {
      if (d <= t.errorDays) return 'error';
      if (d <= t.warnDays) return 'warning';
      return 'success';
    }
  });

  agInit(params: DaysCountdownRendererParams): void {
    this._days.set(params.value ?? null);
    this._thresholds.set({ ...DEFAULT, ...params.thresholds });
  }
  refresh(params: DaysCountdownRendererParams): boolean {
    this._days.set(params.value ?? null);
    this._thresholds.set({ ...DEFAULT, ...params.thresholds });
    return true;
  }
}

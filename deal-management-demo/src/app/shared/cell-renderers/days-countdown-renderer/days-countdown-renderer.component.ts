// @spec-reads: ds/patterns/deal-grid-calculations — configurable thresholds
// @spec-reads: domain/patterns/ag-grid-datatable/coverage-banker §2 col 9 (warn=30, error=7)
// @spec-reads: domain/patterns/ag-grid-datatable/business-execution-lead §3 (warn=14, error=30)
// Single renderer, different threshold params per persona spec.
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface DaysCountdownThresholds {
  warnDays: number;
  errorDays: number;
}

export interface DaysCountdownRendererParams extends ICellRendererParams {
  thresholds?: DaysCountdownThresholds;
}

const DEFAULT: DaysCountdownThresholds = { warnDays: 30, errorDays: 7 };

@Component({
  selector: 'app-days-countdown-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './days-countdown-renderer.component.html',
  styleUrl: './days-countdown-renderer.component.scss',
})
export class DaysCountdownRendererComponent implements ICellRendererAngularComp {
  private readonly _days       = signal<number | null>(null);
  private readonly _thresholds = signal<DaysCountdownThresholds>(DEFAULT);

  readonly label = computed(() => {
    const d = this._days();
    if (d === null) return '—';
    if (d < 0) return `${Math.abs(d)}d overdue`;
    return `${d}d`;
  });

  readonly colorState = computed<'success' | 'warning' | 'error' | 'neutral'>(() => {
    const d = this._days();
    if (d === null) return 'neutral';
    const t = this._thresholds();
    // For daysInStage: higher is worse (errorDays > warnDays)
    // For daysToClose: lower is worse (errorDays < warnDays)
    if (t.errorDays > t.warnDays) {
      // Inverted (daysInStage): more days = more risk
      if (d >= t.errorDays) return 'error';
      if (d >= t.warnDays)  return 'warning';
      return 'success';
    } else {
      // Standard (daysToClose): fewer days = more risk
      if (d <= t.errorDays) return 'error';
      if (d <= t.warnDays)  return 'warning';
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

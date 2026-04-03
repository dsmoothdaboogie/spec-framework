// @spec-reads: domain/patterns/ag-grid-datatable/syndicate-banker §7
// ≥2x success, ≥1x warning, <1x error
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatCoverageMultiple } from '../../calculations/deal-calculations';

@Component({
  selector: 'app-coverage-multiple-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coverage-multiple-renderer.component.html',
  styleUrl: './coverage-multiple-renderer.component.scss',
})
export class CoverageMultipleRendererComponent implements ICellRendererAngularComp {
  private readonly _multiple = signal<number>(0);

  readonly label = computed(() =>
    this._multiple() === 0 ? '—' : formatCoverageMultiple(this._multiple()),
  );

  readonly colorState = computed<'success' | 'warning' | 'error' | 'neutral'>(() => {
    const m = this._multiple();
    if (m === 0) return 'neutral';
    if (m >= 2.0) return 'success';
    if (m >= 1.0) return 'warning';
    return 'error';
  });

  agInit(params: ICellRendererParams): void {
    this._multiple.set(params.value ?? 0);
  }

  refresh(params: ICellRendererParams): boolean {
    this._multiple.set(params.value ?? 0);
    return true;
  }
}

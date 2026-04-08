// @spec-reads: domain/patterns/ag-grid-datatable/syndicate-banker §7
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatCoverageMultiple } from '../../calculations/deal-calculations';
import { StatusBadgeRendererComponent, BadgeVariant } from '../../primitives/status-badge/status-badge-renderer.component';

@Component({
  selector: 'app-coverage-multiple-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeRendererComponent],
  template: `<app-status-badge [value]="label()" [variant]="variant()" />`,
})
export class CoverageMultipleRendererComponent implements ICellRendererAngularComp {
  private readonly _multiple = signal<number>(0);
  readonly label = computed(() => this._multiple() === 0 ? '—' : formatCoverageMultiple(this._multiple()));
  readonly variant = computed<BadgeVariant>(() => {
    const m = this._multiple();
    if (m === 0) return 'neutral';
    if (m >= 2.0) return 'success';
    if (m >= 1.0) return 'warning';
    return 'error';
  });

  agInit(params: ICellRendererParams): void { this._multiple.set(params.value ?? 0); }
  refresh(params: ICellRendererParams): boolean { this._multiple.set(params.value ?? 0); return true; }
}

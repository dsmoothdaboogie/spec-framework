// @spec-reads: domain/patterns/ag-grid-datatable/conflict-clearance §8
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ConflictStatus } from '../../types/deal.types';
import { StatusBadgeRendererComponent, BadgeVariant } from '../../primitives/status-badge/status-badge-renderer.component';

const CONFLICT_VARIANT: Record<ConflictStatus, BadgeVariant> = {
  Pending: 'warning', Flagged: 'error', Cleared: 'success', Waived: 'neutral',
};

@Component({
  selector: 'app-conflict-status-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeRendererComponent],
  template: `<app-status-badge [value]="label()" [variant]="variant()" />`,
})
export class ConflictStatusRendererComponent implements ICellRendererAngularComp {
  private readonly _status = signal<ConflictStatus | null>(null);
  readonly label = computed(() => this._status() ?? '');
  readonly variant = computed<BadgeVariant>(() =>
    this._status() ? CONFLICT_VARIANT[this._status()!] : 'neutral',
  );

  agInit(params: ICellRendererParams): void { this._status.set(params.value ?? null); }
  refresh(params: ICellRendererParams): boolean { this._status.set(params.value ?? null); return true; }
}

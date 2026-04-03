// @spec-reads: domain/patterns/ag-grid-datatable/conflict-clearance §8
// Pending=warning, Flagged=error, Cleared=success, Waived=neutral
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ConflictStatus } from '../../types/deal.types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

const CONFLICT_VARIANT: Record<ConflictStatus, BadgeVariant> = {
  Pending: 'warning',
  Flagged: 'error',
  Cleared: 'success',
  Waived:  'neutral',
};

@Component({
  selector: 'app-conflict-status-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conflict-status-renderer.component.html',
  styleUrl: './conflict-status-renderer.component.scss',
})
export class ConflictStatusRendererComponent implements ICellRendererAngularComp {
  private readonly _status = signal<ConflictStatus | null>(null);

  readonly status  = computed(() => this._status());
  readonly variant = computed<BadgeVariant>(() =>
    this._status() ? CONFLICT_VARIANT[this._status()!] : 'neutral',
  );

  agInit(params: ICellRendererParams): void {
    this._status.set(params.value ?? null);
  }

  refresh(params: ICellRendererParams): boolean {
    this._status.set(params.value ?? null);
    return true;
  }
}

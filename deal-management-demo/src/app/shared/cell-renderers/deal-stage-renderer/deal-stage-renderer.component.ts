// @spec-reads: domain/patterns/ag-grid-datatable/coverage-banker §2 stage color map
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DealStage } from '../../types/deal.types';
import { StatusBadgeRendererComponent, BadgeVariant } from '../../primitives/status-badge/status-badge-renderer.component';

const STAGE_VARIANT: Record<DealStage, BadgeVariant> = {
  Origination: 'info', Mandate: 'info', 'Due Diligence': 'warning',
  Marketing: 'warning', Pricing: 'success', Closed: 'neutral', Withdrawn: 'error',
};

export interface DealStageRendererParams extends ICellRendererParams {
  variant?: BadgeVariant;
}

@Component({
  selector: 'app-deal-stage-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeRendererComponent],
  template: `<app-status-badge [value]="label()" [variant]="variant()" />`,
})
export class DealStageRendererComponent implements ICellRendererAngularComp {
  private readonly _label = signal('');
  private readonly _variant = signal<BadgeVariant>('neutral');
  readonly label = this._label.asReadonly();
  readonly variant = this._variant.asReadonly();

  agInit(params: DealStageRendererParams): void {
    this._label.set(params.value ?? '');
    this._variant.set(params.variant ?? STAGE_VARIANT[params.value as DealStage] ?? 'neutral');
  }

  refresh(params: DealStageRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}

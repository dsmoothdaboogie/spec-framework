// @spec-reads: domain/patterns/ag-grid-datatable/coverage-banker §2 stage color map
import { Component, ChangeDetectionStrategy, signal, computed, input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DealStage } from '../../types/deal.types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STAGE_VARIANT: Record<DealStage, BadgeVariant> = {
  Origination:     'info',
  Mandate:         'info',
  'Due Diligence': 'warning',
  Marketing:       'warning',
  Pricing:         'success',
  Closed:          'neutral',
  Withdrawn:       'error',
};

export interface DealStageRendererParams extends ICellRendererParams {
  /** Override variant (e.g. 'neutral' for deal type badges) */
  variant?: BadgeVariant;
}

@Component({
  selector: 'app-deal-stage-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deal-stage-renderer.component.html',
  styleUrl: './deal-stage-renderer.component.scss',
})
export class DealStageRendererComponent implements ICellRendererAngularComp {
  private readonly _label   = signal<string>('');
  private readonly _variant = signal<BadgeVariant>('neutral');

  readonly label   = computed(() => this._label());
  readonly variant = computed(() => this._variant());

  agInit(params: DealStageRendererParams): void {
    this._label.set(params.value ?? '');
    if (params.variant) {
      this._variant.set(params.variant);
    } else {
      this._variant.set(STAGE_VARIANT[params.value as DealStage] ?? 'neutral');
    }
  }

  refresh(params: DealStageRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}

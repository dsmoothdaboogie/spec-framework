// @spec-reads: domain/patterns/ag-grid-datatable/coverage-banker §2 col 7
// @spec-reads: ds/patterns/deal-grid-calculations §3.2 §3.7
// Shows grossSpreadBps value with inline calculated gross revenue beneath it.
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatBps, calcGrossRevenue } from '../../calculations/deal-calculations';

export interface FeeRevenueRendererParams extends ICellRendererParams {
  dealSizeUsd: number;
}

@Component({
  selector: 'app-fee-revenue-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './fee-revenue-renderer.component.html',
  styleUrl: './fee-revenue-renderer.component.scss',
})
export class FeeRevenueRendererComponent implements ICellRendererAngularComp {
  private readonly _bps         = signal<number>(0);
  private readonly _dealSizeUsd = signal<number>(0);

  readonly formattedBps  = computed(() => formatBps(this._bps()));
  readonly grossRevenue  = computed(() => calcGrossRevenue(this._dealSizeUsd(), this._bps()));
  readonly revenueLabel  = computed(() => {
    const r = this.grossRevenue();
    return r >= 1 ? `$${r.toFixed(1)}m` : `$${(r * 1000).toFixed(0)}k`;
  });

  agInit(params: FeeRevenueRendererParams): void {
    this._bps.set(params.value ?? 0);
    this._dealSizeUsd.set(params.data?.dealSizeUsd ?? 0);
  }

  refresh(params: FeeRevenueRendererParams): boolean {
    this._bps.set(params.value ?? 0);
    this._dealSizeUsd.set(params.data?.dealSizeUsd ?? 0);
    return true;
  }
}

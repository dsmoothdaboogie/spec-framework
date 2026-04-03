// @spec-reads: ds/patterns/deal-grid-calculations §3.1 §3.10
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatDealSize, dealSizeCategory } from '../../calculations/deal-calculations';

@Component({
  selector: 'app-deal-size-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deal-size-renderer.component.html',
  styleUrl: './deal-size-renderer.component.scss',
})
export class DealSizeRendererComponent implements ICellRendererAngularComp {
  private readonly _value = signal<number>(0);

  readonly formattedValue = computed(() => formatDealSize(this._value()));
  readonly sizeCategory   = computed(() => dealSizeCategory(this._value()));

  agInit(params: ICellRendererParams): void {
    this._value.set(params.value ?? 0);
  }

  refresh(params: ICellRendererParams): boolean {
    this._value.set(params.value ?? 0);
    return true;
  }
}

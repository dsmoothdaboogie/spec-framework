import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import type { MetricFormat, TrendDirection } from '../../types/dashboard.types';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
})
export class MetricCardComponent {
  label = input.required<string>();
  value = input.required<number | string>();
  format = input<MetricFormat>('number');
  trend = input<TrendDirection>();
  previousValue = input<number>();
  clickable = input(false);

  cardClicked = output<void>();

  readonly formattedValue = computed(() => {
    const v = this.value();
    if (typeof v === 'string') return v;
    switch (this.format()) {
      case 'currency':
        return v >= 1000 ? `$${(v / 1000).toFixed(1)}bn` : `$${v.toFixed(0)}m`;
      case 'percent':
        return `${v.toFixed(1)}%`;
      default:
        return v.toLocaleString();
    }
  });

  readonly trendIcon = computed(() => {
    const t = this.trend();
    if (!t) return null;
    return t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
  });

  readonly trendClass = computed(() => {
    const t = this.trend();
    if (!t) return '';
    return `trend--${t}`;
  });

  onClick(): void {
    if (this.clickable()) {
      this.cardClicked.emit();
    }
  }
}

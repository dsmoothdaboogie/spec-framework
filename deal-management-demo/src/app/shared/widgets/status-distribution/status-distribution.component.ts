import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import type { StatusSegment } from '../../types/dashboard.types';

@Component({
  selector: 'app-status-distribution',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-distribution.component.html',
  styleUrl: './status-distribution.component.scss',
})
export class StatusDistributionComponent {
  segments = input.required<StatusSegment[]>();
  title = input<string>();

  readonly total = computed(() =>
    this.segments().reduce((sum, s) => sum + s.count, 0)
  );

  readonly segmentsWithPercent = computed(() => {
    const t = this.total();
    if (t === 0) return [];
    return this.segments().map(s => ({
      ...s,
      percent: (s.count / t) * 100,
    }));
  });
}

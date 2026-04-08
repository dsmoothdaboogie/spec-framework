import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import type { AlertItem } from '../../types/dashboard.types';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert-list.component.html',
  styleUrl: './alert-list.component.scss',
})
export class AlertListComponent {
  items = input.required<AlertItem[]>();
  maxItems = input(5);
  title = input<string>();

  readonly visibleItems = computed(() =>
    this.items().slice(0, this.maxItems())
  );
}

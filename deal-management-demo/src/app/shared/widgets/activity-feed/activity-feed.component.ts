import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { ActivityEvent } from '../../types/dashboard.types';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss',
})
export class ActivityFeedComponent {
  items = input.required<ActivityEvent[]>();
  maxItems = input(10);
  title = input<string>();

  readonly visibleItems = computed(() =>
    this.items().slice(0, this.maxItems())
  );
}

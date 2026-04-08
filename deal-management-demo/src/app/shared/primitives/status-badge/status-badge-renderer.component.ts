import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge-renderer.component.html',
  styleUrl: './status-badge-renderer.component.scss',
})
export class StatusBadgeRendererComponent {
  value = input.required<string>();
  variant = input<BadgeVariant>('neutral');
}

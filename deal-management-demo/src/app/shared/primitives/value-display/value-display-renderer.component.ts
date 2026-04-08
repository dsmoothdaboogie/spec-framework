import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type DisplayVariant = 'success' | 'warning' | 'error' | 'neutral' | 'default';

@Component({
  selector: 'app-value-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './value-display-renderer.component.html',
  styleUrl: './value-display-renderer.component.scss',
})
export class ValueDisplayRendererComponent {
  primaryText = input.required<string>();
  secondaryText = input<string>();
  variant = input<DisplayVariant>('default');
  bold = input(false);
}

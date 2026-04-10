import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-deal-origination-banker-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <h3>Deal Origination Banker — Grid</h3>
      <p>To be generated from spec: <code>grid/deal-origination-banker</code></p>
    </div>
  `,
  styles: [`
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 8px;
      color: var(--color-text-secondary);
    }
    h3 { color: var(--color-text-primary); margin: 0; }
    p { margin: 0; font-size: 13px; }
    code {
      background: var(--color-surface-secondary);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  `],
})
export class DealOriginationBankerGridComponent {}

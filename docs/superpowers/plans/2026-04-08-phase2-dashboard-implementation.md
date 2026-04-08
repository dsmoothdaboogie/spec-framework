# Phase 2: Dashboard & Compliance Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persona-driven dashboards with 5 reusable widget components, a Compliance Viewer persona (grid + dashboard), and sub-navigation to the demo app — proving the spec-driven workflow for non-grid patterns.

**Architecture:** Each dashboard is a composition spec that defines which widgets appear in which slots with what params. The 5 generic widget components live in `shared/widgets/` and know nothing about deals. Persona-specific dashboard components read widget configs and render the appropriate widgets. Navigation uses signals (`activeView: 'dashboard' | 'grid'`) — no Angular router.

**Tech Stack:** Angular 19 (standalone, OnPush, signals), ngrx/signals, AG Grid Community, SCSS with CSS custom properties

**Design doc:** `docs/superpowers/specs/2026-04-08-generic-primitives-and-dashboard-design.md`

---

## File Map

### New files to create

```
# Dashboard widget primitives (shared, reusable, DS-portable)
deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.ts
deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.html
deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.scss
deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.ts
deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.html
deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.scss
deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.ts
deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.html
deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.scss
deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.ts
deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.html
deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.scss
deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.ts
deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.html
deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.scss

# Dashboard types
deal-management-demo/src/app/shared/types/dashboard.types.ts

# Persona dashboard components
deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.ts
deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.html
deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.scss
deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.ts
deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.html
deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.scss
deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.ts
deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.html
deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.scss
deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.ts
deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.html
deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.scss
deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.ts
deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.html
deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.scss

# Compliance Viewer grid (new persona)
deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.ts
deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.html
deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.scss

# Specs
specs/ds/patterns/dashboard.spec.md
specs/ds/templates/deal-pipeline-page.spec.md
specs/domain/patterns/dashboard/coverage-banker.spec.md
specs/domain/patterns/dashboard/syndicate-banker.spec.md
specs/domain/patterns/dashboard/business-execution-lead.spec.md
specs/domain/patterns/dashboard/conflict-clearance.spec.md
specs/domain/patterns/dashboard/compliance-viewer.spec.md
specs/domain/patterns/dashboard/deal-origination-banker.spec.md
```

### Existing files to modify

```
# App shell — add sub-nav and new persona tab
deal-management-demo/src/app/app.component.ts
deal-management-demo/src/app/app.component.html
deal-management-demo/src/app/app.component.scss

# Store — add computed dashboard metrics
deal-management-demo/src/app/state/deal.store.ts

# Mock data — add activity events, alerts, trend data
deal-management-demo/src/app/shared/mock/deal-mock-data.ts

# Types — add dashboard-related fields
deal-management-demo/src/app/shared/types/deal.types.ts

# Primitives registry — add widget entries
tools/registry/primitives.json

# Registry index
tools/registry/registry.json
```

---

## Task 1: Dashboard Types

**Files:**
- Create: `deal-management-demo/src/app/shared/types/dashboard.types.ts`

- [ ] **Step 1: Create the dashboard types file**

```typescript
// deal-management-demo/src/app/shared/types/dashboard.types.ts

export type WidgetType = 'metricCard' | 'miniGrid' | 'statusDistribution' | 'activityFeed' | 'alertList';
export type MetricFormat = 'number' | 'currency' | 'percent';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface MetricCardConfig {
  type: 'metricCard';
  slot: string;
  label: string;
  metric: string;
  format: MetricFormat;
  trend?: TrendDirection;
  previousValue?: number;
}

export interface MiniGridConfig {
  type: 'miniGrid';
  slot: string;
  title: string;
  maxRows: number;
  dataSource: string;
}

export interface StatusDistributionConfig {
  type: 'statusDistribution';
  slot: string;
  title: string;
  groupBy: string;
}

export interface ActivityFeedConfig {
  type: 'activityFeed';
  slot: string;
  title: string;
  maxItems: number;
}

export interface AlertListConfig {
  type: 'alertList';
  slot: string;
  title: string;
  maxItems: number;
}

export type WidgetConfig =
  | MetricCardConfig
  | MiniGridConfig
  | StatusDistributionConfig
  | ActivityFeedConfig
  | AlertListConfig;

export interface DashboardRow {
  columns: WidgetConfig[];
}

export interface DashboardLayout {
  rows: DashboardRow[];
}

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  description: string;
  actor?: string;
  dealId?: string;
}

export interface AlertItem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
  dealId?: string;
}

export interface StatusSegment {
  label: string;
  count: number;
  variant: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add deal-management-demo/src/app/shared/types/dashboard.types.ts
git commit -m "feat(types): add dashboard widget type definitions"
```

---

## Task 2: MetricCardComponent

**Files:**
- Create: `deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.ts`
- Create: `deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.html`
- Create: `deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.scss`

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.ts
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
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.html -->
<div
  class="metric-card"
  [class.metric-card--clickable]="clickable()"
  (click)="onClick()"
  [attr.role]="clickable() ? 'button' : null"
  [attr.tabindex]="clickable() ? 0 : null">
  <span class="metric-card__label">{{ label() }}</span>
  <span class="metric-card__value">{{ formattedValue() }}</span>
  @if (trendIcon()) {
    <span class="metric-card__trend" [class]="trendClass()">
      {{ trendIcon() }}
    </span>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/shared/widgets/metric-card/metric-card.component.scss
:host {
  display: block;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 8px;
  background: var(--color-surface-primary, #fff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);
  transition: box-shadow 0.15s, border-color 0.15s;

  &--clickable {
    cursor: pointer;
    &:hover {
      border-color: var(--color-brand-primary, #2563eb);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary, #0f172a);
    line-height: 1.2;
  }

  &__trend {
    font-size: 13px;
    font-weight: 600;
  }
}

.trend--up {
  color: var(--color-success, #059669);
}
.trend--down {
  color: var(--color-error, #dc2626);
}
.trend--flat {
  color: var(--color-neutral, #64748b);
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/shared/widgets/metric-card/
git commit -m "feat(widgets): add MetricCardComponent — generic KPI display"
```

---

## Task 3: StatusDistributionComponent

**Files:**
- Create: `deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.ts`
- Create: `deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.html`
- Create: `deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.scss`

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.ts
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
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.html -->
<div class="status-dist">
  @if (title()) {
    <h3 class="status-dist__title">{{ title() }}</h3>
  }
  <div class="status-dist__bar" role="img" [attr.aria-label]="title() || 'Status distribution'">
    @for (seg of segmentsWithPercent(); track seg.label) {
      <div
        class="status-dist__segment"
        [attr.data-variant]="seg.variant"
        [style.width.%]="seg.percent"
        [attr.title]="seg.label + ': ' + seg.count">
      </div>
    }
  </div>
  <div class="status-dist__legend">
    @for (seg of segmentsWithPercent(); track seg.label) {
      <span class="status-dist__legend-item">
        <span class="status-dist__dot" [attr.data-variant]="seg.variant"></span>
        {{ seg.label }} ({{ seg.count }})
      </span>
    }
  </div>
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/shared/widgets/status-distribution/status-distribution.component.scss
:host { display: block; }

.status-dist {
  padding: 16px;
  border-radius: 8px;
  background: var(--color-surface-primary, #fff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
    margin: 0 0 12px 0;
  }

  &__bar {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    gap: 2px;
  }

  &__segment {
    min-width: 4px;
    border-radius: 2px;

    &[data-variant='success'] { background: var(--color-success, #059669); }
    &[data-variant='warning'] { background: var(--color-warning, #d97706); }
    &[data-variant='error']   { background: var(--color-error, #dc2626); }
    &[data-variant='info']    { background: var(--color-info, #2563eb); }
    &[data-variant='neutral'] { background: var(--color-neutral, #64748b); }
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 10px;
  }

  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary, #64748b);
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &[data-variant='success'] { background: var(--color-success, #059669); }
    &[data-variant='warning'] { background: var(--color-warning, #d97706); }
    &[data-variant='error']   { background: var(--color-error, #dc2626); }
    &[data-variant='info']    { background: var(--color-info, #2563eb); }
    &[data-variant='neutral'] { background: var(--color-neutral, #64748b); }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/shared/widgets/status-distribution/
git commit -m "feat(widgets): add StatusDistributionComponent — segmented bar"
```

---

## Task 4: ActivityFeedComponent

**Files:**
- Create: `deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.ts`
- Create: `deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.html`
- Create: `deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.scss`

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.ts
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
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.html -->
<div class="activity-feed">
  @if (title()) {
    <h3 class="activity-feed__title">{{ title() }}</h3>
  }
  @if (visibleItems().length === 0) {
    <p class="activity-feed__empty">No recent activity.</p>
  } @else {
    <ul class="activity-feed__list">
      @for (item of visibleItems(); track item.id) {
        <li class="activity-feed__item">
          <span class="activity-feed__time">{{ item.timestamp | date:'MMM d, h:mm a' }}</span>
          <span class="activity-feed__desc">
            @if (item.actor) {
              <strong>{{ item.actor }}</strong>
            }
            {{ item.description }}
          </span>
        </li>
      }
    </ul>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/shared/widgets/activity-feed/activity-feed.component.scss
:host { display: block; }

.activity-feed {
  padding: 16px;
  border-radius: 8px;
  background: var(--color-surface-primary, #fff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
    margin: 0 0 12px 0;
  }

  &__empty {
    font-size: 13px;
    color: var(--color-text-secondary, #64748b);
    margin: 0;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border-subtle, #e2e8f0);

    &:last-child { border-bottom: none; }
  }

  &__time {
    font-size: 11px;
    color: var(--color-text-secondary, #64748b);
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  &__desc {
    font-size: 13px;
    color: var(--color-text-primary, #0f172a);
    line-height: 1.4;

    strong {
      font-weight: 600;
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/shared/widgets/activity-feed/
git commit -m "feat(widgets): add ActivityFeedComponent — chronological event list"
```

---

## Task 5: AlertListComponent

**Files:**
- Create: `deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.ts`
- Create: `deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.html`
- Create: `deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.scss`

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.ts
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
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.html -->
<div class="alert-list">
  @if (title()) {
    <h3 class="alert-list__title">{{ title() }}</h3>
  }
  @if (visibleItems().length === 0) {
    <p class="alert-list__empty">No alerts.</p>
  } @else {
    <ul class="alert-list__list">
      @for (item of visibleItems(); track item.id) {
        <li class="alert-list__item" [attr.data-severity]="item.severity">
          <div class="alert-list__header">
            <span class="alert-list__severity" [attr.data-severity]="item.severity">
              {{ item.severity }}
            </span>
            <span class="alert-list__item-title">{{ item.title }}</span>
          </div>
          <p class="alert-list__desc">{{ item.description }}</p>
        </li>
      }
    </ul>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/shared/widgets/alert-list/alert-list.component.scss
:host { display: block; }

.alert-list {
  padding: 16px;
  border-radius: 8px;
  background: var(--color-surface-primary, #fff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
    margin: 0 0 12px 0;
  }

  &__empty {
    font-size: 13px;
    color: var(--color-text-secondary, #64748b);
    margin: 0;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    padding: 10px 12px;
    border-radius: 6px;
    border-left: 3px solid transparent;

    &[data-severity='error'] {
      background: var(--color-error-bg, rgba(239, 68, 68, 0.06));
      border-left-color: var(--color-error, #dc2626);
    }
    &[data-severity='warning'] {
      background: var(--color-warning-bg, rgba(251, 191, 36, 0.06));
      border-left-color: var(--color-warning, #d97706);
    }
    &[data-severity='info'] {
      background: var(--color-info-bg, rgba(59, 130, 246, 0.06));
      border-left-color: var(--color-info, #2563eb);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__severity {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1px 6px;
    border-radius: 4px;

    &[data-severity='error'] {
      background: var(--color-error-bg, rgba(239, 68, 68, 0.12));
      color: var(--color-error, #dc2626);
    }
    &[data-severity='warning'] {
      background: var(--color-warning-bg, rgba(251, 191, 36, 0.12));
      color: var(--color-warning, #d97706);
    }
    &[data-severity='info'] {
      background: var(--color-info-bg, rgba(59, 130, 246, 0.12));
      color: var(--color-info, #2563eb);
    }
  }

  &__item-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
  }

  &__desc {
    font-size: 12px;
    color: var(--color-text-secondary, #64748b);
    margin: 0;
    line-height: 1.4;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/shared/widgets/alert-list/
git commit -m "feat(widgets): add AlertListComponent — prioritized alert display"
```

---

## Task 6: MiniGridComponent

**Files:**
- Create: `deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.ts`
- Create: `deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.html`
- Create: `deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.scss`

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.ts
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-mini-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './mini-grid.component.html',
  styleUrl: './mini-grid.component.scss',
})
export class MiniGridComponent {
  columnDefs = input.required<ColDef[]>();
  rowData = input.required<any[]>();
  maxRows = input(5);
  title = input<string>();
  viewAllLabel = input('View all');

  viewAllClicked = output<void>();

  readonly visibleData = computed(() =>
    this.rowData().slice(0, this.maxRows())
  );

  readonly hasMore = computed(() =>
    this.rowData().length > this.maxRows()
  );

  readonly gridOptions: GridOptions = {
    headerHeight: 36,
    rowHeight: 36,
    domLayout: 'autoHeight',
    suppressHorizontalScroll: true,
    suppressCellFocus: true,
    animateRows: false,
  };
}
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.html -->
<div class="mini-grid">
  <div class="mini-grid__header">
    @if (title()) {
      <h3 class="mini-grid__title">{{ title() }}</h3>
    }
    @if (hasMore()) {
      <button class="mini-grid__view-all" (click)="viewAllClicked.emit()">
        {{ viewAllLabel() }}
      </button>
    }
  </div>
  <ag-grid-angular
    class="ag-theme-alpine mini-grid__grid"
    [columnDefs]="columnDefs()"
    [rowData]="visibleData()"
    [gridOptions]="gridOptions" />
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/shared/widgets/mini-grid/mini-grid.component.scss
:host { display: block; }

.mini-grid {
  border-radius: 8px;
  background: var(--color-surface-primary, #fff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #0f172a);
    margin: 0;
  }

  &__view-all {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-brand-primary, #2563eb);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;

    &:hover { text-decoration: underline; }
  }

  &__grid {
    width: 100%;
  }

  // Compact grid overrides
  :host ::ng-deep .ag-theme-alpine {
    --ag-font-size: 12px;
    --ag-header-background-color: var(--color-surface-secondary, #f8fafc);
    --ag-odd-row-background-color: transparent;
    --ag-row-hover-color: var(--color-surface-hover, rgba(0,0,0,0.02));
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/shared/widgets/mini-grid/
git commit -m "feat(widgets): add MiniGridComponent — compact AG Grid slice"
```

---

## Task 7: Extend Mock Data with Activity Events and Alerts

**Files:**
- Modify: `deal-management-demo/src/app/shared/mock/deal-mock-data.ts`

- [ ] **Step 1: Add activity events and alert mock data**

Add the following exports after the `MOCK_DEALS` array (do NOT change the existing MOCK_DEALS):

```typescript
// Append to the end of deal-mock-data.ts

import type { ActivityEvent, AlertItem } from '../types/dashboard.types';

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'A001', timestamp: daysAgo(0), description: 'updated pricing for Meridian Tech Follow-on', actor: 'Sarah Mitchell', dealId: 'D002' },
  { id: 'A002', timestamp: daysAgo(0), description: 'moved Brightfield Pharma LevFin to Marketing', actor: 'Emma Rodriguez', dealId: 'D005' },
  { id: 'A003', timestamp: daysAgo(1), description: 'flagged conflict on Coastal Energy M&A', actor: 'James Thornton', dealId: 'D003' },
  { id: 'A004', timestamp: daysAgo(1), description: 'completed milestone 6/8 for Apex Financial Group IPO', actor: 'Sarah Mitchell', dealId: 'D001' },
  { id: 'A005', timestamp: daysAgo(2), description: 'submitted conflict review for Vantage Capital LevFin', actor: 'Anna Kowalski', dealId: 'D009' },
  { id: 'A006', timestamp: daysAgo(2), description: 'updated allocation for Pinnacle Retail IPO', actor: 'David Chen', dealId: 'D011' },
  { id: 'A007', timestamp: daysAgo(3), description: 'escalated Iron Peak Mining LevFin — conflict flagged', actor: 'James Thornton', dealId: 'D012' },
  { id: 'A008', timestamp: daysAgo(3), description: 'mandate received for Vantage Capital LevFin', actor: 'Emma Rodriguez', dealId: 'D009' },
  { id: 'A009', timestamp: daysAgo(4), description: 'withdrew Harbour Bridge M&A — client decision', actor: 'Sarah Mitchell', dealId: 'D010' },
  { id: 'A010', timestamp: daysAgo(5), description: 'created SkyBridge Infrastructure ECM deal', actor: 'Sarah Mitchell', dealId: 'D006' },
];

export const MOCK_ALERTS: AlertItem[] = [
  { id: 'AL001', severity: 'error', title: 'Conflict flagged', description: 'Coastal Energy M&A has an unresolved conflict — counterparty relationship under review.', dealId: 'D003' },
  { id: 'AL002', severity: 'error', title: 'Conflict flagged', description: 'Iron Peak Mining LevFin — existing lending relationship with competitor. Escalated.', dealId: 'D012' },
  { id: 'AL003', severity: 'warning', title: 'Close date approaching', description: 'Meridian Tech Follow-on expected to close in 4 days. Pricing date in 2 days.', dealId: 'D002' },
  { id: 'AL004', severity: 'warning', title: 'Pending conflict review', description: 'NorthStar REIT DCM conflict review not yet started.', dealId: 'D004' },
  { id: 'AL005', severity: 'warning', title: 'Pending conflict review', description: 'SkyBridge Infrastructure ECM conflict review not yet started.', dealId: 'D006' },
  { id: 'AL006', severity: 'warning', title: 'Pending conflict review', description: 'Vantage Capital LevFin conflict review submitted, awaiting resolution.', dealId: 'D009' },
  { id: 'AL007', severity: 'info', title: 'Low milestone progress', description: 'Iron Peak Mining LevFin at 22% milestone completion (2/9) and in Due Diligence for 35 days.', dealId: 'D012' },
  { id: 'AL008', severity: 'info', title: 'Low book coverage', description: 'Brightfield Pharma LevFin book coverage at 1.8x — below 2.0x threshold.', dealId: 'D005' },
];
```

Note: The import for types needs to be added at the top of the file. The `daysAgo` helper is already defined and available.

- [ ] **Step 2: Commit**

```bash
git add deal-management-demo/src/app/shared/mock/deal-mock-data.ts
git commit -m "feat(mock): add activity feed events and alert items for dashboards"
```

---

## Task 8: Extend DealStore with Dashboard Computed Metrics

**Files:**
- Modify: `deal-management-demo/src/app/state/deal.store.ts`

- [ ] **Step 1: Add dashboard-related imports and computed signals**

Replace the entire `deal.store.ts` with this expanded version. The existing `DealState`, `initialState`, `isLoading`, `hasError`, `isEmpty`, and `loadDeals()` remain unchanged. New computed signals are added inside the existing `withComputed` block.

```typescript
// deal-management-demo/src/app/state/deal.store.ts
import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Deal, DealStage, ConflictStatus } from '../shared/types/deal.types';
import { MOCK_DEALS, MOCK_ACTIVITY, MOCK_ALERTS } from '../shared/mock/deal-mock-data';
import type { StatusSegment } from '../shared/types/dashboard.types';

export type RequestState = 'idle' | 'loading' | 'success' | 'error';

export interface DealState {
  items: Deal[];
  requestState: RequestState;
  error: string | null;
}

const initialState: DealState = {
  items: [],
  requestState: 'idle',
  error: null,
};

const ACTIVE_STAGES: DealStage[] = ['Origination', 'Mandate', 'Due Diligence', 'Marketing', 'Pricing'];

const STAGE_VARIANT: Record<DealStage, string> = {
  Origination: 'info', Mandate: 'info', 'Due Diligence': 'warning',
  Marketing: 'warning', Pricing: 'success', Closed: 'neutral', Withdrawn: 'error',
};

const CONFLICT_VARIANT: Record<ConflictStatus, string> = {
  Pending: 'warning', Flagged: 'error', Cleared: 'success', Waived: 'neutral',
};

export const DealStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ items, requestState }) => {
    const activeDeals = computed(() =>
      items().filter(d => ACTIVE_STAGES.includes(d.stage))
    );

    return {
      // Existing
      isLoading: computed(() => requestState() === 'loading'),
      hasError:  computed(() => requestState() === 'error'),
      isEmpty:   computed(() => requestState() === 'success' && items().length === 0),

      // Dashboard: counts
      activeDeals,
      activeDealCount: computed(() => activeDeals().length),
      totalDealCount: computed(() => items().length),

      // Dashboard: pipeline value (sum of dealSizeUsd for active deals, in millions)
      totalPipelineValue: computed(() =>
        activeDeals().reduce((sum, d) => sum + d.dealSizeUsd, 0)
      ),

      // Dashboard: average deal size
      avgDealSize: computed(() => {
        const active = activeDeals();
        return active.length > 0
          ? active.reduce((sum, d) => sum + d.dealSizeUsd, 0) / active.length
          : 0;
      }),

      // Dashboard: deals by stage (for StatusDistribution)
      dealsByStage: computed((): StatusSegment[] => {
        const counts = new Map<DealStage, number>();
        for (const d of items()) {
          counts.set(d.stage, (counts.get(d.stage) ?? 0) + 1);
        }
        return Array.from(counts.entries()).map(([label, count]) => ({
          label,
          count,
          variant: STAGE_VARIANT[label],
        }));
      }),

      // Dashboard: deals by conflict status (for StatusDistribution)
      dealsByConflictStatus: computed((): StatusSegment[] => {
        const counts = new Map<ConflictStatus, number>();
        for (const d of items()) {
          counts.set(d.conflictStatus, (counts.get(d.conflictStatus) ?? 0) + 1);
        }
        return Array.from(counts.entries()).map(([label, count]) => ({
          label,
          count,
          variant: CONFLICT_VARIANT[label],
        }));
      }),

      // Dashboard: pending conflicts count
      pendingConflicts: computed(() =>
        items().filter(d => d.conflictStatus === 'Pending').length
      ),

      // Dashboard: flagged conflicts count
      flaggedConflicts: computed(() =>
        items().filter(d => d.conflictStatus === 'Flagged').length
      ),

      // Dashboard: MNPI flagged deals count
      mnpiFlaggedCount: computed(() =>
        items().filter(d => d.mnpiFlag).length
      ),

      // Dashboard: avg milestone completion (percent)
      avgMilestonePercent: computed(() => {
        const active = activeDeals();
        if (active.length === 0) return 0;
        const total = active.reduce((sum, d) =>
          sum + (d.totalMilestones > 0 ? (d.completedMilestones / d.totalMilestones) * 100 : 0), 0
        );
        return Math.round(total / active.length);
      }),

      // Dashboard: top deals by size (for MiniGrid)
      topDealsBySize: computed(() =>
        [...activeDeals()].sort((a, b) => b.dealSizeUsd - a.dealSizeUsd).slice(0, 5)
      ),

      // Dashboard: approaching close deals (next 30 days)
      approachingClose: computed(() =>
        activeDeals()
          .filter(d => d.expectedCloseDate != null)
          .sort((a, b) => a.expectedCloseDate!.getTime() - b.expectedCloseDate!.getTime())
          .slice(0, 5)
      ),

      // Static mock data references (no transformation needed)
      activityFeed: computed(() => MOCK_ACTIVITY),
      alerts: computed(() => MOCK_ALERTS),
    };
  }),

  withMethods((store) => ({
    loadDeals(): void {
      patchState(store, { requestState: 'loading', error: null });
      setTimeout(() => {
        patchState(store, { items: MOCK_DEALS, requestState: 'success' });
      }, 300);
    },
  })),
);
```

- [ ] **Step 2: Commit**

```bash
git add deal-management-demo/src/app/state/deal.store.ts
git commit -m "feat(store): add computed dashboard metrics — pipeline value, stage distribution, alerts"
```

---

## Task 9: App Shell — Add Sub-Navigation and Compliance Viewer Tab

**Files:**
- Modify: `deal-management-demo/src/app/app.component.ts`
- Modify: `deal-management-demo/src/app/app.component.html`
- Modify: `deal-management-demo/src/app/app.component.scss`

- [ ] **Step 1: Update app.component.ts**

Replace the entire file:

```typescript
// deal-management-demo/src/app/app.component.ts
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CoverageBankerGridComponent } from './features/coverage-banker/deal-grid/deal-grid.component';
import { SyndicateBankerGridComponent } from './features/syndicate-banker/deal-grid/deal-grid.component';
import { BusinessExecutionLeadGridComponent } from './features/business-execution-lead/deal-grid/deal-grid.component';
import { ConflictClearanceGridComponent } from './features/conflict-clearance/deal-grid/deal-grid.component';
import { ComplianceViewerGridComponent } from './features/compliance-viewer/deal-grid/deal-grid.component';
import { CoverageBankerDashboardComponent } from './features/coverage-banker/dashboard/dashboard.component';
import { SyndicateBankerDashboardComponent } from './features/syndicate-banker/dashboard/dashboard.component';
import { BusinessExecutionLeadDashboardComponent } from './features/business-execution-lead/dashboard/dashboard.component';
import { ConflictClearanceDashboardComponent } from './features/conflict-clearance/dashboard/dashboard.component';
import { ComplianceViewerDashboardComponent } from './features/compliance-viewer/dashboard/dashboard.component';

type PersonaTab = 'coverage' | 'syndicate' | 'bel' | 'conflict' | 'compliance';
type ActiveView = 'dashboard' | 'grid';

interface Tab {
  id: PersonaTab;
  label: string;
  subtitle: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CoverageBankerGridComponent,
    SyndicateBankerGridComponent,
    BusinessExecutionLeadGridComponent,
    ConflictClearanceGridComponent,
    ComplianceViewerGridComponent,
    CoverageBankerDashboardComponent,
    SyndicateBankerDashboardComponent,
    BusinessExecutionLeadDashboardComponent,
    ConflictClearanceDashboardComponent,
    ComplianceViewerDashboardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly activeTab = signal<PersonaTab>('coverage');
  readonly activeView = signal<ActiveView>('dashboard');

  readonly tabs: Tab[] = [
    { id: 'coverage',    label: 'Coverage Banker',         subtitle: 'deal-full entitlement' },
    { id: 'syndicate',   label: 'Syndicate Banker',        subtitle: 'deal-full entitlement' },
    { id: 'bel',         label: 'Business Execution Lead', subtitle: 'deal-full entitlement' },
    { id: 'conflict',    label: 'Conflict Clearance',      subtitle: 'deal-restricted entitlement' },
    { id: 'compliance',  label: 'Compliance Viewer',       subtitle: 'mnpi-full entitlement' },
  ];

  setTab(id: PersonaTab): void {
    this.activeTab.set(id);
    this.activeView.set('dashboard');
  }

  setView(view: ActiveView): void {
    this.activeView.set(view);
  }
}
```

- [ ] **Step 2: Update app.component.html**

Replace the entire file:

```html
<!-- deal-management-demo/src/app/app.component.html -->
<div class="shell">

  <!-- App header -->
  <header class="app-header">
    <div class="app-header__brand">
      <span class="app-header__logo">⬡</span>
      <span class="app-header__name">Deal Management</span>
      <span class="app-header__tag">Spec-Driven Demo</span>
    </div>
    <div class="app-header__meta">
      <span class="spec-link">spec-framework / domain/patterns</span>
    </div>
  </header>

  <!-- Persona tab nav -->
  <nav class="persona-nav">
    @for (tab of tabs; track tab.id) {
      <button
        class="persona-tab"
        [class.persona-tab--active]="activeTab() === tab.id"
        (click)="setTab(tab.id)">
        <span class="persona-tab__label">{{ tab.label }}</span>
        <span class="persona-tab__sub">{{ tab.subtitle }}</span>
      </button>
    }
  </nav>

  <!-- Sub-navigation: Dashboard | Grid -->
  <nav class="sub-nav">
    <button
      class="sub-nav__btn"
      [class.sub-nav__btn--active]="activeView() === 'dashboard'"
      (click)="setView('dashboard')">
      Dashboard
    </button>
    <button
      class="sub-nav__btn"
      [class.sub-nav__btn--active]="activeView() === 'grid'"
      (click)="setView('grid')">
      Grid
    </button>
  </nav>

  <!-- Content viewport — only one view mounted at a time -->
  <main class="content-viewport">
    @switch (activeTab()) {
      @case ('coverage') {
        @if (activeView() === 'dashboard') {
          <app-coverage-banker-dashboard />
        } @else {
          <app-coverage-banker-grid />
        }
      }
      @case ('syndicate') {
        @if (activeView() === 'dashboard') {
          <app-syndicate-banker-dashboard />
        } @else {
          <app-syndicate-banker-grid />
        }
      }
      @case ('bel') {
        @if (activeView() === 'dashboard') {
          <app-bel-dashboard />
        } @else {
          <app-bel-grid />
        }
      }
      @case ('conflict') {
        @if (activeView() === 'dashboard') {
          <app-conflict-clearance-dashboard />
        } @else {
          <app-conflict-clearance-grid />
        }
      }
      @case ('compliance') {
        @if (activeView() === 'dashboard') {
          <app-compliance-viewer-dashboard />
        } @else {
          <app-compliance-viewer-grid />
        }
      }
    }
  </main>

</div>
```

- [ ] **Step 3: Update app.component.scss**

Replace the entire file. The only changes: grid-template-rows adds a 4th row for sub-nav, rename `.grid-viewport` to `.content-viewport`, and add `.sub-nav` styles.

```scss
// deal-management-demo/src/app/app.component.scss
:host { display: block; }

.shell {
  display: grid;
  grid-template-rows: 52px 52px 36px 1fr;
  height: 100vh;
  overflow: hidden;
}

/* ── App header ─────────────────────────────────────────────────────────── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #0d1b2a;
  color: #fff;

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__logo {
    font-size: 20px;
    color: #4fc3f7;
  }

  &__name {
    font-weight: 700;
    font-size: 15px;
  }

  &__tag {
    font-size: 11px;
    background: rgba(79,195,247,0.2);
    color: #4fc3f7;
    padding: 2px 8px;
    border-radius: 10px;
    border: 1px solid rgba(79,195,247,0.3);
  }

  &__meta {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
}

/* ── Persona tab nav ─────────────────────────────────────────────────────── */
.persona-nav {
  display: flex;
  background: #fff;
  border-bottom: 2px solid var(--color-border-subtle);
  padding: 0 8px;
  gap: 2px;
  overflow-x: auto;
}

.persona-tab {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  gap: 1px;
  transition: border-color 0.15s;
  white-space: nowrap;

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    transition: color 0.15s;
  }

  &__sub {
    font-size: 10px;
    color: var(--color-text-secondary);
    font-family: 'SF Mono', 'Fira Code', monospace;
    opacity: 0.7;
  }

  &--active {
    border-bottom-color: var(--color-brand-primary);

    .persona-tab__label {
      color: var(--color-brand-primary);
    }
  }

  &:hover:not(&--active) {
    background: var(--color-surface-raised);
  }
}

/* ── Sub-navigation (Dashboard | Grid) ──────────────────────────────────── */
.sub-nav {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 16px;
  background: var(--color-surface-secondary, #f8fafc);
  border-bottom: 1px solid var(--color-border-subtle, #e2e8f0);

  &__btn {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary, #64748b);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;

    &--active {
      color: var(--color-brand-primary, #2563eb);
      border-bottom-color: var(--color-brand-primary, #2563eb);
      font-weight: 600;
    }

    &:hover:not(&--active) {
      color: var(--color-text-primary, #0f172a);
    }
  }
}

/* ── Content viewport ───────────────────────────────────────────────────── */
.content-viewport {
  overflow: auto;
  display: flex;
  flex-direction: column;

  > * { flex: 1; min-height: 0; }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/app.component.ts deal-management-demo/src/app/app.component.html deal-management-demo/src/app/app.component.scss
git commit -m "feat(shell): add sub-navigation (Dashboard | Grid) and Compliance Viewer tab"
```

---

## Task 10: Compliance Viewer Grid Component

**Files:**
- Create: `deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.ts`
- Create: `deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.html`
- Create: `deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.scss`

This is a **strict read-only** grid per the composition spec at `specs/domain/patterns/ag-grid-datatable/compliance-viewer.spec.md`. No checkbox, no actions, no bulk bar. Model it on the Conflict Clearance grid.

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.ts
/**
 * @spec ds/patterns/ag-grid-datatable v2.0.0
 * @persona domain/personas/compliance-viewer v1.0.0
 * @entitlement domain/entitlements/mnpi-full v1.0.0
 */
import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { DealStore } from '../../../state/deal.store';
import { Deal } from '../../../shared/types/deal.types';
import { DealStageRendererComponent } from '../../../shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component';
import { ConflictStatusRendererComponent } from '../../../shared/cell-renderers/conflict-status-renderer/conflict-status-renderer.component';
import { StatusBadgeRendererComponent } from '../../../shared/primitives/status-badge/status-badge-renderer.component';

@Component({
  selector: 'app-compliance-viewer-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './deal-grid.component.html',
  styleUrl: './deal-grid.component.scss',
})
export class ComplianceViewerGridComponent implements OnInit {
  private readonly store = inject(DealStore);

  readonly isLoading = this.store.isLoading;
  readonly hasError = this.store.hasError;
  readonly rowData = this.store.items;

  // Strict read-only: no row selection, no checkbox, no actions (per spec §4, §5, §7)
  readonly gridOptions: GridOptions<Deal> = {
    rowHeight: 48,
    headerHeight: 52,
    animateRows: true,
    rowSelection: undefined,
    suppressRowClickSelection: true,
    defaultColDef: {
      sortable: true,
      resizable: true,
      minWidth: 100,
    },
  };

  readonly columnDefs: ColDef<Deal>[] = [
    // §2 col 1: Deal Name
    { field: 'dealName', headerName: 'Deal Name', minWidth: 180 },
    // §2 col 2: Stage
    { field: 'stage', headerName: 'Stage', cellRenderer: DealStageRendererComponent, width: 130 },
    // §2 col 3: Issuer (mapped from counterpartyName → issuerName in demo)
    { field: 'issuerName', headerName: 'Counterparty', minWidth: 160 },
    // §2 col 4: MNPI Flag
    {
      field: 'mnpiFlag',
      headerName: 'MNPI Flag',
      width: 110,
      cellRenderer: StatusBadgeRendererComponent,
      cellRendererParams: (params: any) => ({
        value: params.value ? 'Yes' : 'No',
        variant: params.value ? 'error' : 'neutral',
      }),
      valueFormatter: (params: any) => params.value ? 'Yes' : 'No',
    },
    // §2 col 5: Info Barrier
    { field: 'infoBarrier', headerName: 'Information Barrier', width: 150,
      valueFormatter: (params: any) => params.value ?? 'None' },
    // §2 col 6: Conflict Status
    { field: 'conflictStatus', headerName: 'Conflict Status', cellRenderer: ConflictStatusRendererComponent, width: 140 },
    // §2 col 7: Conflict Reviewed By
    { field: 'conflictReviewedBy', headerName: 'Reviewed By', width: 140,
      valueFormatter: (params: any) => params.value ?? '—' },
    // §2 col 8: Conflict Review Date
    { field: 'conflictReviewDate', headerName: 'Review Date', width: 120,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '—' },
    // §2 col 9: Conflict Notes
    { field: 'conflictNotes', headerName: 'Notes', minWidth: 200, flex: 1,
      valueFormatter: (params: any) => params.value ?? '—',
      tooltipField: 'conflictNotes' },
    // §2 col 10: Audit Timestamp (pinned right)
    { field: 'auditTimestamp', headerName: 'Audit Timestamp', width: 150, pinned: 'right',
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleString() : '—',
      sort: 'desc' },
  ];

  ngOnInit(): void {
    this.store.loadDeals();
  }
}
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.html -->
<!-- No bulk action bar — Compliance Viewer is strict read-only (spec §5) -->
<div class="compliance-grid">
  @if (isLoading()) {
    <div class="compliance-grid__loading">
      <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5,6,7,8]"></div>
    </div>
  } @else if (hasError()) {
    <div class="compliance-grid__error">
      <span>Unable to load deals. Please try again.</span>
    </div>
  } @else {
    <ag-grid-angular
      class="ag-theme-alpine compliance-grid__grid"
      [rowData]="rowData()"
      [columnDefs]="columnDefs"
      [gridOptions]="gridOptions" />
  }
</div>
```

Wait — the template uses `*ngFor` which is the old syntax. Let me fix that:

```html
<!-- deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.html -->
<!-- No bulk action bar — Compliance Viewer is strict read-only (spec §5) -->
<div class="compliance-grid">
  @if (isLoading()) {
    <div class="compliance-grid__loading">
      @for (i of [1,2,3,4,5,6,7,8]; track i) {
        <div class="skeleton-row"></div>
      }
    </div>
  } @else if (hasError()) {
    <div class="compliance-grid__error">
      <span>Unable to load deals. Please try again.</span>
    </div>
  } @else {
    <ag-grid-angular
      class="ag-theme-alpine compliance-grid__grid"
      [rowData]="rowData()"
      [columnDefs]="columnDefs"
      [gridOptions]="gridOptions" />
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/features/compliance-viewer/deal-grid/deal-grid.component.scss
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.compliance-grid {
  flex: 1;
  display: flex;
  flex-direction: column;

  &__grid {
    flex: 1;
    width: 100%;
  }

  &__loading {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--color-error, #dc2626);
    font-size: 14px;
  }
}

.skeleton-row {
  height: 48px;
  background: linear-gradient(90deg,
    var(--color-surface-secondary, #f1f5f9) 25%,
    var(--color-surface-primary, #e2e8f0) 50%,
    var(--color-surface-secondary, #f1f5f9) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/features/compliance-viewer/
git commit -m "feat(compliance-viewer): add read-only grid — MNPI, info barriers, audit columns"
```

---

## Task 11: Coverage Banker Dashboard

**Files:**
- Create: `deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.ts`
- Create: `deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.html`
- Create: `deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.scss`

The Coverage Banker cares about: pipeline value, active deals count, revenue potential, stage distribution, top deals by size, recent activity, and approaching close dates.

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.ts
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';
import { MiniGridComponent } from '../../../shared/widgets/mini-grid/mini-grid.component';
import type { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-coverage-banker-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MetricCardComponent,
    StatusDistributionComponent,
    ActivityFeedComponent,
    AlertListComponent,
    MiniGridComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class CoverageBankerDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  readonly topDealsColumns: ColDef[] = [
    { field: 'dealName', headerName: 'Deal', flex: 1 },
    { field: 'stage', headerName: 'Stage', width: 110 },
    { field: 'dealSizeUsd', headerName: 'Size ($m)', width: 100,
      valueFormatter: (p: any) => `$${p.value}m` },
    { field: 'grossSpreadBps', headerName: 'Spread', width: 80,
      valueFormatter: (p: any) => `${p.value}bps` },
  ];

  ngOnInit(): void {
    this.store.loadDeals();
  }
}
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.html -->
<div class="dashboard">
  @if (store.isLoading()) {
    <div class="dashboard__loading">Loading dashboard...</div>
  } @else if (store.hasError()) {
    <div class="dashboard__error">Unable to load dashboard data.</div>
  } @else {
    <!-- Row 1: Metric cards -->
    <div class="dashboard__row dashboard__row--metrics">
      <app-metric-card label="Pipeline Value" [value]="store.totalPipelineValue()" format="currency" trend="up" />
      <app-metric-card label="Active Deals" [value]="store.activeDealCount()" format="number" />
      <app-metric-card label="Avg Deal Size" [value]="store.avgDealSize()" format="currency" />
      <app-metric-card label="Pending Conflicts" [value]="store.pendingConflicts()" format="number" />
    </div>

    <!-- Row 2: Stage distribution + Top deals -->
    <div class="dashboard__row dashboard__row--two-col">
      <app-status-distribution title="Deals by Stage" [segments]="store.dealsByStage()" />
      <app-mini-grid title="Top Deals by Size" [columnDefs]="topDealsColumns" [rowData]="store.topDealsBySize()" [maxRows]="5" />
    </div>

    <!-- Row 3: Activity feed + Alerts -->
    <div class="dashboard__row dashboard__row--two-col">
      <app-activity-feed title="Recent Activity" [items]="store.activityFeed()" [maxItems]="8" />
      <app-alert-list title="Alerts" [items]="store.alerts()" [maxItems]="5" />
    </div>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/features/coverage-banker/dashboard/dashboard.component.scss
:host { display: block; }

.dashboard {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;

  &__loading, &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    font-size: 14px;
    color: var(--color-text-secondary, #64748b);
  }

  &__error { color: var(--color-error, #dc2626); }

  &__row {
    display: grid;
    gap: 16px;
  }

  &__row--metrics {
    grid-template-columns: repeat(4, 1fr);
  }

  &__row--two-col {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/features/coverage-banker/dashboard/
git commit -m "feat(coverage-banker): add dashboard — pipeline metrics, stage dist, top deals, activity"
```

---

## Task 12: Syndicate Banker Dashboard

**Files:**
- Create: `deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.ts`
- Create: `deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.html`
- Create: `deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.scss`

The Syndicate Banker focuses on book-building: coverage multiples, allocations, pricing dates.

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.ts
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { MiniGridComponent } from '../../../shared/widgets/mini-grid/mini-grid.component';
import type { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-syndicate-banker-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MetricCardComponent,
    StatusDistributionComponent,
    ActivityFeedComponent,
    MiniGridComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class SyndicateBankerDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  readonly approachingCloseColumns: ColDef[] = [
    { field: 'dealName', headerName: 'Deal', flex: 1 },
    { field: 'stage', headerName: 'Stage', width: 100 },
    { field: 'bookbuildCoverageMultiple', headerName: 'Book Cov.', width: 90,
      valueFormatter: (p: any) => p.value > 0 ? `${p.value.toFixed(1)}x` : '—' },
    { field: 'expectedCloseDate', headerName: 'Close Date', width: 110,
      valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : '—' },
  ];

  ngOnInit(): void {
    this.store.loadDeals();
  }
}
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.html -->
<div class="dashboard">
  @if (store.isLoading()) {
    <div class="dashboard__loading">Loading dashboard...</div>
  } @else if (store.hasError()) {
    <div class="dashboard__error">Unable to load dashboard data.</div>
  } @else {
    <!-- Row 1: Metric cards -->
    <div class="dashboard__row dashboard__row--metrics">
      <app-metric-card label="Active Deals" [value]="store.activeDealCount()" format="number" />
      <app-metric-card label="Pipeline Value" [value]="store.totalPipelineValue()" format="currency" />
      <app-metric-card label="Avg Deal Size" [value]="store.avgDealSize()" format="currency" />
      <app-metric-card label="Total Deals" [value]="store.totalDealCount()" format="number" />
    </div>

    <!-- Row 2: Stage distribution + Approaching close -->
    <div class="dashboard__row dashboard__row--two-col">
      <app-status-distribution title="Deals by Stage" [segments]="store.dealsByStage()" />
      <app-mini-grid title="Approaching Close" [columnDefs]="approachingCloseColumns" [rowData]="store.approachingClose()" [maxRows]="5" />
    </div>

    <!-- Row 3: Activity feed -->
    <div class="dashboard__row">
      <app-activity-feed title="Recent Activity" [items]="store.activityFeed()" [maxItems]="8" />
    </div>
  }
</div>
```

- [ ] **Step 3: Create the styles**

Use the same dashboard layout as Coverage Banker. Copy the SCSS:

```scss
// deal-management-demo/src/app/features/syndicate-banker/dashboard/dashboard.component.scss
:host { display: block; }

.dashboard {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;

  &__loading, &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    font-size: 14px;
    color: var(--color-text-secondary, #64748b);
  }

  &__error { color: var(--color-error, #dc2626); }

  &__row {
    display: grid;
    gap: 16px;
  }

  &__row--metrics {
    grid-template-columns: repeat(4, 1fr);
  }

  &__row--two-col {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/features/syndicate-banker/dashboard/
git commit -m "feat(syndicate-banker): add dashboard — book coverage, approaching close, activity"
```

---

## Task 13: Business Execution Lead Dashboard

**Files:**
- Create: `deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.ts`
- Create: `deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.html`
- Create: `deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.scss`

BEL focuses on milestones, timeline, execution risk.

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.ts
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';
import { MiniGridComponent } from '../../../shared/widgets/mini-grid/mini-grid.component';
import type { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-bel-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MetricCardComponent,
    StatusDistributionComponent,
    AlertListComponent,
    MiniGridComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class BusinessExecutionLeadDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  readonly approachingCloseColumns: ColDef[] = [
    { field: 'dealName', headerName: 'Deal', flex: 1 },
    { field: 'completedMilestones', headerName: 'Done', width: 60 },
    { field: 'totalMilestones', headerName: 'Total', width: 60 },
    { field: 'expectedCloseDate', headerName: 'Close Date', width: 110,
      valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : '—' },
  ];

  ngOnInit(): void {
    this.store.loadDeals();
  }
}
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.html -->
<div class="dashboard">
  @if (store.isLoading()) {
    <div class="dashboard__loading">Loading dashboard...</div>
  } @else if (store.hasError()) {
    <div class="dashboard__error">Unable to load dashboard data.</div>
  } @else {
    <!-- Row 1: Metric cards -->
    <div class="dashboard__row dashboard__row--metrics">
      <app-metric-card label="Active Deals" [value]="store.activeDealCount()" format="number" />
      <app-metric-card label="Avg Milestone %" [value]="store.avgMilestonePercent()" format="percent" />
      <app-metric-card label="Pipeline Value" [value]="store.totalPipelineValue()" format="currency" />
      <app-metric-card label="Pending Conflicts" [value]="store.pendingConflicts()" format="number" />
    </div>

    <!-- Row 2: Stage distribution + Approaching close (milestone view) -->
    <div class="dashboard__row dashboard__row--two-col">
      <app-status-distribution title="Deals by Stage" [segments]="store.dealsByStage()" />
      <app-mini-grid title="Approaching Close" [columnDefs]="approachingCloseColumns" [rowData]="store.approachingClose()" [maxRows]="5" />
    </div>

    <!-- Row 3: Alerts (execution risks) -->
    <div class="dashboard__row">
      <app-alert-list title="Execution Alerts" [items]="store.alerts()" [maxItems]="5" />
    </div>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/features/business-execution-lead/dashboard/dashboard.component.scss
:host { display: block; }

.dashboard {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;

  &__loading, &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    font-size: 14px;
    color: var(--color-text-secondary, #64748b);
  }

  &__error { color: var(--color-error, #dc2626); }

  &__row {
    display: grid;
    gap: 16px;
  }

  &__row--metrics {
    grid-template-columns: repeat(4, 1fr);
  }

  &__row--two-col {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/features/business-execution-lead/dashboard/
git commit -m "feat(bel): add dashboard — milestones, execution alerts, approaching close"
```

---

## Task 14: Conflict Clearance Dashboard

**Files:**
- Create: `deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.ts`
- Create: `deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.html`
- Create: `deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.scss`

Conflict Clearance focuses on conflict statuses, flagged/pending counts, review activity.

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.ts
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';

@Component({
  selector: 'app-conflict-clearance-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MetricCardComponent,
    StatusDistributionComponent,
    ActivityFeedComponent,
    AlertListComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class ConflictClearanceDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  ngOnInit(): void {
    this.store.loadDeals();
  }
}
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.html -->
<div class="dashboard">
  @if (store.isLoading()) {
    <div class="dashboard__loading">Loading dashboard...</div>
  } @else if (store.hasError()) {
    <div class="dashboard__error">Unable to load dashboard data.</div>
  } @else {
    <!-- Row 1: Metric cards -->
    <div class="dashboard__row dashboard__row--metrics">
      <app-metric-card label="Pending Reviews" [value]="store.pendingConflicts()" format="number" />
      <app-metric-card label="Flagged Conflicts" [value]="store.flaggedConflicts()" format="number" />
      <app-metric-card label="Total Deals" [value]="store.totalDealCount()" format="number" />
      <app-metric-card label="Active Deals" [value]="store.activeDealCount()" format="number" />
    </div>

    <!-- Row 2: Conflict status distribution + Alerts -->
    <div class="dashboard__row dashboard__row--two-col">
      <app-status-distribution title="Conflict Status Distribution" [segments]="store.dealsByConflictStatus()" />
      <app-alert-list title="Conflict Alerts" [items]="store.alerts()" [maxItems]="5" />
    </div>

    <!-- Row 3: Activity feed -->
    <div class="dashboard__row">
      <app-activity-feed title="Recent Conflict Activity" [items]="store.activityFeed()" [maxItems]="8" />
    </div>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/features/conflict-clearance/dashboard/dashboard.component.scss
:host { display: block; }

.dashboard {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;

  &__loading, &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    font-size: 14px;
    color: var(--color-text-secondary, #64748b);
  }

  &__error { color: var(--color-error, #dc2626); }

  &__row {
    display: grid;
    gap: 16px;
  }

  &__row--metrics {
    grid-template-columns: repeat(4, 1fr);
  }

  &__row--two-col {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/features/conflict-clearance/dashboard/
git commit -m "feat(conflict-clearance): add dashboard — conflict status dist, pending/flagged counts"
```

---

## Task 15: Compliance Viewer Dashboard

**Files:**
- Create: `deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.ts`
- Create: `deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.html`
- Create: `deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.scss`

Compliance Viewer focuses on MNPI flags, info barriers, conflict statuses, and audit activity.

- [ ] **Step 1: Create the component TypeScript**

```typescript
// deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.ts
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DealStore } from '../../../state/deal.store';
import { MetricCardComponent } from '../../../shared/widgets/metric-card/metric-card.component';
import { StatusDistributionComponent } from '../../../shared/widgets/status-distribution/status-distribution.component';
import { ActivityFeedComponent } from '../../../shared/widgets/activity-feed/activity-feed.component';
import { AlertListComponent } from '../../../shared/widgets/alert-list/alert-list.component';

@Component({
  selector: 'app-compliance-viewer-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MetricCardComponent,
    StatusDistributionComponent,
    ActivityFeedComponent,
    AlertListComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class ComplianceViewerDashboardComponent implements OnInit {
  protected readonly store = inject(DealStore);

  ngOnInit(): void {
    this.store.loadDeals();
  }
}
```

- [ ] **Step 2: Create the template**

```html
<!-- deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.html -->
<div class="dashboard">
  @if (store.isLoading()) {
    <div class="dashboard__loading">Loading dashboard...</div>
  } @else if (store.hasError()) {
    <div class="dashboard__error">Unable to load dashboard data.</div>
  } @else {
    <!-- Row 1: Metric cards -->
    <div class="dashboard__row dashboard__row--metrics">
      <app-metric-card label="MNPI Flagged" [value]="store.mnpiFlaggedCount()" format="number" />
      <app-metric-card label="Pending Reviews" [value]="store.pendingConflicts()" format="number" />
      <app-metric-card label="Flagged Conflicts" [value]="store.flaggedConflicts()" format="number" />
      <app-metric-card label="Total Deals" [value]="store.totalDealCount()" format="number" />
    </div>

    <!-- Row 2: Conflict status distribution + Alerts -->
    <div class="dashboard__row dashboard__row--two-col">
      <app-status-distribution title="Conflict Status Distribution" [segments]="store.dealsByConflictStatus()" />
      <app-alert-list title="Compliance Alerts" [items]="store.alerts()" [maxItems]="5" />
    </div>

    <!-- Row 3: Activity feed -->
    <div class="dashboard__row">
      <app-activity-feed title="Audit Activity" [items]="store.activityFeed()" [maxItems]="10" />
    </div>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// deal-management-demo/src/app/features/compliance-viewer/dashboard/dashboard.component.scss
:host { display: block; }

.dashboard {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;

  &__loading, &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    font-size: 14px;
    color: var(--color-text-secondary, #64748b);
  }

  &__error { color: var(--color-error, #dc2626); }

  &__row {
    display: grid;
    gap: 16px;
  }

  &__row--metrics {
    grid-template-columns: repeat(4, 1fr);
  }

  &__row--two-col {
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add deal-management-demo/src/app/features/compliance-viewer/dashboard/
git commit -m "feat(compliance-viewer): add dashboard — MNPI flags, conflict dist, audit activity"
```

---

## Task 16: Write Dashboard Base Pattern Spec

**Files:**
- Create: `specs/ds/patterns/dashboard.spec.md`

- [ ] **Step 1: Write the spec**

```markdown
# Pattern Spec: Dashboard
**spec-id:** `ds/patterns/dashboard`
**version:** `1.0.0`
**status:** `active`
**owner:** `UI Architecture`
**last-reviewed:** `2026-04-08`
**applies-to:** `Angular 19+`
**replaces:** `n/a`

---

## 1. Intent

Defines the standard dashboard pattern for persona-driven views. A dashboard is a
configurable grid of widgets — each widget is a generic, DS-portable component that
receives data and display params from a composition spec.

> **Agent instruction:** Read this spec alongside `ds/tokens/semantic` and
> `ds/components/component-map`. Then read the persona's dashboard composition spec
> to determine which widgets to render and with what params.

---

## 2. Scope

### In scope
- Widget type registry and param contracts
- Dashboard layout system (rows and columns)
- Per-widget loading, empty, and error states
- Accessibility requirements for widget containers

### Out of scope
- Specific widget content → handled by composition specs
- Charts or data visualizations → future spec
- Real-time refresh / WebSocket → future spec
- Page template (header, navigation) → `ds/templates/deal-pipeline-page`

---

## 3. Design System Tokens

```scss
@use '@company/spec-tokens/color'   as color;
@use '@company/spec-tokens/type'    as type;
@use '@company/spec-tokens/spacing' as spacing;
```

| Property | Token | Notes |
|---|---|---|
| Widget background | `color.$surface-primary` | Card surface |
| Widget border | `color.$border-subtle` | 1px solid |
| Widget border radius | `spacing.$s2` (8px) | Consistent card rounding |
| Widget padding | `spacing.$s4` (16px) | Internal padding |
| Widget gap | `spacing.$s4` (16px) | Between widgets in a row |
| Row gap | `spacing.$s4` (16px) | Between rows |
| Dashboard padding | `spacing.$s5` (20px) | Outer container |
| Widget title | `type.$label-large` (13px, 600) | Section heading |
| Metric value | `type.$display-small` (28px, 700) | KPI number |
| Metric label | `type.$label-small` (12px, 500) | KPI label |

> **Agent instruction:** Never use raw hex, px, or rem values for any property listed above.

---

## 4. Component Structure

### 4.1 File layout

```
features/{persona}/dashboard/
├── dashboard.component.ts
├── dashboard.component.html
└── dashboard.component.scss
```

### 4.2 Required inputs

Dashboard components receive data from the DealStore via inject() and render
widget components in a grid layout defined by the composition spec.

---

## 5. Widget Type Registry

| Widget Type | Component | Required Params | Optional Params |
|---|---|---|---|
| `metricCard` | `MetricCardComponent` | `label`, `value`, `format` | `trend`, `previousValue`, `clickable` |
| `miniGrid` | `MiniGridComponent` | `columnDefs`, `rowData` | `maxRows` (default 5), `title`, `viewAllLabel` |
| `statusDistribution` | `StatusDistributionComponent` | `segments` | `title` |
| `activityFeed` | `ActivityFeedComponent` | `items` | `maxItems` (default 10), `title` |
| `alertList` | `AlertListComponent` | `items` | `maxItems` (default 5), `title` |

---

## 6. Layout System

Dashboards use a row-based grid layout:

```
Row 1: [widget] [widget] [widget] [widget]    ← metrics row (4-col)
Row 2: [widget] [widget]                       ← two-col row
Row 3: [widget]                                ← full-width row
```

Layout classes:
- `.dashboard__row--metrics` → `grid-template-columns: repeat(4, 1fr)`
- `.dashboard__row--two-col` → `grid-template-columns: 1fr 1fr`
- `.dashboard__row` (default) → single column

---

## 7. States

### 7.1 Loading state

Dashboard shows a centered loading message while the store loads.

### 7.2 Empty state

Individual widgets handle empty data gracefully (e.g., "No recent activity").

### 7.3 Error state

Dashboard shows a centered error message if the store enters error state.

---

## 8. Accessibility

- Widget titles use `<h3>` elements for heading hierarchy (page title is `<h1>`, persona is `<h2>`)
- StatusDistribution bar has `role="img"` with `aria-label`
- Clickable MetricCards have `role="button"` and `tabindex="0"`
- AlertList items convey severity through text, not color alone

---

## 9. Agent Checklist

- [ ] Semantic tokens read — all visual properties from §3
- [ ] Component map read — widget components resolved
- [ ] All 5 widget types available per §5
- [ ] Layout uses row-based grid per §6
- [ ] Loading state implemented per §7.1
- [ ] Empty state per widget per §7.2
- [ ] Error state implemented per §7.3
- [ ] Heading hierarchy per §8
- [ ] `ChangeDetectionStrategy.OnPush` on dashboard component
- [ ] `standalone: true` on dashboard component
- [ ] `inject()` for DealStore — no constructor DI
- [ ] `@spec` header present with spec-id and version

---

## 10. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |

---

## 11. Related Specs

- `ds/tokens/semantic` — token adapter
- `ds/components/component-map` — component adapter
- `ds/templates/deal-pipeline-page` — page template
- `domain/patterns/dashboard/*` — persona composition specs
```

- [ ] **Step 2: Commit**

```bash
git add specs/ds/patterns/dashboard.spec.md
git commit -m "spec: add ds/patterns/dashboard v1.0.0 — base dashboard pattern"
```

---

## Task 17: Write Deal Pipeline Page Template Spec

**Files:**
- Create: `specs/ds/templates/deal-pipeline-page.spec.md`

- [ ] **Step 1: Create the templates directory and spec**

```markdown
# Template Spec: Deal Pipeline Page
**spec-id:** `ds/templates/deal-pipeline-page`
**version:** `1.0.0`
**status:** `active`
**owner:** `UI Architecture`
**last-reviewed:** `2026-04-08`
**applies-to:** `Angular 19+`
**replaces:** `n/a`

---

## 1. Intent

Defines the page shell for a persona-driven deal pipeline view. Each persona gets a
page with sub-navigation between Dashboard and Grid views, sharing the same DealStore.

> **Agent instruction:** This spec defines the page template. Read it before building
> any persona's dashboard or grid view. The sub-navigation is signal-based — do not
> use Angular Router.

---

## 2. Scope

### In scope
- Page shell layout: persona header + sub-navigation + content viewport
- Sub-navigation between Dashboard and Grid views
- Signal-based view switching (no Angular Router)
- Cross-navigation from dashboard widgets to grid view

### Out of scope
- Widget content → `ds/patterns/dashboard` + composition specs
- Grid content → `ds/patterns/ag-grid-datatable` + composition specs
- Global navigation (persona tabs) → app shell, not this spec

---

## 3. Page Structure

```
┌──────────────────────────────────────────┐
│  App Header (app shell)                  │
├──────────────────────────────────────────┤
│  Persona Tabs (app shell)                │
├──────────────────────────────────────────┤
│  Sub-Nav: [Dashboard] [Grid]             │  ← this spec
├──────────────────────────────────────────┤
│  Content Viewport                        │  ← this spec
│  ┌────────────────────────────────────┐  │
│  │ Dashboard or Grid (one at a time)  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 4. Navigation Signals

```typescript
activeView = signal<'dashboard' | 'grid'>('dashboard');
```

- Default view: `dashboard`
- Switching persona tab resets view to `dashboard`
- "View all" links in widgets set view to `grid`

---

## 5. Sub-Navigation Bar

| Property | Token | Value |
|---|---|---|
| Height | — | 36px |
| Background | `color.$surface-secondary` | Light gray |
| Border bottom | `color.$border-subtle` | 1px solid |
| Active tab color | `color.$brand-primary` | Blue |
| Active tab border | `color.$brand-primary` | 2px bottom |
| Font size | `type.$label-small` | 12px |
| Font weight (active) | — | 600 |

---

## 6. Agent Checklist

- [ ] Sub-navigation renders Dashboard and Grid buttons
- [ ] Default view is Dashboard
- [ ] Persona tab switch resets to Dashboard
- [ ] Signal-based navigation — no Angular Router
- [ ] Only one view mounted at a time
- [ ] Content viewport fills remaining height

---

## 7. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |
```

- [ ] **Step 2: Commit**

```bash
mkdir -p specs/ds/templates
git add specs/ds/templates/deal-pipeline-page.spec.md
git commit -m "spec: add ds/templates/deal-pipeline-page v1.0.0 — page shell template"
```

---

## Task 18: Write 6 Dashboard Composition Specs

**Files:**
- Create: `specs/domain/patterns/dashboard/coverage-banker.spec.md`
- Create: `specs/domain/patterns/dashboard/syndicate-banker.spec.md`
- Create: `specs/domain/patterns/dashboard/business-execution-lead.spec.md`
- Create: `specs/domain/patterns/dashboard/conflict-clearance.spec.md`
- Create: `specs/domain/patterns/dashboard/compliance-viewer.spec.md`
- Create: `specs/domain/patterns/dashboard/deal-origination-banker.spec.md`

- [ ] **Step 1: Create the dashboard directory**

```bash
mkdir -p specs/domain/patterns/dashboard
```

- [ ] **Step 2: Write coverage-banker.spec.md**

```markdown
# Composition Spec: Dashboard — Coverage Banker
**spec-id:** `domain/patterns/dashboard/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/coverage-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Coverage Banker. Revenue-focused metrics,
pipeline value as primary KPI, stage distribution, top deals by size, recent activity,
and conflict alerts.

> **Agent instruction:** Read specs in this order:
> 1. `ds/tokens/semantic`
> 2. `ds/components/component-map`
> 3. `ds/patterns/dashboard`
> 4. `ds/templates/deal-pipeline-page`
> 5. This spec

---

## 2. Widget Layout

| Row | Slot | Widget Type | Params |
|---|---|---|---|
| 1 | metrics-1 | metricCard | metric: totalPipelineValue, label: Pipeline Value, format: currency, trend: up |
| 1 | metrics-2 | metricCard | metric: activeDealCount, label: Active Deals, format: number |
| 1 | metrics-3 | metricCard | metric: avgDealSize, label: Avg Deal Size, format: currency |
| 1 | metrics-4 | metricCard | metric: pendingConflicts, label: Pending Conflicts, format: number |
| 2 | main-1 | statusDistribution | title: Deals by Stage, groupBy: stage |
| 2 | main-2 | miniGrid | title: Top Deals by Size, dataSource: topDealsBySize, maxRows: 5 |
| 3 | detail-1 | activityFeed | title: Recent Activity, maxItems: 8 |
| 3 | detail-2 | alertList | title: Alerts, maxItems: 5 |

---

## 3. MiniGrid Column Definitions

### Top Deals by Size (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | dealName | flex: 1 | — |
| 2 | Stage | stage | 110 | — |
| 3 | Size ($m) | dealSizeUsd | 100 | `$${value}m` |
| 4 | Spread | grossSpreadBps | 80 | `${value}bps` |

---

## 4. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 8 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] MiniGrid columns match §3
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |
```

- [ ] **Step 3: Write syndicate-banker.spec.md**

```markdown
# Composition Spec: Dashboard — Syndicate Banker
**spec-id:** `domain/patterns/dashboard/syndicate-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/syndicate-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Syndicate Banker. Book-building focus with
coverage multiples, approaching close dates, and stage distribution.

> **Agent instruction:** Read specs in this order:
> 1. `ds/tokens/semantic`
> 2. `ds/components/component-map`
> 3. `ds/patterns/dashboard`
> 4. `ds/templates/deal-pipeline-page`
> 5. This spec

---

## 2. Widget Layout

| Row | Slot | Widget Type | Params |
|---|---|---|---|
| 1 | metrics-1 | metricCard | metric: activeDealCount, label: Active Deals, format: number |
| 1 | metrics-2 | metricCard | metric: totalPipelineValue, label: Pipeline Value, format: currency |
| 1 | metrics-3 | metricCard | metric: avgDealSize, label: Avg Deal Size, format: currency |
| 1 | metrics-4 | metricCard | metric: totalDealCount, label: Total Deals, format: number |
| 2 | main-1 | statusDistribution | title: Deals by Stage, groupBy: stage |
| 2 | main-2 | miniGrid | title: Approaching Close, dataSource: approachingClose, maxRows: 5 |
| 3 | detail-1 | activityFeed | title: Recent Activity, maxItems: 8 |

---

## 3. MiniGrid Column Definitions

### Approaching Close (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | dealName | flex: 1 | — |
| 2 | Stage | stage | 100 | — |
| 3 | Book Cov. | bookbuildCoverageMultiple | 90 | `${value.toFixed(1)}x` or `—` if 0 |
| 4 | Close Date | expectedCloseDate | 110 | date locale |

---

## 4. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] MiniGrid columns match §3
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |
```

- [ ] **Step 4: Write business-execution-lead.spec.md**

```markdown
# Composition Spec: Dashboard — Business Execution Lead
**spec-id:** `domain/patterns/dashboard/business-execution-lead`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/business-execution-lead` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Business Execution Lead. Milestone and
timeline focused — execution risk visibility is primary.

> **Agent instruction:** Read specs in this order:
> 1. `ds/tokens/semantic`
> 2. `ds/components/component-map`
> 3. `ds/patterns/dashboard`
> 4. `ds/templates/deal-pipeline-page`
> 5. This spec

---

## 2. Widget Layout

| Row | Slot | Widget Type | Params |
|---|---|---|---|
| 1 | metrics-1 | metricCard | metric: activeDealCount, label: Active Deals, format: number |
| 1 | metrics-2 | metricCard | metric: avgMilestonePercent, label: Avg Milestone %, format: percent |
| 1 | metrics-3 | metricCard | metric: totalPipelineValue, label: Pipeline Value, format: currency |
| 1 | metrics-4 | metricCard | metric: pendingConflicts, label: Pending Conflicts, format: number |
| 2 | main-1 | statusDistribution | title: Deals by Stage, groupBy: stage |
| 2 | main-2 | miniGrid | title: Approaching Close, dataSource: approachingClose, maxRows: 5 |
| 3 | detail-1 | alertList | title: Execution Alerts, maxItems: 5 |

---

## 3. MiniGrid Column Definitions

### Approaching Close (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | dealName | flex: 1 | — |
| 2 | Done | completedMilestones | 60 | — |
| 3 | Total | totalMilestones | 60 | — |
| 4 | Close Date | expectedCloseDate | 110 | date locale |

---

## 4. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] MiniGrid columns match §3
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |
```

- [ ] **Step 5: Write conflict-clearance.spec.md**

```markdown
# Composition Spec: Dashboard — Conflict Clearance
**spec-id:** `domain/patterns/dashboard/conflict-clearance`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Legal
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/conflict-clearance` v1.0.0
**entitlement:** `domain/entitlements/deal-restricted` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by Conflict Clearance. Focused on conflict
review pipeline — pending, flagged, and cleared counts. Read-only context.

> **Agent instruction:** Read specs in this order:
> 1. `ds/tokens/semantic`
> 2. `ds/components/component-map`
> 3. `ds/patterns/dashboard`
> 4. `ds/templates/deal-pipeline-page`
> 5. This spec

---

## 2. Widget Layout

| Row | Slot | Widget Type | Params |
|---|---|---|---|
| 1 | metrics-1 | metricCard | metric: pendingConflicts, label: Pending Reviews, format: number |
| 1 | metrics-2 | metricCard | metric: flaggedConflicts, label: Flagged Conflicts, format: number |
| 1 | metrics-3 | metricCard | metric: totalDealCount, label: Total Deals, format: number |
| 1 | metrics-4 | metricCard | metric: activeDealCount, label: Active Deals, format: number |
| 2 | main-1 | statusDistribution | title: Conflict Status Distribution, groupBy: conflictStatus |
| 2 | main-2 | alertList | title: Conflict Alerts, maxItems: 5 |
| 3 | detail-1 | activityFeed | title: Recent Conflict Activity, maxItems: 8 |

---

## 3. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 4. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture / Legal |
```

- [ ] **Step 6: Write compliance-viewer.spec.md**

```markdown
# Composition Spec: Dashboard — Compliance Viewer
**spec-id:** `domain/patterns/dashboard/compliance-viewer`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture / Compliance
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/compliance-viewer` v1.0.0
**entitlement:** `domain/entitlements/mnpi-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Compliance Viewer. MNPI and audit focused —
shows MNPI flagged count, conflict statuses, and audit activity. Read-only context.

> **Agent instruction:** Read specs in this order:
> 1. `ds/tokens/semantic`
> 2. `ds/components/component-map`
> 3. `ds/patterns/dashboard`
> 4. `ds/templates/deal-pipeline-page`
> 5. This spec

---

## 2. Widget Layout

| Row | Slot | Widget Type | Params |
|---|---|---|---|
| 1 | metrics-1 | metricCard | metric: mnpiFlaggedCount, label: MNPI Flagged, format: number |
| 1 | metrics-2 | metricCard | metric: pendingConflicts, label: Pending Reviews, format: number |
| 1 | metrics-3 | metricCard | metric: flaggedConflicts, label: Flagged Conflicts, format: number |
| 1 | metrics-4 | metricCard | metric: totalDealCount, label: Total Deals, format: number |
| 2 | main-1 | statusDistribution | title: Conflict Status Distribution, groupBy: conflictStatus |
| 2 | main-2 | alertList | title: Compliance Alerts, maxItems: 5 |
| 3 | detail-1 | activityFeed | title: Audit Activity, maxItems: 10 |

---

## 3. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 7 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 4. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture / Compliance |
```

- [ ] **Step 7: Write deal-origination-banker.spec.md (Phase 3 agent test)**

```markdown
# Composition Spec: Dashboard — Deal Origination Banker
**spec-id:** `domain/patterns/dashboard/deal-origination-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** UI Architecture
**spec-type:** `composition`
**last-reviewed:** 2026-04-08
**base-pattern:** `ds/patterns/dashboard` v1.0.0
**persona:** `domain/personas/deal-origination-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0

---

## 1. Intent

Defines the dashboard as experienced by a Deal Origination Banker. Pipeline growth
focus — new deal creation, early-stage pipeline, and origination metrics.

> **Agent instruction:** Read specs in this order:
> 1. `ds/tokens/semantic`
> 2. `ds/components/component-map`
> 3. `ds/patterns/dashboard`
> 4. `ds/templates/deal-pipeline-page`
> 5. This spec
>
> This is an origination-focused view. Highlight early-stage deals
> (Origination, Mandate) over late-stage.

---

## 2. Widget Layout

| Row | Slot | Widget Type | Params |
|---|---|---|---|
| 1 | metrics-1 | metricCard | metric: totalPipelineValue, label: Pipeline Value, format: currency, trend: up |
| 1 | metrics-2 | metricCard | metric: activeDealCount, label: Active Deals, format: number |
| 1 | metrics-3 | metricCard | metric: avgDealSize, label: Avg Deal Size, format: currency |
| 1 | metrics-4 | metricCard | metric: totalDealCount, label: Total Deals, format: number |
| 2 | main-1 | statusDistribution | title: Deals by Stage, groupBy: stage |
| 2 | main-2 | miniGrid | title: Top Deals by Size, dataSource: topDealsBySize, maxRows: 5 |
| 3 | detail-1 | activityFeed | title: Recent Activity, maxItems: 8 |
| 3 | detail-2 | alertList | title: Alerts, maxItems: 5 |

---

## 3. MiniGrid Column Definitions

### Top Deals by Size (slot main-2)

| # | Column | Field | Width | Formatter |
|---|---|---|---|---|
| 1 | Deal | dealName | flex: 1 | — |
| 2 | Stage | stage | 110 | — |
| 3 | Size ($m) | dealSizeUsd | 100 | `$${value}m` |
| 4 | Type | dealType | 100 | — |

---

## 4. Agent Checklist

- [ ] Base dashboard spec read
- [ ] Page template spec read
- [ ] All 8 widgets rendered per §2
- [ ] Widget order matches §2 exactly
- [ ] MiniGrid columns match §3
- [ ] Loading, empty, error states implemented
- [ ] `@spec` header present

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-08 | Initial | UI Architecture |
```

- [ ] **Step 8: Commit all 6 composition specs**

```bash
git add specs/domain/patterns/dashboard/
git commit -m "spec: add 6 dashboard composition specs — all personas"
```

---

## Task 19: Update Primitives Registry

**Files:**
- Modify: `tools/registry/primitives.json`

- [ ] **Step 1: Add widget entries to primitives.json**

Add a new `"widgets"` category to the registry. Insert this after the existing `"gridPresets"` array in the JSON. The exact location will be determined by reading the file — add it as a sibling to `"renderers"`, `"editors"`, etc.

```json
"widgets": [
  {
    "key": "widget:metricCard",
    "category": "widgets",
    "description": "Single KPI card with formatted value, label, and optional trend indicator",
    "importPath": "src/app/shared/widgets/metric-card/metric-card.component",
    "exportName": "MetricCardComponent",
    "specRef": "ds/patterns/dashboard §5",
    "status": "active",
    "tags": ["dashboard", "kpi", "metric"],
    "paramsSchema": {
      "label": { "type": "string", "required": true },
      "value": { "type": "number | string", "required": true },
      "format": { "type": "'number' | 'currency' | 'percent'", "default": "'number'" },
      "trend": { "type": "'up' | 'down' | 'flat'" },
      "clickable": { "type": "boolean", "default": "false" }
    }
  },
  {
    "key": "widget:miniGrid",
    "category": "widgets",
    "description": "Compact AG Grid with limited rows and optional 'View all' link",
    "importPath": "src/app/shared/widgets/mini-grid/mini-grid.component",
    "exportName": "MiniGridComponent",
    "specRef": "ds/patterns/dashboard §5",
    "status": "active",
    "tags": ["dashboard", "grid", "compact"],
    "paramsSchema": {
      "columnDefs": { "type": "ColDef[]", "required": true },
      "rowData": { "type": "any[]", "required": true },
      "maxRows": { "type": "number", "default": "5" },
      "title": { "type": "string" },
      "viewAllLabel": { "type": "string", "default": "'View all'" }
    }
  },
  {
    "key": "widget:statusDistribution",
    "category": "widgets",
    "description": "Horizontal segmented bar showing count distribution with legend",
    "importPath": "src/app/shared/widgets/status-distribution/status-distribution.component",
    "exportName": "StatusDistributionComponent",
    "specRef": "ds/patterns/dashboard §5",
    "status": "active",
    "tags": ["dashboard", "distribution", "bar"],
    "paramsSchema": {
      "segments": { "type": "StatusSegment[]", "required": true },
      "title": { "type": "string" }
    }
  },
  {
    "key": "widget:activityFeed",
    "category": "widgets",
    "description": "Chronological list of activity events with timestamps and actors",
    "importPath": "src/app/shared/widgets/activity-feed/activity-feed.component",
    "exportName": "ActivityFeedComponent",
    "specRef": "ds/patterns/dashboard §5",
    "status": "active",
    "tags": ["dashboard", "activity", "feed", "timeline"],
    "paramsSchema": {
      "items": { "type": "ActivityEvent[]", "required": true },
      "maxItems": { "type": "number", "default": "10" },
      "title": { "type": "string" }
    }
  },
  {
    "key": "widget:alertList",
    "category": "widgets",
    "description": "Prioritized list of alerts with severity indicators",
    "importPath": "src/app/shared/widgets/alert-list/alert-list.component",
    "exportName": "AlertListComponent",
    "specRef": "ds/patterns/dashboard §5",
    "status": "active",
    "tags": ["dashboard", "alerts", "priority"],
    "paramsSchema": {
      "items": { "type": "AlertItem[]", "required": true },
      "maxItems": { "type": "number", "default": "5" },
      "title": { "type": "string" }
    }
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add tools/registry/primitives.json
git commit -m "feat(registry): add 5 dashboard widget primitives to primitives.json"
```

---

## Task 20: Update Registry Index

**Files:**
- Modify: `tools/registry/registry.json`

- [ ] **Step 1: Add new specs to registry.json**

Add entries for the new specs. Read the current `registry.json` to understand the structure, then add:

```json
{
  "spec-id": "ds/patterns/dashboard",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/ds/patterns/dashboard.spec.md",
  "dependencies": ["ds/tokens/semantic", "ds/components/component-map"]
},
{
  "spec-id": "ds/templates/deal-pipeline-page",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/ds/templates/deal-pipeline-page.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/patterns/ag-grid-datatable"]
},
{
  "spec-id": "domain/patterns/dashboard/coverage-banker",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/domain/patterns/dashboard/coverage-banker.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/templates/deal-pipeline-page"]
},
{
  "spec-id": "domain/patterns/dashboard/syndicate-banker",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/domain/patterns/dashboard/syndicate-banker.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/templates/deal-pipeline-page"]
},
{
  "spec-id": "domain/patterns/dashboard/business-execution-lead",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/domain/patterns/dashboard/business-execution-lead.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/templates/deal-pipeline-page"]
},
{
  "spec-id": "domain/patterns/dashboard/conflict-clearance",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/domain/patterns/dashboard/conflict-clearance.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/templates/deal-pipeline-page"]
},
{
  "spec-id": "domain/patterns/dashboard/compliance-viewer",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/domain/patterns/dashboard/compliance-viewer.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/templates/deal-pipeline-page"]
},
{
  "spec-id": "domain/patterns/dashboard/deal-origination-banker",
  "version": "1.0.0",
  "status": "active",
  "path": "specs/domain/patterns/dashboard/deal-origination-banker.spec.md",
  "dependencies": ["ds/patterns/dashboard", "ds/templates/deal-pipeline-page"]
}
```

- [ ] **Step 2: Commit**

```bash
git add tools/registry/registry.json
git commit -m "feat(registry): add dashboard specs to registry.json index"
```

---

## Task 21: Build and Verify

- [ ] **Step 1: Run the Angular build**

```bash
cd deal-management-demo && npx ng build
```

Expected: Build succeeds with no errors. Warnings about bundle size are acceptable.

- [ ] **Step 2: Fix any build errors**

If the build fails, read the error output and fix the specific issue. Common issues:
- Missing imports in components
- Incorrect import paths
- Type mismatches in store computed signals

- [ ] **Step 3: Run the dev server and verify**

```bash
cd deal-management-demo && npx ng serve --open
```

Manually verify:
- All 5 persona tabs render
- Sub-navigation shows Dashboard | Grid
- Dashboard view shows widgets for each persona
- Grid view shows the existing grids
- Switching personas resets to Dashboard view
- Compliance Viewer grid is read-only (no checkboxes, no actions)

- [ ] **Step 4: Run the compliance checker**

```bash
node tools/ci/spec-compliance-check.js
```

Expected: All files with `@spec` headers pass universal checks.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Phase 2 complete — 5 dashboard widgets, 5 persona dashboards, Compliance Viewer grid

Adds persona-driven dashboards with MetricCard, MiniGrid, StatusDistribution,
ActivityFeed, and AlertList widget components. Extends DealStore with computed
dashboard metrics. Adds Compliance Viewer persona (grid + dashboard). Adds
sub-navigation (Dashboard | Grid) to app shell. Writes 8 new specs (dashboard
base, page template, 6 persona compositions). Updates primitives registry."
```

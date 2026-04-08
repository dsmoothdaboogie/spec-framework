# Phase 1: Grid Refactor — Generic Primitives + Deal Wrappers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the demo app's 7 deal-specific cell renderers into thin wrappers over 2 new generic DS-portable primitives, then update all 4 grids and verify the app still works.

**Architecture:** Two generic primitives (`StatusBadgeRendererComponent` and `ValueDisplayRendererComponent`) provide pure rendering. Existing deal renderers become thin wrappers that contain business logic and delegate to the generics. Grid components continue importing wrappers — no grid code changes needed for the renderer refactor.

**Tech Stack:** Angular 19, ag-grid-angular 35.2, signals, standalone components.

**Design doc:** `docs/superpowers/specs/2026-04-08-generic-primitives-and-dashboard-design.md`

**Working directory:** `deal-management-demo/`

---

## File Map

**New files (generic primitives):**
- `src/app/shared/primitives/status-badge/status-badge-renderer.component.ts`
- `src/app/shared/primitives/status-badge/status-badge-renderer.component.html`
- `src/app/shared/primitives/status-badge/status-badge-renderer.component.scss`
- `src/app/shared/primitives/value-display/value-display-renderer.component.ts`
- `src/app/shared/primitives/value-display/value-display-renderer.component.html`
- `src/app/shared/primitives/value-display/value-display-renderer.component.scss`

**Modified files (wrappers — business logic preserved, rendering delegated):**
- `src/app/shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component.ts` + `.html`
- `src/app/shared/cell-renderers/conflict-status-renderer/conflict-status-renderer.component.ts` + `.html`
- `src/app/shared/cell-renderers/coverage-multiple-renderer/coverage-multiple-renderer.component.ts` + `.html`
- `src/app/shared/cell-renderers/days-countdown-renderer/days-countdown-renderer.component.ts` + `.html`
- `src/app/shared/cell-renderers/deal-size-renderer/deal-size-renderer.component.ts` + `.html`
- `src/app/shared/cell-renderers/fee-revenue-renderer/fee-revenue-renderer.component.ts` + `.html`
- `src/app/shared/cell-renderers/milestone-progress-renderer/milestone-progress-renderer.component.ts` + `.html`

**No grid component changes needed** — wrappers maintain the same class name and `ICellRendererAngularComp` interface.

---

### Task 1: Create StatusBadgeRendererComponent (generic primitive)

**Files:**
- Create: `deal-management-demo/src/app/shared/primitives/status-badge/status-badge-renderer.component.ts`
- Create: `deal-management-demo/src/app/shared/primitives/status-badge/status-badge-renderer.component.html`
- Create: `deal-management-demo/src/app/shared/primitives/status-badge/status-badge-renderer.component.scss`

This is a pure rendering component. It takes a label and a variant, renders a colored badge. Knows nothing about deals, stages, or conflicts.

- [ ] **Step 1: Create the component TypeScript**

```typescript
// status-badge-renderer.component.ts
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
```

- [ ] **Step 2: Create the template**

```html
<!-- status-badge-renderer.component.html -->
<span class="badge" [attr.data-variant]="variant()">{{ value() }}</span>
```

- [ ] **Step 3: Create the styles**

```scss
// status-badge-renderer.component.scss
:host {
  display: inline-flex;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;

  &[data-variant='success'] {
    background: var(--color-success-bg, rgba(52, 211, 153, 0.12));
    color: var(--color-success, #059669);
  }
  &[data-variant='warning'] {
    background: var(--color-warning-bg, rgba(251, 191, 36, 0.12));
    color: var(--color-warning, #d97706);
  }
  &[data-variant='error'] {
    background: var(--color-error-bg, rgba(239, 68, 68, 0.12));
    color: var(--color-error, #dc2626);
  }
  &[data-variant='info'] {
    background: var(--color-info-bg, rgba(59, 130, 246, 0.12));
    color: var(--color-info, #2563eb);
  }
  &[data-variant='neutral'] {
    background: var(--color-neutral-bg, rgba(148, 163, 184, 0.12));
    color: var(--color-neutral, #64748b);
  }
}
```

- [ ] **Step 4: Verify the app compiles**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`
Expected: Build succeeds (the component isn't used yet, but it should compile).

- [ ] **Step 5: Commit**

```bash
cd deal-management-demo && git add src/app/shared/primitives/ && cd ..
git add deal-management-demo/src/app/shared/primitives/
git commit -m "feat(primitives): add StatusBadgeRendererComponent — generic DS-portable badge"
```

---

### Task 2: Create ValueDisplayRendererComponent (generic primitive)

**Files:**
- Create: `deal-management-demo/src/app/shared/primitives/value-display/value-display-renderer.component.ts`
- Create: `deal-management-demo/src/app/shared/primitives/value-display/value-display-renderer.component.html`
- Create: `deal-management-demo/src/app/shared/primitives/value-display/value-display-renderer.component.scss`

A pure rendering component for formatted text values. Shows a primary value with optional secondary line and optional variant coloring (for values that need color-coded text like countdown days).

- [ ] **Step 1: Create the component TypeScript**

```typescript
// value-display-renderer.component.ts
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
```

- [ ] **Step 2: Create the template**

```html
<!-- value-display-renderer.component.html -->
<div class="value-display" [attr.data-variant]="variant()">
  <span class="primary" [class.bold]="bold()">{{ primaryText() }}</span>
  @if (secondaryText()) {
    <span class="secondary">{{ secondaryText() }}</span>
  }
</div>
```

- [ ] **Step 3: Create the styles**

```scss
// value-display-renderer.component.scss
:host {
  display: block;
}

.value-display {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.3;
}

.primary {
  font-size: 13px;

  &.bold {
    font-weight: 600;
  }
}

.secondary {
  font-size: 11px;
  opacity: 0.65;
}

[data-variant='success'] .primary { color: var(--color-success, #059669); }
[data-variant='warning'] .primary { color: var(--color-warning, #d97706); }
[data-variant='error'] .primary   { color: var(--color-error, #dc2626); }
[data-variant='neutral'] .primary { color: var(--color-neutral, #64748b); }
```

- [ ] **Step 4: Verify the app compiles**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add deal-management-demo/src/app/shared/primitives/
git commit -m "feat(primitives): add ValueDisplayRendererComponent — generic text/value display"
```

---

### Task 3: Refactor DealStageRendererComponent → wrapper over StatusBadge

**Files:**
- Modify: `deal-management-demo/src/app/shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component.ts`
- Modify: `deal-management-demo/src/app/shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component.html`

The wrapper keeps the `STAGE_VARIANT` mapping (business logic) and the `ICellRendererAngularComp` interface. It delegates rendering to `StatusBadgeRendererComponent`.

- [ ] **Step 1: Update the component TypeScript**

Replace the full content of `deal-stage-renderer.component.ts` with:

```typescript
// @spec-reads: domain/patterns/ag-grid-datatable/coverage-banker §2 stage color map
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DealStage } from '../../types/deal.types';
import { StatusBadgeRendererComponent, BadgeVariant } from '../../primitives/status-badge/status-badge-renderer.component';

const STAGE_VARIANT: Record<DealStage, BadgeVariant> = {
  Origination:     'info',
  Mandate:         'info',
  'Due Diligence': 'warning',
  Marketing:       'warning',
  Pricing:         'success',
  Closed:          'neutral',
  Withdrawn:       'error',
};

export interface DealStageRendererParams extends ICellRendererParams {
  variant?: BadgeVariant;
}

@Component({
  selector: 'app-deal-stage-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeRendererComponent],
  template: `<app-status-badge [value]="label()" [variant]="variant()" />`,
})
export class DealStageRendererComponent implements ICellRendererAngularComp {
  private readonly _label   = signal<string>('');
  private readonly _variant = signal<BadgeVariant>('neutral');

  readonly label   = this._label.asReadonly();
  readonly variant = this._variant.asReadonly();

  agInit(params: DealStageRendererParams): void {
    this._label.set(params.value ?? '');
    this._variant.set(params.variant ?? STAGE_VARIANT[params.value as DealStage] ?? 'neutral');
  }

  refresh(params: DealStageRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}
```

- [ ] **Step 2: Delete the old HTML and SCSS files (now using inline template)**

The component now uses an inline template. Delete:
- `deal-management-demo/src/app/shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component.html`
- `deal-management-demo/src/app/shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component.scss`

Run:
```bash
rm deal-management-demo/src/app/shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component.html
rm deal-management-demo/src/app/shared/cell-renderers/deal-stage-renderer/deal-stage-renderer.component.scss
```

- [ ] **Step 3: Verify the app compiles and the coverage-banker grid still renders**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`
Expected: Build succeeds. The coverage-banker, syndicate-banker, BEL, and conflict-clearance grids all import `DealStageRendererComponent` — they should work without changes since the class name and `ICellRendererAngularComp` interface are unchanged.

- [ ] **Step 4: Commit**

```bash
git add -A deal-management-demo/src/app/shared/cell-renderers/deal-stage-renderer/
git commit -m "refactor(renderers): DealStageRenderer now wraps StatusBadge primitive"
```

---

### Task 4: Refactor ConflictStatusRendererComponent → wrapper over StatusBadge

**Files:**
- Modify: `deal-management-demo/src/app/shared/cell-renderers/conflict-status-renderer/conflict-status-renderer.component.ts`

- [ ] **Step 1: Replace the component**

```typescript
// @spec-reads: domain/patterns/ag-grid-datatable/conflict-clearance §8
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ConflictStatus } from '../../types/deal.types';
import { StatusBadgeRendererComponent, BadgeVariant } from '../../primitives/status-badge/status-badge-renderer.component';

const CONFLICT_VARIANT: Record<ConflictStatus, BadgeVariant> = {
  Pending: 'warning',
  Flagged: 'error',
  Cleared: 'success',
  Waived:  'neutral',
};

@Component({
  selector: 'app-conflict-status-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeRendererComponent],
  template: `<app-status-badge [value]="label()" [variant]="variant()" />`,
})
export class ConflictStatusRendererComponent implements ICellRendererAngularComp {
  private readonly _status = signal<ConflictStatus | null>(null);

  readonly label   = computed(() => this._status() ?? '');
  readonly variant = computed<BadgeVariant>(() =>
    this._status() ? CONFLICT_VARIANT[this._status()!] : 'neutral',
  );

  agInit(params: ICellRendererParams): void {
    this._status.set(params.value ?? null);
  }

  refresh(params: ICellRendererParams): boolean {
    this._status.set(params.value ?? null);
    return true;
  }
}
```

- [ ] **Step 2: Delete old HTML and SCSS**

```bash
rm deal-management-demo/src/app/shared/cell-renderers/conflict-status-renderer/conflict-status-renderer.component.html
rm deal-management-demo/src/app/shared/cell-renderers/conflict-status-renderer/conflict-status-renderer.component.scss
```

- [ ] **Step 3: Build and verify**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add -A deal-management-demo/src/app/shared/cell-renderers/conflict-status-renderer/
git commit -m "refactor(renderers): ConflictStatusRenderer now wraps StatusBadge primitive"
```

---

### Task 5: Refactor CoverageMultipleRendererComponent → wrapper over StatusBadge

**Files:**
- Modify: `deal-management-demo/src/app/shared/cell-renderers/coverage-multiple-renderer/coverage-multiple-renderer.component.ts`

- [ ] **Step 1: Replace the component**

```typescript
// @spec-reads: domain/patterns/ag-grid-datatable/syndicate-banker §7
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatCoverageMultiple } from '../../calculations/deal-calculations';
import { StatusBadgeRendererComponent, BadgeVariant } from '../../primitives/status-badge/status-badge-renderer.component';

@Component({
  selector: 'app-coverage-multiple-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeRendererComponent],
  template: `<app-status-badge [value]="label()" [variant]="variant()" />`,
})
export class CoverageMultipleRendererComponent implements ICellRendererAngularComp {
  private readonly _multiple = signal<number>(0);

  readonly label = computed(() =>
    this._multiple() === 0 ? '—' : formatCoverageMultiple(this._multiple()),
  );

  readonly variant = computed<BadgeVariant>(() => {
    const m = this._multiple();
    if (m === 0) return 'neutral';
    if (m >= 2.0) return 'success';
    if (m >= 1.0) return 'warning';
    return 'error';
  });

  agInit(params: ICellRendererParams): void {
    this._multiple.set(params.value ?? 0);
  }

  refresh(params: ICellRendererParams): boolean {
    this._multiple.set(params.value ?? 0);
    return true;
  }
}
```

- [ ] **Step 2: Delete old HTML and SCSS**

```bash
rm deal-management-demo/src/app/shared/cell-renderers/coverage-multiple-renderer/coverage-multiple-renderer.component.html
rm deal-management-demo/src/app/shared/cell-renderers/coverage-multiple-renderer/coverage-multiple-renderer.component.scss
```

- [ ] **Step 3: Build and verify**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add -A deal-management-demo/src/app/shared/cell-renderers/coverage-multiple-renderer/
git commit -m "refactor(renderers): CoverageMultipleRenderer now wraps StatusBadge primitive"
```

---

### Task 6: Refactor DaysCountdownRendererComponent → wrapper over ValueDisplay

**Files:**
- Modify: `deal-management-demo/src/app/shared/cell-renderers/days-countdown-renderer/days-countdown-renderer.component.ts`

- [ ] **Step 1: Replace the component**

```typescript
// @spec-reads: ds/patterns/deal-grid-calculations — configurable thresholds
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ValueDisplayRendererComponent, DisplayVariant } from '../../primitives/value-display/value-display-renderer.component';

export interface DaysCountdownThresholds {
  warnDays: number;
  errorDays: number;
}

export interface DaysCountdownRendererParams extends ICellRendererParams {
  thresholds?: DaysCountdownThresholds;
}

const DEFAULT: DaysCountdownThresholds = { warnDays: 30, errorDays: 7 };

@Component({
  selector: 'app-days-countdown-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValueDisplayRendererComponent],
  template: `<app-value-display [primaryText]="label()" [variant]="colorState()" [bold]="true" />`,
})
export class DaysCountdownRendererComponent implements ICellRendererAngularComp {
  private readonly _days       = signal<number | null>(null);
  private readonly _thresholds = signal<DaysCountdownThresholds>(DEFAULT);

  readonly label = computed(() => {
    const d = this._days();
    if (d === null) return '—';
    if (d < 0) return `${Math.abs(d)}d overdue`;
    return `${d}d`;
  });

  readonly colorState = computed<DisplayVariant>(() => {
    const d = this._days();
    if (d === null) return 'neutral';
    const t = this._thresholds();
    if (t.errorDays > t.warnDays) {
      if (d >= t.errorDays) return 'error';
      if (d >= t.warnDays)  return 'warning';
      return 'success';
    } else {
      if (d <= t.errorDays) return 'error';
      if (d <= t.warnDays)  return 'warning';
      return 'success';
    }
  });

  agInit(params: DaysCountdownRendererParams): void {
    this._days.set(params.value ?? null);
    this._thresholds.set({ ...DEFAULT, ...params.thresholds });
  }

  refresh(params: DaysCountdownRendererParams): boolean {
    this._days.set(params.value ?? null);
    this._thresholds.set({ ...DEFAULT, ...params.thresholds });
    return true;
  }
}
```

- [ ] **Step 2: Delete old HTML and SCSS**

```bash
rm deal-management-demo/src/app/shared/cell-renderers/days-countdown-renderer/days-countdown-renderer.component.html
rm deal-management-demo/src/app/shared/cell-renderers/days-countdown-renderer/days-countdown-renderer.component.scss
```

- [ ] **Step 3: Build and verify**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add -A deal-management-demo/src/app/shared/cell-renderers/days-countdown-renderer/
git commit -m "refactor(renderers): DaysCountdownRenderer now wraps ValueDisplay primitive"
```

---

### Task 7: Refactor DealSizeRendererComponent → wrapper over ValueDisplay

**Files:**
- Modify: `deal-management-demo/src/app/shared/cell-renderers/deal-size-renderer/deal-size-renderer.component.ts`

- [ ] **Step 1: Replace the component**

```typescript
// @spec-reads: ds/patterns/deal-grid-calculations §3.1 §3.10
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatDealSize, dealSizeCategory } from '../../calculations/deal-calculations';
import { ValueDisplayRendererComponent } from '../../primitives/value-display/value-display-renderer.component';

@Component({
  selector: 'app-deal-size-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValueDisplayRendererComponent],
  template: `<app-value-display [primaryText]="formattedValue()" [secondaryText]="sizeCategory()" [bold]="true" />`,
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
```

- [ ] **Step 2: Delete old HTML and SCSS**

```bash
rm deal-management-demo/src/app/shared/cell-renderers/deal-size-renderer/deal-size-renderer.component.html
rm deal-management-demo/src/app/shared/cell-renderers/deal-size-renderer/deal-size-renderer.component.scss
```

- [ ] **Step 3: Build and verify**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add -A deal-management-demo/src/app/shared/cell-renderers/deal-size-renderer/
git commit -m "refactor(renderers): DealSizeRenderer now wraps ValueDisplay primitive"
```

---

### Task 8: Refactor FeeRevenueRendererComponent → wrapper over ValueDisplay

**Files:**
- Modify: `deal-management-demo/src/app/shared/cell-renderers/fee-revenue-renderer/fee-revenue-renderer.component.ts`

- [ ] **Step 1: Replace the component**

```typescript
// @spec-reads: ds/patterns/deal-grid-calculations §3.2 §3.7
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatBps, calcGrossRevenue } from '../../calculations/deal-calculations';
import { ValueDisplayRendererComponent } from '../../primitives/value-display/value-display-renderer.component';

export interface FeeRevenueRendererParams extends ICellRendererParams {
  dealSizeUsd: number;
}

@Component({
  selector: 'app-fee-revenue-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValueDisplayRendererComponent],
  template: `<app-value-display [primaryText]="formattedBps()" [secondaryText]="revenueLabel()" [bold]="true" />`,
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
```

- [ ] **Step 2: Delete old HTML and SCSS**

```bash
rm deal-management-demo/src/app/shared/cell-renderers/fee-revenue-renderer/fee-revenue-renderer.component.html
rm deal-management-demo/src/app/shared/cell-renderers/fee-revenue-renderer/fee-revenue-renderer.component.scss
```

- [ ] **Step 3: Build and verify**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add -A deal-management-demo/src/app/shared/cell-renderers/fee-revenue-renderer/
git commit -m "refactor(renderers): FeeRevenueRenderer now wraps ValueDisplay primitive"
```

---

### Task 9: Refactor MilestoneProgressRendererComponent → wrapper over ValueDisplay

**Files:**
- Modify: `deal-management-demo/src/app/shared/cell-renderers/milestone-progress-renderer/milestone-progress-renderer.component.ts`

- [ ] **Step 1: Replace the component**

```typescript
// @spec-reads: domain/patterns/ag-grid-datatable/business-execution-lead §4 col 11
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { calcMilestonesPercent } from '../../calculations/deal-calculations';
import { ValueDisplayRendererComponent, DisplayVariant } from '../../primitives/value-display/value-display-renderer.component';

@Component({
  selector: 'app-milestone-progress-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValueDisplayRendererComponent],
  template: `<app-value-display [primaryText]="label()" [secondaryText]="percentLabel()" [variant]="colorState()" />`,
})
export class MilestoneProgressRendererComponent implements ICellRendererAngularComp {
  private readonly _completed = signal<number>(0);
  private readonly _total     = signal<number>(0);

  readonly percent = computed(() => calcMilestonesPercent(this._completed(), this._total()));

  readonly label = computed(() =>
    this._total() === 0 ? '—' : `${this._completed()}/${this._total()}`,
  );

  readonly percentLabel = computed(() =>
    this._total() === 0 ? '' : `${this.percent()}%`,
  );

  readonly colorState = computed<DisplayVariant>(() => {
    const p = this.percent();
    if (this._total() === 0) return 'neutral';
    if (p >= 80) return 'success';
    if (p >= 50) return 'warning';
    return 'error';
  });

  agInit(params: ICellRendererParams): void {
    this._completed.set(params.data?.completedMilestones ?? 0);
    this._total.set(params.data?.totalMilestones ?? 0);
  }

  refresh(params: ICellRendererParams): boolean {
    this._completed.set(params.data?.completedMilestones ?? 0);
    this._total.set(params.data?.totalMilestones ?? 0);
    return true;
  }
}
```

- [ ] **Step 2: Delete old HTML and SCSS**

```bash
rm deal-management-demo/src/app/shared/cell-renderers/milestone-progress-renderer/milestone-progress-renderer.component.html
rm deal-management-demo/src/app/shared/cell-renderers/milestone-progress-renderer/milestone-progress-renderer.component.scss
```

- [ ] **Step 3: Build and verify**

Run: `cd deal-management-demo && npx ng build --configuration development 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add -A deal-management-demo/src/app/shared/cell-renderers/milestone-progress-renderer/
git commit -m "refactor(renderers): MilestoneProgressRenderer now wraps ValueDisplay primitive"
```

---

### Task 10: Full Build + Serve Verification

**Files:** No changes — verification only.

- [ ] **Step 1: Full production build**

Run: `cd deal-management-demo && npx ng build 2>&1 | tail -10`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Serve and verify all 4 grids render**

Run: `cd deal-management-demo && npx ng serve --port 4200 &`
Then: `sleep 5 && curl -s http://localhost:4200 | head -5`
Expected: HTML response from the Angular app.

Kill the server: `kill %1 2>/dev/null`

- [ ] **Step 3: Commit if any cleanup was needed**

```bash
git add -A deal-management-demo/
git commit -m "chore: phase 1 grid refactor complete — all renderers use generic primitives"
```
